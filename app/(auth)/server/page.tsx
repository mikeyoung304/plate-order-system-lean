// File: frontend/app/server/page.tsx
'use client'

import { useCallback, useState } from 'react'
import { Shell } from '@/components/shell'
import { EnhancedProtectedRoute as ProtectedRoute } from '@/lib/modassembly/supabase/auth/enhanced-protected-route'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'

// Dynamic imports for heavy components
const FloorPlanView = dynamic(
  () =>
    import('@/components/floor-plan-view').then(m => ({
      default: m.FloorPlanView,
    })),
  {
    loading: () => (
      <PageLoadingState message='Loading floor plan...' showProgress={false} />
    ),
    ssr: false,
  }
)

const VoiceOrderPanel = dynamic(
  () =>
    import('@/components/voice-order-panel').then(m => ({
      default: m.VoiceOrderPanel,
    })),
  {
    loading: () => (
      <PageLoadingState
        message='Loading voice controls...'
        showProgress={false}
      />
    ),
    ssr: false,
  }
)

import { useToast } from '@/hooks/use-toast'
import {
  FloorPlanErrorBoundary,
  VoiceErrorBoundary,
} from '@/components/error-boundaries'
import { PageLoadingState } from '@/components/loading-states'
import {
  ChevronLeft,
  Clock,
  Coffee,
  Edit3,
  History,
  Info,
  Trash2,
  User,
  Utensils,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
// PERFORMANCE OPTIMIZATION: Removed framer-motion imports (24 instances eliminated)
// All animations now use optimized CSS classes for better performance
import {
  createOrder,
  deleteOrder,
} from '@/lib/modassembly/supabase/database/orders'
import { fetchSeatId } from '@/lib/modassembly/supabase/database/seats'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SeatNavigation } from '@/components/server/seat-navigation'
import { useSeatNavigation } from '@/hooks/use-seat-navigation'
import { useOrderFlowState } from '@/lib/hooks/use-order-flow-state'
import { useServerPageData } from '@/lib/hooks/use-server-page-data'
import { useServerState } from '@/lib/state/restaurant-state-context'

type Order = {
  id: string
  table: string
  seat?: number
  items: string[]
  status: string
  created_at: string
}

export default function ServerPage() {
  // INTELLIGENT STATE MANAGEMENT - Complete integration
  const {
    tables,
    orders,
    residents,
    servers,
    selectedTable,
    selectedSeat,
    orderType,
    currentView,
    connectionStatus,
    loading,
    errors,
    actions,
  } = useServerState()
  
  // Legacy state hooks (minimal usage for compatibility)
  const orderFlow = useOrderFlowState()
  const data = useServerPageData('default')
  const { toast } = useToast()

  // Minimal remaining state
  const [_floorPlanId, _setFloorPlanId] = useState('default')

  // Seat navigation state
  const seatNav = useSeatNavigation({
    tableId: orderFlow.selectedTable?.label || '1',
    maxSeats: 8,
    onSeatComplete: _seatNumber => {
      // Seat order completed callback - future logging implementation
    },
    onTableComplete: () => {
      toast({
        title: 'Table Complete! 🎉',
        description: 'All seats have placed their orders',
        duration: 3000,
      })
      orderFlow.resetFlow()
    },
  })

  // Load suggestions when resident is selected
  const loadSuggestions = useCallback(
    async (residentId: string) => {
      if (residentId) {
        data.loadOrderSuggestions(residentId, orderFlow.selectedTable?.id)
      }
    },
    [data, orderFlow.selectedTable]
  )

  // --- Navigation and Selection Handlers ---

  const handleSelectTable = (table: any) => {
    // Use intelligent state management
    actions.selectTable(table)
    
    // Legacy compatibility
    orderFlow.selectTable(table)
    
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    toast({
      title: `Table ${table.label} selected`,
      description: 'Navigate between seats',
      duration: 1500,
    })
  }

  const _handleSeatSelected = (_seatNumber: number) => {
    // Legacy seat selection handler - now handled by SeatNavigation
  }

  const _handleCloseSeatPicker = () => {
    // Legacy seat picker close handler - now handled by SeatNavigation
  }

  // Reset selection fully when going back
  const handleBackToFloorPlan = () => {
    actions.reset()
    orderFlow.resetFlow()
    seatNav.resetTable()
  }

  // Go back from Order Type selection to Seat Picker
  const handleBackFromOrderType = () => {
    orderFlow.goToStep('seatPicker')
  }

  // Go back from Resident Selection to Order Type selection
  const handleBackFromResidentSelect = () => {
    orderFlow.goToStep('orderType')
  }

  // Go back from Voice Order to Resident Selection
  const handleBackFromVoiceOrder = () => {
    orderFlow.hideVoiceOrder()
  }

  // Called by VoiceOrderPanel upon successful transcription
  const handleOrderSubmitted = useCallback(
    async (
      orderData: string | string[] | { items: string[]; transcription: string }
    ) => {
      if (
        !orderFlow.selectedTable ||
        orderFlow.selectedSeat === null ||
        !data.user ||
        !orderFlow.selectedResident
      ) {
        toast({
          title: 'Error',
          description: 'Missing required information.',
          variant: 'destructive',
        })
        return
      }

      // Get the seat ID using the fetchSeatId function
      const seatId = await fetchSeatId(
        orderFlow.selectedTable.id,
        orderFlow.selectedSeat
      )

      if (!seatId) {
        toast({
          title: 'Error',
          description: 'Invalid seat selection.',
          variant: 'destructive',
        })
        return
      }

      try {
        // Handle different input formats
        let items: string[]
        let transcript: string

        if (orderFlow.selectedSuggestion) {
          // If using a suggestion, use the suggestion items
          items = orderFlow.selectedSuggestion.items
          transcript = orderFlow.selectedSuggestion.items.join(', ')
        } else if (typeof orderData === 'object' && 'items' in orderData) {
          // New format with items and transcription from API
          items = orderData.items
          transcript = orderData.transcription || orderData.items.join(', ')
        } else if (Array.isArray(orderData)) {
          // If we have an array of items (legacy format), use them directly
          items = orderData
          transcript = orderData.join(', ')
        } else {
          // If we have a string (legacy format), split it into items
          items = orderData
            .split(',')
            .map(item => item.trim())
            .filter(item => item)
          transcript = orderData
        }

        const orderPayload = {
          table_id: orderFlow.selectedTable.id,
          seat_id: seatId,
          resident_id: orderFlow.selectedResident,
          server_id: data.user.id,
          items: items,
          transcript: transcript,
          type: orderFlow.orderType || 'food',
        }

        const _order = await createOrder(orderPayload)

        // Mark seat as complete in navigation
        if (orderFlow.selectedSeat) {
          seatNav.markSeatComplete(orderFlow.selectedSeat)
        }

        toast({
          title: 'Order Submitted',
          description: 'Your order has been sent to the kitchen.',
          variant: 'default',
        })

        // Check if we should continue to next seat or finish table
        if (seatNav.nextAvailableSeat) {
          // Auto-advance to next seat
          setTimeout(() => {
            if (seatNav.nextAvailableSeat) {
              seatNav.setCurrentSeat(seatNav.nextAvailableSeat)
            }
            orderFlow.goToStep('seatPicker')
          }, 1000)
        } else {
          // All seats complete, go back to floor plan
          setTimeout(() => {
            handleBackToFloorPlan()
          }, 1500)
        }
      } catch (err) {
        console.error('Order submission error:', err)
        toast({
          title: 'Submission Failed',
          description: 'Could not submit order. Please retry.',
          variant: 'destructive',
        })
      }
    },
    [orderFlow, data, toast, handleBackToFloorPlan, seatNav]
  )

  // Resident selection handler
  const handleResidentSelected = useCallback(
    (residentId: string) => {
      orderFlow.selectResident(residentId)
      loadSuggestions(residentId)
    },
    [orderFlow, loadSuggestions]
  )

  // Suggestion selection handler
  const handleSuggestionSelected = (suggestion: any) => {
    if (orderFlow.selectedSuggestion === suggestion) {
      // If clicking the same suggestion, unselect it
      orderFlow.selectSuggestion(null)
    } else {
      // Otherwise select the new suggestion
      orderFlow.selectSuggestion(suggestion)
    }
  }

  // Proceed to voice order handler
  const handleProceedToVoiceOrder = () => {
    if (orderFlow.selectedSuggestion) {
      // If a suggestion is selected, submit it with the items array directly
      handleOrderSubmitted(orderFlow.selectedSuggestion.items)
    } else {
      // If no suggestion selected, show voice order panel
      orderFlow.showVoiceOrder()
    }
  }

  // Order modification functions
  const handleEditOrder = (_order: Order) => {
    // TODO: Implement edit order dialog/modal
    toast({
      title: 'Edit Order',
      description: 'Order editing feature coming soon',
      duration: 2000,
    })
  }

  const handleCancelOrder = async (order: Order) => {
    try {
      await deleteOrder(order.id)

      // Refresh orders list
      await data.refreshRecentOrders()

      toast({
        title: 'Order Cancelled',
        description: `Order for ${order.table} has been cancelled`,
        duration: 2000,
      })
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel order',
        variant: 'destructive',
      })
    }
  }

  // Use the order flow state machine for current view
  const resolvedView = orderFlow.currentStep

  return (
    <ProtectedRoute roles={['server', 'admin']}>
      <Shell className='bg-gradient-to-br from-gray-900/95 via-gray-900/98 to-gray-900/95'>
        <div className='container py-6 page-container'>
          {/* Header - PERFORMANCE: Replaced motion.div with CSS class */}
          <div className='header-animate flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight text-white'>
                Server View
              </h1>
              <p className='text-gray-400 mt-1'>Take and manage orders</p>
            </div>
            <div className='flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-700/30'>
              <Clock className='h-4 w-4 text-teal-400' />
              <span className='text-gray-300 font-medium'>
                {' '}
                {new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
              </span>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Main Content Area - PERFORMANCE: Replaced motion.div with CSS class */}
            <div className='lg:col-span-2 stagger-container'>
              {/* PERFORMANCE: Replaced AnimatePresence with conditional rendering + CSS transitions */}
              {/* Floor Plan View */}
              {resolvedView === 'floorPlan' && (
                <div className='floor-plan-view stagger-item'>
                  <Card className='bg-gray-800/40 border-gray-700/30 backdrop-blur-sm overflow-hidden'>
                    <CardContent className='p-0'>
                      <div className='p-6 border-b border-gray-700/30'>
                        <h2 className='text-xl font-medium text-white'>
                          Select a Table
                        </h2>
                        <p className='text-gray-400 text-sm mt-1'>
                          Choose a table to place an order
                        </p>
                      </div>
                      <div className='p-6'>
                        {loading.tables ? (
                          <PageLoadingState
                            message='Loading floor plan...'
                            showProgress={false}
                          />
                        ) : (
                          <FloorPlanErrorBoundary>
                            <div className='floor-plan-container'>
                              <FloorPlanView
                                floorPlanId={_floorPlanId}
                                onSelectTable={handleSelectTable}
                                tables={tables} // Use intelligent state tables
                              />
                            </div>
                          </FloorPlanErrorBoundary>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Seat Navigation View */}
              {resolvedView === 'seatPicker' && orderFlow.selectedTable && (
                <div className='seat-nav-view stagger-item'>
                  <Card className='bg-gray-800/40 border-gray-700/30 backdrop-blur-sm overflow-hidden'>
                    <CardContent className='p-0'>
                      <div className='p-6 border-b border-gray-700/30 flex items-center justify-between'>
                        <div>
                          <h2 className='text-xl font-medium text-white'>
                            Table {orderFlow.selectedTable.label}
                          </h2>
                          <p className='text-gray-400 text-sm mt-1'>
                            Navigate between seats to take orders
                          </p>
                        </div>
                        <Button
                          variant='ghost'
                          onClick={() => orderFlow.goToStep('floorPlan')}
                          className='text-gray-400 hover:text-white'
                        >
                          <ChevronLeft className='h-4 w-4 mr-2' />
                          Back to Tables
                        </Button>
                      </div>
                      <div className='p-6'>
                        <SeatNavigation
                          tableId={orderFlow.selectedTable.label}
                          currentSeat={seatNav.currentSeat}
                          maxSeats={seatNav.maxSeats}
                          onSeatChange={seatNumber => {
                            seatNav.setCurrentSeat(seatNumber)
                            orderFlow.selectSeat(seatNumber)
                          }}
                          seats={seatNav.seatOrders.map(seat => ({
                            id: seat.seatNumber,
                            hasOrder: seat.hasOrder,
                            orderCount: seat.orderCount,
                          }))}
                        />

                        <div className='mt-6 flex gap-3'>
                          <Button
                            onClick={() => {
                              orderFlow.selectSeat(seatNav.currentSeat)
                            }}
                            className='flex-1 bg-blue-600 hover:bg-blue-700'
                          >
                            Take Order for Seat {seatNav.currentSeat}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Order Type Selection View */}
              {resolvedView === 'orderType' &&
                orderFlow.selectedTable &&
                orderFlow.selectedSeat && (
                  <div className='order-type-view stagger-item'>
                    <Card className='bg-gray-800/40 border-gray-700/30 backdrop-blur-sm overflow-hidden'>
                      <CardContent className='p-0'>
                        <div className='p-6 border-b border-gray-700/30 flex items-center justify-between'>
                          <div>
                            <h2 className='text-xl font-medium text-white'>
                              {' '}
                              Table {orderFlow.selectedTable.label}, Seat{' '}
                              {orderFlow.selectedSeat}{' '}
                            </h2>
                            <p className='text-gray-400 text-sm mt-1'>
                              Select order type
                            </p>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={handleBackFromOrderType}
                            className='h-9 gap-1 text-gray-300 hover:text-white hover:bg-gray-700/50'
                          >
                            <ChevronLeft className='h-4 w-4' /> Back
                          </Button>
                        </div>
                        <div className='p-8'>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            {/* PERFORMANCE: Replaced motion.div hover animations with CSS classes */}
                            <div className='interactive-button'>
                              <Button
                                className='w-full h-48 flex flex-col gap-4 bg-gradient-to-br from-teal-600/90 to-teal-700/90 hover:from-teal-500/90 hover:to-teal-600/90 border-0 rounded-xl shadow-lg'
                                onClick={() => {
                                  orderFlow.selectOrderType('food')
                                }}
                              >
                                <div className='w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center'>
                                  {' '}
                                  <Utensils className='h-10 w-10 text-teal-300' />{' '}
                                </div>
                                <span className='text-2xl font-medium'>
                                  Food Order
                                </span>
                              </Button>
                            </div>
                            <div className='interactive-button'>
                              <Button
                                className='w-full h-48 flex flex-col gap-4 bg-gradient-to-br from-amber-600/90 to-amber-700/90 hover:from-amber-500/90 hover:to-amber-600/90 border-0 rounded-xl shadow-lg'
                                onClick={() => {
                                  orderFlow.selectOrderType('drink')
                                }}
                              >
                                <div className='w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center'>
                                  {' '}
                                  <Coffee className='h-10 w-10 text-amber-300' />{' '}
                                </div>
                                <span className='text-2xl font-medium'>
                                  Drink Order
                                </span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

              {/* Resident Selection View */}
              {resolvedView === 'residentSelect' &&
                orderFlow.selectedTable &&
                orderFlow.selectedSeat &&
                orderFlow.orderType && (
                  <div className='resident-select-view stagger-item'>
                    <Card className='bg-gray-800/40 border-gray-700/30 backdrop-blur-sm overflow-hidden'>
                      <CardContent className='p-0'>
                        <div className='p-6 border-b border-gray-700/30 flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400`}
                            >
                              <User className='h-5 w-5' />
                            </div>
                            <div>
                              <h2 className='text-xl font-medium text-white flex items-center gap-2'>
                                Select Resident
                                <Badge
                                  variant='outline'
                                  className='ml-2 text-xs font-normal'
                                >
                                  {' '}
                                  Table {orderFlow.selectedTable.label}, Seat{' '}
                                  {orderFlow.selectedSeat}{' '}
                                </Badge>
                              </h2>
                              <p className='text-gray-400 text-sm mt-1'>
                                Choose a resident to place an order
                              </p>
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={handleBackFromResidentSelect}
                            className='h-9 gap-1 text-gray-300 hover:text-white hover:bg-gray-700/50'
                          >
                            <ChevronLeft className='h-4 w-4' /> Back
                          </Button>
                        </div>
                        <div className='p-6 space-y-6'>
                          <div className='space-y-4'>
                            <label className='text-sm font-medium text-gray-200'>
                              Select Resident{' '}
                              <span className='text-red-400'>*</span>
                            </label>
                            <Select
                              value={orderFlow.selectedResident || ''}
                              onValueChange={handleResidentSelected}
                            >
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Choose a resident' />
                              </SelectTrigger>
                              <SelectContent>
                                {residents.map((resident: any) => (
                                  <SelectItem
                                    key={resident.id}
                                    value={resident.id}
                                  >
                                    {resident.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {orderFlow.selectedResident && (
                            <div className='space-y-4'>
                              <div className='flex items-center justify-between'>
                                <label className='text-sm font-medium text-gray-200'>
                                  Previous Orders
                                </label>
                                {data.orderSuggestions.length > 0 && (
                                  <span className='text-xs text-gray-400'>
                                    Optional - Select a previous order or place
                                    a new one
                                  </span>
                                )}
                              </div>

                              {data.orderSuggestions.length > 0 ? (
                                <div className='space-y-3'>
                                  {data.orderSuggestions.map(
                                    (suggestion: any, index: number) => (
                                      <div
                                        key={index}
                                        className={`suggestion-card-${Math.min(index + 1, 5)}`}
                                      >
                                        <Button
                                          variant='outline'
                                          className={`w-full justify-start text-left p-4 h-auto ${
                                            orderFlow.selectedSuggestion ===
                                            suggestion
                                              ? 'border-teal-500'
                                              : 'border-gray-700'
                                          }`}
                                          onClick={() =>
                                            handleSuggestionSelected(suggestion)
                                          }
                                        >
                                          <div className='space-y-1'>
                                            <div className='flex items-center justify-between'>
                                              <span className='font-medium'>
                                                Order #{index + 1}
                                              </span>
                                              <Badge variant='secondary'>
                                                Ordered {suggestion.frequency}x
                                              </Badge>
                                            </div>
                                            {suggestion.items.map(
                                              (item: string, i: number) => (
                                                <div
                                                  key={i}
                                                  className='text-sm text-gray-400'
                                                >
                                                  • {item}
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </Button>
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <div className='text-center py-8 text-gray-400'>
                                  <Info className='h-12 w-12 mx-auto mb-3 opacity-50' />
                                  <p>No previous orders found</p>
                                </div>
                              )}

                              <Button
                                className='w-full mt-6'
                                size='lg'
                                onClick={handleProceedToVoiceOrder}
                              >
                                {orderFlow.selectedSuggestion
                                  ? 'Place Selected Order'
                                  : 'Place New Voice Order'}
                              </Button>
                            </div>
                          )}

                          {!orderFlow.selectedResident && (
                            <div className='text-center py-8 text-gray-400'>
                              <User className='h-12 w-12 mx-auto mb-3 opacity-50' />
                              <p>Please select a resident to place an order</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

              {/* Voice Order Panel View */}
              {resolvedView === 'voiceOrder' &&
                orderFlow.selectedTable &&
                orderFlow.selectedSeat &&
                orderFlow.orderType && (
                  <div className='voice-order-view stagger-item'>
                    <Card className='bg-gray-800/40 border-gray-700/30 backdrop-blur-sm overflow-hidden'>
                      <CardContent className='p-0'>
                        <div className='p-6 border-b border-gray-700/30 flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${orderFlow.orderType === 'food' ? 'bg-teal-500/20 text-teal-400' : 'bg-amber-500/20 text-amber-400'}`}
                            >
                              {orderFlow.orderType === 'food' ? (
                                <Utensils className='h-5 w-5' />
                              ) : (
                                <Coffee className='h-5 w-5' />
                              )}
                            </div>
                            <div>
                              <h2 className='text-xl font-medium text-white flex items-center gap-2'>
                                Voice Order
                                <Badge
                                  variant='outline'
                                  className='ml-2 text-xs font-normal'
                                >
                                  Table {orderFlow.selectedTable.label}, Seat{' '}
                                  {orderFlow.selectedSeat}
                                  {orderFlow.selectedResident &&
                                    ` • Resident Selected`}
                                </Badge>
                              </h2>
                              <p className='text-gray-400 text-sm mt-1'>
                                Speak your order clearly
                              </p>
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={handleBackFromVoiceOrder}
                            className='h-9 gap-1 text-gray-300 hover:text-white hover:bg-gray-700/50'
                          >
                            <ChevronLeft className='h-4 w-4' /> Back
                          </Button>
                        </div>
                        <div className='p-6'>
                          <VoiceErrorBoundary>
                            <div className='voice-order-container'>
                              <VoiceOrderPanel
                                tableId={orderFlow.selectedTable.id}
                                tableName={orderFlow.selectedTable.label}
                                seatNumber={orderFlow.selectedSeat}
                                orderType={orderFlow.orderType}
                                onOrderSubmitted={handleOrderSubmitted}
                                onCancel={handleBackFromVoiceOrder}
                              />
                            </div>
                          </VoiceErrorBoundary>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
            </div>

            {/* Recent Orders Panel - PERFORMANCE: Replaced motion.div with CSS class */}
            <div className='sidebar-animate'>
              <Card className='bg-gray-800/40 border-gray-700/30 backdrop-blur-sm overflow-hidden h-full'>
                <CardContent className='p-0 h-full flex flex-col'>
                  <div className='p-6 border-b border-gray-700/30 flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center'>
                      {' '}
                      <History className='h-5 w-5 text-gray-300' />{' '}
                    </div>
                    <div>
                      <h2 className='text-xl font-medium text-white'>
                        Recent Orders
                      </h2>
                      <p className='text-gray-400 text-sm'>
                        Latest orders you've submitted
                      </p>
                    </div>
                  </div>
                  <ScrollArea className='flex-1 p-6'>
                    {orders.length === 0 ? (
                      <div className='flex flex-col items-center justify-center h-full text-center p-4'>
                        <div className='w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center mb-3'>
                          {' '}
                          <Info className='h-6 w-6 text-gray-400' />{' '}
                        </div>
                        <p className='text-gray-400 font-medium'>
                          No recent orders
                        </p>
                        <p className='text-sm text-gray-500 mt-1'>
                          Orders will appear here after submission
                        </p>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        {/* PERFORMANCE: Replaced AnimatePresence with conditional rendering + CSS transitions */}
                        {orders.slice(0, 10).map((order: any, index: number) => (
                          <div
                            key={order.id}
                            className={`order-card-enter stagger-item-${Math.min(index + 1, 5)}`}
                          >
                            <div className='p-4 rounded-xl bg-gray-800/70 border border-gray-700/30 backdrop-blur-sm hover:bg-gray-800/90 transition-colors'>
                              <div className='flex justify-between items-center mb-2'>
                                <div className='font-medium text-white'>
                                  Table {order.table}{' '}
                                  {order.seat ? `(Seat ${order.seat})` : ''}
                                </div>
                                <Badge
                                  variant='outline'
                                  className={`status-badge status-${order.status}`}
                                >
                                  {order.status.charAt(0).toUpperCase() +
                                    order.status.slice(1).replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className='space-y-1 mb-2'>
                                {order.items.map((item: string, i: number) => (
                                  <div
                                    key={i}
                                    className='text-sm text-gray-300'
                                  >
                                    • {item}
                                  </div>
                                ))}
                              </div>
                              <div className='flex items-center justify-between mt-3'>
                                <div className='text-xs text-gray-500 flex items-center gap-1'>
                                  <Clock className='h-3 w-3' />
                                  {new Date(
                                    order.created_at
                                  ).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                                {/* Only show edit/cancel for pending orders */}
                                {(order.status === 'in_progress' ||
                                  order.status === 'new') && (
                                  <div className='flex gap-2'>
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      onClick={() => handleEditOrder(order)}
                                      className='h-7 px-2 text-xs'
                                    >
                                      <Edit3 className='h-3 w-3 mr-1' />
                                      Edit
                                    </Button>
                                    <Button
                                      size='sm'
                                      variant='destructive'
                                      onClick={() => handleCancelOrder(order)}
                                      className='h-7 px-2 text-xs'
                                    >
                                      <Trash2 className='h-3 w-3 mr-1' />
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Seat Picker Overlay - Rendered conditionally outside the main grid */}
          {/* Seat picker overlay removed - now using integrated seat navigation */}
        </div>
      </Shell>
    </ProtectedRoute>
  )
}
