'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Shell } from '@/components/shell'
import { ProtectedRoute } from '@/lib/modassembly/supabase/auth'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  ChefHat,
  Clock,
  Coffee,
  Filter,
  Grid3x3,
  List,
  MapPin,
  Package,
  RefreshCw,
  Users,
  Utensils,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  type Order,
  updateOrderStatus,
} from '@/lib/modassembly/supabase/database/orders'
import { useKitchenState } from '@/lib/state/restaurant-state-context'

interface TableGroup {
  tableId: string
  tableLabel: string
  orders: Order[]
  earliestTime: Date
  latestTime: Date
  totalItems: number
  seatCount: number
  status: 'new' | 'preparing' | 'mixed' | 'ready'
  isOverdue: boolean
  maxElapsedMinutes: number
}

type ViewMode = 'table' | 'grid' | 'list'
type FilterBy = 'all' | 'new' | 'preparing' | 'ready'

export default function KitchenPage() {
  // INTELLIGENT STATE MANAGEMENT - Full integration
  const {
    orders,
    selectedStation,
    filterStatus,
    sortBy,
    connectionStatus,
    loading,
    errors,
    actions,
  } = useKitchenState()

  // Local UI state
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const { toast } = useToast()

  // Filter mapping to intelligent state
  const filterBy = (filterStatus as FilterBy) || 'all'
  const setFilterBy = (filter: FilterBy) => {
    actions.setFilter(filter === 'all' ? null : filter)
  }

  // Get filtered orders (remove delivered orders)
  const activeOrders = useMemo(() => {
    return orders.filter(order => order.status !== 'delivered')
  }, [orders])

  // Group orders by table
  const tableGroups = useMemo(() => {
    const groups = new Map<string, Order[]>()

    activeOrders.forEach(order => {
      if (!order.table) {
        return
      }

      const key = order.table
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(order)
    })

    const tableGroups: TableGroup[] = []

    groups.forEach((tableOrders, tableKey) => {
      const sortedOrders = tableOrders.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      const earliestTime = new Date(sortedOrders[0].created_at)
      const latestTime = new Date(
        sortedOrders[sortedOrders.length - 1].created_at
      )
      const totalItems = sortedOrders.reduce(
        (sum, order) => sum + (order.items?.length || 0),
        0
      )
      const seatCount = new Set(sortedOrders.map(order => order.seat)).size

      // Determine status
      const newCount = sortedOrders.filter(o => o.status === 'new').length
      const preparingCount = sortedOrders.filter(
        o => o.status === 'in_progress'
      ).length
      const readyCount = sortedOrders.filter(o => o.status === 'ready').length

      let status: TableGroup['status'] = 'new'
      if (readyCount === sortedOrders.length) {
        status = 'ready'
      } else if (preparingCount > 0 || readyCount > 0) {
        status = 'mixed'
      } else if (newCount === sortedOrders.length) {
        status = 'new'
      } else {
        status = 'preparing'
      }

      // Calculate timing
      const maxElapsedMinutes = Math.max(
        ...sortedOrders.map(order => {
          const elapsed =
            (Date.now() - new Date(order.created_at).getTime()) / 1000 / 60
          return elapsed
        })
      )

      const isOverdue = maxElapsedMinutes > 15 // Over 15 minutes

      tableGroups.push({
        tableId: tableKey,
        tableLabel: tableKey,
        orders: sortedOrders,
        earliestTime,
        latestTime,
        totalItems,
        seatCount,
        status,
        isOverdue,
        maxElapsedMinutes,
      })
    })

    return tableGroups.sort(
      (a, b) => a.earliestTime.getTime() - b.earliestTime.getTime()
    )
  }, [activeOrders])

  // Filter orders/tables
  const filteredItems = useMemo(() => {
    if (viewMode === 'table') {
      return tableGroups.filter(group => {
        switch (filterBy) {
          case 'new':
            return group.status === 'new'
          case 'preparing':
            return group.status === 'preparing' || group.status === 'mixed'
          case 'ready':
            return group.status === 'ready'
          default:
            return true
        }
      })
    } else {
      return activeOrders.filter(order => {
        switch (filterBy) {
          case 'new':
            return order.status === 'new'
          case 'preparing':
            return order.status === 'in_progress'
          case 'ready':
            return order.status === 'ready'
          default:
            return true
        }
      })
    }
  }, [viewMode, filterBy, tableGroups, activeOrders])

  // Update order status
  const handleStatusUpdate = async (
    orderId: string,
    newStatus: Order['status']
  ) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      // Intelligent state will auto-refresh via real-time subscriptions

      if (soundEnabled) {
        // Simple beep sound
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.value = 800
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.1
        )
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      }

      toast({
        title: 'Order Updated',
        description: `Order marked as ${newStatus.replace('_', ' ')}`,
        duration: 2000,
      })
    } catch (error) {
      console.error('Error updating order:', error)
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      })
    }
  }

  // Bulk table operations
  const handleBumpTable = async (tableOrders: Order[]) => {
    try {
      await Promise.all(
        tableOrders
          .filter(order => order.status !== 'ready')
          .map(order => updateOrderStatus(order.id, 'ready'))
      )
      // Real-time state updates automatically
      toast({
        title: 'Table Complete',
        description: `All ${tableOrders.length} orders marked as ready`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete table',
        variant: 'destructive',
      })
    }
  }

  // Get color classes based on timing
  const getTimingColors = (minutes: number) => {
    if (minutes <= 5) {
      return {
        border: 'border-green-500',
        bg: 'bg-green-50 dark:bg-green-950',
        text: 'text-green-700 dark:text-green-300',
      }
    }
    if (minutes <= 10) {
      return {
        border: 'border-yellow-500',
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        text: 'text-yellow-700 dark:text-yellow-300',
      }
    }
    return {
      border: 'border-red-500',
      bg: 'bg-red-50 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
    }
  }

  return (
    <ProtectedRoute roles={['cook', 'admin']}>
      <Shell className='bg-gray-900 min-h-screen'>
        <div className='container py-6'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-white'>
                Kitchen Display System
              </h1>
              <p className='text-gray-400 mt-1'>
                Manage orders and track preparation
              </p>
            </div>

            <div className='flex items-center gap-2'>
              <Badge variant='secondary'>
                {viewMode === 'table'
                  ? `${filteredItems.length} tables`
                  : `${filteredItems.length} orders`}
              </Badge>
            </div>
          </div>

          {/* Controls */}
          <div className='flex items-center justify-between mb-6 gap-4 flex-wrap'>
            <div className='flex items-center gap-2'>
              {/* Filter */}
              <Select
                value={filterBy}
                onValueChange={(value: FilterBy) => setFilterBy(value)}
              >
                <SelectTrigger className='w-32'>
                  <Filter className='h-4 w-4 mr-1' />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='new'>New</SelectItem>
                  <SelectItem value='preparing'>Preparing</SelectItem>
                  <SelectItem value='ready'>Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-center gap-2'>
              {/* View Mode */}
              <div className='flex border rounded'>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setViewMode('table')}
                  className='rounded-r-none'
                >
                  <MapPin className='h-4 w-4' />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setViewMode('grid')}
                  className='rounded-none'
                >
                  <Grid3x3 className='h-4 w-4' />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setViewMode('list')}
                  className='rounded-l-none'
                >
                  <List className='h-4 w-4' />
                </Button>
              </div>

              {/* Sound Toggle */}
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
              >
                {soundEnabled ? (
                  <Volume2 className='h-4 w-4' />
                ) : (
                  <VolumeX className='h-4 w-4' />
                )}
              </Button>

              {/* Refresh */}
              <Button
                variant='outline'
                size='sm'
                onClick={actions.refresh}
                disabled={loading.orders}
                title='Refresh orders'
              >
                <RefreshCw
                  className={cn('h-4 w-4', loading.orders && 'animate-spin')}
                />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className='h-[calc(100vh-250px)]'>
            {loading.orders && activeOrders.length === 0 ? (
              <div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className='animate-pulse'>
                    <CardContent className='h-48 bg-gray-200 dark:bg-gray-700' />
                  </Card>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className='flex items-center justify-center h-64 text-gray-500'>
                <div className='text-center'>
                  <div className='text-6xl mb-4'>🍽️</div>
                  <h3 className='text-xl font-medium mb-2'>No orders</h3>
                  <p className='text-gray-400'>
                    All caught up! No pending orders.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'grid gap-4',
                  viewMode === 'list'
                    ? 'grid-cols-1'
                    : viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1 md:grid-cols-2'
                )}
              >
                {viewMode === 'table'
                  ? // Table view
                    (filteredItems as TableGroup[]).map(group => {
                      const colors = getTimingColors(group.maxElapsedMinutes)
                      return (
                        <Card
                          key={group.tableId}
                          className={cn(
                            'transition-all duration-200',
                            colors.border,
                            colors.bg,
                            group.isOverdue && 'animate-pulse'
                          )}
                        >
                          <CardHeader className='pb-3'>
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-3'>
                                <div className='flex items-center gap-2'>
                                  <MapPin className='h-5 w-5' />
                                  <span className='text-xl font-bold'>
                                    {group.tableLabel}
                                  </span>
                                </div>
                                <Badge
                                  variant='secondary'
                                  className='flex items-center gap-1'
                                >
                                  <Users className='h-3 w-3' />
                                  {group.seatCount} seats
                                </Badge>
                                <Badge
                                  variant='secondary'
                                  className='flex items-center gap-1'
                                >
                                  <Package className='h-3 w-3' />
                                  {group.totalItems} items
                                </Badge>
                              </div>
                              <Badge className={cn(colors.text)}>
                                <Clock className='h-3 w-3 mr-1' />
                                {Math.round(group.maxElapsedMinutes)}m
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className='space-y-3'>
                            {group.orders.map(order => (
                              <div
                                key={order.id}
                                className='p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg'
                              >
                                <div className='flex items-center justify-between mb-2'>
                                  <div className='flex items-center gap-2'>
                                    <span className='font-medium'>
                                      Seat {order.seat}
                                    </span>
                                    {order.type === 'food' ? (
                                      <Utensils className='h-4 w-4 text-teal-500' />
                                    ) : (
                                      <Coffee className='h-4 w-4 text-amber-500' />
                                    )}
                                    <Badge
                                      variant='outline'
                                      className={`status-${order.status}`}
                                    >
                                      {order.status === 'new'
                                        ? 'New'
                                        : order.status === 'in_progress'
                                          ? 'Preparing'
                                          : order.status === 'ready'
                                            ? 'Ready'
                                            : order.status}
                                    </Badge>
                                  </div>
                                </div>

                                <div className='text-sm space-y-1 mb-3'>
                                  {order.items?.map((item, idx) => (
                                    <div key={idx} className='pl-4'>
                                      • {item}
                                    </div>
                                  ))}
                                </div>

                                <div className='flex gap-2'>
                                  {order.status === 'new' && (
                                    <Button
                                      size='sm'
                                      onClick={() =>
                                        handleStatusUpdate(
                                          order.id,
                                          'in_progress'
                                        )
                                      }
                                      className='bg-blue-600 hover:bg-blue-700'
                                    >
                                      <ChefHat className='h-4 w-4 mr-1' />
                                      Start
                                    </Button>
                                  )}
                                  {order.status === 'in_progress' && (
                                    <Button
                                      size='sm'
                                      onClick={() =>
                                        handleStatusUpdate(order.id, 'ready')
                                      }
                                      className='bg-green-600 hover:bg-green-700'
                                    >
                                      <CheckCircle className='h-4 w-4 mr-1' />
                                      Ready
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}

                            <Button
                              className='w-full'
                              onClick={() => handleBumpTable(group.orders)}
                              disabled={group.orders.every(
                                o => o.status === 'ready'
                              )}
                            >
                              Complete Entire Table
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })
                  : // Individual order view
                    (filteredItems as Order[]).map(order => {
                      const elapsed =
                        (Date.now() - new Date(order.created_at).getTime()) /
                        1000 /
                        60
                      const colors = getTimingColors(elapsed)
                      return (
                        <Card
                          key={order.id}
                          className={cn(
                            'transition-all duration-200',
                            colors.border,
                            colors.bg,
                            elapsed > 15 && 'animate-pulse'
                          )}
                        >
                          <CardContent className='p-4'>
                            <div className='flex justify-between items-start mb-3'>
                              <div>
                                <div className='text-lg font-semibold text-white'>
                                  {order.table}, Seat {order.seat}
                                </div>
                                <div className='text-sm space-y-1 mt-2'>
                                  {order.items?.map((item, i) => (
                                    <div key={i}>• {item}</div>
                                  ))}
                                </div>
                              </div>
                              <div className='text-right'>
                                <Badge
                                  variant='outline'
                                  className={`status-${order.status}`}
                                >
                                  {order.status === 'new'
                                    ? 'New'
                                    : order.status === 'in_progress'
                                      ? 'Preparing'
                                      : order.status === 'ready'
                                        ? 'Ready'
                                        : order.status}
                                </Badge>
                                <div className='text-xs text-gray-400 flex items-center gap-1 mt-1'>
                                  <Clock className='h-4 w-4' />
                                  {Math.round(elapsed)}m
                                </div>
                              </div>
                            </div>

                            <div className='flex gap-2'>
                              {order.status === 'new' && (
                                <Button
                                  size='sm'
                                  onClick={() =>
                                    handleStatusUpdate(order.id, 'in_progress')
                                  }
                                  className='bg-blue-600 hover:bg-blue-700'
                                >
                                  <ChefHat className='h-4 w-4 mr-1' />
                                  Start Cooking
                                </Button>
                              )}
                              {order.status === 'in_progress' && (
                                <Button
                                  size='sm'
                                  onClick={() =>
                                    handleStatusUpdate(order.id, 'ready')
                                  }
                                  className='bg-green-600 hover:bg-green-700'
                                >
                                  <CheckCircle className='h-4 w-4 mr-1' />
                                  Mark Ready
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
              </div>
            )}
          </ScrollArea>
        </div>
      </Shell>
    </ProtectedRoute>
  )
}
