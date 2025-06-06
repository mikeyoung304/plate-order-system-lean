'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { useAuth, useHasRole } from './auth-context'
import { createClient } from '../client'
import type { AppRole } from './roles'

interface EnhancedProtectedRouteProps {
  children: React.ReactNode
  roles?: AppRole | AppRole[]
  redirectTo?: string
  fallback?: React.ReactNode
  maxRetries?: number
  retryDelay?: number
}

interface AuthState {
  status:
    | 'initializing'
    | 'checking'
    | 'authenticated'
    | 'unauthorized'
    | 'error'
  user: any | null
  hasRole: boolean
  error?: string
}

export function EnhancedProtectedRoute({
  children,
  roles,
  redirectTo = '/dashboard',
  fallback,
  maxRetries = 3,
  retryDelay = 1000,
}: EnhancedProtectedRouteProps) {
  const { user, isLoading, profile } = useAuth()
  const [authState, setAuthState] = useState<AuthState>({
    status: 'initializing',
    user: null,
    hasRole: false,
  })
  const [retryCount, setRetryCount] = useState(0)

  // Calculate role check only when we have a profile
  const hasRoleCheck =
    profile && roles
      ? (Array.isArray(roles) ? roles : [roles]).includes(profile.role)
      : !roles // If no roles required, allow access

  // Enhanced auth checking with retries and session verification
  useEffect(() => {
    const verifyAuthState = async () => {
      try {
        console.log('[EnhancedProtectedRoute] Starting auth verification...', {
          isLoading,
          hasUser: !!user,
          hasProfile: !!profile,
          profileRole: profile?.role,
          requiredRoles: roles,
          hasRoleCheck,
          retryCount,
        })

        setAuthState(prev => ({ ...prev, status: 'checking' }))

        // Double-check session exists at client level
        const supabase = createClient()
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        console.log('[EnhancedProtectedRoute] Session check result:', {
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          error: error?.message,
        })

        if (error) {
          console.error('[EnhancedProtectedRoute] Session check error:', error)
          setAuthState({
            status: 'error',
            user: null,
            hasRole: false,
            error: error.message,
          })
          return
        }

        // If no session and not loading, redirect
        if (!session && !isLoading) {
          console.log(
            '[EnhancedProtectedRoute] No session found, redirecting...'
          )
          setAuthState({ status: 'unauthorized', user: null, hasRole: false })
          redirect(redirectTo)
          return
        }

        // If we have session but auth context is still loading, wait
        if (session && isLoading) {
          console.log(
            '[EnhancedProtectedRoute] Session found but auth context still loading, waiting...'
          )
          setAuthState(prev => ({ ...prev, status: 'initializing' }))
          return
        }

        // If we have session and auth context loaded
        if (session && !isLoading) {
          console.log(
            '[EnhancedProtectedRoute] Session and auth context ready, checking roles...',
            {
              userRole: profile?.role,
              requiredRoles: roles,
              hasRoleCheck,
              hasProfile: !!profile,
            }
          )

          // If roles are required but profile is not loaded yet, wait
          if (roles && !profile) {
            console.log(
              '[EnhancedProtectedRoute] Roles required but profile not loaded yet, waiting...'
            )
            setAuthState(prev => ({ ...prev, status: 'checking' }))
            return
          }

          const hasRequiredRole = roles ? hasRoleCheck : true

          // If role required but user doesn't have it
          if (roles && !hasRequiredRole) {
            console.warn('[EnhancedProtectedRoute] User lacks required role:', {
              userRole: profile?.role,
              requiredRoles: roles,
            })
            setAuthState({
              status: 'unauthorized',
              user: session.user,
              hasRole: false,
            })
            redirect('/dashboard')
            return
          }

          // Success - user is authenticated and has required role
          console.log('[EnhancedProtectedRoute] Auth verification successful!')
          setAuthState({
            status: 'authenticated',
            user: session.user,
            hasRole: hasRequiredRole,
          })
        }
      } catch (error) {
        console.error(
          '[EnhancedProtectedRoute] Auth verification failed:',
          error
        )

        // Retry logic for network issues
        if (retryCount < maxRetries) {
          console.log(
            `[EnhancedProtectedRoute] Retrying (${retryCount + 1}/${maxRetries})...`
          )
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, retryDelay)
        } else {
          setAuthState({
            status: 'error',
            user: null,
            hasRole: false,
            error:
              error instanceof Error
                ? error.message
                : 'Auth verification failed',
          })
        }
      }
    }

    verifyAuthState()
  }, [isLoading, user?.id, profile?.role, profile?.user_id, roles, retryCount])

  // Render based on auth state
  switch (authState.status) {
    case 'initializing':
    case 'checking':
      return (
        fallback || (
          <div className='flex items-center justify-center min-h-screen bg-gray-900'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4'></div>
              <p className='text-gray-400 text-sm'>
                {authState.status === 'initializing'
                  ? 'Initializing authentication...'
                  : 'Verifying access...'}
              </p>
              {retryCount > 0 && (
                <p className='text-gray-500 text-xs mt-2'>
                  Retry {retryCount}/{maxRetries}
                </p>
              )}
            </div>
          </div>
        )
      )

    case 'error':
      return (
        <div className='flex items-center justify-center min-h-screen bg-gray-900'>
          <div className='text-center max-w-md p-6'>
            <div className='text-red-400 text-6xl mb-4'>⚠️</div>
            <h2 className='text-xl font-semibold text-white mb-2'>
              Authentication Error
            </h2>
            <p className='text-gray-400 text-sm mb-4'>
              {authState.error ||
                'Unable to verify your access. Please try again.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm'
            >
              Retry
            </button>
          </div>
        </div>
      )

    case 'authenticated':
      return <>{children}</>

    case 'unauthorized':
    default:
      // This shouldn't render as we redirect, but just in case
      return null
  }
}

// Export with same name for easy replacement
export { EnhancedProtectedRoute as ProtectedRoute }
