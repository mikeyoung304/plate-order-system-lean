import { createClient } from '@/lib/modassembly/supabase/client'
import { measureApiCall } from '@/lib/performance-utils'
import type { KDSOrderRouting, TableSummary } from './types'

/**
 * Group orders by table for KDS display
 */
export function groupOrdersByTable(orders: KDSOrderRouting[]): Map<string, KDSOrderRouting[]> {
  const groupedOrders = new Map<string, KDSOrderRouting[]>()
  
  orders.forEach(order => {
    if (order.order?.table?.id) {
      const tableId = order.order.table.id
      const existingOrders = groupedOrders.get(tableId) || []
      existingOrders.push(order)
      groupedOrders.set(tableId, existingOrders)
    }
  })
  
  return groupedOrders
}

/**
 * Group orders by table and seat for detailed view
 */
export function groupOrdersByTableAndSeat(orders: KDSOrderRouting[]): Map<string, Map<string, KDSOrderRouting[]>> {
  const groupedOrders = new Map<string, Map<string, KDSOrderRouting[]>>()
  
  orders.forEach(order => {
    if (order.order?.table?.id && order.order?.seat?.id) {
      const tableId = order.order.table.id
      const seatId = order.order.seat.id
      
      if (!groupedOrders.has(tableId)) {
        groupedOrders.set(tableId, new Map())
      }
      
      const tableOrders = groupedOrders.get(tableId)!
      const existingOrders = tableOrders.get(seatId) || []
      existingOrders.push(order)
      tableOrders.set(seatId, existingOrders)
    }
  })
  
  return groupedOrders
}

/**
 * Calculate table priority based on order age, item count, and special flags
 */
export function calculateTablePriority(orders: KDSOrderRouting[]): number {
  if (orders.length === 0) {return 0}
  
  let totalPriority = 0
  let totalWeight = 0
  
  orders.forEach(order => {
    const orderAge = order.order?.created_at 
      ? (Date.now() - new Date(order.order.created_at).getTime()) / (1000 * 60) // minutes
      : 0
    
    const itemCount = order.order?.items?.length || 0
    const basePriority = order.priority || 0
    
    // Age weight: orders get higher priority as they age
    const ageWeight = Math.min(orderAge / 15, 3) // Max 3x weight after 15 minutes
    
    // Item count weight: more items = higher priority
    const itemWeight = Math.min(itemCount / 5, 2) // Max 2x weight for 5+ items
    
    // Special handling for specific order types
    const typeWeight = 1
    // Note: These would need to be actual enum values from OrderType
    // For now, just use base weight for all types
    
    const orderPriority = (basePriority + 1) * (1 + ageWeight + itemWeight) * typeWeight
    
    totalPriority += orderPriority
    totalWeight += 1
  })
  
  return totalWeight > 0 ? totalPriority / totalWeight : 0
}

/**
 * Sort table groups by priority for KDS display
 */
export function sortTablesByPriority(groupedOrders: Map<string, KDSOrderRouting[]>): Array<[string, KDSOrderRouting[]]> {
  const tablesWithPriority = Array.from(groupedOrders.entries()).map(([tableId, orders]) => ({
    tableId,
    orders,
    priority: calculateTablePriority(orders),
    oldestOrder: orders.reduce((oldest, current) => {
      const currentTime = current.order?.created_at ? new Date(current.order.created_at).getTime() : 0
      const oldestTime = oldest.order?.created_at ? new Date(oldest.order.created_at).getTime() : 0
      return currentTime < oldestTime ? current : oldest
    }, orders[0])
  }))
  
  // Sort by priority (descending), then by oldest order time (ascending)
  tablesWithPriority.sort((a, b) => {
    if (Math.abs(a.priority - b.priority) < 0.1) {
      // If priorities are very close, sort by oldest order time
      const aTime = a.oldestOrder?.order?.created_at ? new Date(a.oldestOrder.order.created_at).getTime() : 0
      const bTime = b.oldestOrder?.order?.created_at ? new Date(b.oldestOrder.order.created_at).getTime() : 0
      return aTime - bTime
    }
    return b.priority - a.priority
  })
  
  return tablesWithPriority.map(({ tableId, orders }) => [tableId, orders])
}

/**
 * Generate table summary for KDS dashboard
 */
export function generateTableSummary(orders: KDSOrderRouting[]): TableSummary {
  if (orders.length === 0) {
    return {
      table_id: '',
      table_label: '',
      active_orders: 0,
      total_items: 0,
      avg_wait_time: 0,
      status: 'waiting'
    }
  }
  
  const firstOrder = orders[0]
  const tableId = firstOrder.order?.table?.id || ''
  const tableLabel = firstOrder.order?.table?.label || ''
  
  const activeOrders = orders.filter(order => !order.completed_at).length
  const totalItems = orders.reduce((sum, order) => sum + (order.order?.items?.length || 0), 0)
  
  // Calculate average wait time
  const now = Date.now()
  const waitTimes = orders
    .filter(order => order.order?.created_at)
    .map(order => (now - new Date(order.order!.created_at).getTime()) / (1000 * 60)) // minutes
  
  const avgWaitTime = waitTimes.length > 0 
    ? Math.round(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length)
    : 0
  
  // Determine status
  let status: 'waiting' | 'preparing' | 'ready' | 'served' = 'waiting'
  
  const completedOrders = orders.filter(order => order.completed_at).length
  const startedOrders = orders.filter(order => order.started_at && !order.completed_at).length
  
  if (completedOrders === orders.length) {
    status = 'ready'
  } else if (startedOrders > 0) {
    status = 'preparing'
  } else {
    status = 'waiting'
  }
  
  return {
    table_id: tableId,
    table_label: tableLabel,
    active_orders: activeOrders,
    total_items: totalItems,
    avg_wait_time: avgWaitTime,
    status
  }
}

/**
 * Fetch table summary for KDS display (secure)
 */
export async function fetchKDSTableSummary(): Promise<TableSummary[]> {
  return measureApiCall('fetch_kds_table_summary', async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('kds_table_summary')
      .select('*')
      .limit(100) // Security: Limit results

    if (error) {
      console.error('Error fetching KDS table summary:', error)
      throw error
    }

    return data || []
  })
}

/**
 * Get enhanced table grouping with summary data
 */
export function getEnhancedTableGrouping(orders: KDSOrderRouting[]): Array<{
  tableId: string
  orders: KDSOrderRouting[]
  summary: TableSummary
  priority: number
}> {
  const groupedOrders = groupOrdersByTable(orders)
  const sortedTables = sortTablesByPriority(groupedOrders)
  
  return sortedTables.map(([tableId, tableOrders]) => ({
    tableId,
    orders: tableOrders,
    summary: generateTableSummary(tableOrders),
    priority: calculateTablePriority(tableOrders)
  }))
}

/**
 * Filter orders by table status for KDS views
 */
export function filterOrdersByTableStatus(
  orders: KDSOrderRouting[], 
  status: 'waiting' | 'preparing' | 'ready' | 'all'
): KDSOrderRouting[] {
  if (status === 'all') {return orders}
  
  const groupedOrders = groupOrdersByTable(orders)
  const filteredOrders: KDSOrderRouting[] = []
  
  groupedOrders.forEach((tableOrders) => {
    const tableSummary = generateTableSummary(tableOrders)
    if (tableSummary.status === status) {
      filteredOrders.push(...tableOrders)
    }
  })
  
  return filteredOrders
}

/**
 * Get orders that need attention (high priority, overdue, etc.)
 */
export function getOrdersNeedingAttention(orders: KDSOrderRouting[]): KDSOrderRouting[] {
  const now = Date.now()
  const OVERDUE_THRESHOLD = 20 * 60 * 1000 // 20 minutes in milliseconds
  const HIGH_PRIORITY_THRESHOLD = 5
  
  return orders.filter(order => {
    // Check if order is overdue
    const orderTime = order.order?.created_at ? new Date(order.order.created_at).getTime() : 0
    const isOverdue = orderTime > 0 && (now - orderTime) > OVERDUE_THRESHOLD
    
    // Check if order has high priority
    const hasHighPriority = (order.priority || 0) >= HIGH_PRIORITY_THRESHOLD
    
    // Check if order has been recalled multiple times
    const hasMultipleRecalls = (order.recall_count || 0) >= 2
    
    return isOverdue || hasHighPriority || hasMultipleRecalls
  })
}