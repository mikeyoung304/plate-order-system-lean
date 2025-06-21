'use client'

import React, { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/modassembly/supabase/client'

export function useGlobalAuthListener() {
  const router = useRouter()
  const supabase = createClient()

  const handleAuthError = useCallback((error: { message: string }) => {
    if (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found')) {
      supabase.auth.signOut()
    }
  }, [supabase])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }

      if (event === 'SIGNED_IN') {
        if (window.location.pathname === '/') {
          router.push('/dashboard')
        }
      }
      
      // Handle auth errors through proper error boundaries instead of console override
      if (event === 'TOKEN_REFRESHED' && !session) {
        handleAuthError({ message: 'Token refresh failed' })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, handleAuthError])
}

// Hook to provide auth error boundary
export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  useGlobalAuthListener()
  return React.createElement(React.Fragment, null, children)
}