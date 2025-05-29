"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { 
  fetchStationOrders, 
  fetchAllActiveOrders,
  type KDSOrderRouting 
} from '@/lib/modassembly/supabase/database/kds'

interface UseKDSOrdersOptions {
  stationId?: string // If provided, filter to specific station
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseKDSOrdersReturn {
  orders: KDSOrderRouting[]
  loading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  refetch: () => Promise<void>
  optimisticUpdate: (routingId: string, updates: Partial<KDSOrderRouting>) => void
  revertOptimisticUpdate: (routingId: string) => void
}

export function useKDSOrders(options: UseKDSOrdersOptions = {}): UseKDSOrdersReturn {
  const { 
    stationId, 
    autoRefresh = true, 
    refreshInterval = 5000 
  } = options

  const [orders, setOrders] = useState<KDSOrderRouting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected')
  
  const supabaseRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const optimisticUpdatesRef = useRef<Map<string, Partial<KDSOrderRouting>>>(new Map())

  // Initialize Supabase client
  useEffect(() => {
    const initSupabase = async () => {
      supabaseRef.current = await createClient()
    }
    initSupabase()
  }, [])

  // Fetch orders function
  const fetchOrders = useCallback(async () => {
    if (!supabaseRef.current) return

    try {
      setError(null)
      const data = stationId 
        ? await fetchStationOrders(stationId)
        : await fetchAllActiveOrders()
      
      // Apply optimistic updates
      const updatedData = data.map(order => {
        const optimisticUpdate = optimisticUpdatesRef.current.get(order.id)
        return optimisticUpdate ? { ...order, ...optimisticUpdate } : order
      })
      
      setOrders(updatedData)
      setConnectionStatus('connected')
    } catch (err) {
      console.error('Error fetching KDS orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      setConnectionStatus('disconnected')
    } finally {
      setLoading(false)
    }
  }, [stationId])

  // Optimistic update function
  const optimisticUpdate = useCallback((routingId: string, updates: Partial<KDSOrderRouting>) => {
    // Store the optimistic update
    optimisticUpdatesRef.current.set(routingId, updates)
    
    // Apply immediately to UI
    setOrders(prev => prev.map(order => 
      order.id === routingId ? { ...order, ...updates } : order
    ))
  }, [])

  // Revert optimistic update function
  const revertOptimisticUpdate = useCallback((routingId: string) => {
    optimisticUpdatesRef.current.delete(routingId)
    // Refetch to get real data
    fetchOrders()
  }, [fetchOrders])

  // Real-time subscription setup
  useEffect(() => {
    if (!supabaseRef.current || !autoRefresh) return

    const setupRealtimeSubscription = async () => {
      try {
        setConnectionStatus('reconnecting')

        // Create channel for real-time updates
        const channel = supabaseRef.current
          .channel('kds-orders-updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'kds_order_routing',
              ...(stationId ? { filter: `station_id=eq.${stationId}` } : {})
            },
            (payload: any) => {
              console.log('KDS order routing update:', payload)
              
              // Clear optimistic update if it exists
              if (payload.new?.id) {
                optimisticUpdatesRef.current.delete(payload.new.id)
              }
              
              // Refetch orders to get updated data with joins
              fetchOrders()
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders'
            },
            (payload: any) => {
              console.log('Order update:', payload)
              
              // If order status changed, refetch
              if (payload.new?.status !== payload.old?.status) {
                fetchOrders()
              }
            }
          )
          .subscribe((status: string) => {
            console.log('KDS subscription status:', status)
            
            if (status === 'SUBSCRIBED') {
              setConnectionStatus('connected')
            } else if (status === 'CHANNEL_ERROR') {
              setConnectionStatus('disconnected')
              // Retry connection after delay
              setTimeout(setupRealtimeSubscription, 5000)
            }
          })

        channelRef.current = channel
        setConnectionStatus('connected')
      } catch (err) {
        console.error('Error setting up real-time subscription:', err)
        setConnectionStatus('disconnected')
        
        // Retry after delay
        setTimeout(setupRealtimeSubscription, 5000)
      }
    }

    setupRealtimeSubscription()

    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
      }
    }
  }, [stationId, autoRefresh, fetchOrders])

  // Auto-refresh fallback (in case real-time fails)
  useEffect(() => {
    if (!autoRefresh || connectionStatus === 'connected') return

    const startAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        fetchOrders()
        startAutoRefresh() // Schedule next refresh
      }, refreshInterval)
    }

    startAutoRefresh()

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [autoRefresh, connectionStatus, refreshInterval, fetchOrders])

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  return {
    orders,
    loading,
    error,
    connectionStatus,
    refetch: fetchOrders,
    optimisticUpdate,
    revertOptimisticUpdate
  }
}

// Hook for managing order timing calculations
export function useOrderTiming(order: KDSOrderRouting) {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [colorStatus, setColorStatus] = useState<'green' | 'yellow' | 'red'>('green')

  useEffect(() => {
    const updateTiming = () => {
      const now = new Date()
      const startTime = order.started_at ? new Date(order.started_at) : new Date(order.routed_at)
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      
      setTimeElapsed(elapsed)
      
      // Determine color status based on elapsed time
      if (elapsed <= 300) { // 0-5 minutes
        setColorStatus('green')
      } else if (elapsed <= 600) { // 5-10 minutes
        setColorStatus('yellow')
      } else { // 10+ minutes
        setColorStatus('red')
      }
    }

    // Update immediately
    updateTiming()

    // Update every second
    const interval = setInterval(updateTiming, 1000)

    return () => clearInterval(interval)
  }, [order.routed_at, order.started_at])

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  return {
    timeElapsed,
    colorStatus,
    formattedTime: formatTime(timeElapsed),
    isOverdue: timeElapsed > 600 // Over 10 minutes
  }
}

// Hook for KDS station configuration
export function useKDSStations() {
  const [stations, setStations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStations = useCallback(async () => {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('kds_stations')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true })

      if (error) throw error
      setStations(data || [])
    } catch (err) {
      console.error('Error fetching KDS stations:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStations()
  }, [fetchStations])

  return {
    stations,
    loading,
    error,
    refetch: fetchStations
  }
}