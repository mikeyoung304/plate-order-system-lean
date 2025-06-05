'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useHasRole } from './auth-context'
import type { AppRole } from './roles'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: AppRole | AppRole[]
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  roles,
  redirectTo = '/',
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  // Always call hook to avoid conditional hook usage - use a default role if none specified
  const roleToCheck = roles || ('server' as AppRole) // Default to server instead of admin
  const hasRoleCheck = useHasRole(roleToCheck)
  const hasRequiredRole = roles ? hasRoleCheck : true // If no roles specified, allow any authenticated user

  // Redirect if not authenticated - FIXED: Use router.push for client-side navigation
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('[ProtectedRoute] No user found, redirecting to:', redirectTo)
      router.push(redirectTo)
    }
  }, [isLoading, user, redirectTo, router])

  // Redirect if authenticated but doesn't have required role
  useEffect(() => {
    if (!isLoading && user && roles && !hasRequiredRole) {
      console.log(
        '[ProtectedRoute] User lacks required role, redirecting to dashboard'
      )
      router.push('/dashboard')
    }
  }, [isLoading, user, roles, hasRequiredRole, router])

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
        </div>
      )
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  // Don't render if doesn't have required role
  if (roles && !hasRequiredRole) {
    return null
  }

  return <>{children}</>
}

// Server-side version for app router
interface ServerProtectedRouteProps {
  children: React.ReactNode
  roles?: AppRole | AppRole[]
}

export async function ServerProtectedRoute({
  children,
  roles,
}: ServerProtectedRouteProps) {
  const { getUserWithProfile } = await import('./session')
  const { hasRole } = await import('./roles')

  const userWithProfile = await getUserWithProfile()

  if (!userWithProfile) {
    redirect('/')
  }

  if (roles) {
    const hasRequiredRole = await hasRole(roles)
    if (!hasRequiredRole) {
      redirect('/dashboard')
    }
  }

  return <>{children}</>
}
