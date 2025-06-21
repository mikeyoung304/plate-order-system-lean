# Database Module Patterns

> **Luis's Domain Separation:** Clean, isolated modules for each business domain

## 🎯 Architecture Overview

Luis implemented a **domain-driven database architecture** where each business domain has its own isolated module. This approach provides clear boundaries, easier testing, and better maintainability.

### **Core Principle: Single Domain Responsibility**

Each module in `/lib/modassembly/supabase/database/` handles exactly one business domain:

- `orders.ts` - Order management and lifecycle
- `tables.ts` - Table operations and floor plan integration
- `seats.ts` - Seat assignment and management
- `users.ts` - User profiles and role management
- `suggestions.ts` - Order recommendation logic

**No cross-domain dependencies** - Each module is completely self-contained.

## 🏗️ Database Module Structure

### **Standard Module Pattern**

Each database module follows this consistent structure:

```typescript
// 1. Client import
import { createClient } from '@/lib/modassembly/supabase/client'

// 2. Type definitions
interface DomainRow {
  // Raw database row structure
}

export interface Domain {
  // Transformed/enriched interface for application use
}

// 3. Query functions
export async function fetchDomainData(): Promise<Domain[]> {
  // Implementation
}

export async function createDomainItem(): Promise<Domain> {
  // Implementation
}

export async function updateDomainItem(): Promise<void> {
  // Implementation
}
```

## 📋 Module Analysis

### **1. Orders Module (`orders.ts`)**

**Domain:** Order lifecycle management

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

**Luis's Orders Pattern:**

- ✅ **Join optimization** - Uses `!inner()` for required relationships
- ✅ **Data transformation** - Raw data transformed to application format
- ✅ **Status management** - Proper order lifecycle handling
- ✅ **Error handling** - Console logging with error throwing
- ✅ **Type safety** - Separate raw and application interfaces

### **2. Tables Module (`tables.ts`)**

**Domain:** Table management and floor plan integration

```typescript
import { createClient } from '@/lib/modassembly/supabase/client'
import { Table } from '../../../floor-plan-utils'

interface SupabaseTable {
  id: string
  label: number
  type: string
  status: string
}

interface SupabaseSeat {
  id: string
  table_id: string
  label: number
  status: string
}

// Configuration constants
const CIRCLE_TABLE_DEFAULTS = {
  width: 80,
  height: 80,
  rotation: 0,
  floor_plan_id: 'default',
}

const RECTANGLE_TABLE_DEFAULTS = {
  width: 120,
  height: 80,
  rotation: 0,
  floor_plan_id: 'default',
}

const GRID_CONFIG = {
  startX: 100,
  startY: 100,
  horizontalSpacing: 150,
  verticalSpacing: 150,
  tablesPerRow: 3,
}

export async function fetchTables(): Promise<Table[]> {
  const supabase = createClient()

  // Parallel data fetching
  const [tablesResponse, seatsResponse] = await Promise.all([
    supabase.from('tables').select('*').order('label'),
    supabase.from('seats').select('*'),
  ])

  if (tablesResponse.error) {
    console.error('Error fetching tables:', tablesResponse.error)
    throw new Error('Failed to fetch tables')
  }

  if (seatsResponse.error) {
    console.error('Error fetching seats:', seatsResponse.error)
    throw new Error('Failed to fetch seats')
  }

  const tables = tablesResponse.data as SupabaseTable[]
  const seats = seatsResponse.data as SupabaseSeat[]

  // Aggregate seat counts
  const seatCountMap = seats.reduce(
    (acc, seat) => {
      acc[seat.table_id] = (acc[seat.table_id] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Transform with grid layout calculation
  return tables.map((table, index): Table => {
    const defaults =
      table.type === 'circle' ? CIRCLE_TABLE_DEFAULTS : RECTANGLE_TABLE_DEFAULTS

    // Grid position calculation
    const row = Math.floor(index / GRID_CONFIG.tablesPerRow)
    const col = index % GRID_CONFIG.tablesPerRow

    const x = GRID_CONFIG.startX + col * GRID_CONFIG.horizontalSpacing
    const y = GRID_CONFIG.startY + row * GRID_CONFIG.verticalSpacing

    const extraSpacing = table.type === 'rectangle' ? 30 : 0

    return {
      id: table.id,
      label: table.label.toString(),
      status: table.status as 'available' | 'occupied' | 'reserved',
      type: table.type as 'circle' | 'rectangle' | 'square',
      seats: seatCountMap[table.id] || 0,
      x: x + extraSpacing,
      y,
      ...defaults,
    }
  })
}
```

**Luis's Tables Pattern:**

- ✅ **Parallel queries** - `Promise.all()` for performance
- ✅ **Data aggregation** - Seat count calculation
- ✅ **Configuration constants** - Layout parameters externalized
- ✅ **Grid layout logic** - Automatic positioning algorithm
- ✅ **Type transformation** - Database types to application types

### **3. Users Module (`users.ts`)**

**Domain:** User profiles and role management

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

**Luis's Users Pattern:**

- ✅ **Session integration** - Combines auth session with profile data
- ✅ **Null handling** - Graceful handling of missing profiles
- ✅ **Role filtering** - Query by role for specific user types
- ✅ **Data transformation** - Database fields mapped to application format
- ✅ **Error messaging** - Descriptive error messages with context

## 🎯 Design Patterns Analysis

### **1. Consistent Error Handling**

**Pattern:** Console log + throw error

```typescript
if (error) {
  console.error('Error fetching tables:', error)
  throw new Error('Failed to fetch tables')
}
```

**Benefits:**

- Development debugging with console logs
- Application error handling with thrown errors
- Consistent error reporting across modules

### **2. Data Transformation Strategy**

**Pattern:** Raw database interface → Application interface

```typescript
interface OrderRow {
  // Raw database structure
  tables: { label: number }
  seats: { label: number }
}

export interface Order extends OrderRow {
  // Application-friendly structure
  table: string // "Table 5"
  seat: number // 2
}
```

**Benefits:**

- Database schema isolation
- Application-specific data formatting
- Type safety at both levels

### **3. Performance Optimization**

**Pattern:** Parallel queries and aggregation

```typescript
// Parallel data fetching
const [tablesResponse, seatsResponse] = await Promise.all([
  supabase.from('tables').select('*').order('label'),
  supabase.from('seats').select('*'),
])

// Client-side aggregation
const seatCountMap = seats.reduce(
  (acc, seat) => {
    acc[seat.table_id] = (acc[seat.table_id] || 0) + 1
    return acc
  },
  {} as Record<string, number>
)
```

**Benefits:**

- Reduced database round trips
- Efficient data processing
- Better performance under load

### **4. Configuration Externalization**

**Pattern:** Constants for business logic

```typescript
const GRID_CONFIG = {
  startX: 100,
  startY: 100,
  horizontalSpacing: 150,
  verticalSpacing: 150,
  tablesPerRow: 3,
}
```

**Benefits:**

- Easy configuration changes
- Clear business rules
- Testable layout logic

## 🛠️ Integration Patterns

### **Usage in Server Components**

```typescript
// app/dashboard/page.tsx
import { fetchRecentOrders } from '@/lib/modassembly/supabase/database/orders'
import { fetchTables } from '@/lib/modassembly/supabase/database/tables'

export default async function Dashboard() {
  const [orders, tables] = await Promise.all([
    fetchRecentOrders(10),
    fetchTables()
  ]);

  return (
    <div>
      <OrdersList orders={orders} />
      <FloorPlan tables={tables} />
    </div>
  );
}
```

### **Usage in API Routes**

```typescript
// app/api/orders/route.ts
import { createOrder } from '@/lib/modassembly/supabase/database/orders'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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

### **Usage in Server Actions**

```typescript
// lib/modassembly/supabase/auth/actions.ts
import { getAllResidents } from '@/lib/modassembly/supabase/database/users'

export async function getResidentOptions() {
  'use server'

  try {
    const residents = await getAllResidents()
    return residents.map(resident => ({
      value: resident.id,
      label: resident.name,
    }))
  } catch (error) {
    console.error('Failed to fetch residents:', error)
    return []
  }
}
```

## 🔍 Module Dependencies

### **Current Dependency Graph**

```
Database Modules (Independent)
├── orders.ts ─── depends on ─── client.ts
├── tables.ts ─── depends on ─── client.ts, floor-plan-utils.ts
├── users.ts ──── depends on ─── client.ts
├── seats.ts ──── depends on ─── client.ts
└── suggestions.ts ─ depends on ─── client.ts

External Dependencies
├── client.ts ──── Supabase browser client
└── floor-plan-utils.ts ─ Application types
```

**Key Insight:** No cross-module dependencies - each domain is isolated.

## 📊 Comparison: Monolithic vs Modular

### **Before Luis (Monolithic)**

```typescript
// Single large database utility file
export class DatabaseService {
  async getOrders() {
    /* orders logic */
  }
  async getTables() {
    /* tables logic */
  }
  async getUsers() {
    /* users logic */
  }
  async getSeats() {
    /* seats logic */
  }
  // All domains mixed together
}
```

**Problems:**

- ❌ Large, hard-to-maintain files
- ❌ Unclear domain boundaries
- ❌ Difficult to test individual domains
- ❌ Coupling between unrelated functionality

### **After Luis (Modular)**

```typescript
// Separate domain modules
// orders.ts - Only order operations
// tables.ts - Only table operations
// users.ts - Only user operations
// seats.ts - Only seat operations
```

**Benefits:**

- ✅ Clear domain separation
- ✅ Easier to test and maintain
- ✅ No cross-domain coupling
- ✅ Team can work on domains independently

## 🎯 Implementation Checklist

### **Create Domain Modules**

- [ ] Identify business domains in your application
- [ ] Create separate file for each domain
- [ ] Define raw and application interfaces for each
- [ ] Implement query functions with consistent error handling

### **Follow Luis's Patterns**

- [ ] Use `createClient()` from client module
- [ ] Console log errors before throwing
- [ ] Transform raw data to application format
- [ ] Use parallel queries for performance
- [ ] Externalize configuration constants

### **Integration Testing**

- [ ] Test each module independently
- [ ] Verify no cross-domain dependencies
- [ ] Test error handling paths
- [ ] Validate data transformations

---

**Next:** See [04-middleware-session-management.md](./04-middleware-session-management.md) for session handling patterns.
