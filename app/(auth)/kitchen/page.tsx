import { createClient } from '@/lib/modassembly/supabase/server'
import { redirect } from 'next/navigation'

// Redirect /kitchen to /kitchen/kds since that's the main feature
export default async function KitchenPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Redirect to KDS - the main kitchen functionality
  redirect('/kitchen/kds')
}
