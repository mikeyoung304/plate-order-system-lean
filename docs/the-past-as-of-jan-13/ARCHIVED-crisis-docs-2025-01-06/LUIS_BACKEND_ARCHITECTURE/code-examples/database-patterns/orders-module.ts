/**
 * Luis's Orders Database Module Pattern
 * Source: lib/modassembly/supabase/database/orders.ts
 *
 * This demonstrates Luis's approach to domain-specific database modules
 * with clean interfaces, error handling, and data transformation.
 */

import { createClient } from '@/lib/modassembly/supabase/client'

// Raw database row interface - matches actual table structure
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
  tables: {
    label: number
  }
  seats: {
    label: number
  }
}

// Application interface - transformed for UI consumption
export interface Order extends OrderRow {
  table: string // "Table 5"
  seat: number // 2
}

/**
 * Fetch recent orders with joins and transformation
 * Luis's pattern: specific field selection, joins, data transformation
 */
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

  // Luis's error handling pattern: console log + throw
  if (error) {
    console.error('Error fetching orders:', error)
    throw error
  }

  // Luis's data transformation pattern: raw to application format
  return data.map((order: OrderRow) => ({
    ...order,
    table: `Table ${order.tables.label}`,
    seat: order.seats.label,
    items: order.items || [],
  }))
}

/**
 * Create new order with proper data handling
 * Luis's pattern: structured input, immediate return with transformation
 */
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
    .insert([
      {
        ...orderData,
        status: 'new', // Default status
      },
    ])
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

  // Transform and return immediately
  return {
    ...data,
    table: `Table ${data.tables.label}`,
    seat: data.seats.label,
    items: data.items || [],
  } as Order
}

/**
 * Update order status - simple, focused operation
 * Luis's pattern: single responsibility, void return for updates
 */
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

/**
 * Get orders for specific table - filtered query example
 * Luis's pattern: specific use case, clear parameters
 */
export async function getOrdersForTable(tableId: string): Promise<Order[]> {
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
    .eq('table_id', tableId)
    .in('status', ['new', 'in_progress']) // Only active orders
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching table orders:', error)
    throw error
  }

  return data.map((order: OrderRow) => ({
    ...order,
    table: `Table ${order.tables.label}`,
    seat: order.seats.label,
    items: order.items || [],
  }))
}

/**
 * Luis's Database Module Pattern Characteristics:
 *
 * 1. Domain Isolation - Only order-related operations
 * 2. Interface Separation - Raw database vs application interfaces
 * 3. Specific Queries - No select('*'), explicit field selection
 * 4. Join Optimization - Use !inner() for required relationships
 * 5. Data Transformation - Raw data converted to UI-friendly format
 * 6. Error Handling - Console log + throw pattern
 * 7. Type Safety - Full TypeScript interfaces
 * 8. Single Responsibility - Each function has one clear purpose
 */
