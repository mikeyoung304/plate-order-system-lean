'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { useAuth } from '@/lib/modassembly/supabase/auth/auth-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shell } from '@/components/shell'
import { CheckCircle, Clock, Coffee, Plus, Users, Utensils } from 'lucide-react'

interface Table {
  id: string
  label: string
  status: string
  seat_count: number
  orders: Order[]
}

interface Order {
  id: string
  items: string[]
  status: string
  type: string
  created_at: string
  seat_label: string
}

export default function SimpleServerPage() {
  const { profile, isLoading: authLoading } = useAuth()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)

  const supabase = createClient()

  const loadTables = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Loading tables and orders

      // Get tables with orders
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select(`
          id,
          label,
          status,
          orders:orders!table_id (
            id,
            items,
            status,
            type,
            created_at,
            seat:seats!seat_id (label)
          )
        `)
        .order('label', { ascending: true })

      if (tablesError) {
        console.error('[ServerPage] Tables query error:', tablesError)
        setError(`Database error: ${tablesError.message}`)
        return
      }

      // Raw tables data loaded

      // Transform tables data
      const transformedTables: Table[] = tablesData.map(table => ({
        id: table.id,
        label: table.label,
        status: table.status || 'available',
        seat_count: 4, // Default seat count
        orders: (table.orders || [])
          .filter((order: any) => order.status !== 'delivered')
          .map((order: any) => ({
            id: order.id,
            items: Array.isArray(order.items) ? order.items : [],
            status: order.status,
            type: order.type,
            created_at: order.created_at,
            seat_label: order.seat?.label?.toString() || 'Unknown'
          }))
      }))

      // Tables transformed with positioning
      setTables(transformedTables)

    } catch (err) {
      console.error('[ServerPage] Load error:', err)
      setError(`Failed to load tables: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const getTableStatusColor = (table: Table) => {
    if (table.orders.length === 0) {return 'bg-gray-600'}
    
    const hasNew = table.orders.some(o => o.status === 'new')
    const hasInProgress = table.orders.some(o => o.status === 'in_progress')
    const allReady = table.orders.every(o => o.status === 'ready')
    
    if (hasNew) {return 'bg-blue-600'}
    if (hasInProgress) {return 'bg-yellow-600'}
    if (allReady) {return 'bg-green-600'}
    return 'bg-gray-600'
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

  const createNewOrder = async (tableId: string, seatNumber: number) => {
    try {
      // This would open a voice order panel or form
      console.log('[ServerPage] Creating new order for table', tableId, 'seat', seatNumber)
      // For now, just show a message
      alert(`Create new order for Table ${tables.find(t => t.id === tableId)?.label}, Seat ${seatNumber}`)
    } catch (err) {
      console.error('Error creating order:', err)
    }
  }

  // Setup real-time subscription
  useEffect(() => {
    let mounted = true

    const setupRealtimeSubscription = () => {
      // Setting up real-time subscription
      
      const channel = supabase
        .channel('server-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          payload => {
            // Orders updated via real-time
            if (mounted) {
              loadTables()
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
    loadTables()

    // Setup real-time
    const cleanup = setupRealtimeSubscription()

    return () => {
      mounted = false
      cleanup()
    }
  }, [loadTables, supabase])

  // Loading state
  if (authLoading || loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <span className="text-white text-lg">Loading restaurant floor...</span>
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
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-400">Please log in to access the server interface.</p>
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
              <h1 className="text-3xl font-bold text-white mb-2">Server Station</h1>
              <p className="text-gray-300">Table management and order taking</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {tables.length} Tables
              </Badge>
              <Button 
                onClick={loadTables}
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
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table Grid */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Restaurant Floor</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {tables.map((table) => (
                <Card 
                  key={table.id} 
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                    selectedTable?.id === table.id 
                      ? 'bg-blue-800/40 border-blue-500' 
                      : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800/60'
                  }`}
                  onClick={() => setSelectedTable(table)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div 
                        className={`w-8 h-8 rounded-full ${getTableStatusColor(table)} flex items-center justify-center`}
                      >
                        <span className="text-white font-bold text-sm">{table.label}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      Table {table.label}
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-xs">
                      <Users className="h-3 w-3" />
                      <span className="text-gray-400">{table.seat_count} seats</span>
                    </div>
                    {table.orders.length > 0 && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {table.orders.length} order{table.orders.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected Table Details */}
          <div>
            {selectedTable ? (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  Table {selectedTable.label} Details
                </h2>
                
                {selectedTable.orders.length === 0 ? (
                  <Card className="bg-gray-800/40 border-gray-700">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Table Available</h3>
                      <p className="text-gray-400 mb-4">No active orders</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map(seatNum => (
                          <Button
                            key={seatNum}
                            onClick={() => createNewOrder(selectedTable.id, seatNum)}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Seat {seatNum}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {selectedTable.orders.map((order) => (
                      <Card key={order.id} className="bg-gray-800/40 border-gray-700">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                              Seat {order.seat_label}
                              {order.type === 'food' ? (
                                <Utensils className="h-4 w-4 text-orange-400" />
                              ) : (
                                <Coffee className="h-4 w-4 text-blue-400" />
                              )}
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={
                                  order.status === 'new' ? 'default' :
                                  order.status === 'in_progress' ? 'secondary' :
                                  order.status === 'ready' ? 'default' : 'outline'
                                }
                                className={
                                  order.status === 'new' ? 'bg-blue-600' :
                                  order.status === 'in_progress' ? 'bg-yellow-600' :
                                  order.status === 'ready' ? 'bg-green-600' : ''
                                }
                              >
                                {order.status === 'new' ? 'New' :
                                 order.status === 'in_progress' ? 'Cooking' :
                                 order.status === 'ready' ? 'Ready' : order.status}
                              </Badge>
                              <div className="flex items-center text-xs text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {getTimeSinceCreated(order.created_at)}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="bg-gray-900/50 rounded px-3 py-2">
                                <span className="text-sm text-white">{item}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card className="bg-gray-800/40 border-gray-700">
                <CardContent className="p-12 text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Select a Table</h3>
                  <p className="text-gray-400">Click on a table to view details and take orders</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-400 space-y-1">
              <div>User Role: {profile?.role || 'null'}</div>
              <div>Tables Loaded: {tables.length}</div>
              <div>Selected Table: {selectedTable?.label || 'none'}</div>
              <div>Last Updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}