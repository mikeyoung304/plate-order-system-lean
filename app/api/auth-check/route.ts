import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/modassembly/supabase/server'
import { Security } from '@/lib/security'
import { measureApiCall } from '@/lib/performance-utils'
import { ApiResponse } from '@/types/api'

type AuthCheckResponse = ApiResponse<{
  authenticated: boolean
  hasValidSession: boolean
  userId: string | null
  userEmail?: string | null
  sessionError?: string | null
  timestamp: string
}>

export async function GET(request: NextRequest) {
  return measureApiCall('auth_check_api', async () => {
    // 1. Request Validation
    const validation = Security.validate.validateRequest(request)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid request' },
        {
          status: 400,
          headers: Security.headers.getHeaders(),
        }
      )
    }

    // 2. Rate Limiting (prevent brute force session checks)
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const isAllowed = Security.rateLimit.isAllowed(
      clientIP,
      'auth_check',
      30, // 30 requests per minute max
      0.5 // 0.5 per second
    )

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            ...Security.headers.getHeaders(),
            'Retry-After': '60',
          },
        }
      )
    }

    try {
      const supabase = await createClient()

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // 3. Minimal Data Exposure (only what's needed)
      const responseData = {
        authenticated: !!session && !!user,
        hasValidSession: !!session && !error,
        userId: user?.id || null,
        // Only expose email for debugging in development
        ...(process.env.NODE_ENV === 'development' && {
          userEmail: user?.email || null,
          sessionError: error?.message || null,
        }),
        timestamp: new Date().toISOString(),
      }

      const response: AuthCheckResponse = {
        success: true,
        data: responseData,
        timestamp: new Date().toISOString(),
      }

      return NextResponse.json(response, {
        headers: Security.headers.getHeaders(),
      })
    } catch (error: any) {
      console.error('Auth check failed:', error.message)

      const errorResponse: AuthCheckResponse = {
        success: false,
        error: 'Authentication check failed',
        timestamp: new Date().toISOString(),
      }

      return NextResponse.json(errorResponse, {
        status: 500,
        headers: Security.headers.getHeaders(),
      })
    }
  })
}

// Security: No other HTTP methods allowed
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    {
      status: 405,
      headers: {
        ...Security.headers.getHeaders(),
        Allow: 'GET',
      },
    }
  )
}
