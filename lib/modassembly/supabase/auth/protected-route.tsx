'use client'

import { useEffect, useState } from 'react'
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
  const { user, profile, isLoading } = useAuth()
  const [hasRedirected, setHasRedirected] = useState(false)
  
  // Always call useHasRole to avoid conditional hook usage
  const hasRequiredRole = useHasRole(roles || 'server')
  const finalHasRole = roles ? hasRequiredRole : true

  // Handle redirects with state to prevent loops
  useEffect(() => {
    if (hasRedirected || isLoading) {return}

    // Redirect if not authenticated
    if (!user) {
      setHasRedirected(true)
      router.push(redirectTo)
      return
    }

    // Redirect if authenticated but doesn't have required role
    if (roles && !finalHasRole && profile) {
      setHasRedirected(true)
      router.push('/dashboard')
      return
    }
  }, [isLoading, user, profile, roles, finalHasRole, redirectTo, router, hasRedirected])

  // Show loading state
  if (isLoading || (user && !profile) || hasRedirected) {
    return (
      fallback || (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading...</p>
          </div>
        </div>
      )
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  // Don't render if doesn't have required role
  if (roles && !finalHasRole) {
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
  const { redirect } = await import('next/navigation')
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
