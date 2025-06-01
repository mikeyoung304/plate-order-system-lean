'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
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
  redirectTo = '/dashboard',
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  // Always call hook to avoid conditional hook usage
  const hasRoleCheck = useHasRole(roles || ('admin' as AppRole))
  const hasRequiredRole = roles ? hasRoleCheck : true

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      redirect(redirectTo)
    }
  }, [isLoading, user, redirectTo])

  // Redirect if authenticated but doesn't have required role
  useEffect(() => {
    if (!isLoading && user && roles && !hasRequiredRole) {
      redirect('/dashboard')
    }
  }, [isLoading, user, roles, hasRequiredRole])

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
