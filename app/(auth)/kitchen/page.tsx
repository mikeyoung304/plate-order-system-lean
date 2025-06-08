'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { useAuth } from '@/lib/modassembly/supabase/auth/auth-context'
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

export default function KitchenPage() {
  const { profile, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')

  const supabase = createClient()

  const loadKitchenOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Loading kitchen orders

      // Query to get all active orders with seat information  
      const { data: kdsData, error: kdsError } = await supabase
        .from('kds_order_routing')
        .select(`
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
            table:tables!table_id (label),
            seat:seats!seat_id (label)
          ),
          station:kds_stations!station_id (
            id, 
            name, 
            type, 
            color
          )
        `)
        .is('completed_at', null)
        .order('routed_at', { ascending: true })

      if (kdsError) {
        console.error('[Kitchen] KDS query error:', kdsError)
        setError(`Database error: ${kdsError.message}`)
        return
      }

      // Raw KDS data loaded

      // Transform data for display
      const transformedOrders: OrderItem[] = kdsData.map(item => ({
        id: item.id,
        order_id: item.order_id,
        station_name: (item.station as any)?.name || 'Unknown Station',
        station_color: (item.station as any)?.color || '#6b7280',
        table_label: (item.order as any)?.table?.label || 'Unknown Table',
        seat_id: (item.order as any)?.seat?.label?.toString() || 'Unknown Seat',
        items: Array.isArray((item.order as any)?.items) ? (item.order as any).items : [],
        status: (item.order as any)?.status || 'pending',
        type: (item.order as any)?.type || 'food',
        created_at: (item.order as any)?.created_at || '',
        routed_at: item.routed_at || ''
      }))

      // Orders transformed for display

      setOrders(transformedOrders)
      setConnectionStatus('connected')

    } catch (err) {
      console.error('[Kitchen] Load error:', err)
      setError(`Failed to load orders: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const completeOrder = async (routingId: string, orderId: string) => {
    try {
      console.log('[Kitchen] Completing order:', { routingId, orderId })
      
      // Mark the KDS routing as completed (removes from kitchen view)
      const { error: routingError } = await supabase
        .from('kds_order_routing')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', routingId)

      if (routingError) {
        console.error('Error completing KDS routing:', routingError)
        return
      }

      // Update order status to 'ready' (sends to expo)
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', orderId)

      if (orderError) {
        console.error('Error updating order status:', orderError)
        return
      }

      // Remove from local state with animation
      setOrders(prev => prev.filter(order => order.id !== routingId))
      
      // Order completed and sent to expo
    } catch (err) {
      console.error('Complete order error:', err)
    }
  }

  const completeTable = async (tableOrders: OrderItem[]) => {
    try {
      // Completing entire table
      
      // Complete all KDS routing entries for this table
      const routingPromises = tableOrders.map(order => 
        supabase
          .from('kds_order_routing')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', order.id)
      )

      // Update all order statuses to 'ready'
      const orderPromises = tableOrders.map(order => 
        supabase
          .from('orders')
          .update({ status: 'ready' })
          .eq('id', order.order_id)
      )

      await Promise.all([...routingPromises, ...orderPromises])

      // Remove all table orders from local state
      const completedIds = tableOrders.map(order => order.id)
      setOrders(prev => prev.filter(order => !completedIds.includes(order.id)))
      
      // Entire table completed and sent to expo
    } catch (err) {
      console.error('Complete table error:', err)
    }
  }

  const getTimeSinceCreated = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {return 'Just now'}
    if (diffInMinutes < 60) {return `${diffInMinutes}m ago`}
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ${diffInMinutes % 60}m ago`
  }

  const getUrgencyColor = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    
    if (diffInMinutes > 20) {return 'bg-red-500'}
    if (diffInMinutes > 10) {return 'bg-yellow-500'}
    return 'bg-green-500'
  }

  // Setup real-time subscription
  useEffect(() => {
    let mounted = true

    const setupRealtimeSubscription = () => {
      // Setting up real-time subscription
      
      const channel = supabase
        .channel('kitchen-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kds_order_routing'
          },
          _payload => {
            // Real-time KDS update received
            if (mounted) {
              loadKitchenOrders()
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          _payload => {
            // Orders table update received
            if (mounted) {
              loadKitchenOrders()
            }
          }
        )
        .subscribe()

      return () => {
        // Cleaning up subscription
        supabase.removeChannel(channel)
      }
    }

    // Initial load
    loadKitchenOrders()

    // Setup real-time
    const cleanup = setupRealtimeSubscription()

    return () => {
      mounted = false
      cleanup()
    }
  }, [loadKitchenOrders, supabase])

  // Group orders by table and then by seat within each table
  const ordersByTable = orders.reduce((acc, order) => {
    const tableId = order.table_label
    if (!acc[tableId]) {
      acc[tableId] = []
    }
    acc[tableId].push(order)
    return acc
  }, {} as Record<string, OrderItem[]>)

  // Sort orders within each table by seat number
  Object.keys(ordersByTable).forEach(tableId => {
    ordersByTable[tableId].sort((a, b) => {
      const seatA = parseInt(a.seat_id) || 0
      const seatB = parseInt(b.seat_id) || 0
      return seatA - seatB
    })
  })

  // Loading state
  if (authLoading || loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <span className="text-white text-lg">Loading kitchen orders...</span>
          </div>
        </div>
      </Shell>
    )
  }

  // Auth check
  if (!profile) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-400">Please log in to access the kitchen display.</p>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="p-6 h-full overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Kitchen Display System</h1>
              <p className="text-gray-300">Unified view - all stations</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-300 capitalize">{connectionStatus}</span>
              </div>
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {orders.length} Active Order{orders.length !== 1 ? 's' : ''}
              </Badge>
              <Button 
                onClick={loadKitchenOrders}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Orders by Table */}
        {Object.keys(ordersByTable).length === 0 ? (
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">All Caught Up!</h2>
              <p className="text-gray-300">No pending orders in the kitchen.</p>
              <p className="text-sm text-gray-400 mt-2">
                Orders will appear here automatically when they come in.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(ordersByTable).map(([tableLabel, tableOrders]) => (
              <Card key={tableLabel} className="bg-gray-800/40 border-gray-700 hover:bg-gray-800/60 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <Utensils className="h-5 w-5" />
                      Table {tableLabel}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-600">
                      {tableOrders.length} order{tableOrders.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tableOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 transition-all duration-300 hover:bg-gray-900/70"
                      style={{ borderLeftWidth: '4px', borderLeftColor: order.station_color }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-blue-600/20 text-blue-300 border-blue-600 font-semibold">
                            Seat {order.seat_id}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-2 py-1"
                            style={{ backgroundColor: `${order.station_color  }20`, color: order.station_color }}
                          >
                            {order.station_name}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            {order.type === 'food' ? (
                              <Utensils className="h-4 w-4 text-orange-400" />
                            ) : (
                              <Coffee className="h-4 w-4 text-blue-400" />
                            )}
                            <span className="text-xs text-gray-400">{order.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div 
                            className={`w-2 h-2 rounded-full ${getUrgencyColor(order.created_at)}`}
                            title="Order urgency indicator"
                          />
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTimeSinceCreated(order.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {order.items.length > 0 ? (
                          order.items.map((item, index) => (
                            <div key={index} className="bg-gray-800/50 rounded px-3 py-2">
                              <span className="text-sm text-white font-medium">{item}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 italic">No items listed</div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => completeOrder(order.id, order.order_id)}
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors"
                      >
                        Complete & Send to Expo
                      </Button>
                    </div>
                  ))}
                  
                  {/* Complete Table Button */}
                  <div className="pt-4 border-t border-gray-600">
                    <Button
                      onClick={() => completeTable(tableOrders)}
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                    >
                      Complete Entire Table ({tableOrders.length} orders)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-400 space-y-1">
              <div>User Role: {profile?.role || 'null'}</div>
              <div>Orders Loaded: {orders.length}</div>
              <div>Tables: {Object.keys(ordersByTable).length}</div>
              <div>Connection: {connectionStatus}</div>
              <div>Last Updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}