import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'

const supabase = createClient()
import type { User } from '@supabase/supabase-js'

interface Table {
  id: string
  label: string
  status: string
  seats: number
  x: number
  y: number
  width: number
  height: number
  type: string
}

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
  confidence: number
  reasoning: string
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

export function useServerPageData(floorPlanId: string = "default") {
  const [data, setData] = useState<ServerPageData>({
    tables: [],
    residents: [],
    recentOrders: [],
    orderSuggestions: [],
    user: null,
    loading: true,
    error: null
  })

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Get user session
      const { data: { user } } = await supabase.auth.getUser()
      
      // Load all data in parallel
      const [tablesResult, residentsResult, ordersResult] = await Promise.all([
        supabase.from('tables').select('*').eq('floor_plan_id', floorPlanId),
        supabase.from('profiles').select('*').eq('role', 'resident'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10)
      ])

      if (tablesResult.error) throw tablesResult.error
      if (residentsResult.error) throw residentsResult.error  
      if (ordersResult.error) throw ordersResult.error

      // Transform tables data to frontend format
      const tables = (tablesResult.data || []).map((table: any) => ({
        id: table.id,
        label: table.name || `Table ${table.id}`,
        status: table.status || 'available',
        seats: table.seat_count || 4,
        x: table.position_x || 0,
        y: table.position_y || 0,
        width: table.width || 100,
        height: table.height || 100,
        type: table.shape || 'circle'
      }))

      setData({
        tables,
        residents: residentsResult.data || [],
        recentOrders: ordersResult.data || [],
        orderSuggestions: [], // Will be loaded separately based on selections
        user,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Failed to load server page data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }))
    }
  }, [floorPlanId])

  // Load order suggestions for specific resident/table
  const loadOrderSuggestions = useCallback(async (residentId: string, tableId?: string) => {
    try {
      // Simple time-based suggestions (replace fake AI)
      const hour = new Date().getHours()
      const suggestions: OrderSuggestion[] = []

      if (hour < 11) {
        suggestions.push({
          items: ['Fresh Fruit Bowl', 'Greek Yogurt', 'Whole Grain Toast'],
          confidence: 85,
          reasoning: 'Popular breakfast items'
        })
      } else if (hour < 16) {
        suggestions.push({
          items: ['Garden Salad', 'Grilled Chicken', 'Sparkling Water'],
          confidence: 78,
          reasoning: 'Healthy lunch options'
        })
      } else {
        suggestions.push({
          items: ['Beef Stew', 'Mashed Potatoes', 'Green Beans'],
          confidence: 82,
          reasoning: 'Comfort dinner favorites'
        })
      }

      setData(prev => ({ ...prev, orderSuggestions: suggestions }))
    } catch (error) {
      console.error('Failed to load order suggestions:', error)
    }
  }, [])

  // Refresh specific data
  const refreshTables = useCallback(() => {
    supabase.from('tables').select('*').eq('floor_plan_id', floorPlanId)
      .then(({ data, error }) => {
        if (error) throw error
        const tables = (data || []).map((table: any) => ({
          id: table.id,
          label: table.name || `Table ${table.id}`,
          status: table.status || 'available',
          seats: table.seat_count || 4,
          x: table.position_x || 0,
          y: table.position_y || 0,
          width: table.width || 100,
          height: table.height || 100,
          type: table.shape || 'circle'
        }))
        setData(prev => ({ ...prev, tables }))
      })
      .catch(console.error)
  }, [floorPlanId])

  const refreshRecentOrders = useCallback(() => {
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10)
      .then(({ data, error }) => {
        if (error) throw error
        setData(prev => ({ ...prev, recentOrders: data || [] }))
      })
      .catch(console.error)
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    loadData()

    // Subscribe to table changes
    const tablesSubscription = supabase
      .channel('tables_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
        refreshTables()
      })
      .subscribe()

    // Subscribe to order changes  
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        refreshRecentOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(tablesSubscription)
      supabase.removeChannel(ordersSubscription)
    }
  }, [loadData, refreshTables, refreshRecentOrders])

  return {
    ...data,
    loadOrderSuggestions,
    refreshTables,
    refreshRecentOrders,
    reload: loadData
  }
}