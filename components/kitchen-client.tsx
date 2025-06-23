'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { getRealtimeManager } from '@/lib/realtime/session-aware-subscriptions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shell } from '@/components/shell'
import { AlertCircle, CheckCircle, Clock, Coffee, Utensils } from 'lucide-react'

interface OrderItem {
  id: string
  order_id: string
  station_name: string
  station_color: string
  table_label: string
  seat_id: string
  items: string[]
  status: string
  type: string
  created_at: string
  routed_at: string
}

type KitchenClientComponentProps = {
  user: {
    id: string
    email?: string
  }
  profile: {
    role: string | null
    name: string | null
  } | null
}

export function KitchenClientComponent({
  user,
  profile,
}: KitchenClientComponentProps) {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting')

  const supabase = createClient()

  const loadKitchenOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Query to get all active orders for kitchen display
      const { data: kdsData, error: kdsError } = await supabase
        .from('kds_order_routing')
        .select(
          `
          id,
          order_id,
          station_id,
          routed_at,
          completed_at,
          order:orders!inner (
            id, 
            items, 
            status, 
            type, 
            created_at,
            seat_id,
            table:tables!table_id (label)
          ),
          station:kds_stations!station_id (
            id, 
            name, 
            type, 
            color
          )
        `
        )
        .is('completed_at', null)
        .order('routed_at', { ascending: true })

      // Process KDS data

      if (kdsError) {
        console.error('[Kitchen] KDS query error:', kdsError)
        setError(`Database error: ${kdsError.message}`)
        return
      }

      // Transform data for display
      const transformedOrders: OrderItem[] = kdsData.map(item => ({
        id: item.id,
        order_id: item.order_id,
        station_name: (item.station as any)?.name || 'Unknown Station',
        station_color: (item.station as any)?.color || '#6b7280',
        table_label: (item.order as any)?.table?.label || 'Unknown Table',
        seat_id: (item.order as any)?.seat_id || '',
        items: Array.isArray((item.order as any)?.items)
          ? (item.order as any).items.map((orderItem: any) =>
              typeof orderItem === 'string'
                ? orderItem
                : orderItem.name || JSON.stringify(orderItem)
            )
          : [],
        status: (item.order as any)?.status || 'pending',
        type: (item.order as any)?.type || 'food',
        created_at: (item.order as any)?.created_at || '',
        routed_at: item.routed_at || '',
      }))

      setOrders(transformedOrders)
      setConnectionStatus('connected')
    } catch (err) {
      console.error('[Kitchen] Load error:', err)
      setError(
        `Failed to load orders: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const completeOrder = async (routingId: string) => {
    try {
      const { error } = await supabase
        .from('kds_order_routing')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', routingId)

      if (error) {
        console.error('Error completing order:', error)
        return
      }

      // Remove from local state
      setOrders(prev => prev.filter(order => order.id !== routingId))
    } catch (err) {
      console.error('Complete order error:', err)
    }
  }

  const getTimeSinceCreated = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60)
    )

    if (diffInMinutes < 1) {
      return 'Just now'
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    }
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ${diffInMinutes % 60}m ago`
  }

  const getUrgencyColor = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffInMinutes = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60)
    )

    if (diffInMinutes > 20) {
      return 'bg-red-500'
    }
    if (diffInMinutes > 10) {
      return 'bg-yellow-500'
    }
    return 'bg-green-500'
  }

  // Setup real-time subscription with session awareness
  useEffect(() => {
    let mounted = true
    let subscriptionIdKds: string | null = null
    let subscriptionIdOrders: string | null = null
    const realtimeManager = getRealtimeManager()

    const setupRealtimeSubscription = async () => {
      try {
        setConnectionStatus('connecting')
        
        // Subscribe to KDS order routing
        subscriptionIdKds = await realtimeManager.subscribe({
          table: 'kds_order_routing',
          event: '*',
          onData: (_payload) => {
            if (mounted) {
              loadKitchenOrders()
            }
          },
          onConnect: () => {
            if (mounted) {
              setConnectionStatus('connected')
              console.log('✅ [Kitchen] KDS real-time subscription connected')
            }
          },
          onDisconnect: () => {
            if (mounted) {
              setConnectionStatus('disconnected')
            }
          },
          onError: (error) => {
            console.error('❌ [Kitchen] KDS real-time error:', error)
            if (mounted) {
              setConnectionStatus('disconnected')
              setError(`Real-time connection error: ${error.message}`)
            }
          }
        })

        // Subscribe to orders table
        subscriptionIdOrders = await realtimeManager.subscribe({
          table: 'orders',
          event: '*',
          onData: (_payload) => {
            if (mounted) {
              loadKitchenOrders()
            }
          }
        })
      } catch (error) {
        console.error('Failed to setup real-time subscriptions:', error)
        if (mounted) {
          setConnectionStatus('disconnected')
          setError(`Failed to connect to real-time updates: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    // Initial load
    loadKitchenOrders()

    // Setup real-time
    setupRealtimeSubscription()

    return () => {
      mounted = false
      if (subscriptionIdKds) {
        realtimeManager.unsubscribe(subscriptionIdKds).catch(error =>
          console.error('Error unsubscribing KDS:', error)
        )
      }
      if (subscriptionIdOrders) {
        realtimeManager.unsubscribe(subscriptionIdOrders).catch(error =>
          console.error('Error unsubscribing Orders:', error)
        )
      }
    }
  }, [loadKitchenOrders])

  // Loading state
  if (loading) {
    return (
      <Shell user={user} profile={profile}>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-2'>Loading kitchen orders...</span>
        </div>
      </Shell>
    )
  }

  return (
    <Shell user={user} profile={profile}>
      <div className='container py-8 md:py-12'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-white mb-2'>
              Kitchen Display
            </h1>
            <p className='text-gray-400'>Active order queue for all stations</p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              <span className='text-sm text-gray-400 capitalize'>
                {connectionStatus}
              </span>
            </div>
            <Badge variant='outline' className='text-white border-gray-600'>
              {orders.length} Active Order{orders.length !== 1 ? 's' : ''}
            </Badge>
            <Button onClick={loadKitchenOrders} variant='outline' size='sm'>
              Refresh
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className='bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6'>
            <div className='flex items-center'>
              <AlertCircle className='h-5 w-5 text-red-400 mr-2' />
              <span className='text-red-200'>{error}</span>
            </div>
          </div>
        )}

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <Card className='bg-gray-900/50 border-gray-700'>
            <CardContent className='p-12'>
              <div className='text-center'>
                <CheckCircle className='h-16 w-16 text-green-500 mx-auto mb-4' />
                <h2 className='text-xl font-semibold text-white mb-2'>
                  All Caught Up!
                </h2>
                <p className='text-gray-400'>
                  No pending orders in the kitchen.
                </p>
                <p className='text-sm text-gray-500 mt-2'>
                  Orders will appear here automatically when they come in.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {orders.map(order => (
              <Card
                key={order.id}
                className='bg-gray-900/50 border-gray-700 border-l-4'
                style={{ borderLeftColor: order.station_color }}
              >
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg text-white'>
                      Table {order.table_label}
                      {order.seat_id && (
                        <span className='text-sm text-gray-400 ml-2'>
                          Seat {order.seat_id}
                        </span>
                      )}
                    </CardTitle>
                    <div className='flex items-center space-x-2'>
                      <div
                        className={`w-2 h-2 rounded-full ${getUrgencyColor(order.created_at)}`}
                        title='Order urgency indicator'
                      />
                      <Badge
                        variant='secondary'
                        style={{
                          backgroundColor: `${order.station_color}20`,
                          color: order.station_color,
                        }}
                      >
                        {order.station_name}
                      </Badge>
                    </div>
                  </div>
                  <div className='flex items-center text-sm text-gray-400'>
                    <Clock className='h-4 w-4 mr-1' />
                    {getTimeSinceCreated(order.created_at)}
                  </div>
                </CardHeader>
                <CardContent className='pt-0'>
                  <div className='space-y-2 mb-4'>
                    {order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div
                          key={index}
                          className='bg-gray-800/50 rounded px-3 py-2'
                        >
                          <span className='text-sm font-medium text-white'>
                            {item}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className='text-sm text-gray-500 italic'>
                        No items listed
                      </div>
                    )}
                  </div>

                  <div className='flex justify-between items-center'>
                    <Badge
                      variant={order.type === 'food' ? 'default' : 'secondary'}
                    >
                      <div className='flex items-center space-x-1'>
                        {order.type === 'food' ? (
                          <Utensils className='h-3 w-3' />
                        ) : (
                          <Coffee className='h-3 w-3' />
                        )}
                        <span>{order.type}</span>
                      </div>
                    </Badge>
                    <Button
                      onClick={() => completeOrder(order.id)}
                      size='sm'
                      className='bg-green-600 hover:bg-green-700'
                    >
                      Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className='mt-8 bg-gray-900/30 rounded-lg p-4'>
            <h3 className='text-sm font-medium text-gray-300 mb-2'>
              Debug Info
            </h3>
            <div className='text-xs text-gray-400 space-y-1'>
              <div>User: {user.email}</div>
              <div>Role: {profile?.role || 'null'}</div>
              <div>Orders Loaded: {orders.length}</div>
              <div>Connection: {connectionStatus}</div>
              <div>Last Updated: {new Date().toLocaleTimeString()}</div>
              <div>Error: {error || 'None'}</div>
              {orders.length > 0 && (
                <div>
                  <div className='font-medium text-gray-300 mt-2'>
                    Sample Order:
                  </div>
                  <div>Station: {orders[0].station_name}</div>
                  <div>Table: {orders[0].table_label}</div>
                  <div>Items: {orders[0].items.join(', ')}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}
