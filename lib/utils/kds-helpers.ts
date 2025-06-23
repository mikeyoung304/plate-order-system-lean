/**
 * KDS-specific utility functions
 * Shared across KDS components to eliminate duplication
 */

import type { KDSOrderRouting } from '@/types/restaurant'

/**
 * Get KDS order status from routing information
 * This is different from regular order status - it's based on KDS workflow
 */
export function getKDSOrderStatus(order: Partial<KDSOrderRouting>): 'new' | 'preparing' | 'ready' {
  if (order.completed_at) return 'ready'
  if (order.started_at) return 'preparing'
  return 'new'
}

/**
 * Get status color for KDS display
 */
export function getKDSStatusColor(status: 'new' | 'preparing' | 'ready'): string {
  const colorMap = {
    new: 'blue',
    preparing: 'yellow',
    ready: 'green'
  }
  return colorMap[status] || 'gray'
}

/**
 * Calculate elapsed time for KDS order
 */
export function getKDSElapsedTime(order: Partial<KDSOrderRouting>): number {
  const startTime = order.started_at || order.routed_at
  if (!startTime) return 0
  
  const endTime = order.completed_at || new Date().toISOString()
  return Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000)
}

/**
 * Format time for KDS display (MM:SS)
 */
export function formatKDSTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Check if order is overdue based on station type
 */
export function isKDSOrderOverdue(order: Partial<KDSOrderRouting>, stationType?: string): boolean {
  const elapsedMinutes = getKDSElapsedTime(order) / 60
  
  // Different thresholds for different stations
  const thresholds = {
    grill: 12,
    fryer: 8,
    salad: 5,
    expo: 15,
    bar: 10
  }
  
  const threshold = stationType && stationType in thresholds 
    ? thresholds[stationType as keyof typeof thresholds]
    : 10 // default
    
  return elapsedMinutes > threshold
}

/**
 * Get priority for KDS order display
 */
export function getKDSPriority(order: Partial<KDSOrderRouting>): number {
  let priority = order.priority || 50
  
  // Increase priority for overdue orders
  if (isKDSOrderOverdue(order)) {
    priority += 20
  }
  
  // Increase priority for orders that have been started
  if (order.started_at) {
    priority += 10
  }
  
  return Math.min(priority, 100) // Cap at 100
}

/**
 * Sort KDS orders by priority and time
 */
export function sortKDSOrders<T extends Partial<KDSOrderRouting>>(orders: T[]): T[] {
  return [...orders].sort((a, b) => {
    // First sort by priority (higher priority first)
    const priorityDiff = getKDSPriority(b) - getKDSPriority(a)
    if (priorityDiff !== 0) return priorityDiff
    
    // Then by routed time (older first)
    const timeA = new Date(a.routed_at || 0).getTime()
    const timeB = new Date(b.routed_at || 0).getTime()
    return timeA - timeB
  })
}