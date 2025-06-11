'use client'

/**
 * Orders State Context
 *
 * Manages order data, order lifecycle, and order-related operations.
 * Extracted from the monolithic restaurant-state-context.tsx for better
 * performance and maintainability.
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
import { createClient } from '@/lib/modassembly/supabase/client'
import {
  type Order,
  createOrder,
  deleteOrder,
  getOrders,
  updateOrder,
} from '@/lib/modassembly/supabase/database/orders'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Order status type (aligned with database)
type OrderStatus = 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'

// Orders state interface
interface OrdersState {
  orders: Order[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  optimisticUpdates: Record<string, Partial<Order>>
}

// Orders actions
type OrdersAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'REMOVE_ORDER'; payload: string }
  | {
      type: 'OPTIMISTIC_UPDATE'
      payload: { id: string; updates: Partial<Order> }
    }
  | { type: 'CLEAR_OPTIMISTIC_UPDATE'; payload: string }
  | { type: 'REFRESH_TIMESTAMP' }

// Initial state
const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null,
  lastUpdated: null,
  optimisticUpdates: {},
}

// Reducer function
function ordersReducer(state: OrdersState, action: OrdersAction): OrdersState {
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
        optimisticUpdates: {}, // Clear optimistic updates when fresh data arrives
      }

    case 'ADD_ORDER':
      return {
        ...state,
        orders: [...state.orders, action.payload],
        lastUpdated: new Date(),
      }

    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id ? action.payload : order
        ),
        lastUpdated: new Date(),
      }

    case 'REMOVE_ORDER':
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload),
        lastUpdated: new Date(),
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
      const { [action.payload]: removed, ...remainingUpdates } =
        state.optimisticUpdates
      return {
        ...state,
        optimisticUpdates: remainingUpdates,
      }

    case 'REFRESH_TIMESTAMP':
      return { ...state, lastUpdated: new Date() }

    default:
      return state
  }
}

// Context interface
/* eslint-disable no-unused-vars */
interface OrdersContextValue {
  // State
  state: OrdersState

  // Computed orders (with optimistic updates applied)
  orders: Order[]

  // Data operations
  loadOrders: (filters?: OrderFilters) => Promise<void>
  createNewOrder: (
    orderData: Omit<Order, 'id' | 'created_at'>
  ) => Promise<Order>
  updateOrderData: (orderId: string, updates: Partial<Order>) => Promise<void>
  removeOrder: (orderId: string) => Promise<void>

  // Optimistic updates
  optimisticUpdate: (orderId: string, updates: Partial<Order>) => void

  // Utilities
  getOrderById: (id: string) => Order | undefined
  getOrdersByStatus: (status: OrderStatus) => Order[]
  getOrdersByTable: (tableId: string) => Order[]
  getOrdersByResident: (residentId: string) => Order[]
  getActiveOrders: () => Order[]

  // Metrics
  getOrderStats: () => OrderStats
}
/* eslint-enable no-unused-vars */

// Filter interface
interface OrderFilters {
  status?: OrderStatus
  tableId?: string
  residentId?: string
  serverId?: string
  dateRange?: { start: Date; end: Date }
}

// Stats interface
interface OrderStats {
  total: number
  byStatus: Record<OrderStatus, number>
  averageTime: number
  pendingCount: number
  readyCount: number
}

const OrdersContext = createContext<OrdersContextValue | null>(null)

interface OrdersProviderProps {
  children: ReactNode
  enableRealtime?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function OrdersProvider({
  children,
  enableRealtime = true,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}: OrdersProviderProps) {
  const [state, dispatch] = useReducer(ordersReducer, initialState)
  const supabaseRef = useRef(createClient())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const mountedRef = useRef(true)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Compute orders with optimistic updates applied
  const orders = useMemo(() => {
    return state.orders.map(order => {
      const optimisticUpdate = state.optimisticUpdates[order.id]
      return optimisticUpdate ? { ...order, ...optimisticUpdate } : order
    })
  }, [state.orders, state.optimisticUpdates])

  // Load orders from database
  const loadOrders = useCallback(async (filters?: OrderFilters) => {
    if (!mountedRef.current) {
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const fetchedOrders = await getOrders(filters)

      if (mountedRef.current) {
        dispatch({ type: 'SET_ORDERS', payload: fetchedOrders })
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      if (mountedRef.current) {
        dispatch({
          type: 'SET_ERROR',
          payload:
            error instanceof Error ? error.message : 'Failed to load orders',
        })
      }
    }
  }, [])

  // Create new order
  const createNewOrder = useCallback(
    async (orderData: Omit<Order, 'id' | 'created_at'>): Promise<Order> => {
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
    },
    []
  )

  // Update order data
  const updateOrderData = useCallback(
    async (orderId: string, updates: Partial<Order>) => {
      try {
        const updatedOrder = await updateOrder(orderId, updates)

        if (mountedRef.current && updatedOrder) {
          dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder })
          dispatch({ type: 'CLEAR_OPTIMISTIC_UPDATE', payload: orderId })
        }
      } catch (error) {
        console.error('Error updating order:', error)
        // Clear optimistic update on error
        if (mountedRef.current) {
          dispatch({ type: 'CLEAR_OPTIMISTIC_UPDATE', payload: orderId })
        }
        throw error
      }
    },
    []
  )

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
  const optimisticUpdate = useCallback(
    (orderId: string, updates: Partial<Order>) => {
      dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { id: orderId, updates } })
    },
    []
  )

  // Utility functions
  const getOrderById = useCallback(
    (id: string) => {
      return orders.find(order => order.id === id)
    },
    [orders]
  )

  const getOrdersByStatus = useCallback(
    (status: OrderStatus) => {
      return orders.filter(order => order.status === status)
    },
    [orders]
  )

  const getOrdersByTable = useCallback(
    (tableId: string) => {
      return orders.filter(order => order.table_id === tableId)
    },
    [orders]
  )

  const getOrdersByResident = useCallback(
    (residentId: string) => {
      return orders.filter(order => order.resident_id === residentId)
    },
    [orders]
  )

  const getActiveOrders = useCallback(() => {
    return orders.filter(order =>
      ['pending', 'confirmed', 'preparing', 'ready'].includes(
        order.status || ''
      )
    )
  }, [orders])

  // Order statistics
  const getOrderStats = useCallback((): OrderStats => {
    const stats: OrderStats = {
      total: orders.length,
      byStatus: {
        new: 0,
        in_progress: 0,
        ready: 0,
        delivered: 0,
        cancelled: 0,
      },
      averageTime: 0,
      pendingCount: 0,
      readyCount: 0,
    }

    let totalTime = 0
    let completedOrders = 0

    orders.forEach(order => {
      const status = (order.status || 'new') as OrderStatus
      stats.byStatus[status]++

      if (status === 'new') {
        stats.pendingCount++
      }
      if (status === 'ready') {
        stats.readyCount++
      }

      // Calculate average time for completed orders
      if (status === 'delivered' && order.created_at) {
        const createdTime = new Date(order.created_at).getTime()
        const currentTime = Date.now()
        totalTime += currentTime - createdTime
        completedOrders++
      }
    })

    stats.averageTime =
      completedOrders > 0 ? totalTime / completedOrders / 1000 / 60 : 0 // in minutes

    return stats
  }, [orders])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enableRealtime || !mountedRef.current) {
      return
    }

    const supabase = supabaseRef.current

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Create new channel for orders
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        payload => {
          if (!mountedRef.current) {
            return
          }

          switch (payload.eventType) {
            case 'INSERT':
              dispatch({ type: 'ADD_ORDER', payload: payload.new as Order })
              break
            case 'UPDATE':
              dispatch({ type: 'UPDATE_ORDER', payload: payload.new as Order })
              break
            case 'DELETE':
              dispatch({ type: 'REMOVE_ORDER', payload: payload.old.id })
              break
          }

          dispatch({ type: 'REFRESH_TIMESTAMP' })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enableRealtime])

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) {
      return
    }

    refreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        loadOrders()
      }
    }, refreshInterval)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, loadOrders])

  // Load orders on mount
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Context value
  const contextValue: OrdersContextValue = {
    state,
    orders,
    loadOrders,
    createNewOrder,
    updateOrderData,
    removeOrder,
    optimisticUpdate,
    getOrderById,
    getOrdersByStatus,
    getOrdersByTable,
    getOrdersByResident,
    getActiveOrders,
    getOrderStats,
  }

  return (
    <OrdersContext.Provider value={contextValue}>
      {children}
    </OrdersContext.Provider>
  )
}

// Hook for using orders context
export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider')
  }
  return context
}

// Hook for order data only (read-only)
export function useOrdersData() {
  const { orders, state, getOrderStats } = useOrders()
  return {
    orders,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    stats: getOrderStats(),
  }
}

// Hook for active orders only
export function useActiveOrders() {
  const { getActiveOrders, getOrderStats } = useOrders()
  return {
    activeOrders: getActiveOrders(),
    stats: getOrderStats(),
  }
}
