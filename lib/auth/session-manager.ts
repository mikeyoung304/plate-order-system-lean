'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
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
      // Refreshing session...
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        // Session refresh error
        setSession(null)
        setUser(null)
        return
      }

      // Session refreshed successfully

      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      // Unexpected error during refresh
      setSession(null)
      setUser(null)
    }
  }

  const signOut = async () => {
    try {
      // Signing out...
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        // Sign out error
      } else {
        // Successfully signed out
      }
      
      setSession(null)
      setUser(null)
    } catch (error) {
      // Unexpected error during sign out
    }
  }

  useEffect(() => {
    // Get initial session
    refreshSession().finally(() => setLoading(false))

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Auth state change

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        // User signed out
      } else if (event === 'SIGNED_IN') {
        // User signed in
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed
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