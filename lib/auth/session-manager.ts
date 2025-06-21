'use client'

import { createClient } from '@/lib/modassembly/supabase/client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'

interface SessionContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const refreshSession = async () => {
    try {
      console.log('🔄 [Session Manager] Refreshing session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('🚨 [Session Manager] Session refresh error:', error)
        setSession(null)
        setUser(null)
        return
      }

      console.log('✅ [Session Manager] Session refreshed:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at
      })

      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('❌ [Session Manager] Unexpected error during refresh:', error)
      setSession(null)
      setUser(null)
    }
  }

  const signOut = async () => {
    try {
      console.log('🚪 [Session Manager] Signing out...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('🚨 [Session Manager] Sign out error:', error)
      } else {
        console.log('✅ [Session Manager] Successfully signed out')
      }
      
      setSession(null)
      setUser(null)
    } catch (error) {
      console.error('❌ [Session Manager] Unexpected error during sign out:', error)
    }
  }

  useEffect(() => {
    // Get initial session
    refreshSession().finally(() => setLoading(false))

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 [Session Manager] Auth state change:', event, {
        hasSession: !!session,
        userId: session?.user?.id
      })

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        console.log('👋 [Session Manager] User signed out')
      } else if (event === 'SIGNED_IN') {
        console.log('👋 [Session Manager] User signed in')
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 [Session Manager] Token refreshed')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const value: SessionContextType = {
    session,
    user,
    loading,
    signOut,
    refreshSession,
  }

  return React.createElement(SessionContext.Provider, { value }, children)
}


export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

export function useRequiredSession() {
  const { session, user, loading } = useSession()
  
  if (loading) {
    return { session: null, user: null, loading: true }
  }
  
  if (!session || !user) {
    throw new Error('Authentication required - no active session')
  }
  
  return { session, user, loading: false }
}