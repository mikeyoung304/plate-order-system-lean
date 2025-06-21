import { createClient } from '@/lib/modassembly/supabase/client'
import { Security } from '@/lib/security'
import { measureApiCall } from '@/lib/performance-utils'
import type { KDSStation, RoutingRules, RoutingTarget } from './types'
import { fetchKDSStations } from './core'

/**
 * Route an order to a specific station manually (secure)
 */
export async function routeOrderToStation(
  orderId: string,
  stationId: string,
  sequence: number = 1,
  priority: number = 0
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

    const supabase = await createClient()

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
 * Get routing rules for different station types
 */
export function getRoutingRules(): RoutingRules {
  return {
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
}

/**
 * Analyze order items and determine appropriate routing targets
 */
export function analyzeOrderForRouting(
  orderType: string,
  items: any[],
  stations: KDSStation[]
): RoutingTarget[] {
  const targetStations: RoutingTarget[] = []

  if (orderType === 'beverage' || orderType === 'drink') {
    // Route beverages to bar station
    const barStation = stations.find(s => s.type === 'bar')
    if (barStation) {
      targetStations.push({ station: barStation, priority: 1, sequence: 1 })
    }
  } else {
    // Analyze food items to determine routing
    const routingRules = getRoutingRules()
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

  return targetStations
}

/**
 * Automatically routes orders to appropriate stations based on order type and items
 */
export async function intelligentOrderRouting(orderId: string): Promise<void> {
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

    const supabase = await createClient()

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
    const stations = await fetchKDSStations()

    if (stations.length === 0) {
      throw new Error('No active stations available for routing')
    }

    // Analyze order and get routing targets
    const items = Array.isArray(order.items) ? order.items : []
    const targetStations = analyzeOrderForRouting(order.type, items, stations)

    // Route to all determined stations
    for (const { station, priority, sequence } of targetStations) {
      await routeOrderToStation(
        sanitizedOrderId,
        station.id,
        sequence,
        priority
      )
    }

    // Order routed to stations successfully
  })
}

/**
 * Updates main order status when all KDS stations have completed their part
 */
export async function checkAndCompleteOrder(orderId: string): Promise<boolean> {
  return measureApiCall('check_and_complete_order', async () => {
    // Security: Validate order ID
    const sanitizedOrderId = Security.sanitize.sanitizeIdentifier(orderId)
    if (!sanitizedOrderId) {
      throw new Error('Invalid order ID')
    }

    const supabase = await createClient()

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