/**
 * Shared utility functions for order operations
 * Eliminates code duplication across components
 */

import type { OrderStatus } from '@/types/restaurant'

/**
 * Get human-readable order status label
 */
export function getOrderStatus(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    new: 'New',
    in_progress: 'In Progress',
    ready: 'Ready',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }
  
  return statusMap[status] || 'Unknown'
}

/**
 * Get order status color for UI display
 */
export function getOrderStatusColor(status: OrderStatus): string {
  const colorMap: Record<OrderStatus, string> = {
    new: 'blue',
    in_progress: 'yellow',
    ready: 'green',
    delivered: 'gray',
    cancelled: 'red'
  }
  
  return colorMap[status] || 'gray'
}

/**
 * Calculate order age in human-readable format
 */
export function getOrderAge(createdAt: string | Date): string {
  const now = new Date()
  const created = new Date(createdAt)
  const ageInMinutes = Math.floor((now.getTime() - created.getTime()) / 60000)
  
  if (ageInMinutes < 1) return 'Just now'
  if (ageInMinutes === 1) return '1 minute'
  if (ageInMinutes < 60) return `${ageInMinutes} minutes`
  
  const hours = Math.floor(ageInMinutes / 60)
  if (hours === 1) return '1 hour'
  return `${hours} hours`
}

/**
 * Get priority level for order based on age and status
 */
export function getOrderPriority(createdAt: string | Date, status: OrderStatus): 'low' | 'medium' | 'high' | 'urgent' {
  const ageInMinutes = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 60000)
  
  if (status === 'cancelled' || status === 'delivered') return 'low'
  
  if (ageInMinutes > 30) return 'urgent'
  if (ageInMinutes > 20) return 'high'
  if (ageInMinutes > 10) return 'medium'
  return 'low'
}

/**
 * Format order total for display
 */
export function formatOrderTotal(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

/**
 * Check if order is active (not completed or cancelled)
 */
export function isOrderActive(status: OrderStatus): boolean {
  return status !== 'delivered' && status !== 'cancelled'
}

/**
 * Sort orders by priority (urgent first, then by age)
 */
export function sortOrdersByPriority<T extends { created_at: string; status: OrderStatus }>(orders: T[]): T[] {
  return [...orders].sort((a, b) => {
    const priorityA = getOrderPriority(a.created_at, a.status)
    const priorityB = getOrderPriority(b.created_at, b.status)
    
    const priorityWeight = { urgent: 0, high: 1, medium: 2, low: 3 }
    
    if (priorityWeight[priorityA] !== priorityWeight[priorityB]) {
      return priorityWeight[priorityA] - priorityWeight[priorityB]
    }
    
    // If same priority, sort by age (older first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}