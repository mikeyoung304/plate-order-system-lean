# Implementation Guide: Recreating Luis's Backend System

> **Step-by-step guide** to implement Luis's authentic server-first backend architecture

## 🎯 Overview

This guide provides complete instructions for implementing Luis's backend architecture from scratch or migrating an existing system to his patterns.

## 📋 Prerequisites

### **Required Dependencies**

```json
{
  "@supabase/ssr": "^0.0.10",
  "@supabase/supabase-js": "^2.38.0",
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0"
}
```

### **Environment Variables**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Database Setup**

Ensure your Supabase project has:

- Authentication enabled
- Database tables: `profiles`, `orders`, `tables`, `seats`
- Row Level Security (RLS) policies configured

## 🏗️ Phase 1: Foundation Setup

### **Step 1: Create Modular Assembly Structure**

```bash
mkdir -p lib/modassembly/supabase/{auth,database}
```

**Directory Structure:**

```
lib/modassembly/supabase/
├── auth/
├── database/
├── client.ts
├── server.ts
└── middleware.ts
```

### **Step 2: Implement Server Client**

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

### **Step 3: Implement Browser Client**

**File:** `lib/modassembly/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### **Step 4: Create Middleware Handler**

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

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}
```

## 🔐 Phase 2: Authentication Implementation

### **Step 5: Create Server Actions**

**File:** `lib/modassembly/supabase/auth/actions.ts`

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

### **Step 6: Configure Project Middleware**

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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## 🗄️ Phase 3: Database Modules

### **Step 7: Create User Module**

**File:** `lib/modassembly/supabase/database/users.ts`

```typescript
import { createClient } from '@/lib/modassembly/supabase/client'

export type User = {
  id: string
  name: string
}

type ResidentProfile = {
  user_id: string
  name: string
}

export async function getUser() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return { user: null, profile: null }
  }

  const { data } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('user_id', session.user.id)
    .single()

  return {
    user: session.user,
    profile: data || { role: null, name: null },
  }
}

export async function getAllResidents(): Promise<User[]> {
  const supabase = createClient()

  const { data: residents, error } = await supabase
    .from('profiles')
    .select('user_id, name')
    .eq('role', 'resident')

  if (error) {
    throw new Error(`Failed to fetch residents: ${error.message}`)
  }

  if (!residents) {
    return []
  }

  return residents.map((resident: ResidentProfile) => ({
    id: resident.user_id,
    name: resident.name,
  }))
}
```

### **Step 8: Create Orders Module**

**File:** `lib/modassembly/supabase/database/orders.ts`

```typescript
import { createClient } from '@/lib/modassembly/supabase/client'

interface OrderRow {
  id: string
  table_id: string
  seat_id: string
  resident_id: string
  server_id: string
  items: string[]
  transcript: string
  status: 'new' | 'in_progress' | 'ready' | 'delivered'
  type: 'food' | 'drink'
  created_at: string
  tables: { label: number }
  seats: { label: number }
}

export interface Order extends OrderRow {
  table: string
  seat: number
}

export async function fetchRecentOrders(limit = 5): Promise<Order[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      tables!inner(label),
      seats!inner(label)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching orders:', error)
    throw error
  }

  return data.map((order: OrderRow) => ({
    ...order,
    table: `Table ${order.tables.label}`,
    seat: order.seats.label,
    items: order.items || [],
  }))
}

export async function createOrder(orderData: {
  table_id: string
  seat_id: string
  resident_id: string
  server_id: string
  items: string[]
  transcript: string
  type: 'food' | 'drink'
}): Promise<Order> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .insert([{ ...orderData, status: 'new' }])
    .select(
      `
      *,
      tables!inner(label),
      seats!inner(label)
    `
    )
    .single()

  if (error) {
    console.error('Error creating order:', error)
    throw error
  }

  return {
    ...data,
    table: `Table ${data.tables.label}`,
    seat: data.seats.label,
    items: data.items || [],
  } as Order
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderRow['status']
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}
```

### **Step 9: Create Additional Domain Modules**

Follow the same pattern for `tables.ts`, `seats.ts`, and any other business domains:

1. Import client
2. Define interfaces (raw and application)
3. Implement CRUD functions with consistent error handling
4. Use parallel queries for performance where appropriate

## 📱 Phase 4: Component Integration

### **Step 10: Create Authentication Form**

**File:** `components/auth/AuthForm.tsx`

```typescript
'use client'

import { useActionState } from 'react'
import { signIn } from '@/lib/modassembly/supabase/auth/actions'

export default function AuthForm() {
  const [state, formAction] = useActionState(signIn, null)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {state?.error && (
        <div className="text-red-500 text-sm">{state.error}</div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        Sign In
      </button>
    </form>
  )
}
```

### **Step 11: Create Protected Server Component**

**File:** `app/dashboard/page.tsx`

```typescript
import { createClient } from '@/lib/modassembly/supabase/server'
import { redirect } from 'next/navigation'
import { fetchRecentOrders } from '@/lib/modassembly/supabase/database/orders'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch data using database modules
  const orders = await fetchRecentOrders(10)

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <div>
        <h2>Recent Orders</h2>
        {orders.map(order => (
          <div key={order.id}>
            {order.table} - Seat {order.seat}: {order.items.join(', ')}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### **Step 12: Create API Route with Auth**

**File:** `app/api/orders/route.ts`

```typescript
import { createClient } from '@/lib/modassembly/supabase/server'
import { createOrder } from '@/lib/modassembly/supabase/database/orders'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const orders = await fetchRecentOrders()
    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const orderData = await request.json()
    const order = await createOrder(orderData)

    return NextResponse.json({ order })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
```

## 🧪 Phase 5: Testing & Validation

### **Step 13: Test Authentication Flow**

1. **Test Sign Up:**

   ```bash
   # Navigate to your signup page
   # Fill form and submit
   # Verify redirect to dashboard
   ```

2. **Test Sign In:**

   ```bash
   # Use existing credentials
   # Verify successful authentication
   # Check session persistence
   ```

3. **Test Sign Out:**
   ```bash
   # Click sign out
   # Verify redirect to home
   # Confirm session cleared
   ```

### **Step 14: Test Server Components**

1. **Protected Pages:**

   - Access dashboard without auth → should redirect to login
   - Access dashboard with auth → should show content

2. **Database Operations:**
   - Test each database module function
   - Verify error handling
   - Check data transformations

### **Step 15: Test API Routes**

```typescript
// Test protected API endpoint
const response = await fetch('/api/orders', {
  method: 'GET',
  credentials: 'include', // Include cookies
})

if (response.ok) {
  const data = await response.json()
  console.log('Orders:', data.orders)
}
```

## 🚀 Phase 6: Production Considerations

### **Step 16: Environment Configuration**

**Production Environment Variables:**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

### **Step 17: Security Checklist**

- [ ] RLS policies configured in Supabase
- [ ] Environment variables properly set
- [ ] No sensitive data in client-side code
- [ ] HTTPS enabled in production
- [ ] Cookie security settings configured

### **Step 18: Performance Optimization**

1. **Database Queries:**

   - Use `select()` with specific fields
   - Implement pagination for large datasets
   - Add database indexes for common queries

2. **Caching:**
   - Use Next.js cache for static data
   - Implement proper `revalidatePath()` calls
   - Consider Redis for session storage in high-traffic scenarios

## 🎯 Common Patterns & Best Practices

### **Server Component Auth Pattern**

```typescript
export default async function ProtectedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Page content
}
```

### **Database Module Pattern**

```typescript
export async function domainOperation(
  params: DomainParams
): Promise<DomainResult> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('table_name')
    .select('specific_fields')
    .eq('condition', params.value)

  if (error) {
    console.error('Operation failed:', error)
    throw error
  }

  return transformData(data)
}
```

### **Error Handling Pattern**

```typescript
try {
  const result = await databaseOperation()
  return result
} catch (error) {
  console.error('Database operation failed:', error)
  if (error.code === 'PGRST301') {
    return null // Handle not found
  }
  throw error // Re-throw other errors
}
```

## ✅ Implementation Checklist

### **Foundation**

- [ ] Modular assembly directory structure created
- [ ] Server and client configurations implemented
- [ ] Middleware session handling configured
- [ ] Project middleware integration complete

### **Authentication**

- [ ] Server actions for auth operations
- [ ] Form integration with useActionState
- [ ] Protected page patterns implemented
- [ ] Sign out functionality working

### **Database**

- [ ] Domain modules created for each business area
- [ ] Consistent error handling across modules
- [ ] Data transformation patterns implemented
- [ ] Performance optimizations added

### **Integration**

- [ ] Server components use auth patterns correctly
- [ ] API routes include authentication checks
- [ ] Client components use server actions
- [ ] End-to-end flow tested

### **Production**

- [ ] Environment variables configured
- [ ] Security checklist completed
- [ ] Performance optimizations implemented
- [ ] Error monitoring set up

**Result:** Complete implementation of Luis's authentic server-first backend architecture with all modern Next.js 13+ patterns and best practices.

---

**Next:** Review [07-current-system-state.md](./07-current-system-state.md) for fixing existing broken components.
