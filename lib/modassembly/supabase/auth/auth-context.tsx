'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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

  const supabase = createClient()

  const fetchUserProfile = async (
    userId: string
  ): Promise<UserProfile | null> => {
    console.log('[AuthContext] Fetching profile for user ID:', userId)

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, user_id, role, name')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[AuthContext] Error fetching profile by user_id:', error)
      // Try with id instead of user_id
      const { data: profileById, error: error2 } = await supabase
        .from('profiles')
        .select('id, user_id, role, name')
        .eq('id', userId)
        .single()

      if (error2) {
        console.error('[AuthContext] Error fetching profile by id:', error2)
      }

      if (profileById) {
        console.log('[AuthContext] Found profile by id:', profileById)
        return {
          user_id: profileById.user_id || userId,
          role: profileById.role,
          name: profileById.name,
        }
      }

      console.error('[AuthContext] No profile found for user:', userId)
      return null
    }

    console.log('[AuthContext] Found profile by user_id:', profile)
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
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('Error refreshing auth:', error)
      setUser(null)
      setProfile(null)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  useEffect(() => {
    // Initial session check
    refreshAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Auth state change:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
        })
      }

      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }

      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  console.log('[useHasRole] Checking roles:', {
    userRole,
    requiredRoles: roles,
    allowedRoles: Array.isArray(roles) ? roles : [roles],
  })

  if (!userRole) {
    console.log('[useHasRole] No user role found')
    return false
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  const hasRole = allowedRoles.includes(userRole)

  console.log('[useHasRole] Role check result:', hasRole)
  return hasRole
}
