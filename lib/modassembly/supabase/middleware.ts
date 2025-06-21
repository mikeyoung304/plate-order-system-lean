import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Skip Supabase auth for development server startup and health checks
    const isStartupRequest = request.headers.get('user-agent')?.includes('node') ||
                           request.headers.get('sec-fetch-mode') === 'navigate' ||
                           request.nextUrl.pathname.startsWith('/_next') ||
                           !request.headers.get('user-agent')

    if (isStartupRequest) {
        return supabaseResponse
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    let user = null
    try {
        const result = await Promise.race([
            supabase.auth.getUser(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000))
        ])
        user = result.data?.user
    } catch (_error) {
        console.warn('Supabase auth check failed:', _error)
        // If there's a refresh token error, clear the session
        if (_error.message?.includes('Invalid Refresh Token')) {
            try {
                await supabase.auth.signOut()
            } catch (signOutError) {
                console.warn('Failed to sign out during refresh token error:', signOutError)
            }
        }
        // Continue without auth if Supabase is unreachable
        return supabaseResponse
    }

    if (!user && request.nextUrl.pathname !== '/') {
        // no user, redirect to the root page which has the auth form
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse
}