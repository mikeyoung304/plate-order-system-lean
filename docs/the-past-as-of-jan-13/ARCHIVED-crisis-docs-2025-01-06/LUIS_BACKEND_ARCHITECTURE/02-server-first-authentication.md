# Server-First Authentication Architecture

> **Luis's Core Pattern:** Complete server-side authentication with no client-side state management

## 🎯 Architecture Overview

Luis implemented a **pure server-first authentication system** that eliminates client-side auth state management entirely. This approach provides better security, simpler debugging, and cleaner separation of concerns.

### **Key Architectural Decisions**

1. **Server Actions** - All auth operations use Next.js 13+ server actions
2. **Middleware Sessions** - Session validation happens at the request level
3. **No Client State** - Zero client-side auth context or state management
4. **Cookie-Based** - Sessions managed through HTTP cookies, not localStorage

## 🏗️ Core Components

### **1. Server Actions (`auth/actions.ts`)**

**Location:** `lib/modassembly/supabase/auth/actions.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/modassembly/supabase/server'

export interface ActionResult {
  error?: string
}

export async function signIn(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
```

**Pattern Breakdown:**

- ✅ `'use server'` - Ensures server-side execution
- ✅ `FormData` extraction - Native form handling
- ✅ Direct Supabase operations - No abstraction layers
- ✅ `revalidatePath()` - Clears Next.js cache
- ✅ `redirect()` - Server-side navigation
- ✅ Error objects - Simple error reporting

### **2. Session Middleware (`middleware.ts`)**

**Location:** `lib/modassembly/supabase/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Session Management Pattern:**

- ✅ **Cookie forwarding** - Proper request/response cookie handling
- ✅ **User validation** - `getUser()` on every request
- ✅ **Automatic redirects** - Unauthenticated users sent to login
- ✅ **Path exclusions** - Login/auth pages bypass validation
- ✅ **Response preservation** - Critical cookie state maintenance

### **3. Server Client (`server.ts`)**

**Location:** `lib/modassembly/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

**Server Client Pattern:**

- ✅ **Type safety** - Database interface integration
- ✅ **Cookie integration** - Next.js cookies() usage
- ✅ **Error handling** - Graceful server component failures
- ✅ **Middleware coordination** - Works with session middleware

## 🔄 Authentication Flow

### **Login Flow**

1. **User submits form** → Server action receives `FormData`
2. **Server action** → Calls `supabase.auth.signInWithPassword()`
3. **Supabase sets cookies** → Auth session stored in HTTP cookies
4. **Cache revalidation** → `revalidatePath('/', 'layout')` clears cache
5. **Server redirect** → `redirect('/dashboard')` navigates user
6. **Middleware validation** → Next request validates session

### **Session Validation Flow**

1. **Request received** → Middleware `updateSession()` called
2. **Cookie extraction** → Session cookies read from request
3. **User validation** → `supabase.auth.getUser()` checks session
4. **Authorization check** → Protected paths require valid user
5. **Response handling** → Cookies forwarded to client

### **Logout Flow**

1. **User triggers logout** → Server action called
2. **Session cleanup** → `supabase.auth.signOut()` clears session
3. **Cache invalidation** → `revalidatePath('/', 'layout')`
4. **Redirect** → `redirect('/')` sends to home page
5. **Middleware enforcement** → Next request redirects to login

## 🛡️ Security Benefits

### **Server-Side Validation**

- **No client bypass** - Auth logic only runs on server
- **Session hijacking protection** - HttpOnly cookies prevent XSS
- **CSRF protection** - Server actions include CSRF tokens
- **Request-level validation** - Every request validated by middleware

### **State Management Security**

- **No localStorage** - Session data never stored client-side
- **No client tokens** - No JWT tokens in JavaScript
- **Automatic expiration** - Supabase handles session expiry
- **Cookie security** - Secure, HttpOnly, SameSite cookies

## 🎯 Usage Patterns

### **In Server Components**

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/modassembly/supabase/server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      {/* Dashboard content */}
    </div>
  )
}
```

### **In Forms (Client Components)**

```typescript
// components/auth/AuthForm.tsx
'use client'

import { useActionState } from 'react'
import { signIn } from '@/lib/modassembly/supabase/auth/actions'

export default function AuthForm() {
  const [state, formAction] = useActionState(signIn, null)

  return (
    <form action={formAction}>
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
      />

      {state?.error && (
        <div className="error">{state.error}</div>
      )}

      <button type="submit">Sign In</button>
    </form>
  )
}
```

### **In API Routes**

```typescript
// app/api/protected/route.ts
import { createClient } from '@/lib/modassembly/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Protected API logic
  return NextResponse.json({ data: 'Protected data' })
}
```

## 🔧 Integration with Middleware

**File:** `middleware.ts` (project root)

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/modassembly/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## 📊 Comparison: Before vs After Luis

### **Before Luis (Client-Side Auth)**

```typescript
// lib/AuthContext.tsx (DELETED by Luis)
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext<{
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isLoading: boolean
}>({
  user: null,
  signIn: async () => {},
  signOut: async () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Complex client-side auth state management...
}
```

**Problems with Client-Side Approach:**

- ❌ Auth state in JavaScript (security risk)
- ❌ Complex state synchronization
- ❌ Race conditions during loading
- ❌ Client-server auth state mismatches
- ❌ Difficult to debug authentication issues

### **After Luis (Server-First Auth)**

```typescript
// lib/modassembly/supabase/auth/actions.ts
'use server'

export async function signIn(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
```

**Benefits of Server-First Approach:**

- ✅ Auth logic only on server (secure)
- ✅ Simple request/response flow
- ✅ No client state synchronization
- ✅ Consistent auth state across requests
- ✅ Easy to debug and test

## 🎯 Implementation Checklist

### **Setup Server Actions**

- [ ] Create `auth/actions.ts` with `'use server'`
- [ ] Implement `signIn`, `signUp`, `signOut` functions
- [ ] Use `FormData` extraction pattern
- [ ] Add `revalidatePath` and `redirect` calls

### **Configure Middleware**

- [ ] Create middleware session handler
- [ ] Set up cookie forwarding
- [ ] Implement user validation
- [ ] Add redirect logic for unauthenticated users

### **Server Client Setup**

- [ ] Create server client factory
- [ ] Integrate with Next.js cookies
- [ ] Add error handling for server components
- [ ] Type with Database interface

### **Remove Client-Side Auth**

- [ ] Delete any auth contexts
- [ ] Remove client auth hooks
- [ ] Update components to use server actions
- [ ] Remove client-side session storage

---

**Next:** See [03-database-module-patterns.md](./03-database-module-patterns.md) for Luis's database architecture.
