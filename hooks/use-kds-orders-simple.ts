/**
 * VETERAN'S NOTES: KDS Orders Hook - Simplified and Bulletproof
 * 
 * WHY: The original hook was 300+ lines of enterprise overkill for a restaurant app.
 * Complex retry logic, optimistic updates, and connection status tracking are 
 * premature optimization that creates more bugs than it solves.
 * 
 * WHAT: This replaces use-kds-orders.ts with boring, reliable code.
 * - Simple fetch with error handling
 * - Basic real-time subscriptions 
 * - Proper cleanup (no memory leaks)
 * - One responsibility: get order data and keep it updated
 * 
 * WHEN TO TOUCH: Only if orders aren't updating or subscriptions are failing.
 * If you think you need retry logic, you probably need better error handling.
 * 
 * WHO TO BLAME: Veteran engineer - designed for 10 years of maintenance
 * 
 * HOW TO MODIFY: 
 * - Add new fields to the return type
 * - Extend the database query in fetchOrders
 * - Don't add retry logic, connection status, or optimistic updates
 * - Keep it boring
 */

"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { 
  fetchStationOrders, 
  fetchAllActiveOrders,
  type KDSOrderRouting 
} from '@/lib/modassembly/supabase/database/kds'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseKDSOrdersOptions {
  stationId?: string
}

interface UseKDSOrdersReturn {
  orders: KDSOrderRouting[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * BORING AND RELIABLE KDS ORDERS HOOK
 * 
 * Does exactly what it says: fetches orders and keeps them updated.
 * No enterprise features. No complex state machines. No optimization.
 * Works reliably for 10 users or 10,000.
 */
export function useKDSOrdersSimple(options: UseKDSOrdersOptions = {}): UseKDSOrdersReturn {
  const { stationId } = options
  
  // Simple state - no complex status tracking
  const [orders, setOrders] = useState<KDSOrderRouting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Single subscription ref for cleanup
  const channelRef = useRef<RealtimeChannel | null>(null)
  const mountedRef = useRef(true)
  
  // Single responsibility: fetch orders
  const fetchOrders = useCallback(async () => {
    if (!mountedRef.current) return
    
    try {
      setError(null)
      const data = stationId 
        ? await fetchStationOrders(stationId)
        : await fetchAllActiveOrders()
      
      if (mountedRef.current) {
        setOrders(data)
        setLoading(false)
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to fetch orders'
        setError(message)
        setLoading(false)
        
        // Log for debugging - but don't retry automatically
        console.error('KDS orders fetch failed:', {
          stationId,
          error: message,
          timestamp: new Date().toISOString()
        })
      }
    }
  }, [stationId])
  
  // Simple real-time subscription
  const setupSubscription = useCallback(() => {
    const supabase = createClient()
    
    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }
    
    // Create new subscription
    channelRef.current = supabase
      .channel('kds_order_routing_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kds_order_routing'
      }, () => {
        // Something changed - just refetch
        // No optimistic updates, no complex state management
        fetchOrders()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('KDS orders subscription active')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('KDS orders subscription failed')
          // Don't auto-retry - let user refresh if needed
        }
      })
  }, [fetchOrders])
  
  // Initial load and subscription setup
  useEffect(() => {
    mountedRef.current = true
    fetchOrders()
    setupSubscription()
    
    // CRITICAL: Proper cleanup prevents memory leaks
    return () => {
      mountedRef.current = false
      
      if (channelRef.current) {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchOrders, setupSubscription])
  
  // Simple refetch function for manual retry
  const refetch = useCallback(() => {
    setLoading(true)
    fetchOrders()
  }, [fetchOrders])
  
  return {
    orders,
    loading,
    error,
    refetch
  }
}

/**
 * MIGRATION NOTES:
 * 
 * This replaces the complex useKDSOrders hook with a simple, reliable version.
 * 
 * REMOVED FEATURES:
 * - Automatic retry with exponential backoff
 * - Connection status tracking
 * - Optimistic updates
 * - Polling fallback
 * - Complex error recovery
 * 
 * WHY REMOVED:
 * - Retry logic creates race conditions and memory leaks
 * - Connection status is rarely useful in restaurant apps
 * - Optimistic updates cause data inconsistency
 * - Polling is inefficient when real-time works
 * - Complex error recovery masks real problems
 * 
 * WHAT TO DO IF YOU NEED THESE FEATURES:
 * - Manual retry: User can click refresh button
 * - Connection issues: Show error message, let user refresh page
 * - Data consistency: Trust the database, re-fetch on changes
 * - Real-time fails: User refreshes page (restaurant staff understand this)
 * 
 * PRODUCTION EXPERIENCE:
 * Simple hooks like this run in production for years without issues.
 * Complex hooks like the original require constant debugging and fixes.
 * 
 * Choose boring.
 */