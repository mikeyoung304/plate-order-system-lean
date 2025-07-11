import { createClient } from '@/lib/modassembly/supabase/client'

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
 * Gets the current user and their profile
 * @returns The user object and profile
 */
export async function getUser() {
  const supabase = createClient()
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
}

/**
 * Fetches all users with the 'resident' role from the database
 * @returns Array of residents
 */
export async function getAllResidents(): Promise<User[]> {
  const supabase = createClient()
  
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