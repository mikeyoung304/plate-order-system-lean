'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { AppRole } from './roles'

export type UserProfile = {
  user_id: string
  role: AppRole
  name: string
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

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, role, name')
      .eq('user_id', userId)
      .single()

    return profile || null
  }

  const refreshAuth = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id)
          setProfile(userProfile)
        } else {
          setProfile(null)
        }

        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    signOut,
    refreshAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
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

export function useRole(): AppRole | null {
  const { profile } = useAuth()
  return profile?.role || null
}

export function useIsRole(role: AppRole): boolean {
  const userRole = useRole()
  return userRole === role
}

export function useHasRole(roles: AppRole | AppRole[]): boolean {
  const userRole = useRole()
  if (!userRole) return false
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  return allowedRoles.includes(userRole)
}