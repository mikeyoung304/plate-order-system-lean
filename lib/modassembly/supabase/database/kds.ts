import type { createClient } from '@/lib/modassembly/supabase/server'
import { createClient as createBrowserClient } from '@/lib/modassembly/supabase/client'
import { Security } from '@/lib/security'
import { measureApiCall } from '@/lib/performance-utils'
import {
  KDSConfiguration as DatabaseKDSConfiguration,
  KDSMetric as DatabaseKDSMetric,
  KDSOrderRouting as DatabaseKDSOrderRouting,
  KDSStation as DatabaseKDSStation,
  KDSOrderWithJoins,
  OrderType,
} from '@/types/database'

// Re-export database types for backward compatibility
export type KDSStation = DatabaseKDSStation
export type KDSOrderRouting = DatabaseKDSOrderRouting & {
  // Joined data
  order?: {
    id: string
    table_id: string
    seat_id: string
    server_id?: string
    items: any[]
    transcript?: string
    status: string
    type: OrderType
    created_at: string
    server?: {
      name: string
    }
    table?: {
      id: string
      label: string
    }
    seat?: {
      id: string
      label: string
    }
    resident?: {
      name: string
    }
  }
  station?: KDSStation
}
export type KDSMetric = DatabaseKDSMetric
export type KDSConfiguration = DatabaseKDSConfiguration

/**
 * Fetch all active KDS stations (secure)
 */
export async function fetchKDSStations(supabase: Awaited<ReturnType<typeof createClient>>): Promise<KDSStation[]> {
  return measureApiCall('fetch_kds_stations', async () => {

    const { data, error } = await supabase
      .from('kds_stations')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching KDS stations:', error)
      throw error
    }

    // Security: Sanitize station data
    return (data || []).map(station => ({
      ...station,
      name: Security.sanitize.sanitizeUserName(station.name),
      type: [
        'grill',
        'fryer',
        'salad',
        'expo',
        'bar',
        'prep',
        'dessert',
      ].includes(station.type)
        ? station.type
        : 'prep',
      position: Math.max(0, Math.min(100, station.position || 0)),
      settings: typeof station.settings === 'object' ? station.settings : {},
    }))
  })
}

/**
 * Fetch orders for a specific station with real-time updates (secure)
 */
export async function fetchStationOrders(
  stationId: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<KDSOrderRouting[]> {
  return measureApiCall('fetch_station_orders', async () => {
    // Security: Validate station ID
    const sanitizedStationId = Security.sanitize.sanitizeIdentifier(stationId)
    if (!sanitizedStationId) {
      throw new Error('Invalid station ID')
    }

    const supabase = supabaseClient || createBrowserClient()

    const { data, error } = await supabase
      .from('kds_order_routing')
      .select(
        `
        *,
        order:orders!inner (
          id, items, status, type, created_at, transcript, seat_id,
          table:tables!table_id (id, label),
          seat:seats!seat_id (id, label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `
      )
      .eq('station_id', sanitizedStationId)
      .is('completed_at', null) // Only show uncompleted orders
      .order('routed_at', { ascending: true })
      .limit(50) // Security: Limit results to prevent excessive data

    if (error) {
      console.error('Error fetching station orders:', error)
      throw error
    }

    // Security: Sanitize order data
    return (data || []).map(order => ({
      ...order,
      notes: order.notes ? Security.sanitize.sanitizeHTML(order.notes) : null,
      priority: Math.max(0, Math.min(10, order.priority || 0)),
      order: order.order
        ? {
            ...order.order,
            items: Array.isArray(order.order.items)
              ? order.order.items
                  .map((item: any) => Security.sanitize.sanitizeOrderItem(item))
                  .filter((item: string) => item.length > 0)
                  .slice(0, 20) // Limit items
              : [],
            transcript: order.order.transcript
              ? Security.sanitize.sanitizeHTML(order.order.transcript)
              : null,
          }
        : null,
    }))
  })
}

/**
 * Fetch all active orders across all stations
 */
export async function fetchAllActiveOrders(
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<KDSOrderRouting[]> {
  return measureApiCall('fetch_all_active_orders', async () => {
    const supabase = supabaseClient || createBrowserClient()

    const { data, error } = await supabase
      .from('kds_order_routing')
      .select(
        `
        *,
        order:orders!inner (
          id, items, status, type, created_at, transcript, seat_id,
          table:tables!table_id (id, label),
          seat:seats!seat_id (id, label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `
      )
      .is('completed_at', null)
      .order('routed_at', { ascending: true })
      .limit(100) // Security: Limit results to prevent excessive data

    if (error) {
      console.error('Error fetching all active orders:', error)
      throw error
    }


    // Security: Sanitize order data (same as fetchStationOrders)
    return (data || []).map(order => ({
      ...order,
      notes: order.notes ? Security.sanitize.sanitizeHTML(order.notes) : null,
      priority: Math.max(0, Math.min(10, order.priority || 0)),
      order: order.order
        ? {
            ...order.order,
            items: Array.isArray(order.order.items)
              ? order.order.items
                  .map((item: any) => Security.sanitize.sanitizeOrderItem(item))
                  .filter((item: string) => item.length > 0)
                  .slice(0, 20) // Limit items
              : [],
            transcript: order.order.transcript
              ? Security.sanitize.sanitizeHTML(order.order.transcript)
              : null,
          }
        : null,
    }))
  })
}

/**
 * Mark an order as ready/completed at a station (bump functionality) - secure
 */
export async function bumpOrder(
  routingId: string,
  userId: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  return measureApiCall('bump_order', async () => {
    // Security: Validate IDs
    const sanitizedRoutingId = Security.sanitize.sanitizeIdentifier(routingId)
    const sanitizedUserId = Security.sanitize.sanitizeIdentifier(userId)

    if (!sanitizedRoutingId || !sanitizedUserId) {
      throw new Error('Invalid routing ID or user ID')
    }

    // UUID validation for extra security
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (
      !uuidRegex.test(sanitizedRoutingId) ||
      !uuidRegex.test(sanitizedUserId)
    ) {
      throw new Error('Invalid ID format')
    }

    const supabase = supabaseClient || createBrowserClient()

    const { error } = await supabase
      .from('kds_order_routing')
      .update({
        completed_at: new Date().toISOString(),
        bumped_by: sanitizedUserId,
        bumped_at: new Date().toISOString(),
      })
      .eq('id', sanitizedRoutingId)

    if (error) {
      console.error('Error bumping order:', error)
      throw error
    }

    try {
      // Get the order ID from this routing entry
      const { data: routingData, error: routingError } = await supabase
        .from('kds_order_routing')
        .select('order_id')
        .eq('id', sanitizedRoutingId)
        .single()

      if (!routingError && routingData) {
        await checkAndCompleteOrder(routingData.order_id, supabase)
      }
    } catch (completionError) {
      console.error(
        'Error checking order completion after bump:',
        completionError
      )
      // Don't fail the bump if completion check fails
    }
  })
}

/**
 * Recall a bumped order (undo bump)
 */
export async function recallOrder(
  routingId: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const supabase = supabaseClient || createBrowserClient()

  // First get current recall count
  const { data: currentData, error: fetchError } = await supabase
    .from('kds_order_routing')
    .select('recall_count')
    .eq('id', routingId)
    .single()

  if (fetchError) {
    console.error('Error fetching order for recall:', fetchError)
    throw fetchError
  }

  const { error } = await supabase
    .from('kds_order_routing')
    .update({
      completed_at: null,
      bumped_by: null,
      bumped_at: null,
      recalled_at: new Date().toISOString(),
      recall_count: (currentData?.recall_count || 0) + 1,
    })
    .eq('id', routingId)

  if (error) {
    console.error('Error recalling order:', error)
    throw error
  }
}

/**
 * Start preparation for an order
 */
export async function startOrderPrep(
  routingId: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const supabase = supabaseClient || createBrowserClient()

  const { error } = await supabase
    .from('kds_order_routing')
    .update({
      started_at: new Date().toISOString(),
    })
    .eq('id', routingId)

  if (error) {
    console.error('Error starting order prep:', error)
    throw error
  }
}

/**
 * Update order priority
 */
export async function updateOrderPriority(
  routingId: string,
  priority: number,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const supabase = supabaseClient || createBrowserClient()

  const { error } = await supabase
    .from('kds_order_routing')
    .update({ priority })
    .eq('id', routingId)

  if (error) {
    console.error('Error updating order priority:', error)
    throw error
  }
}

/**
 * Add notes to an order at a station (secure)
 */
export async function addOrderNotes(
  routingId: string,
  notes: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  return measureApiCall('add_order_notes', async () => {
    // Security: Validate routing ID
    const sanitizedRoutingId = Security.sanitize.sanitizeIdentifier(routingId)
    if (!sanitizedRoutingId) {
      throw new Error('Invalid routing ID')
    }

    // UUID validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sanitizedRoutingId)) {
      throw new Error('Invalid routing ID format')
    }

    // Security: Sanitize notes content thoroughly
    const sanitizedNotes = Security.sanitize
      .sanitizeHTML(notes || '')
      .slice(0, 500) // Limit note length for security

    if (!sanitizedNotes || sanitizedNotes.trim().length === 0) {
      throw new Error('Notes cannot be empty')
    }

    const supabase = supabaseClient || createBrowserClient()

    const { error } = await supabase
      .from('kds_order_routing')
      .update({ notes: sanitizedNotes })
      .eq('id', sanitizedRoutingId)

    if (error) {
      console.error('Error adding order notes:', error)
      throw error
    }
  })
}

/**
 * Fetch station performance metrics
 */
export async function fetchStationMetrics(
  stationId: string,
  startDate: string,
  endDate: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<KDSMetric[]> {
  const supabase = supabaseClient || createBrowserClient()

  const { data, error } = await supabase
    .from('kds_metrics')
    .select('*')
    .eq('station_id', stationId)
    .gte('recorded_at', startDate)
    .lte('recorded_at', endDate)
    .order('recorded_at', { ascending: false })

  if (error) {
    console.error('Error fetching station metrics:', error)
    throw error
  }

  return data || []
}

/**
 * Fetch KDS configuration
 */
export async function fetchKDSConfiguration(
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<Record<string, any>> {
  const supabase = supabaseClient || createBrowserClient()

  const { data, error } = await supabase
    .from('kds_configuration')
    .select('key, value')

  if (error) {
    console.error('Error fetching KDS configuration:', error)
    throw error
  }

  // Convert array to object
  const config: Record<string, any> = {}
  data?.forEach(item => {
    config[item.key] = item.value
  })

  return config
}

/**
 * Update KDS configuration
 */
export async function updateKDSConfiguration(
  key: string,
  value: any,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const supabase = supabaseClient || createBrowserClient()

  const { error } = await supabase.from('kds_configuration').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Error updating KDS configuration:', error)
    throw error
  }
}

/**
 * Create a new KDS station
 */
export async function createKDSStation(
  station: Omit<KDSStation, 'id' | 'created_at' | 'updated_at'>,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<KDSStation> {
  const supabase = supabaseClient || createBrowserClient()

  const { data, error } = await supabase
    .from('kds_stations')
    .insert(station)
    .select()
    .single()

  if (error) {
    console.error('Error creating KDS station:', error)
    throw error
  }

  return data
}

/**
 * Update a KDS station
 */
export async function updateKDSStation(
  stationId: string,
  updates: Partial<KDSStation>,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const supabase = supabaseClient || createBrowserClient()

  const { error } = await supabase
    .from('kds_stations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stationId)

  if (error) {
    console.error('Error updating KDS station:', error)
    throw error
  }
}

/**
 * Route an order to a specific station manually (secure)
 */
export async function routeOrderToStation(
  orderId: string,
  stationId: string,
  sequence: number = 1,
  priority: number = 0,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  return measureApiCall('route_order_to_station', async () => {
    // Security: Validate all IDs
    const sanitizedOrderId = Security.sanitize.sanitizeIdentifier(orderId)
    const sanitizedStationId = Security.sanitize.sanitizeIdentifier(stationId)

    if (!sanitizedOrderId || !sanitizedStationId) {
      throw new Error('Invalid order ID or station ID')
    }

    // UUID validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (
      !uuidRegex.test(sanitizedOrderId) ||
      !uuidRegex.test(sanitizedStationId)
    ) {
      throw new Error('Invalid ID format')
    }

    // Security: Validate and clamp numerical values
    const sanitizedSequence = Math.max(1, Math.min(10, Math.floor(sequence)))
    const sanitizedPriority = Math.max(0, Math.min(10, Math.floor(priority)))

    const supabase = supabaseClient || createBrowserClient()

    const { error } = await supabase.from('kds_order_routing').insert({
      order_id: sanitizedOrderId,
      station_id: sanitizedStationId,
      sequence: sanitizedSequence,
      priority: sanitizedPriority,
      routed_at: new Date().toISOString(),
      recall_count: 0,
    })

    if (error) {
      console.error('Error routing order to station:', error)
      throw error
    }
  })
}

/**
 * Calculate average prep times for AI prediction
 */
export async function calculateAveragePrepTimes(
  stationId: string,
  days: number = 7,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  const supabase = supabaseClient || createBrowserClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('kds_metrics')
    .select('value_seconds')
    .eq('station_id', stationId)
    .eq('metric_type', 'prep_time')
    .gte('recorded_at', startDate.toISOString())
    .not('value_seconds', 'is', null)

  if (error) {
    console.error('Error calculating average prep times:', error)
    throw error
  }

  if (!data || data.length === 0) {
    return 300
  } // Default 5 minutes

  const total = data.reduce(
    (sum, metric) => sum + (metric.value_seconds || 0),
    0
  )
  return Math.round(total / data.length)
}

/**
 * Bulk bump all orders for a table
 */
export async function bulkBumpTableOrders(
  tableId: string,
  userId: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  const supabase = supabaseClient || createBrowserClient()

  const { data, error } = await supabase.rpc('bulk_bump_table_orders', {
    p_table_id: tableId,
    p_user_id: userId,
  })

  if (error) {
    console.error('Error bulk bumping table orders:', error)
    throw error
  }

  return data || 0
}

/**
 * Fetch table summary for KDS display (secure)
 */
export async function fetchKDSTableSummary(
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<any[]> {
  return measureApiCall('fetch_kds_table_summary', async () => {
    const supabase = supabaseClient || createBrowserClient()

    const { data, error } = await supabase
      .from('kds_table_summary')
      .select('*')
      .limit(100) // Security: Limit results

    if (error) {
      console.error('Error fetching KDS table summary:', error)
      throw error
    }

    return data || []
  })
}

/**
 * Automatically routes orders to appropriate stations based on order type and items
 */
export async function intelligentOrderRouting(
  orderId: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  return measureApiCall('intelligent_order_routing', async () => {
    // Security: Validate order ID
    const sanitizedOrderId = Security.sanitize.sanitizeIdentifier(orderId)
    if (!sanitizedOrderId) {
      throw new Error('Invalid order ID')
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sanitizedOrderId)) {
      throw new Error('Invalid order ID format')
    }

    const supabase = supabaseClient || createBrowserClient()

    // Fetch the order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, type, items')
      .eq('id', sanitizedOrderId)
      .single()

    if (orderError) {
      console.error('Error fetching order for routing:', orderError)
      throw orderError
    }

    if (!order) {
      throw new Error('Order not found')
    }

    // Fetch active stations
    const stations = await fetchKDSStations(supabase)

    if (stations.length === 0) {
      throw new Error('No active stations available for routing')
    }

    // Intelligent routing logic
    const targetStations: {
      station: KDSStation
      priority: number
      sequence: number
    }[] = []

    if (order.type === 'beverage' || order.type === 'drink') {
      // Route beverages to bar station
      const barStation = stations.find(s => s.type === 'bar')
      if (barStation) {
        targetStations.push({ station: barStation, priority: 1, sequence: 1 })
      }
    } else {
      // Analyze food items to determine routing
      const items = Array.isArray(order.items) ? order.items : []

      // Keywords for different stations - Enhanced coverage
      const routingRules = {
        grill: [
          'steak',
          'burger',
          'chicken',
          'beef',
          'pork',
          'grilled',
          'barbecue',
          'bbq',
          'ribeye',
          'filet',
          'sirloin',
          'cheeseburger',
          'bacon',
          'patty',
        ],
        fryer: [
          'fries', 
          'fried', 
          'tempura', 
          'wings', 
          'nuggets', 
          'crispy',
          'loaded',
          'onion rings',
          'calamari',
          'fish and chips',
        ],
        salad: [
          'salad', 
          'greens', 
          'vegetables', 
          'fresh', 
          'raw', 
          'lettuce',
          'caesar',
          'greek',
          'chef',
          'garden',
          'spinach',
        ],
        prep: [
          'soup', 
          'sauce', 
          'dressing', 
          'marinade', 
          'prep',
          'mashed',
          'potatoes',
          'side',
          'fondue',
          'pot',
        ],
        dessert: [
          'dessert',
          'cake',
          'ice cream',
          'sweet',
          'chocolate',
          'fruit',
          'tiramisu',
          'waffle',
          'belgian',
          'stack',
          'slice',
          'birthday',
          'bowl',
        ],
      }

      // Analyze items and route to appropriate stations
      const itemText = items.join(' ').toLowerCase()
      let sequence = 1

      for (const [stationType, keywords] of Object.entries(routingRules)) {
        if (keywords.some(keyword => itemText.includes(keyword))) {
          const station = stations.find(s => s.type === stationType)
          if (station) {
            const priority = stationType === 'grill' ? 2 : 1 // Grill gets higher priority
            targetStations.push({ station, priority, sequence: sequence++ })
          }
        }
      }

      // If no specific routing, route to expo station or first available station
      if (targetStations.length === 0) {
        const expoStation = stations.find(s => s.type === 'expo') || stations[0]
        if (expoStation) {
          targetStations.push({
            station: expoStation,
            priority: 1,
            sequence: 1,
          })
        }
      }
    }

    // Route to all determined stations
    for (const { station, priority, sequence } of targetStations) {
      await routeOrderToStation(
        sanitizedOrderId,
        station.id,
        sequence,
        priority,
        supabase
      )
    }

    // Order routed to stations successfully
  })
}

/**
 * Updates main order status when all KDS stations have completed their part
 */
export async function checkAndCompleteOrder(
  orderId: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<boolean> {
  return measureApiCall('check_and_complete_order', async () => {
    // Security: Validate order ID
    const sanitizedOrderId = Security.sanitize.sanitizeIdentifier(orderId)
    if (!sanitizedOrderId) {
      throw new Error('Invalid order ID')
    }

    const supabase = supabaseClient || createBrowserClient()

    // Check if all routing entries for this order are completed
    const { data: routings, error } = await supabase
      .from('kds_order_routing')
      .select('id, completed_at')
      .eq('order_id', sanitizedOrderId)

    if (error) {
      console.error('Error checking order completion:', error)
      throw error
    }

    if (!routings || routings.length === 0) {
      return false // No routing entries, nothing to complete
    }

    // Check if all routings are completed
    const allCompleted = routings.every(
      routing => routing.completed_at !== null
    )

    if (allCompleted) {
      // Update main order status to ready
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', sanitizedOrderId)

      if (updateError) {
        console.error('Error updating order to ready:', updateError)
        throw updateError
      }

      // Order marked as ready - all stations completed
      return true
    }

    return false
  })
}
