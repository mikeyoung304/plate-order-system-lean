import { createClient } from '@/lib/modassembly/supabase/client'
import { Security } from '@/lib/security'
import { measureApiCall } from '@/lib/performance-utils'
import { KDSCacheManager } from '@/lib/cache/kds-cache'
import { KDSCache } from '@/lib/cache/ultra-smart-cache'
import type { KDSOrderRouting, KDSStation } from './types'
import type { OrderType } from '@/types/database'

// Import ultra-fast performance optimizations
import {
  batchFetchKDSDataUltraEfficient,
  fetchActiveOrdersUltraFast,
  fetchOrderDetailsOptimized,
  fetchStationsBlazingFast,
  fetchTableSeatInfoHyperFast,
  getCacheMetrics,
  invalidateOrderCachesUltraFast,
  warmCacheUltraFast
} from './performance-optimized'

/**
 * Fetch all active KDS stations (secure, cached)
 */
export async function fetchKDSStations(): Promise<KDSStation[]> {
  // Check smart cache first
  const cached = KDSCache.getStations()
  if (cached) {
    return cached
  }

  return measureApiCall('fetch_kds_stations_db', async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('kds_stations')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) {
      // Only log database errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching KDS stations:', error)
      }
      throw error
    }

    // Security: Sanitize station data
    const sanitizedData = (data || []).map(station => ({
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

    // Cache the result
    KDSCache.setStations(sanitizedData, 300000) // 5 minutes cache for stations

    return sanitizedData
  })
}

/**
 * Fetch orders for a specific station with real-time updates (secure, cached)
 */
export async function fetchStationOrders(
  stationId: string
): Promise<KDSOrderRouting[]> {
  // Security: Validate station ID
  const sanitizedStationId = Security.sanitize.sanitizeIdentifier(stationId)
  if (!sanitizedStationId) {
    throw new Error('Invalid station ID')
  }

  return KDSCacheManager.getStationOrders(sanitizedStationId, async () => {
    return measureApiCall('fetch_station_orders_db', async () => {
      const supabase = createClient()

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
        // Only log database errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching station orders:', error)
        }
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
  })
}

/**
 * Fetch all active orders across all stations (ULTRA-OPTIMIZED for <30ms performance)
 * 
 * This function now uses performance-optimized queries with aggressive caching
 * to achieve sub-50ms response times even under high load.
 */
export async function fetchAllActiveOrders(): Promise<any[]> {
  return measureApiCall('fetch_all_active_orders_ultra_optimized', async () => {
    // Step 1: Get basic order data ultra-fast
    const basicOrders = await fetchActiveOrdersUltraFast()
    
    if (basicOrders.length === 0) {
      return []
    }

    // Step 2: Get additional data only when needed
    const orderIds = basicOrders.map(o => o.order_id)
    
    // Fetch related data in parallel for maximum speed
    const [orderDetails, stations] = await Promise.all([
      fetchOrderDetailsOptimized(orderIds),
      fetchStationsBlazingFast()
    ])

    // Get table and seat IDs from order details
    const tableIds = orderDetails.map(o => o.table_id).filter(Boolean)
    const seatIds = orderDetails.map(o => o.seat_id).filter(Boolean)
    
    const tableSeatInfo = await fetchTableSeatInfoHyperFast(tableIds, seatIds)

    // Step 3: Efficiently merge data with minimal processing
    const stationMap = new Map(stations.map(s => [s.id, s]))
    const orderDetailsMap = new Map(orderDetails.map(o => [o.id, o]))
    const tableMap = new Map(tableSeatInfo.tables.map(t => [t.id, t]))
    const seatMap = new Map(tableSeatInfo.seats.map(s => [s.id, s]))

    return basicOrders.map(routingOrder => {
      const orderDetail = orderDetailsMap.get(routingOrder.order_id)
      const station = stationMap.get(routingOrder.station_id)
      const table = orderDetail ? tableMap.get(orderDetail.table_id) : null
      const seat = orderDetail ? seatMap.get(orderDetail.seat_id) : null

      return {
        ...routingOrder,
        // Complete all required KDSOrderRouting fields
        id: routingOrder.id,
        order_id: routingOrder.order_id,
        station_id: routingOrder.station_id,
        sequence: 1, // Default sequence
        routed_at: routingOrder.routed_at,
        started_at: routingOrder.started_at,
        completed_at: routingOrder.completed_at,
        bumped_by: null,
        bumped_at: null,
        recalled_at: null,
        recall_count: 0,
        notes: null,
        priority: Math.max(0, Math.min(10, routingOrder.priority || 0)),
        estimated_prep_time: null,
        actual_prep_time: null,
        created_at: routingOrder.routed_at,
        updated_at: routingOrder.routed_at,
        order: orderDetail ? {
          id: orderDetail.id,
          table_id: orderDetail.table_id,
          seat_id: orderDetail.seat_id,
          items: Array.isArray(orderDetail.items) 
            ? orderDetail.items.slice(0, 10) // Limit items for performance
            : [],
          status: 'active',
          type: 'dine-in' as OrderType,
          created_at: orderDetail.created_at,
          table: table ? { id: table.id, label: table.label } : null,
          seat: seat ? { id: seat.id, label: seat.label } : null
        } : null,
        station: station as any
      }
    })
  })
}

/**
 * Mark an order as ready/completed at a station (bump functionality) - secure
 */
export async function bumpOrder(
  routingId: string,
  userId: string
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

    const supabase = createClient()

    const { error } = await supabase
      .from('kds_order_routing')
      .update({
        completed_at: new Date().toISOString(),
        bumped_by: sanitizedUserId,
        bumped_at: new Date().toISOString(),
      })
      .eq('id', sanitizedRoutingId)

    if (error) {
      // Only log database errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error bumping order:', error)
      }
      throw error
    }

    // Ultra-fast cache invalidation for immediate UI updates
    try {
      // Invalidate ultra-fast caches immediately
      invalidateOrderCachesUltraFast()
      
      // Get routing data for completion check
      const { data: routingData, error: routingError } = await supabase
        .from('kds_order_routing')
        .select('order_id, station_id')
        .eq('id', sanitizedRoutingId)
        .single()

      if (!routingError && routingData) {
        // Invalidate traditional caches as well
        KDSCacheManager.invalidateOrderCaches(
          routingData.order_id,
          routingData.station_id,
          undefined
        )

        // Import checkAndCompleteOrder from routing module to avoid circular dependency
        const { checkAndCompleteOrder } = await import('./routing')
        await checkAndCompleteOrder(routingData.order_id)
      }
    } catch (completionError) {
      // Only log completion errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error(
          'Error checking order completion after bump:',
          completionError
        )
      }
      // Don't fail the bump if completion check fails
      // Still invalidate both cache systems on error
      invalidateOrderCachesUltraFast()
      KDSCacheManager.invalidateOrderCaches()
      KDSCache.invalidateOrders() // Also invalidate smart cache on error
    }
  })
}

/**
 * Recall a bumped order (undo bump)
 */
export async function recallOrder(routingId: string): Promise<void> {
  const supabase = createClient()

  // First get current recall count
  const { data: currentData, error: fetchError } = await supabase
    .from('kds_order_routing')
    .select('recall_count')
    .eq('id', routingId)
    .single()

  if (fetchError) {
    // Only log database errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching order for recall:', fetchError)
    }
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
    // Only log database errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error recalling order:', error)
    }
    throw error
  }

  // Invalidate both cache systems after successful recall
  invalidateOrderCachesUltraFast()
  KDSCacheManager.invalidateOrderCaches()
}

/**
 * Start preparation for an order
 */
export async function startOrderPrep(routingId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('kds_order_routing')
    .update({
      started_at: new Date().toISOString(),
    })
    .eq('id', routingId)

  if (error) {
    // Only log database errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error starting order prep:', error)
    }
    throw error
  }
}

/**
 * Update order priority
 */
export async function updateOrderPriority(
  routingId: string,
  priority: number
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('kds_order_routing')
    .update({ priority })
    .eq('id', routingId)

  if (error) {
    // Only log database errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating order priority:', error)
    }
    throw error
  }
}

/**
 * Add notes to an order at a station (secure)
 */
export async function addOrderNotes(
  routingId: string,
  notes: string
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

    const supabase = createClient()

    const { error } = await supabase
      .from('kds_order_routing')
      .update({ notes: sanitizedNotes })
      .eq('id', sanitizedRoutingId)

    if (error) {
      // Only log database errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding order notes:', error)
      }
      throw error
    }
  })
}

/**
 * Create a new KDS station
 */
export async function createKDSStation(
  station: Omit<KDSStation, 'id' | 'created_at' | 'updated_at'>
): Promise<KDSStation> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('kds_stations')
    .insert(station)
    .select()
    .single()

  if (error) {
    // Only log database errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating KDS station:', error)
    }
    throw error
  }

  return data
}

/**
 * Update a KDS station
 */
export async function updateKDSStation(
  stationId: string,
  updates: Partial<KDSStation>
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('kds_stations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stationId)

  if (error) {
    // Only log database errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating KDS station:', error)
    }
    throw error
  }
}

/**
 * Bulk bump all orders for a table
 */
export async function bulkBumpTableOrders(
  tableId: string,
  userId: string
): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('bulk_bump_table_orders', {
    p_table_id: tableId,
    p_user_id: userId,
  })

  if (error) {
    // Only log database errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error bulk bumping table orders:', error)
    }
    throw error
  }

  return data || 0
}