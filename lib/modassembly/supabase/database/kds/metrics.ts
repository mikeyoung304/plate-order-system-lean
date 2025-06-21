import { createClient } from '@/lib/modassembly/supabase/client'
import { measureApiCall } from '@/lib/performance-utils'
import type { KDSConfiguration, KDSMetric, StationPerformance } from './types'

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
 * Calculate average prep times for AI prediction
 */
export async function calculateAveragePrepTimes(
  stationId: string,
  days: number = 7
): Promise<number> {
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

  if (!data || data.length === 0) {
    return 300 // Default 5 minutes
  }

  const total = data.reduce(
    (sum, metric) => sum + (metric.value_seconds || 0),
    0
  )
  return Math.round(total / data.length)
}

/**
 * Get comprehensive station performance analytics
 */
export async function getStationPerformanceAnalytics(
  stationId: string,
  days: number = 7
): Promise<StationPerformance> {
  return measureApiCall('get_station_performance_analytics', async () => {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get station basic info
    const { data: station, error: stationError } = await supabase
      .from('kds_stations')
      .select('id, name')
      .eq('id', stationId)
      .single()

    if (stationError || !station) {
      throw new Error('Station not found')
    }

    // Get prep time metrics
    const avgPrepTime = await calculateAveragePrepTimes(stationId, days)

    // Get orders completed count
    const { data: completedOrders, error: ordersError } = await supabase
      .from('kds_order_routing')
      .select('id')
      .eq('station_id', stationId)
      .not('completed_at', 'is', null)
      .gte('completed_at', startDate.toISOString())

    const ordersCompleted = completedOrders?.length || 0

    // Get current active orders (load)
    const { data: activeOrders, error: activeError } = await supabase
      .from('kds_order_routing')
      .select('id')
      .eq('station_id', stationId)
      .is('completed_at', null)

    const currentLoad = activeOrders?.length || 0

    // Calculate efficiency score (orders per hour vs average prep time)
    const hoursInPeriod = days * 24
    const ordersPerHour = ordersCompleted / hoursInPeriod
    const efficiencyScore = Math.min(100, Math.max(0, 
      (ordersPerHour * 60) / (avgPrepTime / 60) * 10
    ))

    return {
      station_id: stationId,
      station_name: station.name,
      avg_prep_time: avgPrepTime,
      orders_completed: ordersCompleted,
      current_load: currentLoad,
      efficiency_score: Math.round(efficiencyScore)
    }
  })
}

/**
 * Record a new metric for a station
 */
export async function recordStationMetric(
  stationId: string,
  metricType: string,
  valueSeconds?: number,
  valueNumber?: number,
  valueText?: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('kds_metrics').insert({
    station_id: stationId,
    metric_type: metricType,
    value_seconds: valueSeconds || null,
    value_number: valueNumber || null,
    value_text: valueText || null,
    recorded_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Error recording station metric:', error)
    throw error
  }
}

/**
 * Get system-wide KDS performance metrics
 */
export async function getSystemPerformanceMetrics(days: number = 7): Promise<{
  totalOrders: number
  avgPrepTime: number
  completionRate: number
  peakHours: string[]
  topPerformingStations: string[]
}> {
  return measureApiCall('get_system_performance_metrics', async () => {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get total orders in period
    const { data: totalOrdersData, error: totalError } = await supabase
      .from('kds_order_routing')
      .select('id')
      .gte('routed_at', startDate.toISOString())

    const totalOrders = totalOrdersData?.length || 0

    // Get completed orders
    const { data: completedOrdersData, error: completedError } = await supabase
      .from('kds_order_routing')
      .select('id, completed_at, routed_at')
      .not('completed_at', 'is', null)
      .gte('routed_at', startDate.toISOString())

    const completedOrders = completedOrdersData?.length || 0
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

    // Calculate average prep time across all stations
    const prepTimes = completedOrdersData?.map(order => {
      if (order.completed_at && order.routed_at) {
        const routedTime = new Date(order.routed_at).getTime()
        const completedTime = new Date(order.completed_at).getTime()
        return (completedTime - routedTime) / 1000 // seconds
      }
      return 0
    }).filter(time => time > 0) || []

    const avgPrepTime = prepTimes.length > 0 
      ? prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length
      : 0

    // Analyze peak hours (simplified - would need more complex analysis in production)
    const hourCounts: { [hour: string]: number } = {}
    completedOrdersData?.forEach(order => {
      if (order.completed_at) {
        const hour = new Date(order.completed_at).getHours()
        const hourKey = `${hour}:00`
        hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1
      }
    })

    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour)

    // Get top performing stations (by completion rate)
    const { data: stationPerformance, error: stationError } = await supabase
      .from('kds_stations')
      .select(`
        id, name,
        kds_order_routing(id, completed_at)
      `)
      .eq('is_active', true)

    const topPerformingStations = stationPerformance
      ?.map(station => ({
        name: station.name,
        completionRate: station.kds_order_routing
          ? (station.kds_order_routing.filter((r: any) => r.completed_at).length / 
             station.kds_order_routing.length) * 100
          : 0
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3)
      .map(station => station.name) || []

    return {
      totalOrders,
      avgPrepTime: Math.round(avgPrepTime),
      completionRate: Math.round(completionRate),
      peakHours,
      topPerformingStations
    }
  })
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
export async function updateKDSConfiguration(
  key: string,
  value: any
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('kds_configuration').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Error updating KDS configuration:', error)
    throw error
  }
}