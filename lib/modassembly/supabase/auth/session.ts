'use server'

import { createClient } from '@/lib/modassembly/supabase/server'
import { createClient as createBrowserClient } from '@/lib/modassembly/supabase/client'
import type { Session, User } from '@supabase/supabase-js'
import type { AppRole } from './roles'

export type ServerUserProfile = {
  user_id: string
  role: AppRole
  name: string
}

export type UserWithProfile = {
  user: User
  profile: ServerUserProfile | null
}

/**
 * Gets the current session (server-side)
 * @returns Session object or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

/**
 * Gets the current user (server-side)
 * @returns User object or null if not authenticated
 */
export async function getUser(): Promise<User | null> {
  const session = await getSession()
  return session?.user || null
}

/**
 * Gets the current user with their profile (server-side)
 * @returns User and profile data or null if not authenticated
 */
export async function getUserWithProfile(): Promise<UserWithProfile | null> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, role, name')
    .eq('user_id', session.user.id)
    .single()

  return {
    user: session.user,
    profile: profile || null,
  }
}

/**
 * Gets the current session (client-side)
 * @returns Session object or null if not authenticated
 */
export async function getClientSession(): Promise<Session | null> {
  const supabase = createBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

/**
 * Gets the current user (client-side)
 * @returns User object or null if not authenticated
 */
export async function getClientUser(): Promise<User | null> {
  const session = await getClientSession()
  return session?.user || null
}

/**
 * Gets the current user with their profile (client-side)
 * @returns User and profile data or null if not authenticated
 */
export async function getClientUserWithProfile(): Promise<UserWithProfile | null> {
  const supabase = createBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, role, name')
    .eq('user_id', session.user.id)
    .single()

  return {
    user: session.user,
    profile: profile || null,
  }
}

/**
 * Validates that the current session is still valid
 * @returns True if session is valid
 */
export async function validateSession(): Promise<boolean> {
  const session = await getSession()
  if (!session) {
    return false
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000)
  return session.expires_at ? session.expires_at > now : true
}

/**
 * Refreshes the current session
 * @returns New session or null if refresh failed
 */
export async function refreshSession(): Promise<Session | null> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.refreshSession()
  return session
}
