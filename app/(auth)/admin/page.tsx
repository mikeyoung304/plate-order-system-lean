import { createClient } from '@/lib/modassembly/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClientComponent } from '@/components/admin-client'

// Luis's server-first pattern - auth check on server
export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile for role checking
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('user_id', user.id)
    .single()

  // Check admin role on server side
  if (profile?.role !== 'admin') {
    redirect('/dashboard') // Redirect non-admin users
  }

  // Pass user data to client component
  return <AdminClientComponent user={user} profile={profile} />
}
