'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import type { Session, User } from '@supabase/supabase-js'
import { UserRole } from '@/types/database'

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

  const fetchUserProfile = async (
    userId: string,
    supabaseClient: ReturnType<typeof createClient>
  ): Promise<UserProfile | null> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] Fetching profile for user ID:', userId)
    }

    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('user_id, role, name')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[AuthContext] Error fetching profile by user_id:', error)
        console.error('[AuthContext] No profile found for user:', userId)
      }
      return null
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] Found profile by user_id:', profile)
    }
    return profile
      ? {
          user_id: profile.user_id || userId,
          role: profile.role,
          name: profile.name,
        }
      : null
  }

  const refreshAuth = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Batch state updates to prevent multiple re-renders
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id, supabase)
        // Use React 18's automatic batching
        React.startTransition(() => {
          setSession(session)
          setUser(session.user)
          setProfile(userProfile)
        })
      } else {
        // Clear all state at once
        React.startTransition(() => {
          setSession(null)
          setUser(null)
          setProfile(null)
        })
      }
    } catch (error) {
      console.error('Error refreshing auth:', error)
      // Clear all state at once on error
      React.startTransition(() => {
        setSession(null)
        setUser(null)
        setProfile(null)
      })
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Clear all state at once
    React.startTransition(() => {
      setSession(null)
      setUser(null)
      setProfile(null)
    })
  }

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    // Initial session check
    const initializeAuth = async () => {
      if (!mounted) {
        return
      }

      try {
        setIsLoading(true)
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) {
          return
        }

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id, supabase)
          if (mounted) {
            React.startTransition(() => {
              setSession(session)
              setUser(session.user)
              setProfile(userProfile)
            })
          }
        } else {
          if (mounted) {
            React.startTransition(() => {
              setSession(null)
              setUser(null)
              setProfile(null)
            })
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          React.startTransition(() => {
            setSession(null)
            setUser(null)
            setProfile(null)
          })
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {
        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.warn('Auth state change:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
        })
      }

      try {
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id, supabase)
          if (mounted) {
            React.startTransition(() => {
              setSession(session)
              setUser(session.user)
              setProfile(userProfile)
            })
          }
        } else {
          if (mounted) {
            React.startTransition(() => {
              setSession(null)
              setUser(null)
              setProfile(null)
            })
          }
        }
      } catch (error) {
        console.error('Error handling auth state change:', error)
        if (mounted) {
          React.startTransition(() => {
            setSession(null)
            setUser(null)
            setProfile(null)
          })
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
  }, []) // Empty dependency array is correct here

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
  const userRole = useRole()

  if (process.env.NODE_ENV === 'development') {
    console.log('[useHasRole] Checking roles:', {
      userRole,
      requiredRoles: roles,
      allowedRoles: Array.isArray(roles) ? roles : [roles],
    })
  }

  if (!userRole) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[useHasRole] No user role found')
    }
    return false
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  const hasRole = allowedRoles.includes(userRole)

  if (process.env.NODE_ENV === 'development') {
    console.log('[useHasRole] Role check result:', hasRole)
  }
  return hasRole
}
