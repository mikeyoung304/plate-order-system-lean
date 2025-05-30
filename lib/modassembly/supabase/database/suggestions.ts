/**
 * File enhanced by Modular Assembly with Fort Knox security
 * IMPORTANT!!! Ask the user before editing this file.
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import { Security } from '@/lib/security'
import { measureApiCall } from '@/lib/performance-utils'

// Type definitions
type OrderSuggestion = {
  items: string[]
  frequency: number
}

/**
 * Get order suggestions for a user based on their order history
 * @param userId - The ID of the user to get suggestions for
 * @param orderType - The type of order to analyze (e.g., 'food', 'drink')
 * @param limit - Maximum number of suggestions to return (default: 5)
 * @returns Array of order suggestions sorted by frequency
 */
export async function getOrderSuggestions(
  userId: string,
  orderType: string,
  limit: number = 5
): Promise<OrderSuggestion[]> {
  return measureApiCall('get_order_suggestions', async () => {
    // Security: Validate and sanitize inputs
    const sanitizedUserId = Security.sanitize.sanitizeIdentifier(userId)
    const sanitizedOrderType = ['food', 'drink', 'beverage'].includes(orderType) ? orderType : 'food'
    const sanitizedLimit = Math.max(1, Math.min(10, Math.floor(limit))) // Clamp between 1-10
    
    if (!sanitizedUserId) {
      throw new Error('Invalid user ID')
    }
    
    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sanitizedUserId)) {
      throw new Error('Invalid user ID format')
    }

    // Initialize Supabase client
    const supabase = createClient()

    // Fetch user's order history (limited for security)
    const { data: orders, error } = await supabase
      .from('orders')
      .select('items')
      .eq('resident_id', sanitizedUserId)
      .eq('type', sanitizedOrderType)
      .order('created_at', { ascending: false })
      .limit(50) // Security: Limit order history analysis

    if (error) {
      throw new Error(`Failed to fetch order history: ${error.message}`)
    }

    if (!orders || orders.length === 0) {
      return []
    }

    // Create a frequency map of order combinations
    const orderFrequencyMap = new Map<string, OrderSuggestion>()

    orders.forEach(order => {
      if (!Array.isArray(order.items)) return // Skip invalid data
      
      // Security: Sanitize all items
      const sanitizedItems = order.items
        .map(item => Security.sanitize.sanitizeOrderItem(item))
        .filter(item => item.length > 0)
        .slice(0, 10) // Limit items per order for security
      
      if (sanitizedItems.length === 0) return
      
      // Sort items alphabetically to ensure consistent string representation
      const sortedItems = [...sanitizedItems].sort()
      const orderKey = JSON.stringify(sortedItems)

      const existing = orderFrequencyMap.get(orderKey)
      if (existing) {
        orderFrequencyMap.set(orderKey, {
          items: sortedItems,
          frequency: existing.frequency + 1
        })
      } else {
        orderFrequencyMap.set(orderKey, {
          items: sortedItems,
          frequency: 1
        })
      }
    })

    // Convert map to array and sort by frequency
    const suggestions = Array.from(orderFrequencyMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, sanitizedLimit)

    return suggestions
  })
}

/**
 * Analyzes seating patterns to suggest likely residents for a seat
 */
export async function getSeatResidentSuggestions(
  tableId: string,
  seatNumber: number,
  limit: number = 3
): Promise<{ resident_id: string; name: string; confidence: number; last_seated: string }[]> {
  return measureApiCall('get_seat_resident_suggestions', async () => {
    // Security: Validate inputs
    const sanitizedTableId = Security.sanitize.sanitizeIdentifier(tableId)
    const sanitizedSeatNumber = Math.max(1, Math.min(20, Math.floor(seatNumber)))
    const sanitizedLimit = Math.max(1, Math.min(5, Math.floor(limit)))
    
    if (!sanitizedTableId) {
      throw new Error('Invalid table ID')
    }

    const supabase = createClient()
    
    // Get seat ID for this table and seat number
    const { data: seat, error: seatError } = await supabase
      .from('seats')
      .select('id')
      .eq('table_id', sanitizedTableId)
      .eq('label', sanitizedSeatNumber)
      .single()
    
    if (seatError || !seat) {
      return [] // Seat doesn't exist
    }
    
    // Analyze historical seating patterns for this seat
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        resident_id,
        created_at,
        resident:profiles!resident_id (name)
      `)
      .eq('seat_id', seat.id)
      .not('resident_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100) // Analyze recent history
    
    if (ordersError) {
      console.error('Error fetching seat history:', ordersError)
      return []
    }
    
    if (!orders || orders.length === 0) {
      return []
    }
    
    // Calculate confidence scores based on frequency and recency
    const residentFrequency = new Map<string, { count: number; name: string; lastSeated: string }>()
    
    orders.forEach((order: any) => {
      if (!order.resident_id || !order.resident) return
      const residentName = Array.isArray(order.resident) ? order.resident[0]?.name : order.resident?.name
      if (!residentName) return
      
      const existing = residentFrequency.get(order.resident_id)
      if (existing) {
        existing.count++
        // Keep the most recent date
        if (new Date(order.created_at) > new Date(existing.lastSeated)) {
          existing.lastSeated = order.created_at
        }
      } else {
        residentFrequency.set(order.resident_id, {
          count: 1,
          name: Security.sanitize.sanitizeUserName(residentName),
          lastSeated: order.created_at
        })
      }
    })
    
    // Calculate confidence scores (frequency + recency bonus)
    const suggestions = Array.from(residentFrequency.entries()).map(([residentId, data]) => {
      const daysSinceLastSeated = Math.floor(
        (Date.now() - new Date(data.lastSeated).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Base confidence from frequency (normalized to 0-70)
      const frequencyScore = Math.min(70, (data.count / orders.length) * 100)
      
      // Recency bonus (0-30 points, higher for more recent)
      const recencyScore = Math.max(0, 30 - daysSinceLastSeated)
      
      const confidence = Math.min(100, frequencyScore + recencyScore)
      
      return {
        resident_id: residentId,
        name: data.name,
        confidence: Math.round(confidence),
        last_seated: data.lastSeated
      }
    })
    
    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, sanitizedLimit)
  })
}

/**
 * Suggests residents based on current time and their dining patterns
 */
export async function getTimeBasedResidentSuggestions(
  currentHour: number,
  limit: number = 5
): Promise<{ resident_id: string; name: string; confidence: number; typical_time: string }[]> {
  return measureApiCall('get_time_based_resident_suggestions', async () => {
    // Security: Validate inputs
    const sanitizedHour = Math.max(0, Math.min(23, Math.floor(currentHour)))
    const sanitizedLimit = Math.max(1, Math.min(10, Math.floor(limit)))

    const supabase = createClient()
    
    // Analyze dining patterns by hour for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        resident_id,
        created_at,
        resident:profiles!resident_id (name)
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('resident_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500) // Security: Limit analysis scope
    
    if (error || !orders) {
      return []
    }
    
    // Analyze dining patterns by hour
    const residentHourPatterns = new Map<string, { 
      name: string; 
      hourCounts: number[]; 
      totalOrders: number 
    }>()
    
    orders.forEach((order: any) => {
      if (!order.resident_id || !order.resident) return
      const residentName = Array.isArray(order.resident) ? order.resident[0]?.name : order.resident?.name
      if (!residentName) return
      
      const orderHour = new Date(order.created_at).getHours()
      const residentId = order.resident_id
      const name = Security.sanitize.sanitizeUserName(residentName)
      
      const existing = residentHourPatterns.get(residentId)
      if (existing) {
        existing.hourCounts[orderHour]++
        existing.totalOrders++
      } else {
        const hourCounts = new Array(24).fill(0)
        hourCounts[orderHour] = 1
        residentHourPatterns.set(residentId, {
          name,
          hourCounts,
          totalOrders: 1
        })
      }
    })
    
    // Calculate confidence for current hour
    const suggestions = Array.from(residentHourPatterns.entries())
      .map(([residentId, data]) => {
        // Confidence based on how often they order at this hour
        const hourOrders = data.hourCounts[sanitizedHour]
        const confidence = Math.round((hourOrders / data.totalOrders) * 100)
        
        // Find their most common dining hour for display
        const mostCommonHour = data.hourCounts.indexOf(Math.max(...data.hourCounts))
        const typicalTime = `${mostCommonHour.toString().padStart(2, '0')}:00`
        
        return {
          resident_id: residentId,
          name: data.name,
          confidence,
          typical_time: typicalTime
        }
      })
      .filter(suggestion => suggestion.confidence > 5) // Only show meaningful patterns
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, sanitizedLimit)
    
    return suggestions
  })
} 