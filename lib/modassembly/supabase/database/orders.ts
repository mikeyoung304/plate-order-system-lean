import { getOrderClient } from '@/lib/database-connection-pool'
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
  special_requests?: string
  estimated_prep_time?: number
  actual_prep_time?: number
  created_at: string
  tables: {
    label: string
  }
  seats: {
    label: string
  }
}

export interface Order extends OrderRow {
  table: string
  seat: string
}

export async function fetchRecentOrders(limit = 5): Promise<Order[]> {
  const supabase = getOrderClient()
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
  special_requests?: string
  estimated_prep_time?: number
  actual_prep_time?: number
}): Promise<Order> {
  const supabase = getOrderClient()

  // Validate required data
  if (
    !orderData.table_id ||
    !orderData.seat_id ||
    !orderData.resident_id ||
    !orderData.server_id
  ) {
    throw new Error(
      'Missing required order data: table_id, seat_id, resident_id, and server_id are required'
    )
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        ...orderData,
        status: 'new',
      },
    ])
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data returned from order creation')
  }

  // Fetch table and seat info separately to build the complete Order object
  const [tableData, seatData] = await Promise.all([
    supabase.from('tables').select('label').eq('id', data.table_id).single(),
    supabase.from('seats').select('label').eq('id', data.seat_id).single(),
  ])

  // Automatically route the order to appropriate KDS stations
  try {
    await intelligentOrderRouting(data.id)
    // Order successfully routed to KDS stations
  } catch {
    // Error routing order to KDS stations - will be handled by caller
    // Don't fail the order creation if routing fails - this is a secondary operation
  }

  return {
    ...data,
    table: `Table ${tableData.data?.label || 'Unknown'}`,
    seat: seatData.data?.label || 0,
    items: data.items || [],
  } as Order
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderRow['status']
): Promise<void> {
  const supabase = getOrderClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) {
    throw error
  }
}

// Additional CRUD functions following Luis's patterns
export async function deleteOrder(orderId: string): Promise<void> {
  const supabase = getOrderClient()

  const { error } = await supabase.from('orders').delete().eq('id', orderId)

  if (error) {
    throw new Error(`Failed to delete order: ${error.message}`)
  }
}

export async function getOrders(filters?: {
  status?: OrderRow['status']
  tableId?: string
  limit?: number
}): Promise<Order[]> {
  const supabase = getOrderClient()

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
  const supabase = getOrderClient()

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
    throw new Error(`Failed to update order: ${error.message}`)
  }

  return {
    ...data,
    table: `Table ${data.tables.label}`,
    seat: data.seats.label,
    items: data.items || [],
  } as Order
}
