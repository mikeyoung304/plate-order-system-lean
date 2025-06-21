'use server'

import { createClient } from '@/lib/modassembly/supabase/server'
import { UserRole } from '@/types/database'


export type AppRole = UserRole

/**
 * Gets the current user's role from their profile
 * @returns The user's role or null if not found
 */
export async function getUserRole(): Promise<AppRole | null> {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single()

  return profile?.role || null
}

/**
 * Checks if the current user has one of the specified roles
 * @param roles Single role or array of roles to check
 * @returns True if user has any of the specified roles
 */
export async function hasRole(roles: AppRole | AppRole[]): Promise<boolean> {
  const supabase = await createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()
  


  const userRole = await getUserRole()
  if (!userRole) {
    return false
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  return allowedRoles.includes(userRole)
}

/**
 * Requires the current user to have one of the specified roles
 * @param roles Single role or array of roles required
 * @throws Error if user doesn't have required role
 */
export async function requireRole(roles: AppRole | AppRole[]): Promise<void> {
  const hasRequiredRole = await hasRole(roles)
  if (!hasRequiredRole) {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    


    const userRole = await getUserRole()
    throw new Error(
      `Access denied. Required role: ${Array.isArray(roles) ? roles.join(' or ') : roles}. Current role: ${userRole || 'none'}`
    )
  }
}

/**
 * Convenience function to check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return await hasRole('admin')
}

/**
 * Convenience function to check if user is server
 */
export async function isServer(): Promise<boolean> {
  return await hasRole('server')
}

/**
 * Convenience function to check if user is cook
 */
export async function isCook(): Promise<boolean> {
  return await hasRole('cook')
}

/**
 * Convenience function to check if user is resident
 */
export async function isResident(): Promise<boolean> {
  return await hasRole('resident')
}
