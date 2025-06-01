import { redirect } from 'next/navigation'
import { createClient } from '@/lib/modassembly/supabase/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check both session and user for Vercel production
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Double-check with getUser before redirecting
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      redirect('/')
    }
  }

  return <>{children}</>
}
