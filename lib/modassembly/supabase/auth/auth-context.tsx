'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import type { Session, User } from '@supabase/supabase-js'
import { UserRole } from '@/types/database'
import { isDemoUser } from '@/lib/demo'

export type UserProfile = {
  user_id: string
  role: UserRole
  name: string | null
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserProfile = useCallback(async (
    userId: string,
    supabaseClient: ReturnType<typeof createClient>
  ): Promise<UserProfile | null> => {
    try {
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('user_id, role, name')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Profile fetch failed:', error.message)
        return null
      }

      return profile
        ? {
            user_id: profile.user_id || userId,
            role: profile.role,
            name: profile.name,
          }
        : null
    } catch (error) {
      console.error('Profile fetch error:', error instanceof Error ? error.message : 'Unknown error')
      return null
    }
  }, [])

  const refreshAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw new Error(`Session fetch error: ${sessionError.message}`)
      }

      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id, supabase)
        setSession(session)
        setUser(session.user)
        setProfile(userProfile)
      } else {
        setSession(null)
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Error refreshing auth:', error)
      setSession(null)
      setUser(null)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [fetchUserProfile])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [])

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    const initializeAuth = async () => {
      if (!mounted) {return}

      try {
        setIsLoading(true)
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Error getting session:', sessionError)
          return
        }

        if (!mounted) {return}

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id, supabase)
          
          if (mounted) {
            setSession(session)
            setUser(session.user)
            setProfile(userProfile)
          }
        } else {
          if (mounted) {
            setSession(null)
            setUser(null)
            setProfile(null)
          }
        }
      } catch (error) {
        console.error('Error in auth initialization:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {return}

      try {
        setIsLoading(true)
        
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id, supabase)
          
          if (mounted) {
            setSession(session)
            setUser(session.user)
            setProfile(userProfile)
          }
        } else {
          if (mounted) {
            setSession(null)
            setUser(null)
            setProfile(null)
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        
        if (mounted) {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    signOut,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useUser(): User | null {
  const { user } = useAuth()
  return user
}

export function useProfile(): UserProfile | null {
  const { profile } = useAuth()
  return profile
}

export function useRole(): UserRole | null {
  const { profile } = useAuth()
  return profile?.role || null
}

export function useIsRole(role: UserRole): boolean {
  const userRole = useRole()
  return userRole === role
}

export function useHasRole(roles: UserRole | UserRole[]): boolean {
  const { user } = useAuth()
  const userRole = useRole()

  // Check if this is the demo user
  if (user?.email && isDemoUser(user.email)) {
    return true
  }

  if (!userRole) {
    return false
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  return allowedRoles.includes(userRole)
}
