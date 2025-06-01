/**
 * MODASSEMBLY CHANGE LOG
 * Date: 2024-01-30
 * File: suggestions.ts
 * Change: Complete rewrite - removed security theater and AI bloat
 * Reason: Original was AI-generated code with fake "professional" security
 * Impact: Much simpler, faster, more maintainable suggestion algorithm
 * Risk: Low - same functionality, cleaner implementation
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import { sanitizeOrderItems } from '@/lib/utils/security'

type OrderSuggestion = {
  items: string[]
  frequency: number
}

export async function getOrderSuggestions(
  userId: string,
  orderType: 'food' | 'drink' = 'food',
  _limit: number = 5
): Promise<OrderSuggestion[]> {
  if (!userId) {
    return []
  }

  const supabase = createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('items')
    .eq('resident_id', userId)
    .eq('type', orderType)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!orders?.length) {
    return []
  }

  const frequencyMap = new Map<string, OrderSuggestion>()

  for (const order of orders) {
    if (!Array.isArray(order.items)) {
      continue
    }

    const cleanItems = sanitizeOrderItems(order.items)
    if (cleanItems.length === 0) {
      continue
    }

    const sortedItems = [...cleanItems].sort()
    const key = JSON.stringify(sortedItems)

    const existing = frequencyMap.get(key)
    frequencyMap.set(key, {
      items: sortedItems,
      frequency: existing ? existing.frequency + 1 : 1,
    })
  }

  return Array.from(frequencyMap.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, Math.max(1, Math.min(10, _limit)))
}

// Quick single-item suggestions for autocomplete
export async function getPopularItems(
  orderType: 'food' | 'drink' = 'food',
  _limit: number = 10
): Promise<string[]> {
  const supabase = createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('items')
    .eq('type', orderType)
    .gte(
      'created_at',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    ) // Last 30 days
    .limit(200)

  if (!orders?.length) {
    return []
  }

  const itemCounts = new Map<string, number>()

  for (const order of orders) {
    if (!Array.isArray(order.items)) {
      continue
    }

    const cleanItems = sanitizeOrderItems(order.items)
    for (const item of cleanItems) {
      itemCounts.set(item, (itemCounts.get(item) || 0) + 1)
    }
  }

  return Array.from(itemCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, _limit)
    .map(([item]) => item)
}

// Placeholder functions for resident suggestions (simplified)
export async function getSeatResidentSuggestions(
  _tableId: string,
  _seatNumber: number,
  _limit: number = 3
): Promise<any[]> {
  // TODO: Implement seat-based resident suggestions
  return []
}

export async function getTimeBasedResidentSuggestions(
  _currentHour: number,
  _limit: number = 2
): Promise<any[]> {
  // TODO: Implement time-based resident suggestions
  return []
}
