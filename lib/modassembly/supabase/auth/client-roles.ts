'use client'

import { createClient } from '@/lib/modassembly/supabase/client'
import type { AppRole } from './roles'
import { isDemoUser } from '@/lib/demo'

/**
 * Gets the current user's role from their profile (client-side)
 * @returns The user's role or null if not found
 */
export async function getClientUserRole(): Promise<AppRole | null> {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) {
    return null
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single()

  if (error) {
    // Try with id instead of user_id
    const { data: profileById } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    return profileById?.role || null
  }

  return profile?.role || null
}

/**
 * Checks if the current user has one of the specified roles (client-side)
 * @param roles Single role or array of roles to check
 * @returns True if user has any of the specified roles
 */
export async function hasClientRole(
  roles: AppRole | AppRole[]
): Promise<boolean> {
  // Check for demo user first
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  if (session?.user?.email && isDemoUser(session.user.email)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[hasClientRole] Demo user detected - granting access:', {
        email: session.user.email,
        requiredRoles: roles,
        grantedAccess: true
      })
    }
    return true
  }
  
  // Normal role checking for non-demo users
  const userRole = await getClientUserRole()
  if (!userRole) {
    return false
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  return allowedRoles.includes(userRole as AppRole)
}
