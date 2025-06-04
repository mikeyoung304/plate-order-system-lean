'use client'

/**
 * Optimized KDS Orders Hook
 * 
 * High-performance hook for Kitchen Display System with:
 * - Station-specific filtering
 * - Intelligent caching and memoization
 * - Real-time updates with minimal re-renders
 * - Performance monitoring
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOptimizedOrders } from '@/lib/state/domains/optimized-orders-context'
import { useOptimizedRealtime } from '@/lib/state/optimized-realtime-context'
import type { Order } from '@/lib/modassembly/supabase/database/orders'

// Station types
export type KDSStation = 'grill' | 'fryer' | 'salad' | 'expo' | 'bar' | 'all'

// Order item interface
interface OrderItem {
  name: string
  quantity: number
  modifications?: string[]
  station?: KDSStation
}

// Station configuration
const STATION_CONFIG: Record<KDSStation, {
  items: string[]
  priority: number
  maxConcurrent: number
}> = {
  grill: {
    items: ['steak', 'burger', 'chicken', 'salmon', 'pork'],
    priority: 1,
    maxConcurrent: 6,
  },
  fryer: {
    items: ['fries', 'wings', 'nuggets', 'onion rings', 'fish'],
    priority: 2,
    maxConcurrent: 4,
  },
  salad: {
    items: ['salad', 'soup', 'sandwich', 'wrap', 'cold'],
    priority: 3,
    maxConcurrent: 8,
  },
  expo: {
    items: [], // Expo sees all ready items
    priority: 0,
    maxConcurrent: 20,
  },
  bar: {
    items: ['beer', 'wine', 'cocktail', 'soda', 'juice'],
    priority: 4,
    maxConcurrent: 10,
  },
  all: {
    items: [], // All station sees everything
    priority: 0,
    maxConcurrent: 50,
  },
}

// Hook options
interface UseOptimizedKDSOrdersOptions {
  station?: KDSStation
  autoRefresh?: boolean
  refreshInterval?: number
  maxOrders?: number
}

// Performance metrics
interface KDSPerformanceMetrics {
  ordersProcessed: number
  averageRenderTime: number
  realtimeLatency: number
  cacheEfficiency: number
}

// Return type
interface UseOptimizedKDSOrdersReturn {
  orders: Order[]
  groupedOrders: Map<string, Order[]> // Grouped by table
  loading: boolean
  error: string | null
  
  // Actions
  updateOrderStatus: (orderId: string, status: 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled') => Promise<void>
  bumpOrder: (orderId: string) => Promise<void>
  recallOrder: (orderId: string) => Promise<void>
  
  // Metrics
  performanceMetrics: KDSPerformanceMetrics
  stationLoad: number // 0-1 representing current load
}

export function useOptimizedKDSOrders({
  station = 'all',
  autoRefresh = true,
  refreshInterval = 30000,
  maxOrders = 50,
}: UseOptimizedKDSOrdersOptions = {}): UseOptimizedKDSOrdersReturn {
  const {
    getActiveOrders,
    updateOrder,
    optimisticUpdate,
    state,
    getPerformanceMetrics,
  } = useOptimizedOrders()
  
  const { subscribe, isConnected } = useOptimizedRealtime()
  
  // Performance tracking
  const renderTimesRef = useRef<number[]>([])
  const lastRenderRef = useRef<number>(0)
  const ordersProcessedRef = useRef(0)
  
  // State for additional metrics
  const [realtimeLatency, setRealtimeLatency] = useState(0)
  
  // Filter orders by station
  const filterOrdersByStation = useCallback((orders: Order[]): Order[] => {
    if (station === 'all') return orders
    if (station === 'expo') {
      // Expo sees only ready orders
      return orders.filter(order => order.status === 'ready')
    }
    
    const stationItems = STATION_CONFIG[station].items
    
    return orders.filter(order => {
      if (!order.items || !Array.isArray(order.items)) return false
      
      // Check if any item belongs to this station
      return order.items.some((item: any) => {
        const itemName = typeof item === 'string' ? item : item.name
        return stationItems.some(stationItem => 
          itemName.toLowerCase().includes(stationItem.toLowerCase())
        )
      })
    })
  }, [station])
  
  // Get filtered and sorted orders
  const filteredOrders = useMemo(() => {
    const start = performance.now()
    
    // Get active orders
    let orders = getActiveOrders()
    
    // Filter by station
    orders = filterOrdersByStation(orders)
    
    // Sort by priority and creation time
    orders.sort((a, b) => {
      // Priority: pending > confirmed > preparing > ready
      const statusPriority: Record<string, number> = {
        pending: 0,
        confirmed: 1,
        preparing: 2,
        ready: 3,
      }
      
      const aPriority = statusPriority[a.status || 'pending'] || 999
      const bPriority = statusPriority[b.status || 'pending'] || 999
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // Then by creation time (oldest first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    
    // Limit orders
    if (orders.length > maxOrders) {
      orders = orders.slice(0, maxOrders)
    }
    
    // Track render time
    const renderTime = performance.now() - start
    renderTimesRef.current.push(renderTime)
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current.shift()
    }
    lastRenderRef.current = Date.now()
    
    return orders
  }, [getActiveOrders, filterOrdersByStation, maxOrders])
  
  // Group orders by table
  const groupedOrders = useMemo(() => {
    const groups = new Map<string, Order[]>()
    
    for (const order of filteredOrders) {
      const tableId = order.table_id
      if (!groups.has(tableId)) {
        groups.set(tableId, [])
      }
      groups.get(tableId)!.push(order)
    }
    
    return groups
  }, [filteredOrders])
  
  // Update order status with optimistic update
  const updateOrderStatus = useCallback(async (orderId: string, status: 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled') => {
    // Optimistic update
    optimisticUpdate(orderId, { status })
    
    try {
      await updateOrder(orderId, { status })
      ordersProcessedRef.current++
    } catch (error) {
      console.error('Failed to update order status:', error)
      throw error
    }
  }, [updateOrder, optimisticUpdate])
  
  // Bump order (mark as ready)
  const bumpOrder = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'ready')
  }, [updateOrderStatus])
  
  // Recall order (move back to in_progress)
  const recallOrder = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'in_progress')
  }, [updateOrderStatus])
  
  // Calculate performance metrics
  const performanceMetrics = useMemo((): KDSPerformanceMetrics => {
    const avgRenderTime = renderTimesRef.current.length > 0
      ? renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
      : 0
    
    const ordersMetrics = getPerformanceMetrics()
    
    return {
      ordersProcessed: ordersProcessedRef.current,
      averageRenderTime: avgRenderTime,
      realtimeLatency: realtimeLatency,
      cacheEfficiency: ordersMetrics.cacheHitRate,
    }
  }, [realtimeLatency, getPerformanceMetrics])
  
  // Calculate station load
  const stationLoad = useMemo(() => {
    const maxConcurrent = STATION_CONFIG[station].maxConcurrent
    const currentOrders = filteredOrders.filter(o => 
      o.status === 'in_progress' || o.status === 'new'
    ).length
    
    return Math.min(currentOrders / maxConcurrent, 1)
  }, [station, filteredOrders])
  
  // Set up enhanced real-time subscription for KDS
  useEffect(() => {
    if (!isConnected) return
    
    // Subscribe with station-specific filter if not 'all'
    const filter = station !== 'all' && station !== 'expo'
      ? undefined // Role-based filtering will handle this
      : undefined
    
    const unsubscribe = subscribe({
      id: `kds-orders-${station}`,
      table: 'orders',
      event: '*',
      filter,
      callback: (payload) => {
        // Track real-time latency
        const now = Date.now()
        if (payload.commit_timestamp) {
          const commitTime = new Date(payload.commit_timestamp).getTime()
          setRealtimeLatency(now - commitTime)
        }
      },
      priority: 'high',
    })
    
    return unsubscribe
  }, [isConnected, subscribe, station])
  
  // Auto-refresh for stations that need it
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      // Force re-render to update times
      lastRenderRef.current = Date.now()
    }, refreshInterval)
    
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])
  
  return {
    orders: filteredOrders,
    groupedOrders,
    loading: state.loading,
    error: state.error,
    updateOrderStatus,
    bumpOrder,
    recallOrder,
    performanceMetrics,
    stationLoad,
  }
}

// Hook specifically for expo station (ready orders)
export function useExpoOrders() {
  return useOptimizedKDSOrders({ station: 'expo' })
}

// Hook for monitoring all stations
export function useAllStationsOrders() {
  const grill = useOptimizedKDSOrders({ station: 'grill' })
  const fryer = useOptimizedKDSOrders({ station: 'fryer' })
  const salad = useOptimizedKDSOrders({ station: 'salad' })
  const bar = useOptimizedKDSOrders({ station: 'bar' })
  const expo = useOptimizedKDSOrders({ station: 'expo' })
  
  return {
    grill,
    fryer,
    salad,
    bar,
    expo,
    totalOrders: grill.orders.length + fryer.orders.length + salad.orders.length + bar.orders.length,
    readyOrders: expo.orders.length,
  }
}