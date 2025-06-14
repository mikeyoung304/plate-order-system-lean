/**
 * Luis's Protected Server Component Pattern
 *
 * This shows how Luis implemented page-level authentication
 * using server components with direct auth checks.
 */

import { createClient } from '@/lib/modassembly/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Protected page component using Luis's server-first pattern
 * No client-side auth contexts or protected route wrappers
 */
export default async function ProtectedPage() {
  const supabase = await createClient()

  // Direct server-side auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Server-side redirect for unauthenticated users
  if (!user) {
    redirect('/login')
  }

  // Optional: Get user profile for role-based access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('user_id', user.id)
    .single()

  // Optional: Role-based protection
  if (profile?.role !== 'admin') {
    redirect('/unauthorized')
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Welcome, {user.email}!</p>
      {profile && (
        <div>
          <p>Name: {profile.name}</p>
          <p>Role: {profile.role}</p>
        </div>
      )}

      {/* Protected content here */}
    </div>
  )
}

/**
 * Alternative pattern for pages that need user data
 * but don't require authentication
 */
export async function OptionalAuthPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No redirect - handle both authenticated and unauthenticated states

  return (
    <div>
      <h1>Public Content</h1>
      {user ? (
        <p>Signed in as: {user.email}</p>
      ) : (
        <p>
          <a href='/login'>Sign in</a> to access more features
        </p>
      )}
    </div>
  )
}

/**
 * Luis's Protected Page Pattern Characteristics:
 *
 * 1. Server Component - Async function, runs on server
 * 2. Direct auth check - No client-side auth context
 * 3. Server-side redirect - Uses Next.js redirect()
 * 4. Type safety - Full TypeScript support
 * 5. Profile integration - Optional role-based access
 * 6. Clean error handling - Simple redirect patterns
 * 7. Performance - No client-side auth overhead
 */
