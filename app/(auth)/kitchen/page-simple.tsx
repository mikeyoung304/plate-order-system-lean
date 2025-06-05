'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { useAuth } from '@/lib/modassembly/supabase/auth/auth-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface OrderItem {
  id: string
  order_id: string
  station_name: string
  station_color: string
  table_label: string
  items: string[]
  status: string
  type: string
  created_at: string
  routed_at: string
}

export default function SimpleKitchenPage() {
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

      console.log('[SimpleKitchen] Loading orders...')

      // Simple query to get all active orders
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
            table:tables!table_id (label)
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
        console.error('[SimpleKitchen] KDS query error:', kdsError)
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
      console.error('[SimpleKitchen] Load error:', err)
      setError(`Failed to load orders: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
        .channel('kitchen-orders-simple')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kds_order_routing'
          },
          payload => {
            // Real-time update received
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
          payload => {
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

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading kitchen orders...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Auth check
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600">Please log in to access the kitchen display.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kitchen Display - Simple View</h1>
              <p className="text-gray-600">All stations, unified display</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
              </div>
              <Badge variant="outline">
                {orders.length} Active Order{orders.length !== 1 ? 's' : ''}
              </Badge>
              <Button 
                onClick={loadKitchenOrders}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h2>
              <p className="text-gray-600">No pending orders in the kitchen.</p>
              <p className="text-sm text-gray-500 mt-2">
                Orders will appear here automatically when they come in.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-l-4" style={{ borderLeftColor: order.station_color }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Table {order.table_label}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${getUrgencyColor(order.created_at)}`}
                        title="Order urgency indicator"
                      />
                      <Badge 
                        variant="secondary" 
                        style={{ backgroundColor: `${order.station_color  }20`, color: order.station_color }}
                      >
                        {order.station_name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {getTimeSinceCreated(order.created_at)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded px-3 py-2">
                          <span className="text-sm font-medium">{item}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">No items listed</div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Badge variant={order.type === 'food' ? 'default' : 'secondary'}>
                      {order.type}
                    </Badge>
                    <Button
                      onClick={() => completeOrder(order.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
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
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>User Role: {profile?.role || 'null'}</div>
              <div>Orders Loaded: {orders.length}</div>
              <div>Connection: {connectionStatus}</div>
              <div>Last Updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}