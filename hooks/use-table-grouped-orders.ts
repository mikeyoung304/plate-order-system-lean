'use client'

import { useMemo } from 'react'
import type { KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds'

export interface TableGroup {
  tableId: string
  tableLabel: string
  orders: KDSOrderRouting[]
  earliestOrderTime: Date
  latestOrderTime: Date
  totalItems: number
  seatCount: number
  // Timing and status
  overallStatus: 'new' | 'preparing' | 'mixed' | 'ready'
  isOverdue: boolean
  maxElapsedTime: number
  // Priority
  maxPriority: number
  hasRecalls: boolean
  totalRecallCount: number
}

export function useTableGroupedOrders(orders: KDSOrderRouting[]): TableGroup[] {
  return useMemo(() => {
    if (!orders || orders.length === 0) {
      return []
    }

    const tableGroups = new Map<string, KDSOrderRouting[]>()

    for (const order of orders) {
      const tableId = order.order?.table_id
      if (!tableId) continue

      let tableOrders = tableGroups.get(tableId)
      if (!tableOrders) {
        tableOrders = []
        tableGroups.set(tableId, tableOrders)
      }
      tableOrders.push(order)
    }

    const groups: TableGroup[] = []

    for (const [tableId, tableOrders] of tableGroups.entries()) {
      if (tableOrders.length === 0) continue

      const sortedOrders = [...tableOrders].sort((a, b) => {
        const timeA = new Date(a.routed_at).getTime()
        const timeB = new Date(b.routed_at).getTime()
        return timeA - timeB
      })

      const earliestOrderTime = new Date(sortedOrders[0].routed_at)
      const latestOrderTime = new Date(
        sortedOrders[sortedOrders.length - 1].routed_at
      )

      let totalItems = 0
      for (const order of sortedOrders) {
        totalItems += order.order?.items?.length ?? 0
      }

      const uniqueSeats = new Set<string>()
      for (const order of sortedOrders) {
        const seatId = order.order?.seat_id
        if (seatId) {
          uniqueSeats.add(seatId)
        }
      }
      const seatCount = uniqueSeats.size

      let newCount = 0
      let preparingCount = 0
      let readyCount = 0

      for (const order of sortedOrders) {
        if (order.completed_at) {
          readyCount++
        } else if (order.started_at) {
          preparingCount++
        } else {
          newCount++
        }
      }

      const totalCount = sortedOrders.length
      let overallStatus: TableGroup['overallStatus'] = 'new'

      if (readyCount === totalCount) {
        overallStatus = 'ready'
      } else if (newCount === 0) {
        overallStatus = 'preparing'
      } else if (preparingCount > 0 || readyCount > 0) {
        overallStatus = 'mixed'
      }

      const now = Date.now()
      let maxElapsedTime = 0

      for (const order of sortedOrders) {
        const startTime = order.started_at
          ? new Date(order.started_at).getTime()
          : new Date(order.routed_at).getTime()
        const elapsed = Math.floor((now - startTime) / 1000)
        if (elapsed > maxElapsedTime) {
          maxElapsedTime = elapsed
        }
      }

      const isOverdue = maxElapsedTime > 600

      let maxPriority = 0
      for (const order of sortedOrders) {
        const priority = order.priority ?? 0
        if (priority > maxPriority) {
          maxPriority = priority
        }
      }

      let hasRecalls = false
      let totalRecallCount = 0

      for (const order of sortedOrders) {
        const recallCount = order.recall_count ?? 0
        if (recallCount > 0) {
          hasRecalls = true
          totalRecallCount += recallCount
        }
      }

      const tableLabel =
        sortedOrders[0].order?.table?.label || `Table ${tableId.slice(-6)}`

      groups.push({
        tableId,
        tableLabel,
        orders: sortedOrders,
        earliestOrderTime,
        latestOrderTime,
        totalItems,
        seatCount,
        overallStatus,
        isOverdue,
        maxElapsedTime,
        maxPriority,
        hasRecalls,
        totalRecallCount,
      })
    }

    groups.sort(
      (a, b) => a.earliestOrderTime.getTime() - b.earliestOrderTime.getTime()
    )

    return groups
  }, [orders])
}

export function useTableGroupTiming(group: TableGroup) {
  const colorStatus = useMemo(() => {
    if (group.maxElapsedTime <= 300) return 'green'
    if (group.maxElapsedTime <= 600) return 'yellow'
    return 'red'
  }, [group.maxElapsedTime])

  const colors = useMemo(() => {
    const colorMap = {
      green: {
        border: 'border-green-500',
        bg: 'bg-green-50 dark:bg-green-950',
        header: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-700 dark:text-green-300',
        badge:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      yellow: {
        border: 'border-yellow-500',
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        header: 'bg-yellow-100 dark:bg-yellow-900',
        text: 'text-yellow-700 dark:text-yellow-300',
        badge:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
      red: {
        border: 'border-red-500',
        bg: 'bg-red-50 dark:bg-red-950',
        header: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-700 dark:text-red-300',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      },
    } as const

    return colorMap[colorStatus]
  }, [colorStatus])

  return {
    colorStatus,
    colors,
  }
}
