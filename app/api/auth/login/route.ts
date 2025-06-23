import { createServerClient } from '@/lib/modassembly/supabase/server'
import { rateLimitMiddleware, RateLimitConfigs } from '@/lib/rate-limiter'
import { NextRequest, NextResponse } from 'next/server'

// Apply rate limiting to login attempts
const loginRateLimiter = rateLimitMiddleware(RateLimitConfigs.auth)

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = loginRateLimiter(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        user: data.user,
        session: data.session 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}