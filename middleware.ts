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
    // Exclude ALL API routes from middleware auth checks - they handle their own auth
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
