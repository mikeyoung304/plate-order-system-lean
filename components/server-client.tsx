'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import { createOrder } from '@/lib/modassembly/supabase/database/orders'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shell } from '@/components/shell'
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Plus,
  User,
  Utensils,
} from 'lucide-react'
import { VoiceOrderPanel } from '@/components/voice-order-panel'

interface Table {
  id: string
  label: string
  status: string
  seat_count: number
  orders: Order[]
  position: { x: number; y: number }
  shape: 'round' | 'square' | 'rectangle'
  size: { width: number; height: number }
}

interface Order {
  id: string
  items: string[]
  status: string
  type: string
  created_at: string
  seat_label: string
}

interface Resident {
  id: string
  name: string
  dietaryRestrictions?: string[]
  favoriteSeats: string[] // table-seat combinations like "1-2"
  mealPreferences: MealPreference[]
}

interface MealPreference {
  dish: string
  mealTime: 'breakfast' | 'lunch' | 'dinner'
  frequency: number // how often they order this (1-10)
  lastOrdered?: string
}

interface OrderStep {
  step: 'resident' | 'meal'
  selectedResident?: Resident
}

type ServerClientComponentProps = {
  user: {
    id: string
    email?: string
  }
  profile: {
    role: string | null
    name: string | null
  } | null
}

// Helper function to safely render order items
const getItemDisplayName = (item: any): string => {
  if (typeof item === 'string') {
    return item
  }
  if (item && typeof item === 'object') {
    return (
      item.name ||
      item.title ||
      `${item.category || ''} item`.trim() ||
      'Unknown item'
    )
  }
  return String(item || 'Unknown item')
}

export function ServerClientComponent({
  user,
  profile,
}: ServerClientComponentProps) {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderFormData, setOrderFormData] = useState<{
    tableId: string
    seatNumber: number
    tableName: string
  } | null>(null)
  const [orderStep, setOrderStep] = useState<OrderStep>({ step: 'resident' })
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [showVoiceRecording, setShowVoiceRecording] = useState(false)

  const supabase = createClient()

  // Mock resident data for demo
  const mockResidents: Resident[] = [
    {
      id: '1',
      name: 'Salazar Saladbar',
      dietaryRestrictions: ['vegetarian'],
      favoriteSeats: ['5-1', '5-2'],
      mealPreferences: [
        {
          dish: 'Grilled Chicken Caesar Salad',
          mealTime: 'dinner',
          frequency: 9,
        },
        { dish: 'Mediterranean Quinoa Bowl', mealTime: 'lunch', frequency: 7 },
        {
          dish: 'Avocado Toast with Eggs',
          mealTime: 'breakfast',
          frequency: 8,
        },
      ],
    },
    {
      id: '2',
      name: 'Margaret Meatloaf',
      favoriteSeats: ['1-1', '1-3', '2-1'],
      mealPreferences: [
        {
          dish: 'Classic Meatloaf with Mashed Potatoes',
          mealTime: 'dinner',
          frequency: 10,
        },
        { dish: 'Beef Stew', mealTime: 'lunch', frequency: 8 },
        { dish: 'Pancakes with Bacon', mealTime: 'breakfast', frequency: 9 },
      ],
    },
    {
      id: '3',
      name: 'Frank Fisherman',
      favoriteSeats: ['3-2', '4-1'],
      mealPreferences: [
        { dish: 'Grilled Salmon with Rice', mealTime: 'dinner', frequency: 9 },
        { dish: 'Fish and Chips', mealTime: 'lunch', frequency: 8 },
        { dish: 'Tuna Sandwich', mealTime: 'breakfast', frequency: 6 },
      ],
    },
    {
      id: '4',
      name: 'Betty Burger',
      favoriteSeats: ['2-2', '3-1'],
      mealPreferences: [
        { dish: 'Cheeseburger with Fries', mealTime: 'dinner', frequency: 8 },
        { dish: 'Chicken Burger', mealTime: 'lunch', frequency: 7 },
        { dish: 'Breakfast Burger', mealTime: 'breakfast', frequency: 5 },
      ],
    },
  ]

  const getCurrentMealTime = (): 'breakfast' | 'lunch' | 'dinner' => {
    const hour = new Date().getHours()
    if (hour < 11) {
      return 'breakfast'
    }
    if (hour < 17) {
      return 'lunch'
    }
    return 'dinner'
  }

  const getSuggestedResidents = (
    tableLabel: string,
    seatNumber: number
  ): Resident[] => {
    const seatKey = `${tableLabel}-${seatNumber}`

    // Find residents who frequently sit in this seat
    const primaryResidents = mockResidents
      .filter(r => r.favoriteSeats.includes(seatKey))
      .sort((a, b) => {
        const aIndex = a.favoriteSeats.indexOf(seatKey)
        const bIndex = b.favoriteSeats.indexOf(seatKey)
        return aIndex - bIndex
      })

    // Add other residents from the same table as secondary options
    const tableResidents = mockResidents.filter(
      r =>
        r.favoriteSeats.some(seat => seat.startsWith(`${tableLabel}-`)) &&
        !primaryResidents.includes(r)
    )

    return [...primaryResidents, ...tableResidents].slice(0, 3)
  }

  const getSuggestedMeals = (resident: Resident): MealPreference[] => {
    const currentMeal = getCurrentMealTime()
    return resident.mealPreferences
      .filter(pref => pref.mealTime === currentMeal)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)
  }

  const loadTables = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get tables with orders
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select(
          `
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
        `
        )
        .order('label', { ascending: true })

      if (tablesError) {
        console.error('[ServerClient] Tables query error:', tablesError)
        setError(`Database error: ${tablesError.message}`)
        return
      }

      // Demo restaurant layout positions
      const demoPositions = [
        {
          x: 50,
          y: 80,
          shape: 'round' as const,
          size: { width: 80, height: 80 },
          seats: 4,
        },
        {
          x: 180,
          y: 80,
          shape: 'round' as const,
          size: { width: 80, height: 80 },
          seats: 4,
        },
        {
          x: 310,
          y: 80,
          shape: 'square' as const,
          size: { width: 90, height: 90 },
          seats: 4,
        },
        {
          x: 450,
          y: 80,
          shape: 'square' as const,
          size: { width: 80, height: 80 },
          seats: 2,
        },
        {
          x: 50,
          y: 220,
          shape: 'rectangle' as const,
          size: { width: 120, height: 80 },
          seats: 6,
        },
        {
          x: 220,
          y: 220,
          shape: 'rectangle' as const,
          size: { width: 120, height: 80 },
          seats: 6,
        },
        {
          x: 390,
          y: 220,
          shape: 'round' as const,
          size: { width: 100, height: 100 },
          seats: 8,
        },
        {
          x: 150,
          y: 380,
          shape: 'round' as const,
          size: { width: 100, height: 100 },
          seats: 8,
        },
      ]

      // Transform tables data with demo positioning
      const transformedTables: Table[] = tablesData.map((table, index) => {
        const demoPos = demoPositions[index] || demoPositions[0]
        return {
          id: table.id,
          label: table.label,
          status: table.status || 'available',
          seat_count: demoPos.seats,
          position: { x: demoPos.x, y: demoPos.y },
          shape: demoPos.shape,
          size: demoPos.size,
          orders: (table.orders || [])
            .filter((order: any) => order.status !== 'delivered')
            .map((order: any) => ({
              id: order.id,
              items: Array.isArray(order.items) ? order.items : [],
              status: order.status,
              type: order.type,
              created_at: order.created_at,
              seat_label: order.seat?.label?.toString() || 'Unknown',
            })),
        }
      })

      setTables(transformedTables)
    } catch (err) {
      console.error('[ServerClient] Load error:', err)
      setError(
        `Failed to load tables: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const getTableStatusColor = (table: Table) => {
    if (table.orders.length === 0) {
      return 'bg-gray-600'
    }

    const hasNew = table.orders.some(o => o.status === 'new')
    const hasInProgress = table.orders.some(o => o.status === 'in_progress')
    const allReady = table.orders.every(o => o.status === 'ready')

    if (hasNew) {
      return 'bg-blue-600'
    }
    if (hasInProgress) {
      return 'bg-yellow-600'
    }
    if (allReady) {
      return 'bg-green-600'
    }
    return 'bg-gray-600'
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

  const createNewOrder = async (tableId: string, seatNumber: number) => {
    try {
      const table = tables.find(t => t.id === tableId)
      if (!table) {
        return
      }

      setOrderFormData({
        tableId,
        seatNumber,
        tableName: table.label,
      })
      setShowOrderForm(true)
    } catch (err) {
      console.error('Error opening order form:', err)
    }
  }

  const handleCloseOrderForm = () => {
    setShowOrderForm(false)
    setOrderFormData(null)
    setOrderStep({ step: 'resident' })
    setCurrentSuggestionIndex(0)
  }

  const handleSelectResident = (resident: Resident) => {
    setOrderStep({ step: 'meal', selectedResident: resident })
    setCurrentSuggestionIndex(0)
  }

  const handleSelectMeal = async (meal: string) => {
    if (!orderFormData || !orderStep.selectedResident) {
      return
    }

    try {
      // Get current user ID for server_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No authenticated user')
        return
      }

      // Get seat_id from seat number
      const { data: seatData } = await supabase
        .from('seats')
        .select('id')
        .eq('table_id', orderFormData.tableId)
        .eq('label', orderFormData.seatNumber)
        .single()

      if (!seatData) {
        throw new Error('Seat not found')
      }

      // Create the order in the database
      await createOrder({
        table_id: orderFormData.tableId,
        seat_id: seatData.id,
        resident_id: orderStep.selectedResident.id,
        server_id: user.id,
        items: [meal],
        transcript: `Order for ${meal}`,
        type: 'food'
      })

      // Close form and reload tables to show updated order
      handleCloseOrderForm()
      loadTables()
    } catch (err) {
      console.error('Error creating order:', err)
    }
  }

  // Setup real-time subscription
  useEffect(() => {
    let mounted = true

    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel('server-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          _payload => {
            if (mounted) {
              loadTables()
            }
          }
        )
        .subscribe()

      return () => {
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
  if (loading) {
    return (
      <Shell user={user} profile={profile}>
        <div className='flex items-center justify-center h-screen'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4'></div>
            <span className='text-white text-lg'>
              Loading restaurant floor...
            </span>
          </div>
        </div>
      </Shell>
    )
  }

  // Error state
  if (error) {
    return (
      <Shell user={user} profile={profile}>
        <div className='flex items-center justify-center h-screen'>
          <div className='text-center text-red-400'>
            <div className='mb-4'>Error loading tables</div>
            <div className='text-sm'>{error}</div>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell user={user} profile={profile}>
      <div className='p-6 h-full overflow-auto'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-white mb-2'>
                Server Station
              </h1>
              <p className='text-gray-300'>Table management and order taking</p>
            </div>
            <div className='flex items-center space-x-4'>
              <Badge
                variant='outline'
                className='border-gray-600 text-gray-300'
              >
                {tables.length} Tables
              </Badge>
              <Button
                onClick={loadTables}
                variant='outline'
                size='sm'
                className='border-gray-600 text-gray-300 hover:bg-gray-800'
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className='bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6'>
            <div className='flex items-center'>
              <span className='text-red-300'>{error}</span>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Restaurant Floor Plan - Overhead View */}
          <div>
            <h2 className='text-xl font-bold text-white mb-4'>
              Restaurant Floor Plan
            </h2>
            <div
              className='relative bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700 rounded-lg p-6'
              style={{ minHeight: '500px', minWidth: '600px' }}
            >
              {/* Restaurant Elements */}

              {/* Kitchen Area */}
              <div className='absolute top-4 right-4 bg-red-900/30 border border-red-700 rounded-lg p-3'>
                <div className='text-xs text-red-300 font-semibold'>
                  KITCHEN
                </div>
              </div>

              {/* Bar Area */}
              <div className='absolute bottom-4 left-4 bg-amber-900/30 border border-amber-700 rounded-lg p-2 w-32 h-12'>
                <div className='text-xs text-amber-300 font-semibold'>BAR</div>
              </div>

              {/* Entrance */}
              <div className='absolute bottom-4 right-4 bg-green-900/30 border border-green-700 rounded-lg p-2'>
                <div className='text-xs text-green-300 font-semibold'>
                  ENTRANCE
                </div>
              </div>

              {/* Tables with Overhead Positioning */}
              {tables.map(table => {
                const isSelected = selectedTable?.id === table.id
                const statusColor = getTableStatusColor(table)

                return (
                  <div
                    key={table.id}
                    className={`absolute cursor-pointer transition-all duration-200 hover:scale-110 ${
                      isSelected ? 'ring-2 ring-blue-400 ring-opacity-75' : ''
                    }`}
                    style={{
                      left: table.position.x,
                      top: table.position.y,
                      width: table.size.width,
                      height: table.size.height,
                    }}
                    onClick={() => setSelectedTable(table)}
                  >
                    {/* Table Shape */}
                    <div
                      className={`w-full h-full flex items-center justify-center border-2 border-gray-600 ${statusColor} shadow-lg hover:shadow-xl transition-all duration-200 ${
                        table.shape === 'round'
                          ? 'rounded-full'
                          : table.shape === 'square'
                            ? 'rounded-lg'
                            : 'rounded-xl'
                      }`}
                    >
                      {/* Table Number */}
                      <div className='text-center'>
                        <div className='text-white font-bold text-lg'>
                          {table.label}
                        </div>
                        <div className='text-xs text-gray-200'>
                          {table.seat_count} seats
                        </div>
                      </div>
                    </div>

                    {/* Order Count Badge */}
                    {table.orders.length > 0 && (
                      <div className='absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'>
                        {table.orders.length}
                      </div>
                    )}

                    {/* Chair/Seat Indicators */}
                    {table.shape === 'round' && (
                      <>
                        <div className='absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-gray-700 rounded-t'></div>
                        <div className='absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-gray-700 rounded-b'></div>
                        <div className='absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-3 bg-gray-700 rounded-l'></div>
                        <div className='absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-3 bg-gray-700 rounded-r'></div>
                      </>
                    )}

                    {table.shape === 'rectangle' && (
                      <>
                        <div className='absolute -top-1 left-2 w-3 h-2 bg-gray-700 rounded-t'></div>
                        <div className='absolute -top-1 right-2 w-3 h-2 bg-gray-700 rounded-t'></div>
                        <div className='absolute -bottom-1 left-2 w-3 h-2 bg-gray-700 rounded-b'></div>
                        <div className='absolute -bottom-1 right-2 w-3 h-2 bg-gray-700 rounded-b'></div>
                        <div className='absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-3 bg-gray-700 rounded-l'></div>
                        <div className='absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-3 bg-gray-700 rounded-r'></div>
                      </>
                    )}
                  </div>
                )
              })}

              {/* Floor Plan Legend */}
              <div className='absolute top-4 left-4 bg-gray-800/50 border border-gray-600 rounded-lg p-3 text-xs'>
                <div className='text-white font-semibold mb-2'>
                  Status Legend
                </div>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <div className='w-3 h-3 rounded bg-gray-600'></div>
                    <span className='text-gray-300'>Available</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-3 h-3 rounded bg-blue-600'></div>
                    <span className='text-gray-300'>New Orders</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-3 h-3 rounded bg-yellow-600'></div>
                    <span className='text-gray-300'>Cooking</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-3 h-3 rounded bg-green-600'></div>
                    <span className='text-gray-300'>Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Table Details */}
          <div>
            {selectedTable ? (
              <div>
                <h2 className='text-xl font-bold text-white mb-4'>
                  Table {selectedTable.label} Details
                </h2>

                {selectedTable.orders.length === 0 ? (
                  <Card className='bg-gray-800/40 border-gray-700'>
                    <CardContent className='p-6 text-center'>
                      <CheckCircle className='h-12 w-12 text-green-400 mx-auto mb-4' />
                      <h3 className='text-lg font-semibold text-white mb-2'>
                        Table Available
                      </h3>
                      <p className='text-gray-400 mb-4'>No active orders</p>
                      <div className='grid grid-cols-2 gap-2'>
                        {[1, 2, 3, 4].map(seatNum => (
                          <Button
                            key={seatNum}
                            onClick={() =>
                              createNewOrder(selectedTable.id, seatNum)
                            }
                            variant='outline'
                            size='sm'
                            className='border-gray-600 text-gray-300 hover:bg-gray-700'
                          >
                            <Plus className='h-4 w-4 mr-1' />
                            Seat {seatNum}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className='space-y-4'>
                    {selectedTable.orders.map(order => (
                      <Card
                        key={order.id}
                        className='bg-gray-800/40 border-gray-700'
                      >
                        <CardHeader className='pb-3'>
                          <div className='flex items-center justify-between'>
                            <CardTitle className='text-lg text-white flex items-center gap-2'>
                              Seat {order.seat_label}
                              {order.type === 'food' ? (
                                <Utensils className='h-4 w-4 text-orange-400' />
                              ) : (
                                <Coffee className='h-4 w-4 text-blue-400' />
                              )}
                            </CardTitle>
                            <div className='flex items-center space-x-2'>
                              <Badge
                                variant={
                                  order.status === 'new'
                                    ? 'default'
                                    : order.status === 'in_progress'
                                      ? 'secondary'
                                      : order.status === 'ready'
                                        ? 'default'
                                        : 'outline'
                                }
                                className={
                                  order.status === 'new'
                                    ? 'bg-blue-600'
                                    : order.status === 'in_progress'
                                      ? 'bg-yellow-600'
                                      : order.status === 'ready'
                                        ? 'bg-green-600'
                                        : ''
                                }
                              >
                                {order.status === 'new'
                                  ? 'New'
                                  : order.status === 'in_progress'
                                    ? 'Cooking'
                                    : order.status === 'ready'
                                      ? 'Ready'
                                      : order.status}
                              </Badge>
                              <div className='flex items-center text-xs text-gray-400'>
                                <Clock className='h-3 w-3 mr-1' />
                                {getTimeSinceCreated(order.created_at)}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className='space-y-2'>
                            {order.items.map((item, index) => (
                              <div
                                key={index}
                                className='bg-gray-900/50 rounded px-3 py-2'
                              >
                                <span className='text-sm text-white'>
                                  {getItemDisplayName(item)}
                                </span>
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
              <Card className='bg-gray-800/40 border-gray-700'>
                <CardContent className='p-12 text-center'>
                  <h3 className='text-lg font-semibold text-white mb-2'>
                    Select a Table
                  </h3>
                  <p className='text-gray-400'>
                    Click on a table to view details and take orders
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className='mt-8 bg-gray-800/30 border border-gray-700 rounded-lg p-4'>
            <h3 className='text-sm font-medium text-gray-300 mb-2'>
              Debug Info
            </h3>
            <div className='text-xs text-gray-400 space-y-1'>
              <div>User: {user.email}</div>
              <div>Role: {profile?.role || 'null'}</div>
              <div>Tables Loaded: {tables.length}</div>
              <div>Selected Table: {selectedTable?.label || 'none'}</div>
              <div>Last Updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        )}

        {/* Order Form Modal with Suggestions */}
        {showOrderForm && orderFormData && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            {showVoiceRecording ? (
              <VoiceOrderPanel
                tableId={orderFormData.tableId}
                tableName={orderFormData.tableName}
                seatNumber={orderFormData.seatNumber}
                orderType='food'
                onOrderSubmitted={async orderData => {
                  try {
                    // Get seat_id
                    const { data: seatData } = await supabase
                      .from('seats')
                      .select('id')
                      .eq('table_id', orderFormData.tableId)
                      .eq('label', orderFormData.seatNumber)
                      .single()

                    if (!seatData) {
                      throw new Error('Seat not found')
                    }

                    // Create the order with the voice data
                    await createOrder({
                      table_id: orderFormData.tableId,
                      seat_id: seatData.id,
                      resident_id:
                        orderStep.selectedResident?.id || 'guest-user',
                      server_id: user.id,
                      items: orderData.items,
                      transcript: orderData.transcription,
                      type: 'food',
                    })
                    setShowVoiceRecording(false)
                    handleCloseOrderForm()
                    await loadTables() // Refresh the tables
                  } catch (error) {
                    console.error('Error creating order:', error)
                  }
                }}
                onCancel={() => setShowVoiceRecording(false)}
              />
            ) : (
              <Card className='bg-gray-800 border-gray-700 w-full max-w-lg mx-4'>
                <CardHeader>
                  <CardTitle className='text-white flex items-center justify-between'>
                    {orderStep.step === 'resident' && (
                      <>
                        Who is sitting at Table {orderFormData.tableName}, Seat{' '}
                        {orderFormData.seatNumber}?
                      </>
                    )}
                    {orderStep.step === 'meal' &&
                      orderStep.selectedResident && (
                        <>
                          What would {orderStep.selectedResident.name} like for{' '}
                          {getCurrentMealTime()}?
                        </>
                      )}
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={handleCloseOrderForm}
                      className='text-gray-400 hover:text-white'
                    >
                      ✕
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orderStep.step === 'resident' && (
                    <div className='space-y-4'>
                      {(() => {
                        const suggestions = getSuggestedResidents(
                          orderFormData.tableName,
                          orderFormData.seatNumber
                        )

                        if (suggestions.length === 0) {
                          return (
                            <div className='text-center py-8'>
                              <div className='text-gray-300 mb-4'>
                                No resident suggestions for this seat
                              </div>
                              <Button
                                className='w-full bg-blue-600 hover:bg-blue-700'
                                onClick={() => {
                                  console.error('Guest selected')
                                  handleCloseOrderForm()
                                }}
                              >
                                👤 Guest
                              </Button>
                            </div>
                          )
                        }

                        const currentSuggestion =
                          suggestions[currentSuggestionIndex]

                        return (
                          <>
                            {/* Main Suggestion Display */}
                            <div className='bg-gray-900/50 rounded-lg p-6 text-center'>
                              <div className='mb-4'>
                                <User className='h-16 w-16 text-blue-400 mx-auto mb-3' />
                                <h3 className='text-xl font-bold text-white mb-2'>
                                  {currentSuggestion.name}
                                </h3>
                                <div className='text-sm text-gray-400'>
                                  Usually sits in:{' '}
                                  {currentSuggestion.favoriteSeats.join(', ')}
                                </div>
                                {currentSuggestion.dietaryRestrictions && (
                                  <div className='text-xs text-yellow-400 mt-1'>
                                    Dietary:{' '}
                                    {currentSuggestion.dietaryRestrictions.join(
                                      ', '
                                    )}
                                  </div>
                                )}
                              </div>

                              <Button
                                onClick={() =>
                                  handleSelectResident(currentSuggestion)
                                }
                                className='w-full bg-green-600 hover:bg-green-700 text-white font-semibold'
                                size='lg'
                              >
                                Select {currentSuggestion.name}
                              </Button>
                            </div>

                            {/* Navigation */}
                            {suggestions.length > 1 && (
                              <div className='flex items-center justify-between'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() =>
                                    setCurrentSuggestionIndex(
                                      Math.max(0, currentSuggestionIndex - 1)
                                    )
                                  }
                                  disabled={currentSuggestionIndex === 0}
                                  className='border-gray-600 text-gray-300'
                                >
                                  <ChevronLeft className='h-4 w-4 mr-1' />
                                  Previous
                                </Button>

                                <div className='text-gray-400 text-sm'>
                                  {currentSuggestionIndex + 1} of{' '}
                                  {suggestions.length}
                                </div>

                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() =>
                                    setCurrentSuggestionIndex(
                                      Math.min(
                                        suggestions.length - 1,
                                        currentSuggestionIndex + 1
                                      )
                                    )
                                  }
                                  disabled={
                                    currentSuggestionIndex ===
                                    suggestions.length - 1
                                  }
                                  className='border-gray-600 text-gray-300'
                                >
                                  Next
                                  <ChevronRight className='h-4 w-4 ml-1' />
                                </Button>
                              </div>
                            )}

                            {/* Guest Option */}
                            <div className='pt-4 border-t border-gray-600'>
                              <Button
                                variant='outline'
                                className='w-full border-gray-600 text-gray-300 hover:bg-gray-700'
                                onClick={() => {
                                  console.error('Guest selected')
                                  handleCloseOrderForm()
                                }}
                              >
                                👤 Guest (Unknown Resident)
                              </Button>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {orderStep.step === 'meal' && orderStep.selectedResident && (
                    <div className='space-y-4'>
                      {(() => {
                        const mealSuggestions = getSuggestedMeals(
                          orderStep.selectedResident
                        )

                        if (mealSuggestions.length === 0) {
                          return (
                            <div className='text-center py-8'>
                              <div className='text-gray-300 mb-4'>
                                No meal suggestions for {getCurrentMealTime()}
                              </div>
                              <Button
                                className='w-full bg-blue-600 hover:bg-blue-700'
                                onClick={() => {
                                  setShowVoiceRecording(true)
                                }}
                              >
                                🎤 Record New Order
                              </Button>
                            </div>
                          )
                        }

                        const currentMeal =
                          mealSuggestions[currentSuggestionIndex]

                        return (
                          <>
                            {/* Back Button */}
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => setOrderStep({ step: 'resident' })}
                              className='text-gray-400 hover:text-white mb-4'
                            >
                              <ChevronLeft className='h-4 w-4 mr-1' />
                              Back to resident selection
                            </Button>

                            {/* Main Meal Suggestion Display */}
                            <div className='bg-gray-900/50 rounded-lg p-6 text-center'>
                              <div className='mb-4'>
                                <Utensils className='h-16 w-16 text-orange-400 mx-auto mb-3' />
                                <h3 className='text-xl font-bold text-white mb-2'>
                                  {currentMeal.dish}
                                </h3>
                                <div className='text-sm text-gray-400 mb-2'>
                                  {orderStep.selectedResident.name}'s #
                                  {currentMeal.frequency}/10 favorite for{' '}
                                  {getCurrentMealTime()}
                                </div>
                                <div className='text-xs text-green-400'>
                                  Perfect for {getCurrentMealTime()} time
                                </div>
                              </div>

                              <Button
                                onClick={() =>
                                  handleSelectMeal(currentMeal.dish)
                                }
                                className='w-full bg-green-600 hover:bg-green-700 text-white font-semibold'
                                size='lg'
                              >
                                Order {currentMeal.dish}
                              </Button>
                            </div>

                            {/* Navigation */}
                            {mealSuggestions.length > 1 && (
                              <div className='flex items-center justify-between'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() =>
                                    setCurrentSuggestionIndex(
                                      Math.max(0, currentSuggestionIndex - 1)
                                    )
                                  }
                                  disabled={currentSuggestionIndex === 0}
                                  className='border-gray-600 text-gray-300'
                                >
                                  <ChevronLeft className='h-4 w-4 mr-1' />
                                  Previous
                                </Button>

                                <div className='text-gray-400 text-sm'>
                                  {currentSuggestionIndex + 1} of{' '}
                                  {mealSuggestions.length}
                                </div>

                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() =>
                                    setCurrentSuggestionIndex(
                                      Math.min(
                                        mealSuggestions.length - 1,
                                        currentSuggestionIndex + 1
                                      )
                                    )
                                  }
                                  disabled={
                                    currentSuggestionIndex ===
                                    mealSuggestions.length - 1
                                  }
                                  className='border-gray-600 text-gray-300'
                                >
                                  Next
                                  <ChevronRight className='h-4 w-4 ml-1' />
                                </Button>
                              </div>
                            )}

                            {/* Record New Order Option */}
                            <div className='pt-4 border-t border-gray-600'>
                              <Button
                                variant='outline'
                                className='w-full border-gray-600 text-gray-300 hover:bg-gray-700'
                                onClick={() => {
                                  // Recording new order
                                  setShowVoiceRecording(true)
                                }}
                              >
                                🎤 Record New Order
                              </Button>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Shell>
  )
}
