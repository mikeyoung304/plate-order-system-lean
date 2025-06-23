import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/modassembly/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // Handle session updates for authenticated routes
  const response = await updateSession(request)
  
  // Add security headers to all responses
  const headers = new Headers(response.headers)
  
  // Content Security Policy
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://api.openai.com",
      "media-src 'self' blob:",
      "object-src 'none'",
      "frame-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; ')
  )
  
  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // Additional security headers
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()')
  
  // Create a new response with the security headers
  const secureResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
  
  // Copy over the cookies from the original response
  response.cookies.getAll().forEach(cookie => {
    secureResponse.cookies.set(cookie)
  })
  
  return secureResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/test-env (test endpoint)
     * - api/vercel-auth (debug endpoint)
     * - api/auth-check (auth check endpoint)
     * - api/health (health check endpoint)
     * - api/metrics (metrics endpoint)
     * - public files with extensions
     */
    // Exclude ALL API routes from middleware auth checks - they handle their own auth
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
