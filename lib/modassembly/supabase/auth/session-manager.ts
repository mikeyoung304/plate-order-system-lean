'use client'

import { createClient } from '@/lib/modassembly/supabase/client'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useSessionManager() {
  const router = useRouter()
  const supabase = createClient()

  const handleSessionError = useCallback(async (error: any) => {
    console.warn('Session error detected:', error)
    
    // Check if it's a refresh token error
    if (error?.message?.includes('Invalid Refresh Token') || 
        error?.message?.includes('Refresh Token Not Found')) {
      try {
        // Clear the session
        await supabase.auth.signOut()
        // Redirect to login
        router.push('/')
      } catch (signOutError) {
        console.error('Failed to sign out during session error:', signOutError)
        // Force reload to clear any cached state
        window.location.href = '/'
      }
    }
  }, [router, supabase])

  const refreshSessionSafely = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        await handleSessionError(error)
        return null
      }
      
      return data.session
    } catch (error) {
      await handleSessionError(error)
      return null
    }
  }, [handleSessionError, supabase])

  const getSessionSafely = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        await handleSessionError(error)
        return null
      }
      
      return data.session
    } catch (error) {
      await handleSessionError(error)
      return null
    }
  }, [handleSessionError, supabase])

  return {
    handleSessionError,
    refreshSessionSafely,
    getSessionSafely,
  }
}

// Global session error handler for server-side
export async function handleServerSessionError(error: any) {
  console.warn('Server session error:', error)
  
  if (error?.message?.includes('Invalid Refresh Token') || 
      error?.message?.includes('Refresh Token Not Found')) {
    // On server-side, we can't directly redirect, so we'll return null
    // and let the calling code handle the redirect
    return { shouldRedirect: true, error: 'Session expired' }
  }
  
  return { shouldRedirect: false, error: error?.message || 'Session error' }
}