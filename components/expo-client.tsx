'use client'

import { Shell } from '@/components/shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useKDSOrders } from '@/hooks/use-kds-orders'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { useState } from 'react'
import { bumpOrder } from '@/lib/modassembly/supabase/database/kds'

type ExpoClientComponentProps = {
  user: {
    id: string
    email?: string
  }
  profile: {
    role: string | null
    name: string | null
  } | null
}

export function ExpoClientComponent({
  user,
  profile,
}: ExpoClientComponentProps) {
  const { orders, loading, error, refetch } = useKDSOrders({
    stationId: undefined, // Show all orders for expo
    autoRefresh: true,
  })
  const [bumpingOrders, setBumpingOrders] = useState<Set<string>>(new Set())

  const handleBumpOrder = async (routingId: string) => {
    if (bumpingOrders.has(routingId)) {return}

    setBumpingOrders(prev => new Set(prev).add(routingId))
    try {
      await bumpOrder(routingId, user.id)
      await refetch()
    } catch (error) {
      console.error('Error bumping order:', error)
    } finally {
      setBumpingOrders(prev => {
        const next = new Set(prev)
        next.delete(routingId)
        return next
      })
    }
  }

  const getTimeColor = (routedAt: string) => {
    const now = new Date()
    const routed = new Date(routedAt)
    const diffMinutes = (now.getTime() - routed.getTime()) / (1000 * 60)
    
    if (diffMinutes <= 5) {return 'text-green-400'}
    if (diffMinutes <= 10) {return 'text-yellow-400'}
    return 'text-red-400'
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) {return 'Just now'}
    if (diffMinutes < 60) {return `${diffMinutes}m ago`}
    const hours = Math.floor(diffMinutes / 60)
    return `${hours}h ${diffMinutes % 60}m ago`
  }

  return (
    <Shell user={user} profile={profile}>
      <div className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-white mb-2'>Expo Station</h1>
            <p className='text-gray-400'>Quality control and order dispatch</p>
          </div>
          <div className='text-sm text-gray-500'>
            <div>User: {user.email}</div>
            <div>Role: {profile?.role || 'N/A'}</div>
          </div>
        </div>

        {loading && (
          <Card className='bg-gray-800/40 border-gray-700'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-center'>
                <Clock className='w-6 h-6 text-gray-400 animate-spin mr-2' />
                <span className='text-gray-400'>Loading orders...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className='bg-red-900/20 border-red-700'>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <AlertTriangle className='w-6 h-6 text-red-400 mr-2' />
                <span className='text-red-400'>Error loading orders: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <div className='grid gap-4'>
            {orders.length === 0 ? (
              <Card className='bg-gray-800/40 border-gray-700'>
                <CardContent className='p-6'>
                  <div className='text-center text-gray-400'>
                    <CheckCircle2 className='w-12 h-12 mx-auto mb-4' />
                    <p>No orders pending for expo</p>
                    <p className='text-sm'>All orders are completed or in preparation</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              orders.map((orderRouting) => (
                <Card key={orderRouting.id} className='bg-gray-800/40 border-gray-700'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg text-white'>
                        {orderRouting.order?.table?.label || 'Unknown Table'} - Seat {orderRouting.order?.seat_id}
                      </CardTitle>
                      <div className='flex items-center gap-2'>
                        <Badge variant='outline' className='text-gray-300 border-gray-600'>
                          {orderRouting.station?.name || 'Unknown Station'}
                        </Badge>
                        <Badge 
                          variant={orderRouting.priority > 1 ? 'destructive' : 'secondary'}
                          className={orderRouting.priority > 1 ? 'bg-red-900/20 text-red-400' : 'bg-gray-700 text-gray-300'}
                        >
                          Priority {orderRouting.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className={getTimeColor(orderRouting.routed_at)}>
                        <Clock className='w-4 h-4 inline mr-1' />
                        {formatTime(orderRouting.routed_at)}
                      </span>
                      <span className='text-gray-400'>
                        Sequence #{orderRouting.sequence}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <div className='space-y-3'>
                      <div>
                        <h4 className='text-sm font-medium text-gray-300 mb-2'>Items</h4>
                        <div className='flex flex-wrap gap-1'>
                          {(orderRouting.order?.items || []).map((item, idx) => (
                            <Badge key={idx} variant='outline' className='text-xs text-gray-400 border-gray-600'>
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {orderRouting.notes && (
                        <div>
                          <h4 className='text-sm font-medium text-gray-300 mb-1'>Notes</h4>
                          <p className='text-sm text-gray-400'>{orderRouting.notes}</p>
                        </div>
                      )}

                      <div className='flex justify-end'>
                        <Button
                          onClick={() => handleBumpOrder(orderRouting.id)}
                          disabled={bumpingOrders.has(orderRouting.id)}
                          className='bg-green-600 hover:bg-green-700 text-white'
                        >
                          {bumpingOrders.has(orderRouting.id) ? (
                            <>
                              <Clock className='w-4 h-4 mr-2 animate-spin' />
                              Dispatching...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className='w-4 h-4 mr-2' />
                              Dispatch Order
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Shell>
  )
}
