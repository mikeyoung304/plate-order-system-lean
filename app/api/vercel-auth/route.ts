import { NextResponse } from 'next/server'
import { createClient } from '@/lib/modassembly/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  const cookieStore = await cookies()
  const supabase = await createClient()
  
  // Action: Force set test cookie
  if (action === 'test-cookie') {
    cookieStore.set('vercel-test', 'working', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/'
    })
    return NextResponse.json({ message: 'Test cookie set' })
  }
  
  // Get auth state
  const [sessionResult, userResult] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser()
  ])
  
  const sbCookies = cookieStore.getAll().filter(c => c.name.includes('sb-'))
  const testCookie = cookieStore.get('vercel-test')
  
  return NextResponse.json({
    debug: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL,
      
      session: {
        exists: !!sessionResult.data.session,
        error: sessionResult.error?.message,
        expiresAt: sessionResult.data.session?.expires_at
      },
      
      user: {
        exists: !!userResult.data.user,
        email: userResult.data.user?.email,
        error: userResult.error?.message
      },
      
      cookies: {
        testCookieWorks: !!testCookie,
        supabaseCookieCount: sbCookies.length,
        supabaseCookies: sbCookies.map(c => ({
          name: c.name,
          valueLength: c.value?.length || 0
        }))
      },
      
      urls: {
        currentUrl: request.url,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      }
    },
    
    quickFix: {
      step1: 'Go to Supabase Dashboard → Authentication → URL Configuration',
      step2: 'Add this to Redirect URLs: ' + request.url.split('/api')[0] + '/**',
      step3: 'Set Site URL to: ' + request.url.split('/api')[0]
    }
  })
}