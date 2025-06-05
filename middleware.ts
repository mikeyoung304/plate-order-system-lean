import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/modassembly/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Skip redirect for dashboard to prevent loops
  if (request.nextUrl.pathname === '/dashboard') {
    return await updateSession(request)
  }
  
  return await updateSession(request)
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
    '/((?!_next/static|_next/image|favicon.ico|api/test-env|api/vercel-auth|api/auth-check|api/health|api/metrics|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
