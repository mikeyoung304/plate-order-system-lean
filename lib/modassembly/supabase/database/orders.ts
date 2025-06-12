import { createClient } from '@/lib/modassembly/supabase/client'
import { intelligentOrderRouting } from './kds'

interface OrderRow {
  id: string
  table_id: string
  seat_id: string
  resident_id: string
  server_id: string
  items: string[]
  transcript: string
  status: 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
  type: 'food' | 'drink'
  created_at: string
  tables: {
    label: number
  }
  seats: {
    label: number
  }
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
    .insert([
      {
        ...orderData,
        status: 'new',
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

  // Automatically route the order to appropriate KDS stations
  try {
    await intelligentOrderRouting(data.id)
    // Successfully routed order to KDS stations
  } catch (routingError) {
    console.error('Error routing order to KDS stations:', routingError)
    // Don't fail the order creation if routing fails
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

// Additional CRUD functions following Luis's patterns
export async function deleteOrder(orderId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('orders').delete().eq('id', orderId)

  if (error) {
    console.error('Error deleting order:', error)
    throw new Error(`Failed to delete order: ${error.message}`)
  }
}

export async function getOrders(filters?: {
  status?: OrderRow['status']
  tableId?: string
  limit?: number
}): Promise<Order[]> {
  const supabase = createClient()

  let query = supabase
    .from('orders')
    .select(
      `
      *,
      tables!inner(label),
      seats!inner(label)
    `
    )
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.tableId) {
    query = query.eq('table_id', filters.tableId)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching orders:', error)
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return data.map((order: OrderRow) => ({
    ...order,
    table: `Table ${order.tables.label}`,
    seat: order.seats.label,
    items: order.items || [],
  }))
}

export async function updateOrder(
  orderId: string,
  updates: Partial<OrderRow>
): Promise<Order | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select(
      `
      *,
      tables!inner(label),
      seats!inner(label)
    `
    )
    .single()

  if (error) {
    console.error('Error updating order:', error)
    throw new Error(`Failed to update order: ${error.message}`)
  }

  return {
    ...data,
    table: `Table ${data.tables.label}`,
    seat: data.seats.label,
    items: data.items || [],
  } as Order
}
