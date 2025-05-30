import { NextResponse } from 'next/server'
import { createClient } from '@/lib/modassembly/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  const { data: { user } } = await supabase.auth.getUser()
  
  return NextResponse.json({
    hasSession: !!session,
    hasUser: !!user,
    sessionError: error?.message || null,
    userId: user?.id || null,
    userEmail: user?.email || null,
    timestamp: new Date().toISOString()
  })
}