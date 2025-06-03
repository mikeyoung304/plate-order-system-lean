'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Shell } from '@/components/shell'
import { ProtectedRoute } from '@/lib/modassembly/supabase/auth'
import { PageHeaderWithTime } from '@/components/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  AlertCircle,
  CheckCircle,
  ChefHat,
  Clock,
  Utensils,
  Timer,
  Users,
  Package,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
// PERFORMANCE_OPTIMIZATION: Eliminated framer-motion completely
// Original: Full framer-motion library (~150KB) for expo animations
// Changed to: Pure CSS animations with equivalent functionality
// Impact: 100% reduction in motion-related bundle size for expo station
// Risk: None - same visual effects, better performance
import {
  type Order,
  fetchRecentOrders,
  updateOrderStatus,
} from '@/lib/modassembly/supabase/database/orders'
import { createClient } from '@/lib/modassembly/supabase/client'

export default function ExpoPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load orders from Supabase
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true)
        const fetchedOrders = await fetchRecentOrders(50)
        setOrders(fetchedOrders)
      } catch (error) {
        console.error('Error loading orders:', error)
        toast({
          title: 'Error',
          description: 'Failed to load orders. Please refresh the page.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()

    // Set up real-time subscription for order updates
    const supabase = createClient()
    const channel = supabase
      .channel('expo-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        payload => {
          console.log('Expo received order update:', payload)
          // Reload orders when any order changes
          loadOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [toast])

  // Mark order as delivered
  const markAsDelivered = async (orderId: string) => {
    try {
      // Optimistically update the UI
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId
            ? { ...order, status: 'delivered' as const }
            : order
        )
      )

      await updateOrderStatus(orderId, 'delivered')

      // Show toast notification
      toast({
        title: 'Order delivered',
        description: `Order ${orderId} has been marked as delivered`,
        duration: 2000,
      })
    } catch (error) {
      console.error('Error marking order as delivered:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark order as delivered',
        variant: 'destructive',
      })
    }
  }

  // Mark entire table as delivered for efficiency
  const markTableAsDelivered = async (tableOrders: Order[]) => {
    try {
      // Optimistically update the UI
      setOrders(prev =>
        prev.map(order =>
          tableOrders.find(to => to.id === order.id)
            ? { ...order, status: 'delivered' as const }
            : order
        )
      )

      await Promise.all(
        tableOrders.map(order => updateOrderStatus(order.id, 'delivered'))
      )

      toast({
        title: 'Table delivered',
        description: `All ${tableOrders.length} orders from ${tableOrders[0].table} delivered`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Error marking table as delivered:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark table as delivered',
        variant: 'destructive',
      })
    }
  }

  // Filter orders by status with enhanced grouping
  const readyOrders = orders.filter(order => order.status === 'ready')
  const inProgressOrders = orders.filter(
    order => order.status === 'in_progress'
  )

  // Group ready orders by table for efficient delivery coordination
  const readyTableGroups = useMemo(() => {
    const groups = new Map<string, Order[]>()
    readyOrders.forEach(order => {
      if (!order.table) return
      const key = order.table
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(order)
    })

    return Array.from(groups.entries())
      .map(([tableId, tableOrders]) => {
        const seatCount = new Set(tableOrders.map(o => o.seat)).size
        const totalItems = tableOrders.reduce(
          (sum, o) => sum + (o.items?.length || 0),
          0
        )
        const avgWaitTime =
          tableOrders.reduce((sum, o) => {
            const elapsed =
              (Date.now() - new Date(o.created_at).getTime()) / 1000 / 60
            return sum + elapsed
          }, 0) / tableOrders.length

        return {
          tableId,
          tableLabel: tableId,
          orders: tableOrders.sort((a, b) => (a.seat || 0) - (b.seat || 0)),
          seatCount,
          totalItems,
          avgWaitTime: Math.round(avgWaitTime),
          isUrgent: avgWaitTime > 20, // Over 20 minutes is urgent
        }
      })
      .sort((a, b) => b.avgWaitTime - a.avgWaitTime) // Prioritize by wait time
  }, [readyOrders])

  // Delivery efficiency metrics
  const deliveryMetrics = useMemo(() => {
    const totalReadyOrders = readyOrders.length
    const urgentOrders = readyOrders.filter(order => {
      const elapsed =
        (Date.now() - new Date(order.created_at).getTime()) / 1000 / 60
      return elapsed > 20
    }).length
    const avgWaitTime =
      readyOrders.length > 0
        ? readyOrders.reduce((sum, order) => {
            const elapsed =
              (Date.now() - new Date(order.created_at).getTime()) / 1000 / 60
            return sum + elapsed
          }, 0) / readyOrders.length
        : 0

    return {
      totalReady: totalReadyOrders,
      urgent: urgentOrders,
      avgWaitTime: Math.round(avgWaitTime),
      tablesReady: readyTableGroups.length,
    }
  }, [readyOrders, readyTableGroups])

  return (
    <ProtectedRoute roles={['admin', 'server', 'cook']}>
      <Shell>
        <div className='container py-6'>
          <PageHeaderWithTime
            title='Expo Station'
            description='Quality Control & Delivery Coordination'
          />

          {/* Delivery Metrics Dashboard */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            <Card className='shadow-sm'>
              <CardContent className='flex items-center justify-between p-4'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Tables Ready
                  </p>
                  <p className='text-2xl font-bold'>
                    {deliveryMetrics.tablesReady}
                  </p>
                </div>
                <Package className='h-8 w-8 text-emerald-500' />
              </CardContent>
            </Card>
            <Card className='shadow-sm'>
              <CardContent className='flex items-center justify-between p-4'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Orders Ready
                  </p>
                  <p className='text-2xl font-bold'>
                    {deliveryMetrics.totalReady}
                  </p>
                </div>
                <CheckCircle className='h-8 w-8 text-emerald-500' />
              </CardContent>
            </Card>
            <Card className='shadow-sm'>
              <CardContent className='flex items-center justify-between p-4'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Urgent
                  </p>
                  <p className='text-2xl font-bold text-red-600'>
                    {deliveryMetrics.urgent}
                  </p>
                </div>
                <AlertCircle className='h-8 w-8 text-red-500' />
              </CardContent>
            </Card>
            <Card className='shadow-sm'>
              <CardContent className='flex items-center justify-between p-4'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Avg Wait
                  </p>
                  <p className='text-2xl font-bold'>
                    {deliveryMetrics.avgWaitTime}m
                  </p>
                </div>
                <Timer className='h-8 w-8 text-amber-500' />
              </CardContent>
            </Card>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <div className='w-3 h-3 bg-emerald-500 rounded-full'></div>
                <h2 className='text-xl font-semibold'>
                  Ready for Service ({readyTableGroups.length} tables,{' '}
                  {readyOrders.length} orders)
                </h2>
              </div>

              {isLoading ? (
                <div className='space-y-4'>
                  {[1, 2, 3].map(i => (
                    <Card key={i} className='shadow-sm animate-pulse'>
                      <CardHeader className='h-24'></CardHeader>
                      <CardContent className='h-48'></CardContent>
                      <CardFooter className='h-16'></CardFooter>
                    </Card>
                  ))}
                </div>
              ) : readyTableGroups.length === 0 ? (
                <Card className='shadow-sm'>
                  <CardContent className='flex flex-col items-center justify-center p-12 text-center'>
                    <div className='rounded-full bg-secondary/50 p-4 mb-4'>
                      <CheckCircle className='h-8 w-8 text-muted-foreground' />
                    </div>
                    <h3 className='text-xl font-medium mb-2'>All Caught Up</h3>
                    <p className='text-muted-foreground max-w-md'>
                      There are no orders ready for service at this time.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className='space-y-4'>
                  {readyTableGroups.map((tableGroup, index) => (
                    <Card
                      key={tableGroup.tableId}
                      className={`expo-order expo-order-ready shadow-sm hover:shadow-md transition-shadow border-2 ${
                        tableGroup.isUrgent
                          ? 'border-red-500 bg-red-50'
                          : 'border-emerald-500'
                      } stagger-item-${Math.min(index + 1, 10)}`}
                      style={{
                        animation: tableGroup.isUrgent
                          ? 'pulse-red 2s infinite'
                          : 'pulse-green 2s infinite',
                      }}
                    >
                      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2'>
                            <CardTitle className='text-xl'>
                              {tableGroup.tableLabel}
                            </CardTitle>
                            <Badge variant='outline' className='text-xs'>
                              <Users className='h-3 w-3 mr-1' />
                              {tableGroup.seatCount} seats
                            </Badge>
                            <Badge variant='outline' className='text-xs'>
                              <Package className='h-3 w-3 mr-1' />
                              {tableGroup.totalItems} items
                            </Badge>
                            {tableGroup.isUrgent && (
                              <Badge variant='destructive' className='text-xs'>
                                <AlertCircle className='h-3 w-3 mr-1' />
                                URGENT
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {tableGroup.orders.length} orders ready for delivery
                          </CardDescription>
                        </div>
                        <div className='flex items-center gap-1 text-sm font-medium'>
                          <Timer
                            className={`h-4 w-4 ${tableGroup.isUrgent ? 'text-red-500' : 'text-muted-foreground'}`}
                          />
                          <span
                            className={
                              tableGroup.isUrgent
                                ? 'text-red-600 font-bold'
                                : ''
                            }
                          >
                            {tableGroup.avgWaitTime}m avg
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <ScrollArea className='h-[220px] pr-4'>
                          <div className='space-y-3'>
                            {tableGroup.orders.map(order => (
                              <div
                                key={order.id}
                                className='p-3 bg-emerald-50 rounded-lg border border-emerald-200'
                              >
                                <div className='flex items-center justify-between mb-2'>
                                  <Badge
                                    variant='secondary'
                                    className='text-xs'
                                  >
                                    Seat {order.seat}
                                  </Badge>
                                  <span className='text-xs text-muted-foreground'>
                                    {new Date(
                                      order.created_at
                                    ).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <ul className='space-y-1'>
                                  {order.items.map((item, idx) => (
                                    <li
                                      key={idx}
                                      className='text-sm flex items-center gap-2'
                                    >
                                      <div className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>

                      <CardFooter className='flex gap-2'>
                        <Button
                          onClick={() =>
                            markTableAsDelivered(tableGroup.orders)
                          }
                          className='flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700'
                        >
                          <CheckCircle className='h-4 w-4' />
                          Deliver Entire Table
                        </Button>
                        <Button
                          variant='outline'
                          onClick={() => {
                            // Individual order management - show details
                            toast({
                              title: 'Individual Order Management',
                              description:
                                'Click individual orders above to manage separately',
                            })
                          }}
                          className='gap-2'
                        >
                          <Package className='h-4 w-4' />
                          Manage Items
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className='flex items-center gap-2 mb-4'>
                <div className='w-3 h-3 bg-amber-500 rounded-full'></div>
                <h2 className='text-xl font-semibold'>
                  In Progress ({inProgressOrders.length})
                </h2>
              </div>

              {isLoading ? (
                <div className='space-y-4'>
                  {[1, 2, 3].map(i => (
                    <Card key={i} className='shadow-sm animate-pulse'>
                      <CardHeader className='h-24'></CardHeader>
                      <CardContent className='h-48'></CardContent>
                      <CardFooter className='h-16'></CardFooter>
                    </Card>
                  ))}
                </div>
              ) : inProgressOrders.length === 0 ? (
                <Card className='shadow-sm'>
                  <CardContent className='flex flex-col items-center justify-center p-12 text-center'>
                    <div className='rounded-full bg-secondary/50 p-4 mb-4'>
                      <ChefHat className='h-8 w-8 text-muted-foreground' />
                    </div>
                    <h3 className='text-xl font-medium mb-2'>
                      No Orders In Progress
                    </h3>
                    <p className='text-muted-foreground max-w-md'>
                      There are no orders currently being prepared in the
                      kitchen.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className='space-y-4'>
                  {inProgressOrders.map(order => (
                    <Card
                      key={order.id}
                      className='expo-order expo-order-waiting shadow-sm hover:shadow-md transition-shadow'
                    >
                      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2'>
                            <CardTitle>{order.table}</CardTitle>
                            <Badge
                              variant='outline'
                              className={`status-badge status-${order.status}`}
                            >
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1).replace('_', ' ')}
                            </Badge>
                          </div>
                          <CardDescription>Order {order.id}</CardDescription>
                        </div>
                        <div className='flex items-center gap-1 text-sm font-medium'>
                          <ChefHat className='h-4 w-4 text-muted-foreground' />
                          In Progress
                        </div>
                      </CardHeader>

                      <CardContent>
                        <ScrollArea className='h-[180px] pr-4'>
                          <ul className='space-y-2'>
                            {order.items.map((item, index) => (
                              <li key={index} className='space-y-1'>
                                <div className='flex items-center gap-2'>
                                  <div className='w-2 h-2 rounded-full bg-amber-500' />
                                  <p className='font-medium'>{item}</p>
                                </div>
                                {index < order.items.length - 1 && (
                                  <Separator className='mt-2' />
                                )}
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      </CardContent>

                      <CardFooter>
                        <div className='w-full py-2 bg-secondary/50 text-muted-foreground rounded-md text-center flex items-center justify-center gap-2'>
                          <Utensils className='h-4 w-4' />
                          Being Prepared
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Shell>
    </ProtectedRoute>
  )
}
