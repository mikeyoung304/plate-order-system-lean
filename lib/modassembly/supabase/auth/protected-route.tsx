'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { getClientUserWithProfile } from './session'
import { hasClientRole } from './client-roles'
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
  fallback 
}: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const userWithProfile = await getClientUserWithProfile()
        
        if (!userWithProfile) {
          setIsAuthorized(false)
          setIsLoading(false)
          return
        }

        // If no specific roles required, just check if authenticated
        if (!roles) {
          setIsAuthorized(true)
          setIsLoading(false)
          return
        }

        // Check if user has required role
        const hasRequiredRole = await hasClientRole(roles)
        setIsAuthorized(hasRequiredRole)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthorized(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [roles])

  // Show loading state
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Redirect if not authorized
  if (!isAuthorized) {
    redirect(redirectTo)
    return null
  }

  return <>{children}</>
}

// Server-side version for app router
interface ServerProtectedRouteProps {
  children: React.ReactNode
  roles?: AppRole | AppRole[]
}

export async function ServerProtectedRoute({ children, roles }: ServerProtectedRouteProps) {
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