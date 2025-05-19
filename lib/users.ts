import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

// Use React cache to avoid duplicate fetches in the same render cycle
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return { user: null, profile: null }
  }
  
  // Get user profile
  const { data } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('user_id', session.user.id)
    .single()
  
  return {
    user: session.user,
    profile: data || { role: null, name: null }
  }
})

// Type definitions
export type User = {
  id: string
  name: string
}

// Type for the resident data from Supabase
type ResidentProfile = {
  user_id: string
  name: string
}

/**
 * Fetches all users with the 'resident' role from the database
 * @returns Array of residents
 */
export async function getAllResidents(): Promise<User[]> {
  const supabase = await createClient()
  
  // Get all residents from profiles
  const { data: residents, error } = await supabase
    .from('profiles')
    .select('user_id, name')
    .eq('role', 'resident')

  if (error) {
    throw new Error(`Failed to fetch residents: ${error.message}`)
  }

  if (!residents) {
    return []
  }

  // Transform the data into the expected format
  return residents.map((resident: ResidentProfile) => ({
    id: resident.user_id,
    name: resident.name,
  }))
} 