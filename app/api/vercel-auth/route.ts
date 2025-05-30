// OVERNIGHT_SESSION: 2025-05-30 - Secure debugging endpoint (production-safe)
// Reason: Debug endpoint needs security controls and reduced information exposure
// Impact: Secure authentication debugging without exposing sensitive data

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/modassembly/supabase/server'
import { cookies } from 'next/headers'
import { Security } from '@/lib/security'
import { measureApiCall } from '@/lib/performance/monitoring'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return measureApiCall('vercel_auth_debug', async () => {
    // 1. Security: Only allow in development or for authenticated admin users
    if (process.env.NODE_ENV === 'production') {
      // In production, require admin authentication
      const supabase = await createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { 
            status: 401,
            headers: Security.headers.getHeaders()
          }
        );
      }
      
      // Check if user has admin role (you'd need to implement this check)
      // For now, only allow in development
      return NextResponse.json(
        { error: 'Debug endpoint disabled in production' },
        { 
          status: 403,
          headers: Security.headers.getHeaders()
        }
      );
    }

    // 2. Rate Limiting (prevent abuse of debug endpoint)
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = Security.rateLimit.isAllowed(
      clientIP,
      'debug_auth',
      10, // 10 requests per minute max
      10 / 60 // Rate per second
    );
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            ...Security.headers.getHeaders(),
            'Retry-After': '60'
          }
        }
      );
    }

    const { searchParams } = new URL(request.url)
    const action = Security.sanitize.sanitizeIdentifier(searchParams.get('action') || '')
    
    const cookieStore = await cookies()
    const supabase = await createClient()
    
    // Action: Force set test cookie (sanitized)
    if (action === 'test-cookie') {
      cookieStore.set('vercel-test', 'working', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/'
      })
      return NextResponse.json(
        { message: 'Test cookie set successfully' },
        { headers: Security.headers.getHeaders() }
      )
    }
    
    // 3. Secure Authentication State Check
    const [sessionResult, userResult] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser()
    ])
    
    const sbCookies = cookieStore.getAll().filter(c => c.name.includes('sb-'))
    const testCookie = cookieStore.get('vercel-test')
    
    // 4. Minimal Debug Information (no sensitive data)
    const debugResponse = {
      status: 'debug_info',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      
      authentication: {
        sessionExists: !!sessionResult.data.session,
        userExists: !!userResult.data.user,
        sessionValid: !!sessionResult.data.session && !sessionResult.error,
        hasErrors: !!(sessionResult.error || userResult.error)
      },
      
      cookies: {
        testCookieWorks: !!testCookie,
        supabaseCookieCount: sbCookies.length,
        hasCookies: sbCookies.length > 0
      },
      
      // Only expose configuration hints in development
      ...(process.env.NODE_ENV === 'development' && {
        configuration: {
          supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          currentDomain: new URL(request.url).origin,
          suggestions: [
            'Check Supabase Dashboard → Authentication → URL Configuration',
            'Verify redirect URLs include current domain',
            'Ensure Site URL matches deployment domain'
          ]
        }
      })
    }
    
    return NextResponse.json(debugResponse, {
      headers: Security.headers.getHeaders()
    })
    
  });
}

// Security: No other HTTP methods allowed
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: {
        ...Security.headers.getHeaders(),
        'Allow': 'GET'
      }
    }
  );
}