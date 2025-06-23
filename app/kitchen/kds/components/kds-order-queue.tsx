'use client'

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  AlertTriangle, 
  CheckCircle, 
  ChefHat, 
  Clock, 
  Flag,
  Hash,
  Timer,
  User
} from 'lucide-react'
import { useKDSContext } from '../providers/kds-state-provider'
import { useKDSOperations } from '../hooks/use-kds-operations'
import { type KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds/types'

interface OrderQueueProps {
  className?: string
  stationId?: string
  height?: number
  itemHeight?: number
  viewMode?: 'compact' | 'detailed' | 'minimal'
  sortBy?: 'time' | 'priority' | 'table'
  filterBy?: 'all' | 'new' | 'preparing' | 'overdue'
}

interface OrderItemData {
  orders: KDSOrderRouting[]
  operations: any
  viewMode: string
  onOrderClick: (_order: KDSOrderRouting) => void
}

type OrderItemProps = ListChildComponentProps<OrderItemData>

/**
 * Individual Order Item Component
 * Memoized for performance in virtual scrolling
 */
const OrderItem = memo<OrderItemProps>(({ index, style, data }) => {
  if (!data) return null
  const { orders, operations, viewMode, onOrderClick } = data
  const order = orders[index]

  if (!order) {
    return (
      <div style={style} className="p-2">
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  // Calculate order timing
  const createdAt = new Date(order.routed_at)
  const startedAt = order.started_at ? new Date(order.started_at) : null
  const completedAt = order.completed_at ? new Date(order.completed_at) : null
  const now = new Date()

  const elapsedTime = startedAt ? 
    Math.floor((now.getTime() - startedAt.getTime()) / 1000 / 60) :
    Math.floor((now.getTime() - createdAt.getTime()) / 1000 / 60)

  const isOverdue = elapsedTime > 10 && !completedAt
  const isUrgent = (order.priority || 0) >= 8
  const isNew = !startedAt && !completedAt
  const isPreparing = startedAt && !completedAt
  const isCompleted = completedAt

  // Get status
  const getStatus = () => {
    if (isCompleted) {return { label: 'Ready', color: 'bg-green-500', icon: CheckCircle }}
    if (isPreparing) {return { label: 'Preparing', color: 'bg-blue-500', icon: ChefHat }}
    if (isNew) {return { label: 'New', color: 'bg-yellow-500', icon: Clock }}
    return { label: 'Unknown', color: 'bg-gray-500', icon: Clock }
  }

  const status = getStatus()
  const StatusIcon = status.icon

  // Get order details
  const tableLabel = order.order?.table?.label || 'No Table'
  const seatLabel = order.order?.seat?.label || 'No Seat'
  const serverName = order.order?.server?.name || 'No Server'
  const itemCount = order.order?.items?.length || 0
  const stationName = order.station?.name || 'Unknown Station'

  // Handle quick actions
  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    operations.startOrder(order.id)
  }

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    operations.completeOrder(order.id)
  }

  const handleRecall = (e: React.MouseEvent) => {
    e.stopPropagation()
    operations.recallOrder(order.id)
  }

  return (
    <div style={style} className="p-2">
      <Card 
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-md',
          'border-l-4',
          isOverdue && 'border-l-red-500 bg-red-50 dark:bg-red-950',
          isUrgent && !isOverdue && 'border-l-orange-500 bg-orange-50 dark:bg-orange-950',
          isPreparing && !isOverdue && !isUrgent && 'border-l-blue-500 bg-blue-50 dark:bg-blue-950',
          isNew && !isUrgent && 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950',
          isCompleted && 'border-l-green-500 bg-green-50 dark:bg-green-950'
        )}
        onClick={() => onOrderClick(order)}
      >
        <CardContent className="p-3">
          {viewMode === 'minimal' ? (
            /* Minimal View */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="w-4 h-4" />
                <span className="font-semibold">{tableLabel}</span>
                <span className="text-sm text-gray-500">{seatLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {elapsedTime}min
                </Badge>
                {isOverdue && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          ) : viewMode === 'compact' ? (
            /* Compact View */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', status.color)} />
                  <span className="font-semibold">{tableLabel}</span>
                  <span className="text-sm text-gray-500">{seatLabel}</span>
                  {isUrgent && <Flag className="w-3 h-3 text-orange-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Timer className="w-3 h-3 mr-1" />
                    {elapsedTime}min
                  </Badge>
                  {isOverdue && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{itemCount} items • {stationName}</span>
                <span>{serverName}</span>
              </div>
              
              <div className="flex gap-1">
                {isNew && (
                  <Button size="sm" variant="outline" onClick={handleStart}>
                    <ChefHat className="w-3 h-3 mr-1" />
                    Start
                  </Button>
                )}
                {isPreparing && (
                  <Button size="sm" variant="outline" onClick={handleComplete}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Button>
                )}
                {isCompleted && (
                  <Button size="sm" variant="outline" onClick={handleRecall}>
                    Recall
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Detailed View */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-4 h-4 rounded-full', status.color)} />
                  <div>
                    <div className="font-semibold text-lg">{tableLabel}</div>
                    <div className="text-sm text-gray-500">{seatLabel}</div>
                  </div>
                  {isUrgent && (
                    <Badge variant="destructive" className="text-xs">
                      <Flag className="w-3 h-3 mr-1" />
                      Priority {order.priority}
                    </Badge>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span className="font-semibold">{elapsedTime}min</span>
                  </div>
                  <div className="text-sm text-gray-500">{status.label}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Hash className="w-3 h-3" />
                    <span>Items</span>
                  </div>
                  <div className="font-medium">{itemCount} items</div>
                </div>
                
                <div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <User className="w-3 h-3" />
                    <span>Server</span>
                  </div>
                  <div className="font-medium">{serverName}</div>
                </div>
              </div>

              <div className="text-sm">
                <div className="text-gray-600">Station</div>
                <div className="font-medium">{stationName}</div>
              </div>

              {order.order?.special_requests && (
                <div className="text-sm">
                  <div className="text-gray-600">Special Requests</div>
                  <div className="font-medium italic">{order.order.special_requests}</div>
                </div>
              )}

              <div className="flex gap-2">
                {isNew && (
                  <Button size="sm" onClick={handleStart}>
                    <ChefHat className="w-4 h-4 mr-2" />
                    Start Preparation
                  </Button>
                )}
                {isPreparing && (
                  <Button size="sm" onClick={handleComplete}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
                {isCompleted && (
                  <Button size="sm" variant="outline" onClick={handleRecall}>
                    Recall to Kitchen
                  </Button>
                )}
              </div>

              {isOverdue && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Order is overdue</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

OrderItem.displayName = 'OrderItem'

/**
 * KDS Order Queue Component
 * 
 * High-performance order queue with virtual scrolling for handling large order lists.
 * Features:
 * - Virtual scrolling for performance with 1000+ orders
 * - Multiple view modes (minimal, compact, detailed)
 * - Real-time filtering and sorting
 * - Intersection observer for performance monitoring
 * - Memoized components for optimal re-rendering
 * - Touch-friendly mobile interface
 */
export const KDSOrderQueue = memo<OrderQueueProps>(({
  className,
  stationId,
  height = 600,
  itemHeight = 120,
  viewMode = 'compact',
  sortBy = 'time',
  filterBy = 'all'
}) => {
  const { filteredAndSortedOrders, loading, error } = useKDSContext()
  const operations = useKDSOperations()
  const [_selectedOrder, setSelectedOrder] = useState<KDSOrderRouting | null>(null)
  const listRef = useRef<any>(null)

  // Filter orders by station if specified
  const stationOrders = useMemo(() => {
    if (!stationId) {return filteredAndSortedOrders}
    
    return filteredAndSortedOrders.filter(order => 
      order.station?.id === stationId || 
      order.station?.name?.toLowerCase().includes(stationId.toLowerCase())
    )
  }, [filteredAndSortedOrders, stationId])

  // Apply additional filtering and sorting
  const processedOrders = useMemo(() => {
    let orders = [...stationOrders]

    // Apply filter
    if (filterBy !== 'all') {
      orders = orders.filter(order => {
        switch (filterBy) {
          case 'new':
            return !order.started_at && !order.completed_at
          case 'preparing':
            return order.started_at && !order.completed_at
          case 'overdue':
            const startTime = order.started_at ? 
              new Date(order.started_at).getTime() : 
              new Date(order.routed_at).getTime()
            return (Date.now() - startTime) / 1000 > 600 // Over 10 minutes
          default:
            return true
        }
      })
    }

    // Apply sorting
    orders.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (b.priority || 0) - (a.priority || 0)
        case 'table':
          const tableA = a.order?.table?.label || ''
          const tableB = b.order?.table?.label || ''
          return tableA.localeCompare(tableB)
        case 'time':
        default:
          return new Date(a.routed_at).getTime() - new Date(b.routed_at).getTime()
      }
    })

    return orders
  }, [stationOrders, filterBy, sortBy])

  // Handle order selection
  const handleOrderClick = useCallback((order: KDSOrderRouting) => {
    setSelectedOrder(order)
    operations.playOrderSound('new')
  }, [operations])

  // Scroll to top when orders change significantly
  useEffect(() => {
    if (listRef.current && processedOrders.length > 0) {
      listRef.current.scrollToItem(0, 'start')
    }
  }, [stationId, filterBy, sortBy])

  // Calculate dynamic item height based on view mode
  const getItemHeight = () => {
    switch (viewMode) {
      case 'minimal':
        return 60
      case 'compact':
        return 120
      case 'detailed':
        return 200
      default:
        return itemHeight
    }
  }

  if (loading) {
    return (
      <div className={cn('space-y-2', className)} style={{ height }}>
        {[...Array(Math.floor(height / getItemHeight()))].map((_, i) => (
          <Skeleton key={i} className="w-full" style={{ height: getItemHeight() }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <div className="text-center text-red-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <div>Error loading orders</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (processedOrders.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🍽️</div>
          <div className="text-lg font-medium">No orders in queue</div>
          <div className="text-sm">
            {filterBy === 'all' ? 'All caught up!' : `No ${filterBy} orders`}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Queue header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="font-medium">Order Queue</div>
            {stationId && (
              <Badge variant="outline">{stationId}</Badge>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {processedOrders.length} orders
          </div>
        </div>
      </div>

      {/* Virtual scrolling list */}
      <FixedSizeList
        ref={listRef}
        height={height - 50} // Subtract header height
        width="100%"
        itemCount={processedOrders.length}
        itemSize={getItemHeight()}
        itemData={{
          orders: processedOrders,
          operations,
          viewMode,
          onOrderClick: handleOrderClick
        }}
        className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
      >
        {OrderItem}
      </FixedSizeList>
    </div>
  )
})

KDSOrderQueue.displayName = 'KDSOrderQueue'