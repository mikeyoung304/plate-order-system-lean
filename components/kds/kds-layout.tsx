'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  Filter,
  Grid3x3,
  List,
  Loader2,
  MapPin,
  Maximize,
  Minimize,
  RefreshCw,
  Settings,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { OrderCard } from './order-card'
import { TableGroupCard } from './table-group-card'
import { useKDSAudio, useKDSState } from '@/lib/hooks/use-kds-state'
import { useTableGroupedOrders } from '@/hooks/use-table-grouped-orders'
import { useToast } from '@/hooks/use-toast'
import { getClientUser } from '@/lib/modassembly/supabase/auth/session'
import {
  // type KDSOrderRouting, // Unused for now
  addOrderNotes,
  bumpOrder,
  recallOrder,
  startOrderPrep,
  updateOrderPriority,
} from '@/lib/modassembly/supabase/database/kds'

// Lazy load voice command panel for better performance
const VoiceCommandPanel = dynamic(
  () =>
    import('./voice-command-panel').then(mod => ({
      default: mod.VoiceCommandPanel,
    })),
  {
    loading: () => (
      <Button variant='outline' size='sm' disabled>
        <Loader2 className='h-4 w-4 animate-spin' />
      </Button>
    ),
    ssr: false,
  }
)

interface KDSLayoutProps {
  stationId?: string
  className?: string
  showHeader?: boolean
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

// Loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className='p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
    {[...Array(6)].map((_, i) => (
      <Skeleton key={i} className='h-48 w-full' />
    ))}
  </div>
))
LoadingSkeleton.displayName = 'LoadingSkeleton'

// Empty state component
const EmptyState = memo(({ filterBy }: { filterBy: string }) => (
  <div className='flex items-center justify-center h-full text-gray-500'>
    <div className='text-center'>
      <div className='text-6xl mb-4'>🍽️</div>
      <h3 className='text-xl font-medium mb-2'>No orders</h3>
      <p className='text-gray-400'>
        {filterBy === 'all'
          ? 'All caught up! No pending orders.'
          : `No ${filterBy} orders at the moment.`}
      </p>
    </div>
  </div>
))
EmptyState.displayName = 'EmptyState'

// Connection status icon component
const ConnectionIcon = memo(({ status }: { status: string }) => {
  switch (status) {
    case 'connected':
      return <Wifi className='h-4 w-4 text-green-500' />
    case 'reconnecting':
      return <RefreshCw className='h-4 w-4 text-yellow-500 animate-spin' />
    case 'disconnected':
      return <WifiOff className='h-4 w-4 text-red-500' />
    default:
      return null
  }
})
ConnectionIcon.displayName = 'ConnectionIcon'

export function KDSLayout({
  stationId,
  className,
  showHeader = true,
  isFullscreen = false,
  onToggleFullscreen,
}: KDSLayoutProps) {
  // Consolidated state management
  const kdsState = useKDSState(stationId)
  const { playSound } = useKDSAudio()
  const { toast } = useToast()

  // Local UI state (simple toggle)
  const [showSettings, setShowSettings] = useState(false)

  // Get table-grouped orders
  const tableGroups = useTableGroupedOrders(kdsState.orders)

  // Filter table groups based on current filter
  const filteredTableGroups = useMemo(() => {
    let filtered = [...tableGroups]

    switch (kdsState.filterBy) {
      case 'new':
        filtered = filtered.filter(group =>
          group.orders.some(order => !order.started_at)
        )
        break
      case 'preparing':
        filtered = filtered.filter(group =>
          group.orders.some(order => order.started_at && !order.completed_at)
        )
        break
      case 'overdue':
        filtered = filtered.filter(group => group.isOverdue)
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (kdsState.sortBy) {
        case 'priority':
          return b.maxPriority - a.maxPriority
        case 'table':
          return a.tableLabel.localeCompare(b.tableLabel)
        case 'time':
        default:
          return a.earliestOrderTime.getTime() - b.earliestOrderTime.getTime()
      }
    })

    return filtered
  }, [tableGroups, kdsState.filterBy, kdsState.sortBy])

  // Order actions with optimistic updates
  const handleBumpOrder = useCallback(
    async (routingId: string) => {
      // Optimistic update
      kdsState.optimisticUpdate(routingId, {
        completed_at: new Date().toISOString(),
        bumped_at: new Date().toISOString(),
      })

      try {
        // Get current user for audit trail
        const user = await getClientUser()
        const userId = user?.id || 'unknown-user'
        await bumpOrder(routingId, userId)

        // Play success sound
        if (kdsState.soundEnabled) {
          playSound(800, 0.1)
        }

        toast({
          title: 'Order marked as ready',
          description: 'The order has been bumped successfully',
        })
      } catch (error) {
        console.error('Error bumping order:', error)

        // Refetch on error
        kdsState.refetch()

        toast({
          title: 'Error bumping order',
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
          variant: 'destructive',
        })
      }
    },
    [kdsState, playSound, toast]
  )

  const handleRecallOrder = useCallback(
    async (routingId: string) => {
      // Optimistic update
      kdsState.optimisticUpdate(routingId, {
        completed_at: undefined,
        bumped_at: undefined,
        recalled_at: new Date().toISOString(),
      })

      try {
        await recallOrder(routingId)

        // Play recall sound (lower frequency)
        if (kdsState.soundEnabled) {
          playSound(600, 0.15)
        }

        toast({
          title: 'Order recalled',
          description: 'The order has been recalled to the kitchen',
        })
      } catch (error) {
        console.error('Error recalling order:', error)

        // Refetch on error
        kdsState.refetch()

        toast({
          title: 'Error recalling order',
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
          variant: 'destructive',
        })
      }
    },
    [kdsState, playSound, toast]
  )

  const handleStartPrep = useCallback(
    async (routingId: string) => {
      // Optimistic update
      kdsState.optimisticUpdate(routingId, {
        started_at: new Date().toISOString(),
      })

      try {
        await startOrderPrep(routingId)

        // Play start sound
        if (kdsState.soundEnabled) {
          playSound(1000, 0.05)
        }

        toast({
          title: 'Preparation started',
          description: 'Order preparation has begun',
        })
      } catch (error) {
        console.error('Error starting prep:', error)

        // Refetch on error
        kdsState.refetch()

        toast({
          title: 'Error starting preparation',
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
          variant: 'destructive',
        })
      }
    },
    [kdsState, playSound, toast]
  )

  const handleUpdatePriority = useCallback(
    async (routingId: string, priority: number) => {
      // Validate priority
      if (priority < 0 || priority > 10) {
        toast({
          title: 'Invalid priority',
          description: 'Priority must be between 0 and 10',
          variant: 'destructive',
        })
        return
      }

      // Optimistic update
      kdsState.optimisticUpdate(routingId, { priority })

      try {
        await updateOrderPriority(routingId, priority)

        toast({
          title: 'Priority updated',
          description: `Order priority set to ${priority}`,
        })
      } catch (error) {
        console.error('Error updating priority:', error)

        // Refetch on error
        kdsState.refetch()

        toast({
          title: 'Error updating priority',
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
          variant: 'destructive',
        })
      }
    },
    [kdsState, toast]
  )

  const handleAddNotes = useCallback(
    async (routingId: string, notes: string) => {
      // Validate notes
      const sanitizedNotes = notes.trim()
      if (!sanitizedNotes) {
        return
      }

      if (sanitizedNotes.length > 500) {
        toast({
          title: 'Notes too long',
          description: 'Notes must be 500 characters or less',
          variant: 'destructive',
        })
        return
      }

      // Optimistic update
      kdsState.optimisticUpdate(routingId, { notes: sanitizedNotes })

      try {
        await addOrderNotes(routingId, sanitizedNotes)

        toast({
          title: 'Notes added',
          description: 'Order notes have been updated',
        })
      } catch (error) {
        console.error('Error adding notes:', error)

        // Refetch on error
        kdsState.refetch()

        toast({
          title: 'Error adding notes',
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
          variant: 'destructive',
        })
      }
    },
    [kdsState, toast]
  )

  // Handle bump entire table
  const handleBumpTable = useCallback(
    async (tableId: string, orderIds: string[]) => {
      try {
        // Bump all orders for the table
        await Promise.all(orderIds.map(orderId => handleBumpOrder(orderId)))

        toast({
          title: 'Table completed',
          description: `All ${orderIds.length} orders for this table have been bumped`,
        })
      } catch (error) {
        console.error('Error bumping table:', error)

        toast({
          title: 'Error bumping table',
          description: 'Some orders may not have been bumped',
          variant: 'destructive',
        })
      }
    },
    [handleBumpOrder, toast]
  )

  // Voice command handlers
  const handleVoiceBumpOrder = useCallback(
    async (orderNumber: string) => {
      const order = kdsState.filteredAndSortedOrders.find(
        o =>
          o.order?.id?.endsWith(orderNumber) ||
          o.order?.id?.slice(-6) === orderNumber
      )
      if (order) {
        await handleBumpOrder(order.id)
      } else {
        toast({
          title: 'Order not found',
          description: `Could not find order #${orderNumber}`,
          variant: 'destructive',
        })
      }
    },
    [kdsState.filteredAndSortedOrders, handleBumpOrder, toast]
  )

  const handleVoiceRecallOrder = useCallback(
    async (orderNumber: string) => {
      const order = kdsState.filteredAndSortedOrders.find(
        o =>
          o.order?.id?.endsWith(orderNumber) ||
          o.order?.id?.slice(-6) === orderNumber
      )
      if (order) {
        await handleRecallOrder(order.id)
      } else {
        toast({
          title: 'Order not found',
          description: `Could not find order #${orderNumber}`,
          variant: 'destructive',
        })
      }
    },
    [kdsState.filteredAndSortedOrders, handleRecallOrder, toast]
  )

  const handleVoiceStartOrder = useCallback(
    async (orderNumber: string) => {
      const order = kdsState.filteredAndSortedOrders.find(
        o =>
          o.order?.id?.endsWith(orderNumber) ||
          o.order?.id?.slice(-6) === orderNumber
      )
      if (order) {
        await handleStartPrep(order.id)
      } else {
        toast({
          title: 'Order not found',
          description: `Could not find order #${orderNumber}`,
          variant: 'destructive',
        })
      }
    },
    [kdsState.filteredAndSortedOrders, handleStartPrep, toast]
  )

  const handleVoiceSetPriority = useCallback(
    async (orderNumber: string, priority: number) => {
      const order = kdsState.filteredAndSortedOrders.find(
        o =>
          o.order?.id?.endsWith(orderNumber) ||
          o.order?.id?.slice(-6) === orderNumber
      )
      if (order) {
        await handleUpdatePriority(order.id, priority)
      } else {
        toast({
          title: 'Order not found',
          description: `Could not find order #${orderNumber}`,
          variant: 'destructive',
        })
      }
    },
    [kdsState.filteredAndSortedOrders, handleUpdatePriority, toast]
  )

  const handleVoiceFilter = useCallback(
    (filter: string) => {
      const normalizedFilter = filter.toLowerCase()
      switch (normalizedFilter) {
        case 'new':
        case 'preparing':
        case 'overdue':
        case 'all':
          kdsState.setFilterBy(normalizedFilter)
          toast({
            title: 'Filter applied',
            description: `Showing ${normalizedFilter} orders`,
          })
          break
        default:
          toast({
            title: 'Unknown filter',
            description: `Filter "${filter}" not recognized`,
            variant: 'destructive',
          })
      }
    },
    [toast]
  )

  // Get grid classes based on order count and view mode
  const getGridClasses = useCallback(() => {
    if (kdsState.viewMode === 'list') {
      return 'grid-cols-1'
    }

    const orderCount = kdsState.filteredAndSortedOrders.length
    if (orderCount <= 4) {
      return 'grid-cols-1 md:grid-cols-2'
    }
    if (orderCount <= 9) {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
    if (orderCount <= 16) {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    }
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
  }, [kdsState.viewMode, kdsState.filteredAndSortedOrders.length])

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-gray-50 dark:bg-gray-900',
        className
      )}
    >
      {/* Header */}
      {showHeader && (
        <div className='flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b shadow-sm'>
          <div className='flex items-center gap-4 flex-wrap'>
            {/* Station info */}
            <div className='flex items-center gap-2'>
              {stationId ? (
                <Badge
                  className='text-lg px-3 py-1'
                  style={{ backgroundColor: '#3B82F6' }}
                >
                  Station {stationId}
                </Badge>
              ) : (
                <Badge variant='outline' className='text-lg px-3 py-1'>
                  All Stations
                </Badge>
              )}
            </div>

            {/* Order/Table count */}
            <Badge variant='secondary'>
              {kdsState.viewMode === 'table'
                ? `${filteredTableGroups.length} tables`
                : `${kdsState.filteredAndSortedOrders.length} orders`}
            </Badge>

            {/* Connection status */}
            <div className='flex items-center gap-1'>
              <ConnectionIcon status={kdsState.connectionStatus} />
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                {kdsState.connectionStatus}
              </span>
            </div>
          </div>

          <div className='flex items-center gap-2 flex-wrap'>
            {/* Filter */}
            <Select
              value={kdsState.filterBy}
              onValueChange={kdsState.setFilterBy}
            >
              <SelectTrigger className='w-32'>
                <Filter className='h-4 w-4 mr-1' />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='new'>New</SelectItem>
                <SelectItem value='preparing'>Preparing</SelectItem>
                <SelectItem value='overdue'>Overdue</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={kdsState.sortBy} onValueChange={kdsState.setSortBy}>
              <SelectTrigger className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='time'>By Time</SelectItem>
                <SelectItem value='priority'>By Priority</SelectItem>
                <SelectItem value='table'>By Table</SelectItem>
              </SelectContent>
            </Select>

            {/* View mode */}
            <div className='flex border rounded'>
              <Button
                variant={kdsState.viewMode === 'table' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => kdsState.setViewMode('table')}
                className='rounded-r-none'
                title='Table View'
              >
                <MapPin className='h-4 w-4' />
              </Button>
              <Button
                variant={kdsState.viewMode === 'grid' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => kdsState.setViewMode('grid')}
                className='rounded-none'
                title='Grid View'
              >
                <Grid3x3 className='h-4 w-4' />
              </Button>
              <Button
                variant={kdsState.viewMode === 'list' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => kdsState.setViewMode('list')}
                className='rounded-l-none'
                title='List View'
              >
                <List className='h-4 w-4' />
              </Button>
            </div>

            {/* Voice commands */}
            <VoiceCommandPanel
              onBumpOrder={handleVoiceBumpOrder}
              onRecallOrder={handleVoiceRecallOrder}
              onStartOrder={handleVoiceStartOrder}
              onSetPriority={handleVoiceSetPriority}
              onFilter={handleVoiceFilter}
              orders={kdsState.filteredAndSortedOrders}
            />

            {/* Sound toggle */}
            <Button
              variant='outline'
              size='sm'
              onClick={kdsState.toggleSound}
              title={kdsState.soundEnabled ? 'Disable sounds' : 'Enable sounds'}
            >
              {kdsState.soundEnabled ? (
                <Volume2 className='h-4 w-4' />
              ) : (
                <VolumeX className='h-4 w-4' />
              )}
            </Button>

            {/* Fullscreen toggle */}
            {onToggleFullscreen && (
              <Button
                variant='outline'
                size='sm'
                onClick={onToggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className='h-4 w-4' />
                ) : (
                  <Maximize className='h-4 w-4' />
                )}
              </Button>
            )}

            {/* Refresh */}
            <Button
              variant='outline'
              size='sm'
              onClick={kdsState.refetch}
              disabled={kdsState.loading}
              title='Refresh orders'
            >
              <RefreshCw
                className={cn('h-4 w-4', kdsState.loading && 'animate-spin')}
              />
            </Button>

            {/* Settings */}
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowSettings(!showSettings)}
              title='Toggle settings'
            >
              <Settings className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}

      {/* Error state */}
      {kdsState.error && (
        <Alert variant='destructive' className='m-4'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Error loading orders: {kdsState.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main content */}
      <div className='flex-1 overflow-hidden'>
        {kdsState.loading && kdsState.filteredAndSortedOrders.length === 0 ? (
          <LoadingSkeleton />
        ) : (
            kdsState.viewMode === 'table'
              ? filteredTableGroups.length === 0
              : kdsState.filteredAndSortedOrders.length === 0
          ) ? (
          <EmptyState filterBy={kdsState.filterBy} />
        ) : (
          <ScrollArea className='h-full'>
            <div
              className={cn(
                'p-4 grid gap-4',
                kdsState.viewMode === 'table' ? 'grid-cols-1' : getGridClasses()
              )}
            >
              {kdsState.viewMode === 'table'
                ? // Table grouped view
                  filteredTableGroups.map(group => (
                    <TableGroupCard
                      key={group.tableId}
                      group={group}
                      onBumpOrder={handleBumpOrder}
                      onBumpTable={handleBumpTable}
                      onStartPrep={handleStartPrep}
                      onRecallOrder={handleRecallOrder}
                      isCompact={false}
                      showActions={true}
                      className='w-full'
                    />
                  ))
                : // Individual order view (grid or list)
                  kdsState.filteredAndSortedOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onBump={handleBumpOrder}
                      onRecall={handleRecallOrder}
                      onStartPrep={handleStartPrep}
                      onUpdatePriority={handleUpdatePriority}
                      onAddNotes={handleAddNotes}
                      isCompact={kdsState.viewMode === 'list'}
                      className='w-full'
                    />
                  ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className='border-t bg-white dark:bg-gray-800 p-4'>
          <h4 className='font-medium mb-3'>Display Settings</h4>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <label className='text-sm text-gray-600 dark:text-gray-400'>
                Auto-refresh
              </label>
              <div className='text-sm'>Every 5 seconds</div>
            </div>
            <div>
              <label className='text-sm text-gray-600 dark:text-gray-400'>
                Sound alerts
              </label>
              <div className='text-sm'>
                {kdsState.soundEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div>
              <label className='text-sm text-gray-600 dark:text-gray-400'>
                View mode
              </label>
              <div className='text-sm capitalize'>{kdsState.viewMode}</div>
            </div>
            <div>
              <label className='text-sm text-gray-600 dark:text-gray-400'>
                Connection
              </label>
              <div className='text-sm capitalize'>
                {kdsState.connectionStatus}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
