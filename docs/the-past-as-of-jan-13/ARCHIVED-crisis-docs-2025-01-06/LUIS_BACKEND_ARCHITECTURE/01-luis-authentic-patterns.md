# Luis's Authentic Backend Patterns

> **Source:** Git commit `56f4526` - "lgaleana/refactor (#1)" - May 19, 2025

## 🔍 What Luis Actually Built

Based on forensic analysis of commit `56f4526`, Luis implemented a **server-first backend architecture** with these core characteristics:

### **Architecture Philosophy: Server-First Everything**

Luis **deleted** client-side authentication and replaced it with server-side patterns:

**What Luis Removed:**

- `lib/AuthContext.tsx` - React context for client auth (188 lines deleted)
- `app/ClientLayout.tsx` - Client-side auth wrapper (29 lines deleted)
- `app/api/auth/signout/route.ts` - Client auth endpoint (31 lines deleted)
- `app/auth/callback/route.ts` - Auth callback handler (50 lines deleted)

**What Luis Created:**

- `lib/modassembly/supabase/auth/actions.ts` - Server actions for auth (61 lines)
- `lib/modassembly/supabase/middleware.ts` - Session handling (61 lines)
- `lib/modassembly/supabase/server.ts` - Server client (29 lines)
- Complete database module reorganization

## 🏗️ Core Architecture Components

### **1. Modular Assembly File Organization**

Luis created a systematic file structure under `/lib/modassembly/supabase/`:

```
lib/modassembly/supabase/
├── auth/
│   └── actions.ts          # Server actions for auth operations
├── database/
│   ├── orders.ts           # Order domain operations
│   ├── seats.ts            # Seat assignment operations
│   ├── suggestions.ts      # Order suggestion logic
│   ├── tables.ts           # Table management operations
│   └── users.ts            # User profile operations
├── client.ts               # Browser Supabase client
├── middleware.ts           # Session middleware
└── server.ts               # Server Supabase client
```

**Key Pattern: Domain Isolation**

- Each database file handles a single domain
- No cross-domain dependencies
- Clean separation of concerns

### **2. Server Actions Pattern**

**File:** `lib/modassembly/supabase/auth/actions.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/modassembly/supabase/server'

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

**Luis's Server Actions Pattern:**

- ✅ `'use server'` directive for server-side execution
- ✅ Form data extraction from `FormData`
- ✅ Direct Supabase auth operations
- ✅ `revalidatePath()` for cache invalidation
- ✅ `redirect()` for navigation
- ✅ Error handling with return objects

### **3. Middleware Session Management**

**File:** `lib/modassembly/supabase/middleware.ts`

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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}
```

**Luis's Middleware Pattern:**

- ✅ Cookie-based session management
- ✅ `supabase.auth.getUser()` for session validation
- ✅ Automatic redirect to login for unauthenticated users
- ✅ Proper cookie forwarding and response handling
- ✅ Clear comments about critical implementation details

### **4. Server Client Configuration**

**File:** `lib/modassembly/supabase/server.ts`

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

**Luis's Server Client Pattern:**

- ✅ Type-safe with `Database` interface
- ✅ Cookie store integration for server components
- ✅ Error handling for server component limitations
- ✅ Consistent environment variable usage

### **5. Database Module Pattern**

**Example:** `lib/modassembly/supabase/database/users.ts`

```typescript
import { createClient } from '@/lib/modassembly/supabase/server'

export async function getProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      email,
      full_name,
      role,
      created_at,
      updated_at
    `
    )
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function updateProfile(
  userId: string,
  updates: {
    full_name?: string
    role?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }

  return data
}
```

**Luis's Database Module Pattern:**

- ✅ Single domain responsibility (users only)
- ✅ Server client usage for all operations
- ✅ Explicit field selection (no `select('*')`)
- ✅ Consistent error handling with logging
- ✅ Return null for missing data, throw for update errors

## 🎯 Luis's Design Principles

### **1. Server-Side Authority**

- All authentication logic runs on the server
- No client-side auth state management
- Middleware enforces session validation

### **2. Domain Isolation**

- Each database module handles one domain
- No cross-domain imports or dependencies
- Clear functional boundaries

### **3. Type Safety**

- Consistent use of `Database` type from generated types
- Explicit return type handling
- Strong TypeScript usage throughout

### **4. Simple Error Handling**

- Console logging for debugging
- Return null for read operations
- Throw errors for write operations
- No complex error hierarchies

### **5. Next.js 13+ Patterns**

- Server actions with `'use server'`
- App router compatible
- Server components by default
- Proper cache revalidation

## 📊 Code Statistics from Commit `56f4526`

**Files Added:** 7 new modular assembly files
**Files Deleted:** 4 client-side auth files  
**Files Modified:** 19 existing files updated
**Net Change:** +439 lines, -548 lines (net reduction of 109 lines)

**Key Insight:** Luis **simplified** the codebase while adding functionality, removing complexity rather than adding it.

## 🚨 What Luis Did NOT Build

**Important:** These patterns were added AFTER Luis and should not be attributed to his work:

❌ **Client-side auth contexts** - Luis deleted these  
❌ **Protected route components** - Not in his commit  
❌ **Demo mode functionality** - Added later  
❌ **Enhanced/optimized client patterns** - Post-Luis additions  
❌ **Complex error hierarchies** - Luis kept error handling simple

## 🎯 Implementation Checklist

To recreate Luis's patterns in a new project:

### **Setup Modular Assembly Structure**

- [ ] Create `/lib/modassembly/supabase/` directory
- [ ] Set up `auth/`, `database/` subdirectories
- [ ] Create `client.ts`, `server.ts`, `middleware.ts` base files

### **Implement Server-First Auth**

- [ ] Create server actions in `auth/actions.ts`
- [ ] Set up middleware session handling
- [ ] Configure server client with cookie management
- [ ] Remove any client-side auth patterns

### **Create Domain Modules**

- [ ] Separate database operations by domain
- [ ] Implement consistent error handling
- [ ] Use type-safe database queries
- [ ] Maintain single responsibility per module

### **Integration**

- [ ] Update pages to use server actions
- [ ] Configure middleware in `middleware.ts`
- [ ] Test authentication flow end-to-end
- [ ] Verify session persistence across requests

---

**Next:** See [02-server-first-authentication.md](./02-server-first-authentication.md) for detailed auth implementation patterns.
