import { createClient } from '@/lib/modassembly/supabase/client'

// Types for KDS system
export interface KDSStation {
  id: string
  name: string
  type: 'grill' | 'fryer' | 'salad' | 'expo' | 'bar' | 'prep' | 'dessert'
  position: number
  color: string
  is_active: boolean
  settings: {
    auto_bump_time?: number
    max_orders?: number
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

export interface KDSOrderRouting {
  id: string
  order_id: string
  station_id: string
  sequence: number
  routed_at: string
  started_at?: string
  completed_at?: string
  bumped_by?: string
  bumped_at?: string
  recalled_at?: string
  recall_count: number
  estimated_prep_time?: number
  actual_prep_time?: number
  notes?: string
  priority: number
  created_at: string
  updated_at: string
  
  // Joined data
  order?: {
    id: string
    table_id: string
    seat_id: string
    resident_id: string
    server_id: string
    items: any[]
    transcript?: string
    status: string
    type: 'food' | 'beverage'
    created_at: string
    resident?: {
      name: string
    }
    server?: {
      name: string
    }
    table?: {
      label: string
    }
  }
  station?: KDSStation
}

export interface KDSMetric {
  id: string
  station_id: string
  order_id: string
  metric_type: 'prep_time' | 'wait_time' | 'bump_time' | 'throughput'
  value_seconds?: number
  value_count?: number
  recorded_at: string
  shift_date: string
  hour_of_day: number
}

export interface KDSConfiguration {
  id: string
  key: string
  value: any
  description?: string
  created_at: string
  updated_at: string
}

/**
 * Fetch all active KDS stations
 */
export async function fetchKDSStations(): Promise<KDSStation[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('kds_stations')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })
  
  if (error) {
    console.error('Error fetching KDS stations:', error)
    throw error
  }
  
  return data || []
}

/**
 * Fetch orders for a specific station with real-time updates
 */
export async function fetchStationOrders(stationId: string): Promise<KDSOrderRouting[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('kds_order_routing')
    .select(`
      *,
      order:orders!inner (
        *,
        resident:profiles!resident_id (name),
        server:profiles!server_id (name),
        table:tables!table_id (label)
      ),
      station:kds_stations!station_id (*)
    `)
    .eq('station_id', stationId)
    .is('completed_at', null) // Only show uncompleted orders
    .order('routed_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching station orders:', error)
    throw error
  }
  
  return data || []
}

/**
 * Fetch all active orders across all stations
 */
export async function fetchAllActiveOrders(): Promise<KDSOrderRouting[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('kds_order_routing')
    .select(`
      *,
      order:orders!inner (
        *,
        resident:profiles!resident_id (name),
        server:profiles!server_id (name),
        table:tables!table_id (label)
      ),
      station:kds_stations!station_id (*)
    `)
    .is('completed_at', null)
    .order('routed_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching all active orders:', error)
    throw error
  }
  
  return data || []
}

/**
 * Mark an order as ready/completed at a station (bump functionality)
 */
export async function bumpOrder(routingId: string, userId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('kds_order_routing')
    .update({
      completed_at: new Date().toISOString(),
      bumped_by: userId,
      bumped_at: new Date().toISOString()
    })
    .eq('id', routingId)
  
  if (error) {
    console.error('Error bumping order:', error)
    throw error
  }
}

/**
 * Recall a bumped order (undo bump)
 */
export async function recallOrder(routingId: string): Promise<void> {
  const supabase = await createClient()
  
  // First get current recall count
  const { data: currentData, error: fetchError } = await supabase
    .from('kds_order_routing')
    .select('recall_count')
    .eq('id', routingId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching order for recall:', fetchError)
    throw fetchError
  }
  
  const { error } = await supabase
    .from('kds_order_routing')
    .update({
      completed_at: null,
      bumped_by: null,
      bumped_at: null,
      recalled_at: new Date().toISOString(),
      recall_count: (currentData?.recall_count || 0) + 1
    })
    .eq('id', routingId)
  
  if (error) {
    console.error('Error recalling order:', error)
    throw error
  }
}

/**
 * Start preparation for an order
 */
export async function startOrderPrep(routingId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('kds_order_routing')
    .update({
      started_at: new Date().toISOString()
    })
    .eq('id', routingId)
  
  if (error) {
    console.error('Error starting order prep:', error)
    throw error
  }
}

/**
 * Update order priority
 */
export async function updateOrderPriority(routingId: string, priority: number): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('kds_order_routing')
    .update({ priority })
    .eq('id', routingId)
  
  if (error) {
    console.error('Error updating order priority:', error)
    throw error
  }
}

/**
 * Add notes to an order at a station
 */
export async function addOrderNotes(routingId: string, notes: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('kds_order_routing')
    .update({ notes })
    .eq('id', routingId)
  
  if (error) {
    console.error('Error adding order notes:', error)
    throw error
  }
}

/**
 * Fetch station performance metrics
 */
export async function fetchStationMetrics(
  stationId: string, 
  startDate: string, 
  endDate: string
): Promise<KDSMetric[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('kds_metrics')
    .select('*')
    .eq('station_id', stationId)
    .gte('recorded_at', startDate)
    .lte('recorded_at', endDate)
    .order('recorded_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching station metrics:', error)
    throw error
  }
  
  return data || []
}

/**
 * Fetch KDS configuration
 */
export async function fetchKDSConfiguration(): Promise<Record<string, any>> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('kds_configuration')
    .select('key, value')
  
  if (error) {
    console.error('Error fetching KDS configuration:', error)
    throw error
  }
  
  // Convert array to object
  const config: Record<string, any> = {}
  data?.forEach(item => {
    config[item.key] = item.value
  })
  
  return config
}

/**
 * Update KDS configuration
 */
export async function updateKDSConfiguration(key: string, value: any): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('kds_configuration')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Error updating KDS configuration:', error)
    throw error
  }
}

/**
 * Create a new KDS station
 */
export async function createKDSStation(station: Omit<KDSStation, 'id' | 'created_at' | 'updated_at'>): Promise<KDSStation> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('kds_stations')
    .insert(station)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating KDS station:', error)
    throw error
  }
  
  return data
}

/**
 * Update a KDS station
 */
export async function updateKDSStation(stationId: string, updates: Partial<KDSStation>): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('kds_stations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', stationId)
  
  if (error) {
    console.error('Error updating KDS station:', error)
    throw error
  }
}

/**
 * Route an order to a specific station manually
 */
export async function routeOrderToStation(
  orderId: string, 
  stationId: string, 
  sequence: number = 1,
  priority: number = 0
): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('kds_order_routing')
    .insert({
      order_id: orderId,
      station_id: stationId,
      sequence,
      priority
    })
  
  if (error) {
    console.error('Error routing order to station:', error)
    throw error
  }
}

/**
 * Calculate average prep times for AI prediction
 */
export async function calculateAveragePrepTimes(stationId: string, days: number = 7): Promise<number> {
  const supabase = await createClient()
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('kds_metrics')
    .select('value_seconds')
    .eq('station_id', stationId)
    .eq('metric_type', 'prep_time')
    .gte('recorded_at', startDate.toISOString())
    .not('value_seconds', 'is', null)
  
  if (error) {
    console.error('Error calculating average prep times:', error)
    throw error
  }
  
  if (!data || data.length === 0) return 300 // Default 5 minutes
  
  const total = data.reduce((sum, metric) => sum + (metric.value_seconds || 0), 0)
  return Math.round(total / data.length)
}

/**
 * Bulk bump all orders for a table
 */
export async function bulkBumpTableOrders(tableId: string, userId: string): Promise<number> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .rpc('bulk_bump_table_orders', {
      p_table_id: tableId,
      p_user_id: userId
    })
  
  if (error) {
    console.error('Error bulk bumping table orders:', error)
    throw error
  }
  
  return data || 0
}

/**
 * Fetch table summary for KDS display
 */
export async function fetchKDSTableSummary(): Promise<any[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('kds_table_summary')
    .select('*')
  
  if (error) {
    console.error('Error fetching KDS table summary:', error)
    throw error
  }
  
  return data || []
}