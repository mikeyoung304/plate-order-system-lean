'use client'

/**
 * Optimized Orders Context
 * 
 * Performance-optimized orders management with:
 * - Intelligent caching and deduplication
 * - Batch updates for efficiency
 * - Optimistic updates with rollback
 * - Selective real-time subscriptions
 * - Memory-efficient data structures
 */

import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import { createOptimizedClient } from '@/lib/modassembly/supabase/optimized-client'
import { useOptimizedRealtime } from '@/lib/state/optimized-realtime-context'
import type { Order } from '@/lib/modassembly/supabase/database/orders'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Order status type  
type OrderStatus = 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'

// Cache configuration
const CACHE_CONFIG = {
  MAX_ORDERS: 1000, // Maximum orders to keep in memory
  MAX_AGE: 3600000, // 1 hour
  BATCH_SIZE: 50, // Batch size for updates
  BATCH_DELAY: 100, // Delay before processing batch (ms)
  DEDUPE_WINDOW: 1000, // Window for deduplicating updates (ms)
}

// Orders state interface
interface OptimizedOrdersState {
  orders: Map<string, Order> // Using Map for O(1) lookups
  ordersByTable: Map<string, Set<string>> // Table ID -> Order IDs
  ordersByStatus: Map<OrderStatus, Set<string>> // Status -> Order IDs
  ordersByResident: Map<string, Set<string>> // Resident ID -> Order IDs
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  cacheStats: {
    hits: number
    misses: number
    evictions: number
  }
}

// Orders actions
type OrdersAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'BATCH_UPDATE'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'REMOVE_ORDER'; payload: string }
  | { type: 'OPTIMISTIC_UPDATE'; payload: { id: string; updates: Partial<Order> } }
  | { type: 'ROLLBACK_OPTIMISTIC'; payload: string }
  | { type: 'CACHE_HIT' }
  | { type: 'CACHE_MISS' }
  | { type: 'CACHE_EVICT'; payload: number }

// Initial state
const initialState: OptimizedOrdersState = {
  orders: new Map(),
  ordersByTable: new Map(),
  ordersByStatus: new Map(),
  ordersByResident: new Map(),
  loading: false,
  error: null,
  lastUpdated: null,
  cacheStats: {
    hits: 0,
    misses: 0,
    evictions: 0,
  },
}

// Helper function to update indexes
function updateIndexes(
  state: OptimizedOrdersState,
  order: Order,
  oldOrder?: Order
) {
  // Remove from old indexes if updating
  if (oldOrder) {
    // Remove from table index
    const tableOrders = state.ordersByTable.get(oldOrder.table_id)
    if (tableOrders) {
      tableOrders.delete(oldOrder.id)
      if (tableOrders.size === 0) {
        state.ordersByTable.delete(oldOrder.table_id)
      }
    }
    
    // Remove from status index
    const statusOrders = state.ordersByStatus.get(oldOrder.status as OrderStatus)
    if (statusOrders) {
      statusOrders.delete(oldOrder.id)
      if (statusOrders.size === 0) {
        state.ordersByStatus.delete(oldOrder.status as OrderStatus)
      }
    }
    
    // Remove from resident index
    if (oldOrder.resident_id) {
      const residentOrders = state.ordersByResident.get(oldOrder.resident_id)
      if (residentOrders) {
        residentOrders.delete(oldOrder.id)
        if (residentOrders.size === 0) {
          state.ordersByResident.delete(oldOrder.resident_id)
        }
      }
    }
  }
  
  // Add to new indexes
  // Table index
  if (!state.ordersByTable.has(order.table_id)) {
    state.ordersByTable.set(order.table_id, new Set())
  }
  state.ordersByTable.get(order.table_id)!.add(order.id)
  
  // Status index
  const status = order.status as OrderStatus
  if (!state.ordersByStatus.has(status)) {
    state.ordersByStatus.set(status, new Set())
  }
  state.ordersByStatus.get(status)!.add(order.id)
  
  // Resident index
  if (order.resident_id) {
    if (!state.ordersByResident.has(order.resident_id)) {
      state.ordersByResident.set(order.resident_id, new Set())
    }
    state.ordersByResident.get(order.resident_id)!.add(order.id)
  }
}

// Evict old orders from cache
function evictOldOrders(state: OptimizedOrdersState): number {
  const now = Date.now()
  const maxAge = CACHE_CONFIG.MAX_AGE
  let evicted = 0
  
  // Find orders to evict
  const toEvict: string[] = []
  for (const [id, order] of state.orders) {
    const orderAge = now - new Date(order.created_at).getTime()
    if (orderAge > maxAge && order.status === 'delivered') {
      toEvict.push(id)
    }
  }
  
  // Evict old orders
  for (const id of toEvict) {
    const order = state.orders.get(id)
    if (order) {
      updateIndexes(state, order, order) // Remove from indexes
      state.orders.delete(id)
      evicted++
    }
  }
  
  // If still over limit, evict oldest served orders
  if (state.orders.size > CACHE_CONFIG.MAX_ORDERS) {
    const delivered = Array.from(state.orders.values())
      .filter(o => o.status === 'delivered')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    const toRemove = state.orders.size - CACHE_CONFIG.MAX_ORDERS
    for (let i = 0; i < toRemove && i < delivered.length; i++) {
      const order = delivered[i]
      updateIndexes(state, order, order)
      state.orders.delete(order.id)
      evicted++
    }
  }
  
  return evicted
}

// Reducer function
function ordersReducer(state: OptimizedOrdersState, action: OrdersAction): OptimizedOrdersState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
      
    case 'BATCH_UPDATE': {
      const newState = { ...state }
      
      // Process batch of orders
      for (const order of action.payload) {
        const oldOrder = newState.orders.get(order.id)
        newState.orders.set(order.id, order)
        updateIndexes(newState, order, oldOrder)
      }
      
      // Evict old orders if needed
      const evicted = evictOldOrders(newState)
      if (evicted > 0) {
        newState.cacheStats = {
          ...newState.cacheStats,
          evictions: newState.cacheStats.evictions + evicted,
        }
      }
      
      return {
        ...newState,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }
    }
    
    case 'ADD_ORDER': {
      const newState = { ...state }
      newState.orders.set(action.payload.id, action.payload)
      updateIndexes(newState, action.payload)
      
      // Evict if over limit
      const evicted = evictOldOrders(newState)
      if (evicted > 0) {
        newState.cacheStats = {
          ...newState.cacheStats,
          evictions: newState.cacheStats.evictions + evicted,
        }
      }
      
      return { ...newState, lastUpdated: new Date() }
    }
    
    case 'UPDATE_ORDER': {
      const newState = { ...state }
      const oldOrder = newState.orders.get(action.payload.id)
      
      if (oldOrder) {
        newState.orders.set(action.payload.id, action.payload)
        updateIndexes(newState, action.payload, oldOrder)
      }
      
      return { ...newState, lastUpdated: new Date() }
    }
    
    case 'REMOVE_ORDER': {
      const newState = { ...state }
      const order = newState.orders.get(action.payload)
      
      if (order) {
        updateIndexes(newState, order, order)
        newState.orders.delete(action.payload)
      }
      
      return { ...newState, lastUpdated: new Date() }
    }
    
    case 'OPTIMISTIC_UPDATE': {
      const newState = { ...state }
      const order = newState.orders.get(action.payload.id)
      
      if (order) {
        const updatedOrder = { ...order, ...action.payload.updates }
        newState.orders.set(action.payload.id, updatedOrder)
        updateIndexes(newState, updatedOrder, order)
      }
      
      return { ...newState }
    }
    
    case 'CACHE_HIT':
      return {
        ...state,
        cacheStats: {
          ...state.cacheStats,
          hits: state.cacheStats.hits + 1,
        },
      }
      
    case 'CACHE_MISS':
      return {
        ...state,
        cacheStats: {
          ...state.cacheStats,
          misses: state.cacheStats.misses + 1,
        },
      }
      
    default:
      return state
  }
}

// Context interface
interface OptimizedOrdersContextValue {
  // State
  state: OptimizedOrdersState
  
  // Data operations
  loadOrders: (filters?: OrderFilters) => Promise<void>
  createOrder: (orderData: Omit<Order, 'id' | 'created_at'>) => Promise<Order>
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>
  deleteOrder: (orderId: string) => Promise<void>
  
  // Optimistic updates
  optimisticUpdate: (orderId: string, updates: Partial<Order>) => void
  
  // Efficient getters
  getOrderById: (id: string) => Order | undefined
  getOrdersByStatus: (status: OrderStatus) => Order[]
  getOrdersByTable: (tableId: string) => Order[]
  getOrdersByResident: (residentId: string) => Order[]
  getActiveOrders: () => Order[]
  
  // Performance metrics
  getPerformanceMetrics: () => PerformanceMetrics
}

// Filter interface
interface OrderFilters {
  status?: OrderStatus | OrderStatus[]
  tableId?: string
  residentId?: string
  serverId?: string
  dateRange?: { start: Date; end: Date }
  limit?: number
}

// Performance metrics
interface PerformanceMetrics {
  totalOrders: number
  cacheHitRate: number
  averageUpdateTime: number
  memoryUsage: number
}

const OptimizedOrdersContext = createContext<OptimizedOrdersContextValue | null>(null)

interface OptimizedOrdersProviderProps {
  children: ReactNode
  userRole?: string
  userId?: string
}

export function OptimizedOrdersProvider({
  children,
  userRole,
  userId,
}: OptimizedOrdersProviderProps) {
  const [state, dispatch] = useReducer(ordersReducer, initialState)
  const { subscribe, isConnected } = useOptimizedRealtime()
  
  // Refs
  const supabaseRef = useRef(createOptimizedClient())
  const batchQueueRef = useRef<Map<string, Order>>(new Map())
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dedupeMapRef = useRef<Map<string, number>>(new Map())
  const updateTimesRef = useRef<number[]>([])
  const mountedRef = useRef(true)
  
  // Process batch updates
  const processBatchUpdates = useCallback(() => {
    if (batchQueueRef.current.size === 0) {return}
    
    const updates = Array.from(batchQueueRef.current.values())
    batchQueueRef.current.clear()
    
    dispatch({ type: 'BATCH_UPDATE', payload: updates })
  }, [])
  
  // Add order to batch queue
  const queueBatchUpdate = useCallback((order: Order) => {
    batchQueueRef.current.set(order.id, order)
    
    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }
    
    // Process batch if it's full
    if (batchQueueRef.current.size >= CACHE_CONFIG.BATCH_SIZE) {
      processBatchUpdates()
    } else {
      // Otherwise, schedule batch processing
      batchTimeoutRef.current = setTimeout(processBatchUpdates, CACHE_CONFIG.BATCH_DELAY)
    }
  }, [processBatchUpdates])
  
  // Handle real-time updates with deduplication
  const handleRealtimeUpdate = useCallback((payload: RealtimePostgresChangesPayload<Order>) => {
    const now = Date.now()
    const updateStart = performance.now()
    
    // Check for duplicate updates
    const recordId = (payload.new as Order)?.id || (payload.old as Order)?.id || ''
    const lastUpdate = dedupeMapRef.current.get(recordId)
    if (lastUpdate && now - lastUpdate < CACHE_CONFIG.DEDUPE_WINDOW) {
      return // Skip duplicate
    }
    
    // Update dedupe map
    if (recordId) {
      dedupeMapRef.current.set(recordId, now)
    }
    
    // Handle update based on event type
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new) {
          queueBatchUpdate(payload.new)
        }
        break
        
      case 'UPDATE':
        if (payload.new) {
          queueBatchUpdate(payload.new)
        }
        break
        
      case 'DELETE':
        if ((payload.old as Order)?.id) {
          dispatch({ type: 'REMOVE_ORDER', payload: (payload.old as Order).id })
        }
        break
    }
    
    // Track update time
    updateTimesRef.current.push(performance.now() - updateStart)
    if (updateTimesRef.current.length > 100) {
      updateTimesRef.current.shift()
    }
    
    // Clean up old dedupe entries
    if (dedupeMapRef.current.size > 1000) {
      const cutoff = now - CACHE_CONFIG.DEDUPE_WINDOW * 2
      for (const [id, timestamp] of dedupeMapRef.current) {
        if (timestamp < cutoff) {
          dedupeMapRef.current.delete(id)
        }
      }
    }
  }, [queueBatchUpdate])
  
  // Load orders from database
  const loadOrders = useCallback(async (filters?: OrderFilters) => {
    if (!mountedRef.current) {return}
    
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const supabase = supabaseRef.current
      let query = supabase.from('orders').select('*')
      
      // Apply filters
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }
      
      if (filters?.tableId) {
        query = query.eq('table_id', filters.tableId)
      }
      
      if (filters?.residentId) {
        query = query.eq('resident_id', filters.residentId)
      }
      
      if (filters?.serverId) {
        query = query.eq('server_id', filters.serverId)
      }
      
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString())
      }
      
      // Apply limit
      if (filters?.limit) {
        query = query.limit(filters.limit)
      } else {
        query = query.limit(500) // Default limit for performance
      }
      
      // Order by created_at descending
      query = query.order('created_at', { ascending: false })
      
      const { data, error } = await query
      
      if (error) {throw error}
      
      if (mountedRef.current && data) {
        dispatch({ type: 'BATCH_UPDATE', payload: data })
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      if (mountedRef.current) {
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Failed to load orders',
        })
      }
    }
  }, [])
  
  // Create new order
  const createOrder = useCallback(async (orderData: Omit<Order, 'id' | 'created_at'>): Promise<Order> => {
    const supabase = supabaseRef.current
    
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()
    
    if (error) {throw error}
    if (!data) {throw new Error('No data returned')}
    
    // Add to local state immediately
    if (mountedRef.current) {
      dispatch({ type: 'ADD_ORDER', payload: data })
    }
    
    return data
  }, [])
  
  // Update order
  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
    const supabase = supabaseRef.current
    
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single()
    
    if (error) {throw error}
    
    // Update local state
    if (mountedRef.current && data) {
      dispatch({ type: 'UPDATE_ORDER', payload: data })
    }
  }, [])
  
  // Delete order
  const deleteOrder = useCallback(async (orderId: string) => {
    const supabase = supabaseRef.current
    
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
    
    if (error) {throw error}
    
    // Remove from local state
    if (mountedRef.current) {
      dispatch({ type: 'REMOVE_ORDER', payload: orderId })
    }
  }, [])
  
  // Optimistic update
  const optimisticUpdate = useCallback((orderId: string, updates: Partial<Order>) => {
    dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { id: orderId, updates } })
  }, [])
  
  // Efficient getters using indexes
  const getOrderById = useCallback((id: string): Order | undefined => {
    const order = state.orders.get(id)
    if (order) {
      dispatch({ type: 'CACHE_HIT' })
    } else {
      dispatch({ type: 'CACHE_MISS' })
    }
    return order
  }, [state.orders])
  
  const getOrdersByStatus = useCallback((status: OrderStatus): Order[] => {
    const orderIds = state.ordersByStatus.get(status)
    if (!orderIds) {return []}
    
    const orders: Order[] = []
    for (const id of orderIds) {
      const order = state.orders.get(id)
      if (order) {orders.push(order)}
    }
    
    return orders
  }, [state.orders, state.ordersByStatus])
  
  const getOrdersByTable = useCallback((tableId: string): Order[] => {
    const orderIds = state.ordersByTable.get(tableId)
    if (!orderIds) {return []}
    
    const orders: Order[] = []
    for (const id of orderIds) {
      const order = state.orders.get(id)
      if (order) {orders.push(order)}
    }
    
    return orders
  }, [state.orders, state.ordersByTable])
  
  const getOrdersByResident = useCallback((residentId: string): Order[] => {
    const orderIds = state.ordersByResident.get(residentId)
    if (!orderIds) {return []}
    
    const orders: Order[] = []
    for (const id of orderIds) {
      const order = state.orders.get(id)
      if (order) {orders.push(order)}
    }
    
    return orders
  }, [state.orders, state.ordersByResident])
  
  const getActiveOrders = useCallback((): Order[] => {
    const activeStatuses: OrderStatus[] = ['new', 'in_progress', 'ready']
    const orders: Order[] = []
    
    for (const status of activeStatuses) {
      const statusOrders = getOrdersByStatus(status)
      orders.push(...statusOrders)
    }
    
    return orders
  }, [getOrdersByStatus])
  
  // Get performance metrics
  const getPerformanceMetrics = useCallback((): PerformanceMetrics => {
    const cacheTotal = state.cacheStats.hits + state.cacheStats.misses
    const cacheHitRate = cacheTotal > 0 ? state.cacheStats.hits / cacheTotal : 0
    
    const avgUpdateTime = updateTimesRef.current.length > 0
      ? updateTimesRef.current.reduce((a, b) => a + b, 0) / updateTimesRef.current.length
      : 0
    
    // Estimate memory usage (rough approximation)
    const avgOrderSize = 500 // bytes
    const memoryUsage = state.orders.size * avgOrderSize
    
    return {
      totalOrders: state.orders.size,
      cacheHitRate,
      averageUpdateTime: avgUpdateTime,
      memoryUsage,
    }
  }, [state.orders.size, state.cacheStats])
  
  // Set up real-time subscription
  useEffect(() => {
    if (!isConnected) {return}
    
    // Subscribe to orders table with role-based filtering
    const unsubscribe = subscribe({
      id: 'optimized-orders',
      table: 'orders',
      event: '*',
      callback: handleRealtimeUpdate,
      priority: 'high',
    })
    
    return unsubscribe
  }, [isConnected, subscribe, handleRealtimeUpdate])
  
  // Load initial orders
  useEffect(() => {
    loadOrders({
      status: ['new', 'in_progress', 'ready'],
      limit: 200,
    })
  }, [loadOrders])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }
    }
  }, [])
  
  // Context value
  const contextValue: OptimizedOrdersContextValue = {
    state,
    loadOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    optimisticUpdate,
    getOrderById,
    getOrdersByStatus,
    getOrdersByTable,
    getOrdersByResident,
    getActiveOrders,
    getPerformanceMetrics,
  }
  
  return (
    <OptimizedOrdersContext.Provider value={contextValue}>
      {children}
    </OptimizedOrdersContext.Provider>
  )
}

// Hook for using optimized orders context
export function useOptimizedOrders() {
  const context = useContext(OptimizedOrdersContext)
  if (!context) {
    throw new Error('useOptimizedOrders must be used within an OptimizedOrdersProvider')
  }
  return context
}

// Hook for active orders only (performance optimized)
export function useActiveOrders() {
  const { getActiveOrders, state } = useOptimizedOrders()
  
  return useMemo(() => {
    const orders = getActiveOrders()
    return {
      orders,
      count: orders.length,
      loading: state.loading,
      error: state.error,
    }
  }, [getActiveOrders, state.loading, state.error])
}

// Hook for orders by table (performance optimized)
export function useTableOrders(tableId: string) {
  const { getOrdersByTable, state } = useOptimizedOrders()
  
  return useMemo(() => {
    const orders = getOrdersByTable(tableId)
    return {
      orders,
      count: orders.length,
      loading: state.loading,
      error: state.error,
    }
  }, [getOrdersByTable, tableId, state.loading, state.error])
}