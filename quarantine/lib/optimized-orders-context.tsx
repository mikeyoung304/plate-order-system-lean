'use client'

/**
 * OPTIMIZED Orders State Context
 * 
 * High-performance order management with selective real-time subscriptions:
 * - Role-based filtering to reduce data transfer
 * - Selective updates based on user context
 * - Optimistic updates with fallback
 * - Connection pooling and efficient batching
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
import { 
  createOrder, 
  deleteOrder, 
  getOrders, 
  updateOrder 
} from '@/lib/modassembly/supabase/database/orders'
import type { Order } from '@/lib/modassembly/supabase/database/orders'
import { useOptimizedRealtime, useRoleBasedSubscription } from '../optimized-realtime-context'
import { useAuth } from '@/lib/modassembly/supabase/auth'

// Order status type
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled'

// Orders state interface with performance tracking
interface OptimizedOrdersState {
  orders: Order[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  optimisticUpdates: Record<string, Partial<Order>>
  filteredOrdersCache: Record<string, Order[]>
  performanceMetrics: {
    totalUpdates: number
    averageUpdateTime: number
    cacheHitRate: number
  }
}

// Orders actions
type OptimizedOrdersAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'REMOVE_ORDER'; payload: string }
  | { type: 'OPTIMISTIC_UPDATE'; payload: { id: string; updates: Partial<Order> } }
  | { type: 'CLEAR_OPTIMISTIC_UPDATE'; payload: string }
  | { type: 'BATCH_UPDATE_ORDERS'; payload: Order[] }
  | { type: 'INVALIDATE_CACHE'; payload?: string }
  | { type: 'UPDATE_METRICS'; payload: Partial<OptimizedOrdersState['performanceMetrics']> }
  | { type: 'REFRESH_TIMESTAMP' }

// Initial state
const initialState: OptimizedOrdersState = {
  orders: [],
  loading: false,
  error: null,
  lastUpdated: null,
  optimisticUpdates: {},
  filteredOrdersCache: {},
  performanceMetrics: {
    totalUpdates: 0,
    averageUpdateTime: 0,
    cacheHitRate: 0,
  },
}

// Reducer function with caching optimization
function optimizedOrdersReducer(
  state: OptimizedOrdersState, 
  action: OptimizedOrdersAction
): OptimizedOrdersState {
  const updateTime = Date.now()
  
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
      
    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        optimisticUpdates: {}, // Clear optimistic updates
        filteredOrdersCache: {}, // Invalidate cache
        performanceMetrics: {
          ...state.performanceMetrics,
          totalUpdates: state.performanceMetrics.totalUpdates + 1,
        },
      }
      
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        lastUpdated: new Date(),
        filteredOrdersCache: {}, // Invalidate cache
        performanceMetrics: {
          ...state.performanceMetrics,
          totalUpdates: state.performanceMetrics.totalUpdates + 1,
        },
      }
      
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id ? action.payload : order
        ),
        lastUpdated: new Date(),
        filteredOrdersCache: {}, // Invalidate cache
        performanceMetrics: {
          ...state.performanceMetrics,
          totalUpdates: state.performanceMetrics.totalUpdates + 1,
        },
      }
      
    case 'REMOVE_ORDER':
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload),
        lastUpdated: new Date(),
        filteredOrdersCache: {}, // Invalidate cache
        performanceMetrics: {
          ...state.performanceMetrics,
          totalUpdates: state.performanceMetrics.totalUpdates + 1,
        },
      }
      
    case 'BATCH_UPDATE_ORDERS':
      const updatedOrderIds = new Set(action.payload.map(o => o.id))
      const mergedOrders = [
        ...action.payload,
        ...state.orders.filter(order => !updatedOrderIds.has(order.id))
      ]
      
      return {
        ...state,
        orders: mergedOrders,
        lastUpdated: new Date(),
        filteredOrdersCache: {}, // Invalidate cache
        performanceMetrics: {
          ...state.performanceMetrics,
          totalUpdates: state.performanceMetrics.totalUpdates + action.payload.length,
        },
      }
      
    case 'OPTIMISTIC_UPDATE':
      return {
        ...state,
        optimisticUpdates: {
          ...state.optimisticUpdates,
          [action.payload.id]: {
            ...state.optimisticUpdates[action.payload.id],
            ...action.payload.updates,
          },
        },
      }
      
    case 'CLEAR_OPTIMISTIC_UPDATE':
      const { [action.payload]: removed, ...remainingUpdates } = state.optimisticUpdates
      return {
        ...state,
        optimisticUpdates: remainingUpdates,
      }
      
    case 'INVALIDATE_CACHE':
      if (action.payload) {
        const { [action.payload]: removed, ...remainingCache } = state.filteredOrdersCache
        return { ...state, filteredOrdersCache: remainingCache }
      }
      return { ...state, filteredOrdersCache: {} }
      
    case 'UPDATE_METRICS':
      return {
        ...state,
        performanceMetrics: {
          ...state.performanceMetrics,
          ...action.payload,
        },
      }
      
    case 'REFRESH_TIMESTAMP':
      return { ...state, lastUpdated: new Date() }
      
    default:
      return state
  }
}

// Filter interface with caching key
interface OrderFilters {
  status?: OrderStatus
  tableId?: string
  residentId?: string
  serverId?: string
  dateRange?: { start: Date; end: Date }
  limit?: number
}

// Context interface
interface OptimizedOrdersContextValue {
  // State
  state: OptimizedOrdersState
  
  // Computed orders (with optimistic updates applied)
  orders: Order[]
  
  // Cached filtered orders for performance
  getFilteredOrders: (filters: OrderFilters) => Order[]
  
  // Data operations
  loadOrders: (filters?: OrderFilters) => Promise<void>
  createNewOrder: (orderData: Omit<Order, 'id' | 'created_at'>) => Promise<Order>
  updateOrderData: (orderId: string, updates: Partial<Order>) => Promise<void>
  removeOrder: (orderId: string) => Promise<void>
  
  // Optimistic updates
  optimisticUpdate: (orderId: string, updates: Partial<Order>) => void
  
  // Utilities
  getOrderById: (id: string) => Order | undefined
  getOrdersByStatus: (status: OrderStatus) => Order[]
  getOrdersByTable: (tableId: string) => Order[]
  getActiveOrders: () => Order[]
  
  // Performance metrics
  getPerformanceMetrics: () => OptimizedOrdersState['performanceMetrics']
}

const OptimizedOrdersContext = createContext<OptimizedOrdersContextValue | null>(null)

interface OptimizedOrdersProviderProps {
  children: ReactNode
  enableRealtime?: boolean
  cacheTimeout?: number
}

export function OptimizedOrdersProvider({ 
  children, 
  enableRealtime = true,
  cacheTimeout = 30000, // 30 seconds
}: OptimizedOrdersProviderProps) {
  const [state, dispatch] = useReducer(optimizedOrdersReducer, initialState)
  const { user, userRole } = useAuth()
  const { isConnected } = useOptimizedRealtime()
  const mountedRef = useRef(true)
  const cacheTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  
  // Compute orders with optimistic updates applied (memoized)
  const orders = useMemo(() => {
    const startTime = performance.now()
    
    const result = state.orders.map(order => {
      const optimisticUpdate = state.optimisticUpdates[order.id]
      return optimisticUpdate ? { ...order, ...optimisticUpdate } : order
    })
    
    const computeTime = performance.now() - startTime
    
    // Update performance metrics
    dispatch({
      type: 'UPDATE_METRICS',
      payload: {
        averageUpdateTime: (state.performanceMetrics.averageUpdateTime + computeTime) / 2,
      },
    })
    
    return result
  }, [state.orders, state.optimisticUpdates, state.performanceMetrics.averageUpdateTime])

  // Cached filtered orders with automatic invalidation
  const getFilteredOrders = useCallback((filters: OrderFilters) => {
    const cacheKey = JSON.stringify(filters)
    
    // Check cache first
    if (state.filteredOrdersCache[cacheKey]) {
      dispatch({
        type: 'UPDATE_METRICS',
        payload: {
          cacheHitRate: state.performanceMetrics.cacheHitRate + 0.1,
        },
      })
      return state.filteredOrdersCache[cacheKey]
    }
    
    // Apply filters
    let filtered = [...orders]
    
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status)
    }
    
    if (filters.tableId) {
      filtered = filtered.filter(order => order.table_id === filters.tableId)
    }
    
    if (filters.residentId) {
      filtered = filtered.filter(order => order.resident_id === filters.residentId)
    }
    
    if (filters.serverId) {
      filtered = filtered.filter(order => order.server_id === filters.serverId)
    }
    
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate >= start && orderDate <= end
      })
    }
    
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit)
    }
    
    // Role-based filtering for security and performance
    if (userRole === 'server' && user?.id) {
      filtered = filtered.filter(order => 
        order.server_id === user.id || 
        ['pending', 'ready'].includes(order.status || '')
      )
    } else if (userRole === 'cook') {
      filtered = filtered.filter(order => 
        ['confirmed', 'preparing'].includes(order.status || '')
      )
    }
    
    // Cache the result with timeout
    dispatch({ type: 'INVALIDATE_CACHE', payload: cacheKey })
    state.filteredOrdersCache[cacheKey] = filtered
    
    // Set cache timeout
    if (cacheTimeoutsRef.current.has(cacheKey)) {
      clearTimeout(cacheTimeoutsRef.current.get(cacheKey)!)
    }
    
    const timeout = setTimeout(() => {
      dispatch({ type: 'INVALIDATE_CACHE', payload: cacheKey })
      cacheTimeoutsRef.current.delete(cacheKey)
    }, cacheTimeout)
    
    cacheTimeoutsRef.current.set(cacheKey, timeout)
    
    return filtered
  }, [orders, userRole, user?.id, cacheTimeout, state.filteredOrdersCache, state.performanceMetrics.cacheHitRate])

  // Load orders from database with role-based filtering
  const loadOrders = useCallback(async (filters?: OrderFilters) => {
    if (!mountedRef.current) return
    
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      // Add role-based server filters to reduce data transfer
      const roleFilters = { ...filters }
      
      if (userRole === 'server' && user?.id) {
        roleFilters.serverId = user.id
      } else if (userRole === 'cook') {
        roleFilters.status = 'confirmed' // Only confirmed orders for kitchen
      }
      
      const fetchedOrders = await getOrders(roleFilters)
      
      if (mountedRef.current) {
        dispatch({ type: 'SET_ORDERS', payload: fetchedOrders })
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      if (mountedRef.current) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to load orders'
        })
      }
    }
  }, [userRole, user?.id])

  // Real-time subscription with role-based filtering
  useRoleBasedSubscription(
    'orders',
    useCallback((event) => {
      if (!mountedRef.current) return
      
      switch (event.eventType) {
        case 'INSERT':
          // Only add if relevant to user role
          if (shouldReceiveOrder(event.new, userRole, user?.id)) {
            dispatch({ type: 'ADD_ORDER', payload: event.new as Order })
          }
          break
        case 'UPDATE':
          // Always update existing orders (they were already filtered on initial load)
          dispatch({ type: 'UPDATE_ORDER', payload: event.new as Order })
          break
        case 'DELETE':
          dispatch({ type: 'REMOVE_ORDER', payload: event.old.id })
          break
      }
      
      dispatch({ type: 'REFRESH_TIMESTAMP' })
    }, [userRole, user?.id]),
    [userRole, user?.id]
  )

  // Helper function to determine if user should receive this order update
  const shouldReceiveOrder = (order: any, role?: string, userId?: string): boolean => {
    if (!role) return false
    
    switch (role) {
      case 'server':
        return order.server_id === userId || ['pending', 'ready'].includes(order.status)
      case 'cook':
        return ['confirmed', 'preparing'].includes(order.status)
      case 'admin':
        return true
      default:
        return false
    }
  }

  // Create new order with optimistic update
  const createNewOrder = useCallback(async (orderData: Omit<Order, 'id' | 'created_at'>): Promise<Order> => {
    try {
      const newOrder = await createOrder(orderData)
      
      if (mountedRef.current) {
        dispatch({ type: 'ADD_ORDER', payload: newOrder })
      }
      
      return newOrder
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  }, [])

  // Update order data with optimistic update and fallback
  const updateOrderData = useCallback(async (orderId: string, updates: Partial<Order>) => {
    // Apply optimistic update immediately
    dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { id: orderId, updates } })
    
    try {
      const updatedOrder = await updateOrder(orderId, updates)
      
      if (mountedRef.current) {
        dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder })
        dispatch({ type: 'CLEAR_OPTIMISTIC_UPDATE', payload: orderId })
      }
    } catch (error) {
      console.error('Error updating order:', error)
      // Revert optimistic update on error
      if (mountedRef.current) {
        dispatch({ type: 'CLEAR_OPTIMISTIC_UPDATE', payload: orderId })
      }
      throw error
    }
  }, [])

  // Remove order
  const removeOrder = useCallback(async (orderId: string) => {
    try {
      await deleteOrder(orderId)
      
      if (mountedRef.current) {
        dispatch({ type: 'REMOVE_ORDER', payload: orderId })
      }
    } catch (error) {
      console.error('Error removing order:', error)
      throw error
    }
  }, [])

  // Optimistic update
  const optimisticUpdate = useCallback((orderId: string, updates: Partial<Order>) => {
    dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { id: orderId, updates } })
  }, [])

  // Utility functions (memoized for performance)
  const getOrderById = useCallback((id: string) => {
    return orders.find(order => order.id === id)
  }, [orders])

  const getOrdersByStatus = useCallback((status: OrderStatus) => {
    return getFilteredOrders({ status })
  }, [getFilteredOrders])

  const getOrdersByTable = useCallback((tableId: string) => {
    return getFilteredOrders({ tableId })
  }, [getFilteredOrders])

  const getActiveOrders = useCallback(() => {
    return orders.filter(order => 
      ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status || '')
    )
  }, [orders])

  const getPerformanceMetrics = useCallback(() => {
    return state.performanceMetrics
  }, [state.performanceMetrics])

  // Load orders on mount
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      // Clear all cache timeouts
      for (const timeout of cacheTimeoutsRef.current.values()) {
        clearTimeout(timeout)
      }
      cacheTimeoutsRef.current.clear()
    }
  }, [])

  // Context value
  const contextValue: OptimizedOrdersContextValue = {
    state,
    orders,
    getFilteredOrders,
    loadOrders,
    createNewOrder,
    updateOrderData,
    removeOrder,
    optimisticUpdate,
    getOrderById,
    getOrdersByStatus,
    getOrdersByTable,
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

// Hook for order data only (read-only, cached)
export function useOptimizedOrdersData(filters?: OrderFilters) {
  const { getFilteredOrders, state, getPerformanceMetrics } = useOptimizedOrders()
  
  const filteredOrders = useMemo(() => {
    return filters ? getFilteredOrders(filters) : state.orders
  }, [getFilteredOrders, filters, state.orders])
  
  return {
    orders: filteredOrders,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    performanceMetrics: getPerformanceMetrics(),
  }
}

// Hook for active orders only (cached)
export function useActiveOrders() {
  const { getActiveOrders, getPerformanceMetrics } = useOptimizedOrders()
  return {
    activeOrders: getActiveOrders(),
    performanceMetrics: getPerformanceMetrics(),
  }
}