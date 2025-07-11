'use client'

/**
 * ⚠️ DEPRECATED: RESTAURANT STATE INTELLIGENCE COORDINATOR
 * 
 * 🚨 THIS FILE IS DEPRECATED AS OF DECEMBER 2024 🚨
 * 
 * Please use the new domain-specific contexts instead:
 * - import { useConnection, useTables, useOrders, useServer } from '@/lib/state/domains'
 * - Or: import { RestaurantProvider } from '@/lib/state/domains'
 *
 * This 890-line monolithic context has been refactored into 4 focused domain contexts
 * for better maintainability, performance, and reduced memory usage.
 * 
 * Migration completed in December 2024. This file is kept for reference only.
 * 
 * ORIGINAL DESCRIPTION:
 * Central state management system that provides:
 * - Real-time coordination across all restaurant views
 * - Intelligent state synchronization
 * - Performance optimized updates
 * - Unified data management
 *
 * MISSION: Make state management feel alive and responsive
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { Order } from '@/lib/modassembly/supabase/database/orders'
import type { Table } from '@/lib/floor-plan-utils'
import type { KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds'

// COMPREHENSIVE RESTAURANT STATE
interface RestaurantState {
  // Data entities
  tables: Table[]
  orders: Order[]
  kdsQueue: KDSOrderRouting[]
  residents: any[]
  servers: any[]

  // Real-time connection status
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  lastUpdated: Date

  // View-specific states
  serverView: {
    selectedTable: Table | null
    selectedSeat: number | null
    orderType: 'food' | 'drink' | null
    currentView:
      | 'floorPlan'
      | 'seatPicker'
      | 'orderType'
      | 'residentSelect'
      | 'voiceOrder'
  }

  kitchenView: {
    selectedStation: string | null
    filterStatus: string | null
    sortBy: 'time' | 'priority' | 'table'
  }

  analyticsView: {
    dateRange: { start: Date; end: Date }
    selectedMetrics: string[]
    refreshInterval: number
  }

  // Loading states
  loading: {
    tables: boolean
    orders: boolean
    kdsQueue: boolean
    general: boolean
  }

  // Error states
  errors: {
    tables: string | null
    orders: string | null
    kdsQueue: string | null
    connection: string | null
  }
}

// STATE ACTIONS
type RestaurantAction =
  | {
      type: 'SET_LOADING'
      payload: { key: keyof RestaurantState['loading']; loading: boolean }
    }
  | {
      type: 'SET_ERROR'
      payload: { key: keyof RestaurantState['errors']; error: string | null }
    }
  | {
      type: 'SET_CONNECTION_STATUS'
      payload: 'connected' | 'disconnected' | 'reconnecting'
    }
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'SET_KDS_QUEUE'; payload: KDSOrderRouting[] }
  | { type: 'SET_RESIDENTS'; payload: any[] }
  | { type: 'SET_SERVERS'; payload: any[] }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'REMOVE_ORDER'; payload: string }
  | { type: 'UPDATE_KDS_ROUTING'; payload: KDSOrderRouting }
  | { type: 'SERVER_SELECT_TABLE'; payload: Table }
  | { type: 'SERVER_SELECT_SEAT'; payload: number }
  | { type: 'SERVER_SET_ORDER_TYPE'; payload: 'food' | 'drink' }
  | {
      type: 'SERVER_SET_VIEW'
      payload: RestaurantState['serverView']['currentView']
    }
  | { type: 'SERVER_RESET' }
  | { type: 'KITCHEN_SELECT_STATION'; payload: string | null }
  | { type: 'KITCHEN_SET_FILTER'; payload: string | null }
  | { type: 'KITCHEN_SET_SORT'; payload: 'time' | 'priority' | 'table' }
  | { type: 'ANALYTICS_SET_DATE_RANGE'; payload: { start: Date; end: Date } }
  | { type: 'ANALYTICS_SET_METRICS'; payload: string[] }
  | { type: 'REFRESH_TIMESTAMP' }

// INITIAL STATE
const initialState: RestaurantState = {
  tables: [],
  orders: [],
  kdsQueue: [],
  residents: [],
  servers: [],

  connectionStatus: 'disconnected',
  lastUpdated: new Date(),

  serverView: {
    selectedTable: null,
    selectedSeat: null,
    orderType: null,
    currentView: 'floorPlan',
  },

  kitchenView: {
    selectedStation: null,
    filterStatus: null,
    sortBy: 'time',
  },

  analyticsView: {
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: new Date(),
    },
    selectedMetrics: ['prep_time', 'throughput', 'wait_time'],
    refreshInterval: 30000, // 30 seconds
  },

  loading: {
    tables: true,
    orders: true,
    kdsQueue: true,
    general: false,
  },

  errors: {
    tables: null,
    orders: null,
    kdsQueue: null,
    connection: null,
  },
}

// STATE REDUCER WITH INTELLIGENT UPDATES
function restaurantStateReducer(
  state: RestaurantState,
  action: RestaurantAction
): RestaurantState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading,
        },
      }

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error,
        },
      }

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload,
        lastUpdated: new Date(),
      }

    case 'SET_TABLES':
      return {
        ...state,
        tables: action.payload,
        loading: { ...state.loading, tables: false },
        errors: { ...state.errors, tables: null },
        lastUpdated: new Date(),
      }

    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload,
        loading: { ...state.loading, orders: false },
        errors: { ...state.errors, orders: null },
        lastUpdated: new Date(),
      }

    case 'SET_KDS_QUEUE':
      return {
        ...state,
        kdsQueue: action.payload,
        loading: { ...state.loading, kdsQueue: false },
        errors: { ...state.errors, kdsQueue: null },
        lastUpdated: new Date(),
      }

    case 'SET_RESIDENTS':
      return {
        ...state,
        residents: action.payload,
        lastUpdated: new Date(),
      }

    case 'SET_SERVERS':
      return {
        ...state,
        servers: action.payload,
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

    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        lastUpdated: new Date(),
      }

    case 'REMOVE_ORDER':
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload),
        lastUpdated: new Date(),
      }

    case 'UPDATE_KDS_ROUTING':
      return {
        ...state,
        kdsQueue: state.kdsQueue.map(routing =>
          routing.id === action.payload.id ? action.payload : routing
        ),
        lastUpdated: new Date(),
      }

    // Server view actions
    case 'SERVER_SELECT_TABLE':
      return {
        ...state,
        serverView: {
          ...state.serverView,
          selectedTable: action.payload,
          selectedSeat: null,
          orderType: null,
          currentView: 'seatPicker',
        },
      }

    case 'SERVER_SELECT_SEAT':
      return {
        ...state,
        serverView: {
          ...state.serverView,
          selectedSeat: action.payload,
          currentView: 'orderType',
        },
      }

    case 'SERVER_SET_ORDER_TYPE':
      return {
        ...state,
        serverView: {
          ...state.serverView,
          orderType: action.payload,
          currentView: 'residentSelect',
        },
      }

    case 'SERVER_SET_VIEW':
      return {
        ...state,
        serverView: {
          ...state.serverView,
          currentView: action.payload,
        },
      }

    case 'SERVER_RESET':
      return {
        ...state,
        serverView: {
          selectedTable: null,
          selectedSeat: null,
          orderType: null,
          currentView: 'floorPlan',
        },
      }

    // Kitchen view actions
    case 'KITCHEN_SELECT_STATION':
      return {
        ...state,
        kitchenView: {
          ...state.kitchenView,
          selectedStation: action.payload,
        },
      }

    case 'KITCHEN_SET_FILTER':
      return {
        ...state,
        kitchenView: {
          ...state.kitchenView,
          filterStatus: action.payload,
        },
      }

    case 'KITCHEN_SET_SORT':
      return {
        ...state,
        kitchenView: {
          ...state.kitchenView,
          sortBy: action.payload,
        },
      }

    // Analytics view actions
    case 'ANALYTICS_SET_DATE_RANGE':
      return {
        ...state,
        analyticsView: {
          ...state.analyticsView,
          dateRange: action.payload,
        },
      }

    case 'ANALYTICS_SET_METRICS':
      return {
        ...state,
        analyticsView: {
          ...state.analyticsView,
          selectedMetrics: action.payload,
        },
      }

    case 'REFRESH_TIMESTAMP':
      return {
        ...state,
        lastUpdated: new Date(),
      }

    default:
      return state
  }
}

// CONTEXT DEFINITION
interface RestaurantStateContextType {
  state: RestaurantState
  actions: {
    // Data fetching
    refreshTables: () => Promise<void>
    refreshOrders: () => Promise<void>
    refreshKDSQueue: () => Promise<void>
    refreshAll: () => Promise<void>

    // Server view actions
    selectTable: (_table: Table) => void
    selectSeat: (_seat: number) => void
    setOrderType: (_type: 'food' | 'drink') => void
    setServerView: (_view: RestaurantState['serverView']['currentView']) => void
    resetServerView: () => void

    // Kitchen view actions
    selectStation: (_stationId: string | null) => void
    setKitchenFilter: (_status: string | null) => void
    setKitchenSort: (_sort: 'time' | 'priority' | 'table') => void

    // Analytics view actions
    setAnalyticsDateRange: (_range: { start: Date; end: Date }) => void
    setAnalyticsMetrics: (_metrics: string[]) => void

    // Real-time optimistic updates
    optimisticUpdateOrder: (_order: Order) => void
    optimisticUpdateKDSRouting: (_routing: KDSOrderRouting) => void
  }
}

const RestaurantStateContext = createContext<RestaurantStateContextType | null>(
  null
)

// CONTEXT PROVIDER
interface RestaurantStateProviderProps {
  children: React.ReactNode
}

export function RestaurantStateProvider({
  children,
}: RestaurantStateProviderProps) {
  const [state, dispatch] = useReducer(restaurantStateReducer, initialState)
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const channelsRef = useRef<RealtimeChannel[]>([])
  const isMountedRef = useRef(true)

  // Initialize Supabase client
  useEffect(() => {
    try {
      const client = createClient()
      supabaseRef.current = client
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' })
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error)
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' })
      dispatch({
        type: 'SET_ERROR',
        payload: { key: 'connection', error: 'Failed to connect to database' },
      })
    }
  }, [])

  // Data fetching functions
  const refreshTables = useCallback(async () => {
    if (!supabaseRef.current) {
      return
    }

    try {
      dispatch({
        type: 'SET_LOADING',
        payload: { key: 'tables', loading: true },
      })

      // Use database functions instead of direct queries
      const { fetchAllTables } = await import('@/lib/modassembly/supabase/database/tables')
      const { fetchAllSeats } = await import('@/lib/modassembly/supabase/database/seats')
      
      // Pass the client to the database functions (dependency injection)
      const tables = await fetchAllTables(supabaseRef.current)
      const seats = await fetchAllSeats(supabaseRef.current)

      // Transform to Table format with seat counts and occupancy
      const seatCountMap =
        seats?.reduce(
          (acc, seat) => {
            acc[seat.table_id] = (acc[seat.table_id] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ) || {}

      const occupiedSeatMap =
        seats?.reduce(
          (acc, seat) => {
            if (seat.status === 'occupied') {
              acc[seat.table_id] = (acc[seat.table_id] || 0) + 1
            }
            return acc
          },
          {} as Record<string, number>
        ) || {}

      const transformedTables: Table[] = (tables || []).map((table, index) => ({
        id: table.id,
        label: table.label.toString(),
        status: table.status as 'available' | 'occupied' | 'reserved',
        type: table.type as 'circle' | 'rectangle' | 'square',
        seats: seatCountMap[table.id] || 0,
        occupiedSeats: occupiedSeatMap[table.id] || 0,
        x: table.position_x || 100 + (index % 3) * 150,
        y: table.position_y || 100 + Math.floor(index / 3) * 150,
        width: table.width || (table.type === 'circle' ? 80 : 120),
        height: table.height || 80,
        rotation: table.rotation || 0,
        zIndex: 1,
      }))

      dispatch({ type: 'SET_TABLES', payload: transformedTables })
    } catch (error) {
      console.error('Error fetching tables:', error)
      dispatch({
        type: 'SET_ERROR',
        payload: {
          key: 'tables',
          error:
            error instanceof Error ? error.message : 'Failed to fetch tables',
        },
      })
    }
  }, [])

  const refreshOrders = useCallback(async () => {
    if (!supabaseRef.current) {
      return
    }

    try {
      dispatch({
        type: 'SET_LOADING',
        payload: { key: 'orders', loading: true },
      })

      // Use database functions instead of direct queries
      const { fetchOrdersWithDetails } = await import('@/lib/modassembly/supabase/database/orders')
      
      // Pass the client to the database functions (dependency injection)
      const data = await fetchOrdersWithDetails(supabaseRef.current)

      const transformedOrders: Order[] = (data || []).map(order => ({
        ...order,
        table: `Table ${order.tables?.label || 'Unknown'}`,
        seat: order.seats?.label || 'Unknown',
      }))

      dispatch({ type: 'SET_ORDERS', payload: transformedOrders })
    } catch (error) {
      console.error('Error fetching orders:', error)
      dispatch({
        type: 'SET_ERROR',
        payload: {
          key: 'orders',
          error:
            error instanceof Error ? error.message : 'Failed to fetch orders',
        },
      })
    }
  }, [])

  const refreshKDSQueue = useCallback(async () => {
    if (!supabaseRef.current) {
      return
    }

    try {
      dispatch({
        type: 'SET_LOADING',
        payload: { key: 'kdsQueue', loading: true },
      })

      const { data, error } = await supabaseRef.current
        .from('kds_order_routing')
        .select(
          `
          *,
          order:orders!inner (
            *,
            resident:profiles!resident_id (name),
            server:profiles!server_id (name),
            table:tables!table_id (label)
          ),
          station:kds_stations!station_id (*)
        `
        )
        .is('completed_at', null)
        .order('routed_at', { ascending: true })

      if (error) {
        throw error
      }

      dispatch({ type: 'SET_KDS_QUEUE', payload: data || [] })
    } catch (error) {
      console.error('Error fetching KDS queue:', error)
      dispatch({
        type: 'SET_ERROR',
        payload: {
          key: 'kdsQueue',
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch KDS queue',
        },
      })
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshTables(), refreshOrders(), refreshKDSQueue()])
  }, [refreshTables, refreshOrders, refreshKDSQueue])

  // Real-time subscriptions with graceful degradation
  useEffect(() => {
    if (!supabaseRef.current) {
      return
    }

    const setupRealtimeSubscriptions = async () => {
      try {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'reconnecting' })

        // Orders subscription with error handling
        const ordersChannel = supabaseRef
          .current!.channel('orders-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {
              if (isMountedRef.current) {
                refreshOrders()
              }
            }
          )
          .subscribe()

        // Add timeout to prevent hanging on failed connections
        setTimeout(() => {
          if (ordersChannel.state !== 'joined') {
            console.warn(
              'Real-time connection timeout - continuing without real-time updates'
            )
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' })
          }
        }, 5000)

        // KDS routing subscription with error handling
        const kdsChannel = supabaseRef
          .current!.channel('kds-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'kds_order_routing' },
            () => {
              if (isMountedRef.current) {
                refreshKDSQueue()
              }
            }
          )
          .subscribe()

        // Tables subscription with error handling
        const tablesChannel = supabaseRef
          .current!.channel('tables-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tables' },
            () => {
              if (isMountedRef.current) {
                refreshTables()
              }
            }
          )
          .subscribe()

        // Seats subscription with error handling
        const seatsChannel = supabaseRef
          .current!.channel('seats-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'seats' },
            () => {
              if (isMountedRef.current) {
                refreshTables() // Refresh tables when seats change
              }
            }
          )
          .subscribe()

        channelsRef.current = [
          ordersChannel,
          kdsChannel,
          tablesChannel,
          seatsChannel,
        ]

        // Set connected status after attempting subscriptions
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' })
      } catch (error) {
        console.error('Failed to setup real-time subscriptions:', error)
        
        // Clean up any partially created channels
        channelsRef.current.forEach(channel => {
          if (channel && supabaseRef.current) {
            try {
              supabaseRef.current.removeChannel(channel)
            } catch (cleanupError) {
              console.error('Error cleaning up channel:', cleanupError)
            }
          }
        })
        channelsRef.current = []
        
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' }) // Still mark as connected for basic functionality
        dispatch({
          type: 'SET_ERROR',
          payload: {
            key: 'connection',
            error: 'Real-time updates unavailable',
          },
        })
      }
    }

    setupRealtimeSubscriptions()

    return () => {
      isMountedRef.current = false // Set BEFORE cleanup
      channelsRef.current.forEach(channel => {
        if (supabaseRef.current) {
          try {
            supabaseRef.current.removeChannel(channel)
          } catch (cleanupError) {
            console.error('Error removing channel:', cleanupError)
          }
        }
      })
      channelsRef.current = []
    }
  }, [refreshOrders, refreshKDSQueue, refreshTables])

  // Initial data load
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Action creators
  const actions = {
    refreshTables,
    refreshOrders,
    refreshKDSQueue,
    refreshAll,

    selectTable: (table: Table) =>
      dispatch({ type: 'SERVER_SELECT_TABLE', payload: table }),
    selectSeat: (seat: number) =>
      dispatch({ type: 'SERVER_SELECT_SEAT', payload: seat }),
    setOrderType: (type: 'food' | 'drink') =>
      dispatch({ type: 'SERVER_SET_ORDER_TYPE', payload: type }),
    setServerView: (view: RestaurantState['serverView']['currentView']) =>
      dispatch({ type: 'SERVER_SET_VIEW', payload: view }),
    resetServerView: () => dispatch({ type: 'SERVER_RESET' }),

    selectStation: (stationId: string | null) =>
      dispatch({ type: 'KITCHEN_SELECT_STATION', payload: stationId }),
    setKitchenFilter: (status: string | null) =>
      dispatch({ type: 'KITCHEN_SET_FILTER', payload: status }),
    setKitchenSort: (sort: 'time' | 'priority' | 'table') =>
      dispatch({ type: 'KITCHEN_SET_SORT', payload: sort }),

    setAnalyticsDateRange: (range: { start: Date; end: Date }) =>
      dispatch({ type: 'ANALYTICS_SET_DATE_RANGE', payload: range }),
    setAnalyticsMetrics: (metrics: string[]) =>
      dispatch({ type: 'ANALYTICS_SET_METRICS', payload: metrics }),

    optimisticUpdateOrder: (order: Order) =>
      dispatch({ type: 'UPDATE_ORDER', payload: order }),
    optimisticUpdateKDSRouting: (routing: KDSOrderRouting) =>
      dispatch({ type: 'UPDATE_KDS_ROUTING', payload: routing }),
  }

  return (
    <RestaurantStateContext.Provider value={{ state, actions }}>
      {children}
    </RestaurantStateContext.Provider>
  )
}

// HOOK FOR CONSUMING CONTEXT
export function useRestaurantState() {
  const context = useContext(RestaurantStateContext)
  if (!context) {
    throw new Error(
      'useRestaurantState must be used within a RestaurantStateProvider'
    )
  }
  return context
}

// SPECIALIZED HOOKS FOR SPECIFIC VIEWS
export function useServerState() {
  const { state, actions } = useRestaurantState()
  return {
    tables: state.tables,
    orders: state.orders,
    residents: state.residents,
    servers: state.servers,
    selectedTable: state.serverView.selectedTable,
    selectedSeat: state.serverView.selectedSeat,
    orderType: state.serverView.orderType,
    currentView: state.serverView.currentView,
    connectionStatus: state.connectionStatus,
    loading: state.loading,
    errors: state.errors,
    actions: {
      selectTable: actions.selectTable,
      selectSeat: actions.selectSeat,
      setOrderType: actions.setOrderType,
      setView: actions.setServerView,
      reset: actions.resetServerView,
      refresh: actions.refreshAll,
    },
  }
}

export function useKitchenState() {
  const { state, actions } = useRestaurantState()
  return {
    kdsQueue: state.kdsQueue,
    orders: state.orders,
    selectedStation: state.kitchenView.selectedStation,
    filterStatus: state.kitchenView.filterStatus,
    sortBy: state.kitchenView.sortBy,
    connectionStatus: state.connectionStatus,
    loading: state.loading,
    errors: state.errors,
    actions: {
      selectStation: actions.selectStation,
      setFilter: actions.setKitchenFilter,
      setSort: actions.setKitchenSort,
      refresh: actions.refreshKDSQueue,
      optimisticUpdate: actions.optimisticUpdateKDSRouting,
    },
  }
}

export function useAnalyticsState() {
  const { state, actions } = useRestaurantState()
  return {
    dateRange: state.analyticsView.dateRange,
    selectedMetrics: state.analyticsView.selectedMetrics,
    refreshInterval: state.analyticsView.refreshInterval,
    orders: state.orders,
    kdsQueue: state.kdsQueue,
    tables: state.tables,
    connectionStatus: state.connectionStatus,
    loading: state.loading,
    actions: {
      setDateRange: actions.setAnalyticsDateRange,
      setMetrics: actions.setAnalyticsMetrics,
      refresh: actions.refreshAll,
    },
  }
}
