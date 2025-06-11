import { createClient } from '@/lib/modassembly/supabase/server'
import { redirect } from 'next/navigation'
import { ServerComplexClientComponent } from '@/components/server-complex-client'

// Luis's server-first pattern - auth check on server
export default async function ServerComplexPage() {
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

  // Pass user data to client component
  return <ServerComplexClientComponent user={user} profile={profile} />
}
