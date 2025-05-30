import { redirect } from 'next/navigation'
import { createClient } from '@/lib/modassembly/supabase/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/')
  }
  
  return <>{children}</>
}