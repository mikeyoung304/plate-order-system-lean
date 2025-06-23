import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { getRealtimeManager } from '@/lib/realtime/session-aware-subscriptions'
import type { Table } from '@/lib/floor-plan-utils'

const supabase = createClient()
import type { User } from '@supabase/supabase-js'

interface Resident {
  id: string
  name: string
  email?: string
  dietary_restrictions?: string
}

interface Order {
  id: string
  table_id: string
  seat_id: string
  items: string[]
  status: string
  created_at: string
}

interface OrderSuggestion {
  items: string[]
  description: string
}

interface ServerPageData {
  tables: Table[]
  residents: Resident[]
  recentOrders: Order[]
  orderSuggestions: OrderSuggestion[]
  user: User | null
  loading: boolean
  error: string | null
}

export function useServerPageData(floorPlanId: string = 'default') {
  const [data, setData] = useState<ServerPageData>({
    tables: [],
    residents: [],
    recentOrders: [],
    orderSuggestions: [],
    user: null,
    loading: true,
    error: null,
  })

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Get user session
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Load all data in parallel
      const [tablesResult, residentsResult, ordersResult] = await Promise.all([
        supabase.from('tables').select('*').order('label'),
        supabase.from('profiles').select('*').eq('role', 'resident'),
        supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      if (tablesResult.error) {
        throw tablesResult.error
      }
      if (residentsResult.error) {
        throw residentsResult.error
      }
      if (ordersResult.error) {
        throw ordersResult.error
      }

      // Transform tables data to frontend format
      const tables = (tablesResult.data || []).map(
        (table: any): Table => ({
          id: table.id,
          label: table.label?.toString() || `Table ${table.id}`,
          status: (table.status || 'available') as
            | 'available'
            | 'occupied'
            | 'reserved',
          seats: 4, // Default seat count, will be calculated from seats table
          x: table.position_x || 0,
          y: table.position_y || 0,
          width: table.width || 100,
          height: table.height || 100,
          type: (table.type || 'circle') as 'circle' | 'rectangle' | 'square',
          rotation: table.rotation || 0,
          zIndex: 1,
        })
      )

      setData({
        tables,
        residents: residentsResult.data || [],
        recentOrders: ordersResult.data || [],
        orderSuggestions: [], // Will be loaded separately based on selections
        user,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('Failed to load server page data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }))
    }
  }, [floorPlanId])

  // Load order suggestions for specific resident/table
  const loadOrderSuggestions = useCallback(
    async (residentId: string, tableId?: string) => {
      try {
        // Simple time-based suggestions
        const hour = new Date().getHours()
        const suggestions: OrderSuggestion[] = []

        if (hour < 11) {
          suggestions.push({
            items: ['Fresh Fruit Bowl', 'Greek Yogurt', 'Whole Grain Toast'],
            description: 'Breakfast favorites',
          })
        } else if (hour < 16) {
          suggestions.push({
            items: ['Garden Salad', 'Grilled Chicken', 'Sparkling Water'],
            description: 'Lunch specials',
          })
        } else {
          suggestions.push({
            items: ['Beef Stew', 'Mashed Potatoes', 'Green Beans'],
            description: 'Dinner favorites',
          })
        }

        setData(prev => ({ ...prev, orderSuggestions: suggestions }))
      } catch (error) {
        console.error('Failed to load order suggestions:', error)
      }
    },
    []
  )

  // Refresh specific data
  const refreshTables = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('label')
      if (error) {
        throw error
      }
      const tables = (data || []).map(
        (table: any): Table => ({
          id: table.id,
          label: table.label?.toString() || `Table ${table.id}`,
          status: (table.status || 'available') as
            | 'available'
            | 'occupied'
            | 'reserved',
          seats: 4, // Default seat count, will be calculated from seats table
          x: table.position_x || 0,
          y: table.position_y || 0,
          width: table.width || 100,
          height: table.height || 100,
          type: (table.type || 'circle') as 'circle' | 'rectangle' | 'square',
          rotation: table.rotation || 0,
          zIndex: 1,
        })
      )
      setData(prev => ({ ...prev, tables }))
    } catch (error) {
      console.error('Error refreshing tables:', error)
    }
  }, [])

  const refreshRecentOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) {
        throw error
      }
      setData(prev => ({ ...prev, recentOrders: data || [] }))
    } catch (error) {
      console.error('Error refreshing recent orders:', error)
    }
  }, [])

  // Set up real-time subscriptions with session awareness
  useEffect(() => {
    loadData()

    const realtimeManager = getRealtimeManager()
    let tablesSubscriptionId: string | null = null
    let ordersSubscriptionId: string | null = null

    const setupSubscriptions = async () => {
      try {
        // Subscribe to table changes
        tablesSubscriptionId = await realtimeManager.subscribe({
          table: 'tables',
          event: '*',
          onData: () => {
            refreshTables()
          },
          onError: (error) => {
            console.error('❌ [ServerPageData] Tables real-time error:', error)
            setData(prev => ({ ...prev, error: `Real-time error: ${error.message}` }))
          }
        })

        // Subscribe to order changes
        ordersSubscriptionId = await realtimeManager.subscribe({
          table: 'orders',
          event: '*',
          onData: () => {
            refreshRecentOrders()
          },
          onError: (error) => {
            console.error('❌ [ServerPageData] Orders real-time error:', error)
          }
        })
      } catch (error) {
        console.error('Failed to setup real-time subscriptions:', error)
        setData(prev => ({ 
          ...prev, 
          error: `Failed to connect to real-time updates: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }))
      }
    }

    setupSubscriptions()

    return () => {
      if (tablesSubscriptionId) {
        realtimeManager.unsubscribe(tablesSubscriptionId).catch(error =>
          console.error('Error unsubscribing tables:', error)
        )
      }
      if (ordersSubscriptionId) {
        realtimeManager.unsubscribe(ordersSubscriptionId).catch(error =>
          console.error('Error unsubscribing orders:', error)
        )
      }
    }
  }, [loadData, refreshTables, refreshRecentOrders])

  return {
    ...data,
    loadOrderSuggestions,
    refreshTables,
    refreshRecentOrders,
    reload: loadData,
  }
}
