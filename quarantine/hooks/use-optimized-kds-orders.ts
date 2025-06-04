'use client'

/**
 * OPTIMIZED KDS Orders Hook
 * 
 * High-performance KDS order management with selective subscriptions:
 * - Station-specific filtering to reduce data transfer
 * - Role-based access control
 * - Connection pooling and efficient batching
 * - Intelligent caching and performance monitoring
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  fetchStationOrders,
  fetchAllActiveOrders,
  type KDSOrderRouting,
} from '@/lib/modassembly/supabase/database/kds'
import { useOptimizedRealtime } from '@/lib/state/optimized-realtime-context'
import { useAuth } from '@/lib/modassembly/supabase/auth'

interface UseOptimizedKDSOrdersOptions {
  stationId?: string // If provided, filter to specific station
  autoRefresh?: boolean
  refreshInterval?: number
  enableCaching?: boolean
  maxCacheAge?: number
}

interface UseOptimizedKDSOrdersReturn {
  orders: KDSOrderRouting[]
  loading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'degraded'
  refetch: () => Promise<void>
  optimisticUpdate: (
    routingId: string,
    updates: Partial<KDSOrderRouting>
  ) => void
  revertOptimisticUpdate: (routingId: string) => void
  performanceMetrics: {
    totalUpdates: number
    averageLatency: number
    cacheHitRate: number
    subscriptionCount: number
  }
}

// Performance tracking
interface PerformanceMetrics {
  totalUpdates: number
  updateTimes: number[]
  cacheHits: number
  cacheMisses: number
  subscriptionCount: number
}

// Cache entry with metadata
interface CacheEntry {
  data: KDSOrderRouting[]
  timestamp: number
  stationId?: string
}

const MAX_RETRY_ATTEMPTS = 3
const INITIAL_RETRY_DELAY = 1000
const MAX_RETRY_DELAY = 10000

export function useOptimizedKDSOrders(
  options: UseOptimizedKDSOrdersOptions = {}
): UseOptimizedKDSOrdersReturn {
  const { 
    stationId, 
    autoRefresh = true, 
    refreshInterval = 10000,
    enableCaching = true,
    maxCacheAge = 30000 // 30 seconds
  } = options

  const { userRole, user } = useAuth()
  const { subscribe, unsubscribe, connectionStatus, getConnectionHealth } = useOptimizedRealtime()

  const [orders, setOrders] = useState<KDSOrderRouting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Performance tracking
  const metricsRef = useRef<PerformanceMetrics>({
    totalUpdates: 0,
    updateTimes: [],
    cacheHits: 0,
    cacheMisses: 0,
    subscriptionCount: 0,
  })

  // Caching
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map())
  const optimisticUpdatesRef = useRef<Map<string, Partial<KDSOrderRouting>>>(new Map())
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Generate cache key based on station and user context
  const getCacheKey = useCallback(() => {
    const rolePrefix = userRole || 'anonymous'
    const stationSuffix = stationId || 'all'
    return `kds-orders-${rolePrefix}-${stationSuffix}`
  }, [userRole, stationId])

  // Check cache for valid data
  const getCachedData = useCallback((): KDSOrderRouting[] | null => {
    if (!enableCaching) return null

    const cacheKey = getCacheKey()
    const entry = cacheRef.current.get(cacheKey)

    if (entry && (Date.now() - entry.timestamp) < maxCacheAge) {
      metricsRef.current.cacheHits++
      return entry.data
    }

    if (entry) {
      cacheRef.current.delete(cacheKey)
    }

    metricsRef.current.cacheMisses++
    return null
  }, [enableCaching, getCacheKey, maxCacheAge])

  // Cache data with metadata
  const setCachedData = useCallback((data: KDSOrderRouting[]) => {
    if (!enableCaching) return

    const cacheKey = getCacheKey()
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
      stationId,
    })

    // Cleanup old cache entries
    const cutoff = Date.now() - maxCacheAge * 2
    for (const [key, entry] of cacheRef.current) {
      if (entry.timestamp < cutoff) {
        cacheRef.current.delete(key)
      }
    }
  }, [enableCaching, getCacheKey, stationId, maxCacheAge])

  // Fetch orders with caching and role-based filtering
  const fetchOrders = useCallback(async (): Promise<KDSOrderRouting[]> => {
    const startTime = performance.now()

    try {
      // Check cache first
      const cachedData = getCachedData()
      if (cachedData) {
        return cachedData
      }

      setError(null)

      // Role-based data fetching to reduce payload
      let data: KDSOrderRouting[]

      if (userRole === 'cook' && stationId) {
        // Kitchen staff: only their station's orders
        data = await fetchStationOrders(stationId)
      } else if (userRole === 'admin' || userRole === 'expo') {
        // Admin/Expo: all active orders
        data = await fetchAllActiveOrders()
      } else if (userRole === 'server') {
        // Servers: only ready orders and their own orders
        data = await fetchAllActiveOrders()
        data = data.filter(order => 
          order.status === 'ready' || 
          order.order?.server_id === user?.id
        )
      } else {
        // Default: station-specific or all orders
        data = stationId 
          ? await fetchStationOrders(stationId)
          : await fetchAllActiveOrders()
      }

      // Apply optimistic updates
      const updatedData = data.map(order => {
        const optimisticUpdate = optimisticUpdatesRef.current.get(order.id)
        return optimisticUpdate ? { ...order, ...optimisticUpdate } : order
      })

      // Cache the result
      setCachedData(updatedData)

      // Update performance metrics
      const updateTime = performance.now() - startTime
      metricsRef.current.updateTimes.push(updateTime)
      if (metricsRef.current.updateTimes.length > 100) {
        metricsRef.current.updateTimes.shift()
      }
      metricsRef.current.totalUpdates++

      return updatedData
    } catch (err) {
      console.error('Error fetching KDS orders:', err)
      throw err
    }
  }, [stationId, userRole, user?.id, getCachedData, setCachedData])

  // Main refetch function
  const refetch = useCallback(async () => {
    if (!isMountedRef.current) return

    try {
      const data = await fetchOrders()
      if (isMountedRef.current) {
        setOrders(data)
        setLoading(false)
      }
    } catch (err) {
      if (!isMountedRef.current) return

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders'
      setError(errorMessage)
      setLoading(false)
    }
  }, [fetchOrders])

  // Optimistic update with fallback
  const optimisticUpdate = useCallback(
    (routingId: string, updates: Partial<KDSOrderRouting>) => {
      if (!routingId || typeof routingId !== 'string') {
        console.error('Invalid routing ID for optimistic update')
        return
      }

      // Store optimistic update
      optimisticUpdatesRef.current.set(routingId, {
        ...optimisticUpdatesRef.current.get(routingId),
        ...updates,
      })

      // Apply to current orders
      setOrders(prev =>
        prev.map(order =>
          order.id === routingId ? { ...order, ...updates } : order
        )
      )

      // Invalidate cache
      cacheRef.current.clear()

      // Schedule revert after timeout if not confirmed
      setTimeout(() => {
        if (optimisticUpdatesRef.current.has(routingId)) {
          console.warn(`Optimistic update not confirmed for ${routingId}, reverting`)
          revertOptimisticUpdate(routingId)
        }
      }, 10000) // 10 seconds timeout
    },
    []
  )

  // Revert optimistic update
  const revertOptimisticUpdate = useCallback(
    (routingId: string) => {
      optimisticUpdatesRef.current.delete(routingId)
      cacheRef.current.clear()
      refetch()
    },
    [refetch]
  )

  // Real-time subscription with role-based filtering
  useEffect(() => {
    if (!autoRefresh || !isMountedRef.current) return

    const subscriptionKey = `kds-orders-${stationId || 'all'}-${userRole || 'anonymous'}`
    metricsRef.current.subscriptionCount++

    const cleanup = subscribe(
      subscriptionKey,
      'kds_order_routing',
      (event) => {
        if (!isMountedRef.current) return

        // Clear optimistic update if confirmed
        if (event.new?.id) {
          optimisticUpdatesRef.current.delete(event.new.id)
        }

        // Invalidate cache on any change
        cacheRef.current.clear()

        // Batch updates to avoid rapid re-renders
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
        }

        refreshTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            refetch()
          }
        }, 100) // 100ms debounce
      },
      {
        stationId,
        userRole,
        userId: user?.id,
      }
    )

    return () => {
      cleanup()
      unsubscribe(subscriptionKey)
      metricsRef.current.subscriptionCount--
    }
  }, [stationId, autoRefresh, userRole, user?.id, subscribe, unsubscribe, refetch])

  // Backup polling for when real-time fails
  useEffect(() => {
    if (!autoRefresh || connectionStatus === 'connected') return

    const interval = setInterval(() => {
      if (isMountedRef.current && connectionStatus !== 'connected') {
        refetch()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, connectionStatus, refreshInterval, refetch])

  // Initial fetch
  useEffect(() => {
    refetch()
  }, [refetch])

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      cacheRef.current.clear()
      optimisticUpdatesRef.current.clear()
    }
  }, [])

  // Performance metrics calculation
  const performanceMetrics = useMemo(() => {
    const { updateTimes, cacheHits, cacheMisses, totalUpdates, subscriptionCount } = metricsRef.current
    const averageLatency = updateTimes.length > 0
      ? updateTimes.reduce((a, b) => a + b) / updateTimes.length
      : 0
    const cacheHitRate = (cacheHits + cacheMisses) > 0 
      ? cacheHits / (cacheHits + cacheMisses) 
      : 0

    return {
      totalUpdates,
      averageLatency,
      cacheHitRate,
      subscriptionCount,
    }
  }, [orders]) // Recalculate when orders change

  return {
    orders,
    loading,
    error,
    connectionStatus,
    refetch,
    optimisticUpdate,
    revertOptimisticUpdate,
    performanceMetrics,
  }
}

// Hook for KDS stations with caching
export function useOptimizedKDSStations() {
  const [stations, setStations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { subscribe } = useOptimizedRealtime()
  const cacheRef = useRef<{ data: any[]; timestamp: number } | null>(null)
  const isMountedRef = useRef(true)

  const fetchStations = useCallback(async () => {
    // Check cache (5 minutes for stations as they change rarely)
    if (cacheRef.current && (Date.now() - cacheRef.current.timestamp) < 300000) {
      setStations(cacheRef.current.data)
      setLoading(false)
      return
    }

    try {
      // This would be replaced with actual API call
      const data: any[] = [
        { id: 'grill', name: 'Grill Station', color: '#ff6b6b', position: 0, is_active: true },
        { id: 'salad', name: 'Salad Station', color: '#4ecdc4', position: 1, is_active: true },
        { id: 'expo', name: 'Expo Station', color: '#45b7d1', position: 2, is_active: true },
      ]

      if (isMountedRef.current) {
        setStations(data)
        setError(null)
        setLoading(false)
        
        // Cache the result
        cacheRef.current = {
          data,
          timestamp: Date.now(),
        }
      }
    } catch (err) {
      console.error('Error fetching KDS stations:', err)

      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stations')
        setLoading(false)
      }
    }
  }, [])

  // Real-time subscription for station changes
  useEffect(() => {
    const cleanup = subscribe(
      'kds-stations',
      'kds_stations',
      () => {
        // Invalidate cache and refetch
        cacheRef.current = null
        fetchStations()
      }
    )

    return cleanup
  }, [subscribe, fetchStations])

  useEffect(() => {
    fetchStations()
  }, [fetchStations])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    stations,
    loading,
    error,
    refetch: fetchStations,
  }
}