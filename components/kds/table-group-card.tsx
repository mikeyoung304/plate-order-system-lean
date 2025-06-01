'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  MapPin,
  Package,
  Play,
  RefreshCw,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  type TableGroup,
  useTableGroupTiming,
} from '@/hooks/use-table-grouped-orders'
import { useAsyncAction, useAsyncSetAction } from '@/hooks/use-async-action'
import type { KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds'

interface TableGroupCardProps {
  group: TableGroup
  onBumpOrder: (routingId: string) => Promise<void>
  onBumpTable: (tableId: string, orderIds: string[]) => Promise<void>
  onStartPrep: (routingId: string) => Promise<void>
  onRecallOrder: (routingId: string) => Promise<void>
  isCompact?: boolean
  showActions?: boolean
  className?: string
}

// Memoized order item component
const OrderItem = memo(({ item }: { item: any }) => {
  const formattedItem = useMemo(() => {
    if (typeof item === 'string') {
      return item
    }
    return item?.name || String(item)
  }, [item])

  return <div className='pl-4'>• {formattedItem}</div>
})
OrderItem.displayName = 'OrderItem'

// Memoized seat order component
const SeatOrder = memo(
  ({
    order,
    orderIdx,
    showActions,
    onStartPrep,
    bumpOrder,
    startPrep,
  }: {
    order: KDSOrderRouting
    orderIdx: number
    showActions: boolean
    onStartPrep?: (routingId: string) => Promise<void>
    bumpOrder: {
      execute: (id: string) => Promise<void>
      isLoading: (id: string) => boolean
    }
    startPrep: {
      execute: (id: string) => Promise<void>
      isLoading: (id: string) => boolean
    }
  }) => {
    const isBumping = bumpOrder.isLoading(order.id)
    const isStarting = startPrep.isLoading(order.id)

    return (
      <div
        className={cn(
          'pl-6 space-y-1 transition-opacity duration-200',
          order.completed_at && 'opacity-60'
        )}
      >
        {/* Order header */}
        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Badge variant='outline' className='text-xs font-mono'>
              #{order.order?.id?.slice(-6) || 'N/A'}
            </Badge>
            {orderIdx > 0 && (
              <Badge variant='secondary' className='text-xs'>
                Late arrival
              </Badge>
            )}
            {order.started_at && !order.completed_at && (
              <Play className='h-3 w-3 text-blue-500' />
            )}
            {order.completed_at && (
              <CheckCircle className='h-3 w-3 text-green-500' />
            )}
          </div>

          {/* Order actions */}
          {showActions && !order.completed_at && (
            <div className='flex gap-1'>
              {!order.started_at && onStartPrep && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => startPrep.execute(order.id)}
                  disabled={isStarting}
                  className='h-6 px-2 text-xs'
                >
                  {isStarting ? (
                    <Loader2 className='h-3 w-3 animate-spin' />
                  ) : (
                    'Start'
                  )}
                </Button>
              )}
              <Button
                size='sm'
                onClick={() => bumpOrder.execute(order.id)}
                disabled={isBumping}
                className='h-6 px-2 text-xs bg-green-600 hover:bg-green-700 text-white'
              >
                {isBumping ? (
                  <Loader2 className='h-3 w-3 animate-spin' />
                ) : (
                  'Ready'
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Order items */}
        {order.order?.items && order.order.items.length > 0 && (
          <div className='text-sm space-y-0.5'>
            {order.order.items.map((item, idx) => (
              <OrderItem key={idx} item={item} />
            ))}
          </div>
        )}

        {/* Order notes */}
        {order.notes && (
          <div className='pl-4 text-xs text-gray-500 italic'>
            Note: {order.notes}
          </div>
        )}
      </div>
    )
  }
)
SeatOrder.displayName = 'SeatOrder'

// Main component
export const TableGroupCard = memo(function TableGroupCard({
  group,
  onBumpOrder,
  onBumpTable,
  onStartPrep,
  onRecallOrder,
  isCompact = false,
  showActions = true,
  className,
}: TableGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(!isCompact)

  // Async action hooks replace the bloated error handling patterns
  const bumpTable = useAsyncAction(async () => {
    const activeOrderIds = group.orders
      .filter(o => !o.completed_at)
      .map(o => o.id)
    if (activeOrderIds.length > 0) {
      await onBumpTable(group.tableId, activeOrderIds)
    }
  })

  const bumpOrder = useAsyncSetAction(onBumpOrder)
  const startPrep = useAsyncSetAction(onStartPrep)

  const recallReady = useAsyncAction(async () => {
    const readyOrders = group.orders.filter(o => o.completed_at)
    await Promise.all(readyOrders.map(o => onRecallOrder(o.id)))
  })

  const { colors } = useTableGroupTiming(group)

  // Format elapsed time
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  // Memoized calculations
  const { activeOrders, someOrdersReady, ordersBySeat } = useMemo(() => {
    const active = group.orders.filter(o => !o.completed_at)
    const someReady = group.orders.some(o => o.completed_at)

    // Group orders by seat with null safety
    const bySeat = group.orders.reduce(
      (acc, order) => {
        const seatId = order.order?.seat_id || 'unknown'
        if (!acc[seatId]) {
          acc[seatId] = []
        }
        acc[seatId].push(order)
        return acc
      },
      {} as Record<string, KDSOrderRouting[]>
    )

    return {
      activeOrders: active,
      someOrdersReady: someReady,
      ordersBySeat: bySeat,
    }
  }, [group.orders])

  // Time spread calculation
  const timeSpreadMinutes = useMemo(() => {
    if (group.orders.length <= 1) {
      return 0
    }
    return Math.round(
      (group.latestOrderTime.getTime() - group.earliestOrderTime.getTime()) /
        60000
    )
  }, [group.earliestOrderTime, group.latestOrderTime, group.orders.length])

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        colors.border,
        colors.bg,
        group.isOverdue && 'animate-pulse',
        'hover:shadow-xl',
        className
      )}
    >
      {/* Table Header */}
      <CardHeader
        className={cn(
          'cursor-pointer select-none',
          colors.header,
          isCompact ? 'p-3' : 'pb-3'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='space-y-2'>
          {/* Top row */}
          <div className='flex items-center justify-between flex-wrap gap-2'>
            <div className='flex items-center gap-3 flex-wrap'>
              {/* Table info */}
              <div className='flex items-center gap-2'>
                <MapPin className='h-5 w-5 flex-shrink-0' />
                <span className='text-xl font-bold'>{group.tableLabel}</span>
              </div>

              {/* Seat count */}
              <Badge variant='secondary' className='flex items-center gap-1'>
                <Users className='h-3 w-3' />
                {group.seatCount} {group.seatCount === 1 ? 'seat' : 'seats'}
              </Badge>

              {/* Item count */}
              <Badge variant='secondary' className='flex items-center gap-1'>
                <Package className='h-3 w-3' />
                {group.totalItems} {group.totalItems === 1 ? 'item' : 'items'}
              </Badge>

              {/* Priority indicator */}
              {group.maxPriority > 0 && (
                <Badge
                  className={cn(
                    'text-xs',
                    group.maxPriority >= 8
                      ? 'bg-red-600 text-white'
                      : group.maxPriority >= 5
                        ? 'bg-orange-500 text-white'
                        : 'bg-blue-500 text-white'
                  )}
                >
                  Priority {group.maxPriority}
                </Badge>
              )}

              {/* Recall indicator */}
              {group.hasRecalls && (
                <Badge variant='destructive' className='text-xs'>
                  Recalled {group.totalRecallCount}x
                </Badge>
              )}
            </div>

            <div className='flex items-center gap-2'>
              {/* Max elapsed time */}
              <Badge className={cn(colors.badge, 'flex items-center gap-1')}>
                <Clock className='h-3 w-3' />
                {formatTime(group.maxElapsedTime)}
              </Badge>

              {/* Status indicator */}
              {group.isOverdue && (
                <AlertTriangle className='h-5 w-5 text-red-500 animate-pulse' />
              )}

              {/* Expand/collapse */}
              {isExpanded ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </div>
          </div>

          {/* Status row */}
          <div className='flex items-center justify-between text-sm flex-wrap gap-2'>
            <div className='flex items-center gap-2 flex-wrap'>
              {/* Overall status */}
              <span className='text-gray-600 dark:text-gray-400'>Status:</span>
              <Badge
                variant={
                  group.overallStatus === 'ready'
                    ? 'default'
                    : group.overallStatus === 'preparing'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {group.overallStatus === 'ready'
                  ? '✓ Ready'
                  : group.overallStatus === 'preparing'
                    ? '🔥 Preparing'
                    : group.overallStatus === 'mixed'
                      ? '⚡ Mixed'
                      : '📋 New'}
              </Badge>

              {/* Late arrival indicator */}
              {timeSpreadMinutes > 0 && (
                <span className='text-xs text-gray-500'>
                  {timeSpreadMinutes} min spread
                </span>
              )}
            </div>

            {/* Quick actions */}
            {showActions && !isExpanded && activeOrders.length > 0 && (
              <Button
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  bumpTable.execute()
                }}
                disabled={bumpTable.loading}
                className='bg-green-600 hover:bg-green-700 text-white'
              >
                {bumpTable.loading ? (
                  <Loader2 className='h-3 w-3 mr-1 animate-spin' />
                ) : (
                  <CheckCircle className='h-3 w-3 mr-1' />
                )}
                Bump Table ({activeOrders.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className={cn('pt-0', isCompact && 'p-3 pt-0')}>
          <div className='space-y-4'>
            {/* Orders by seat */}
            <ScrollArea className='max-h-96'>
              <div className='space-y-3'>
                {Object.entries(ordersBySeat).map(([seatId, seatOrders]) => (
                  <div key={seatId} className='border rounded-lg p-3 space-y-2'>
                    {/* Seat header */}
                    <div className='flex items-center justify-between flex-wrap gap-2'>
                      <div className='flex items-center gap-2'>
                        <Users className='h-4 w-4 flex-shrink-0' />
                        <span className='font-medium'>
                          Seat{' '}
                          {seatOrders[0].order?.seat_id?.slice(-4) ||
                            seatId.slice(-4)}
                        </span>
                        {seatOrders[0].order?.resident?.name && (
                          <span className='text-sm text-gray-600 dark:text-gray-400'>
                            ({seatOrders[0].order.resident.name})
                          </span>
                        )}
                      </div>

                      {/* Seat timing */}
                      <div className='flex items-center gap-2 flex-wrap'>
                        {seatOrders.map((order, idx) => (
                          <Badge
                            key={order.id}
                            variant={order.completed_at ? 'default' : 'outline'}
                            className='text-xs'
                          >
                            {idx > 0 && <UserPlus className='h-3 w-3 mr-1' />}
                            {new Date(order.routed_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Seat orders */}
                    {seatOrders.map((order, orderIdx) => (
                      <SeatOrder
                        key={order.id}
                        order={order}
                        orderIdx={orderIdx}
                        showActions={showActions}
                        onStartPrep={onStartPrep}
                        bumpOrder={bumpOrder}
                        startPrep={startPrep}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Table actions */}
            {showActions && (activeOrders.length > 0 || someOrdersReady) && (
              <div className='flex gap-2 pt-2 border-t flex-wrap'>
                {activeOrders.length > 0 && (
                  <Button
                    onClick={() => bumpTable.execute()}
                    disabled={bumpTable.loading}
                    className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                  >
                    {bumpTable.loading ? (
                      <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                    ) : (
                      <CheckCircle className='h-4 w-4 mr-1' />
                    )}
                    Bump Entire Table ({activeOrders.length}{' '}
                    {activeOrders.length === 1 ? 'order' : 'orders'})
                  </Button>
                )}

                {someOrdersReady && (
                  <Button
                    variant='outline'
                    onClick={() => recallReady.execute()}
                    disabled={recallReady.loading}
                  >
                    {recallReady.loading ? (
                      <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                    ) : (
                      <RefreshCw className='h-4 w-4 mr-1' />
                    )}
                    Recall Ready
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
})
