// Direct server access - bypasses (auth) group
import { createClient } from '@/lib/modassembly/supabase/server'
import { redirect } from 'next/navigation'
import ServerPage from '@/app/(auth)/server/page'

export default async function DirectServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }
  
  return <ServerPage />
}