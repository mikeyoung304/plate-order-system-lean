/**
 * VETERAN'S NOTES: Quick Order Modal - Bulletproof Modal State Machine
 * 
 * WHY: The original had 6 useState calls for modal workflow causing chaos. Loading states
 * could conflict, resident selection got out of sync with suggestions, and form validation
 * was impossible. Classic modal useState explosion pattern.
 * 
 * WHAT: Consolidated all modal workflow into a single useReducer with clear phases.
 * State machine prevents impossible states (loading residents while showing selection).
 * Atomic updates ensure modal workflow is predictable and debuggable.
 * 
 * WHEN TO TOUCH: Only for new modal steps or async operations. Don't add useState
 * for "simple" modal state - it breaks consistency with the reducer state.
 * 
 * WHO TO BLAME: Veteran engineer - this pattern handles complex modal workflows
 * 
 * HOW TO MODIFY:
 * - Add new modal phases to QuickOrderState interface
 * - Add corresponding actions to QuickOrderAction
 * - Keep async operations in the hook, not the reducer
 * - Test modal state transitions thoroughly
 * - Verify no race conditions during rapid user interactions
 */

"use client"

import React, { useReducer, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Clock, AlertTriangle, Mic, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table } from "@/lib/floor-plan-utils"
import { getSeatResidentSuggestions } from "@/lib/modassembly/supabase/database/suggestions"
import { getTodaysFeaturedSpecial, incrementSpecialOrders, type AvailableSpecial } from "@/lib/modassembly/supabase/database/daily-specials"

type SeatSuggestion = {
  resident: {
    id: string
    name: string
    photo_url?: string
    dietary_restrictions?: string
  }
  confidence: number
  isPrimary: boolean
  usualOrder?: string
}

// QUICK ORDER STATE - all related state in one place
interface QuickOrderState {
  // Modal workflow phases
  phase: 'loading' | 'seat_selection' | 'resident_selection' | 'order_selection' | 'processing' | 'error'
  
  // Data state
  seatSuggestions: SeatSuggestion[]
  selectedResident: SeatSuggestion | null
  todaysSpecial: AvailableSpecial | null
  
  // Loading states for different operations
  loading: {
    suggestions: boolean
    special: boolean
    orderProcessing: boolean
  }
  
  // UI state
  ui: {
    showResidentSearch: boolean
    autoSelectedResident: boolean
  }
  
  // Error state
  error: string | null
}

// ATOMIC ACTIONS - each action represents one complete state transition
type QuickOrderAction =
  | { type: 'START_LOADING' }
  | { type: 'SUGGESTIONS_LOADED'; suggestions: SeatSuggestion[] }
  | { type: 'SUGGESTIONS_FAILED'; error: string }
  | { type: 'SPECIAL_LOADED'; special: AvailableSpecial | null }
  | { type: 'SPECIAL_FAILED'; error: string }
  | { type: 'SELECT_SEAT'; seatNumber: number }
  | { type: 'SELECT_RESIDENT'; resident: SeatSuggestion }
  | { type: 'CLEAR_RESIDENT_SELECTION' }
  | { type: 'SHOW_RESIDENT_SEARCH' }
  | { type: 'HIDE_RESIDENT_SEARCH' }
  | { type: 'START_ORDER_PROCESSING' }
  | { type: 'ORDER_PROCESSED' }
  | { type: 'ORDER_FAILED'; error: string }
  | { type: 'RESET_ERROR' }

// INITIAL STATE
const initialState: QuickOrderState = {
  phase: 'loading',
  seatSuggestions: [],
  selectedResident: null,
  todaysSpecial: null,
  loading: {
    suggestions: false,
    special: false,
    orderProcessing: false
  },
  ui: {
    showResidentSearch: false,
    autoSelectedResident: false
  },
  error: null
}

// PURE REDUCER - handles all state transitions
function quickOrderReducer(state: QuickOrderState, action: QuickOrderAction): QuickOrderState {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...state,
        phase: 'loading',
        loading: {
          suggestions: true,
          special: true,
          orderProcessing: false
        },
        error: null
      }
    
    case 'SUGGESTIONS_LOADED': {
      // Auto-select primary suggestion if confidence > 80%
      const primarySuggestion = action.suggestions.find(s => s.isPrimary && s.confidence > 80)
      const hasSpecialCompleted = !state.loading.special
      
      return {
        ...state,
        phase: hasSpecialCompleted ? 'resident_selection' : state.phase,
        seatSuggestions: action.suggestions,
        selectedResident: primarySuggestion || null,
        loading: {
          ...state.loading,
          suggestions: false
        },
        ui: {
          ...state.ui,
          autoSelectedResident: !!primarySuggestion
        }
      }
    }
    
    case 'SUGGESTIONS_FAILED':
      return {
        ...state,
        phase: 'error',
        loading: {
          ...state.loading,
          suggestions: false
        },
        error: action.error
      }
    
    case 'SPECIAL_LOADED': {
      const hasSuggestionsCompleted = !state.loading.suggestions
      
      return {
        ...state,
        phase: hasSuggestionsCompleted ? 'resident_selection' : 'seat_selection',
        todaysSpecial: action.special,
        loading: {
          ...state.loading,
          special: false
        }
      }
    }
    
    case 'SELECT_SEAT':
      return {
        ...state,
        phase: 'resident_selection'
      }
    
    case 'SPECIAL_FAILED':
      return {
        ...state,
        todaysSpecial: null,
        loading: {
          ...state.loading,
          special: false
        },
        error: action.error
      }
    
    case 'SELECT_RESIDENT':
      return {
        ...state,
        phase: 'order_selection',
        selectedResident: action.resident,
        ui: {
          ...state.ui,
          showResidentSearch: false,
          autoSelectedResident: false
        }
      }
    
    case 'CLEAR_RESIDENT_SELECTION':
      return {
        ...state,
        phase: 'resident_selection',
        selectedResident: null,
        ui: {
          ...state.ui,
          autoSelectedResident: false
        }
      }
    
    case 'SHOW_RESIDENT_SEARCH':
      return {
        ...state,
        ui: {
          ...state.ui,
          showResidentSearch: true
        }
      }
    
    case 'HIDE_RESIDENT_SEARCH':
      return {
        ...state,
        ui: {
          ...state.ui,
          showResidentSearch: false
        }
      }
    
    case 'START_ORDER_PROCESSING':
      return {
        ...state,
        phase: 'processing',
        loading: {
          ...state.loading,
          orderProcessing: true
        }
      }
    
    case 'ORDER_PROCESSED':
      return {
        ...state,
        phase: 'order_selection',
        loading: {
          ...state.loading,
          orderProcessing: false
        }
      }
    
    case 'ORDER_FAILED':
      return {
        ...state,
        phase: 'error',
        loading: {
          ...state.loading,
          orderProcessing: false
        },
        error: action.error
      }
    
    case 'RESET_ERROR':
      return {
        ...state,
        phase: 'resident_selection',
        error: null
      }
    
    default:
      return state
  }
}

type QuickOrderModalProps = {
  table: Table | null
  seatNumber: number | null
  onClose: () => void
  onOrderPlaced: (orderData: {
    tableId: string
    seatNumber: number
    residentId: string
    items: string[]
    type: 'food' | 'drink'
    isSpecial?: boolean
    specialId?: string
  }) => void
  onShowVoicePanel: () => void
  onSeatSelect?: (seatNumber: number) => void
}

/**
 * SIMPLE, RELIABLE QUICK ORDER MODAL
 * 
 * Manages complex modal workflow with async data loading in a predictable way.
 * No useState chaos. No race conditions. Clear state machine.
 */
export function QuickOrderModalSimple({ 
  table, 
  seatNumber, 
  onClose, 
  onOrderPlaced, 
  onShowVoicePanel,
  onSeatSelect
}: QuickOrderModalProps) {
  const [state, dispatch] = useReducer(quickOrderReducer, initialState)

  // Load seat suggestions (single responsibility)
  const loadSeatSuggestions = useCallback(async (tableId: string, seatNum: number) => {
    try {
      const suggestions = await getSeatResidentSuggestions(tableId, seatNum, 3)
      dispatch({ type: 'SUGGESTIONS_LOADED', suggestions })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load seat suggestions'
      console.error('Error loading seat suggestions:', error)
      dispatch({ type: 'SUGGESTIONS_FAILED', error: message })
    }
  }, [])

  // Load today's special (single responsibility)
  const loadTodaysSpecial = useCallback(async () => {
    try {
      const special = await getTodaysFeaturedSpecial()
      dispatch({ type: 'SPECIAL_LOADED', special })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load today\'s special'
      console.error('Error loading today\'s special:', error)
      dispatch({ type: 'SPECIAL_FAILED', error: message })
    }
  }, [])

  // Process special order (single responsibility)
  const orderSpecial = useCallback(async () => {
    if (!table || !seatNumber || !state.selectedResident || !state.todaysSpecial || !state.todaysSpecial.is_available) {
      return
    }
    
    dispatch({ type: 'START_ORDER_PROCESSING' })

    try {
      // Increment the special order count in database
      await incrementSpecialOrders(state.todaysSpecial.id)
      
      onOrderPlaced({
        tableId: table.id,
        seatNumber,
        residentId: state.selectedResident.resident.id,
        items: [state.todaysSpecial.name],
        type: 'food',
        isSpecial: true,
        specialId: state.todaysSpecial.id
      })
      
      dispatch({ type: 'ORDER_PROCESSED' })
      
    } catch (error) {
      console.error('Failed to process special order:', error)
      
      // Still proceed with order but without incrementing count
      onOrderPlaced({
        tableId: table.id,
        seatNumber,
        residentId: state.selectedResident.resident.id,
        items: [state.todaysSpecial.name],
        type: 'food',
        isSpecial: true
      })
      
      dispatch({ type: 'ORDER_PROCESSED' })
    }
  }, [table, seatNumber, state.selectedResident, state.todaysSpecial, onOrderPlaced])

  // Process usual order (single responsibility)
  const orderUsual = useCallback(() => {
    if (!table || !seatNumber || !state.selectedResident || !state.selectedResident.usualOrder) {
      return
    }
    
    onOrderPlaced({
      tableId: table.id,
      seatNumber,
      residentId: state.selectedResident.resident.id,
      items: [state.selectedResident.usualOrder],
      type: 'food'
    })
  }, [table, seatNumber, state.selectedResident, onOrderPlaced])

  // Handle seat selection when provided
  const handleSeatSelect = useCallback((selectedSeat: number) => {
    if (onSeatSelect) {
      onSeatSelect(selectedSeat)
    }
    dispatch({ type: 'SELECT_SEAT', seatNumber: selectedSeat })
    if (table) {
      loadSeatSuggestions(table.id, selectedSeat)
    }
  }, [onSeatSelect, table, loadSeatSuggestions])

  // Initial data loading
  useEffect(() => {
    if (table) {
      if (seatNumber) {
        // Seat already selected, go straight to loading
        dispatch({ type: 'START_LOADING' })
        loadSeatSuggestions(table.id, seatNumber)
        loadTodaysSpecial()
      } else if (table.seats === 1) {
        // Single seat table, auto-select seat 1
        dispatch({ type: 'START_LOADING' })
        loadSeatSuggestions(table.id, 1)
        loadTodaysSpecial()
        if (onSeatSelect) onSeatSelect(1)
      } else {
        // Multi-seat table, need seat selection
        dispatch({ type: 'START_LOADING' })
        loadTodaysSpecial()
      }
    }
  }, [table, seatNumber, onSeatSelect, loadSeatSuggestions, loadTodaysSpecial])

  if (!table) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 h-9 w-9"
            onClick={onClose}
            aria-label="Close order modal"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Quick Order</h2>
            <p className="text-gray-600">Table {table.label}, Seat {seatNumber}</p>
          </div>

          {/* Loading Phase */}
          {state.phase === 'loading' && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading order options...</p>
              </div>
            </div>
          )}

          {/* Error Phase */}
          {state.phase === 'error' && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">{state.error}</p>
              <Button onClick={() => dispatch({ type: 'RESET_ERROR' })}>
                Try Again
              </Button>
            </div>
          )}

          {/* Seat Selection Phase */}
          {state.phase === 'seat_selection' && !seatNumber && table.seats > 1 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Select a Seat</h3>
              <p className="text-gray-600 mb-4">Table {table.label} - Choose which seat</p>
              
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: table.seats }, (_, i) => i + 1).map((seat) => (
                  <Button
                    key={seat}
                    variant="outline"
                    className="h-16 text-lg font-semibold hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => handleSeatSelect(seat)}
                  >
                    Seat {seat}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Resident Selection Phase */}
          {state.phase === 'resident_selection' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Who is this for?</h3>
              
              {state.seatSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {state.seatSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion.resident.id}
                      variant="outline"
                      className="w-full h-auto p-4 text-left justify-start"
                      onClick={() => dispatch({ type: 'SELECT_RESIDENT', resident: suggestion })}
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={suggestion.resident.photo_url} />
                        <AvatarFallback>{suggestion.resident.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium">{suggestion.resident.name}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {suggestion.confidence}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">Usually sits here</p>
                      </div>
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => dispatch({ type: 'SHOW_RESIDENT_SEARCH' })}
                  >
                    + Someone else
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-16"
                  onClick={() => dispatch({ type: 'SHOW_RESIDENT_SEARCH' })}
                >
                  <div className="text-center">
                    <p className="font-medium">Select Resident</p>
                    <p className="text-sm text-gray-500">No usual resident for this seat</p>
                  </div>
                </Button>
              )}
            </div>
          )}

          {/* Order Selection Phase */}
          {state.phase === 'order_selection' && state.selectedResident && (
            <>
              {/* Selected Resident Display */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Who is this for?</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage src={state.selectedResident.resident.photo_url} />
                      <AvatarFallback>{state.selectedResident.resident.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-semibold text-gray-900">{state.selectedResident.resident.name}</h4>
                        <Check className="ml-2 h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-600">{state.selectedResident.confidence}% match for this seat</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch({ type: 'CLEAR_RESIDENT_SELECTION' })}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      Change
                    </Button>
                  </div>
                </div>
              </div>

              {/* Order Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What would they like?</h3>
                
                {/* Today's Special */}
                {state.todaysSpecial && state.todaysSpecial.is_available ? (
                  <Button
                    size="lg"
                    className="w-full h-24 text-xl bg-green-600 hover:bg-green-700 text-white relative overflow-hidden"
                    onClick={orderSpecial}
                    disabled={state.loading.orderProcessing}
                  >
                    {state.loading.orderProcessing ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-700/20"></div>
                        <div className="relative flex flex-col items-center">
                          <div className="flex items-center mb-1">
                            <span className="text-2xl mr-2">🍽️</span>
                            <span className="font-bold">TODAY'S SPECIAL</span>
                            {state.todaysSpecial.price && (
                              <span className="ml-2 text-lg">${state.todaysSpecial.price}</span>
                            )}
                          </div>
                          <div className="text-lg font-normal">{state.todaysSpecial.name}</div>
                          {state.todaysSpecial.description && (
                            <div className="text-sm opacity-90 mt-1">{state.todaysSpecial.description}</div>
                          )}
                          {state.todaysSpecial.orders_remaining !== undefined && state.todaysSpecial.orders_remaining < 5 && (
                            <div className="text-xs opacity-80 mt-1">
                              Only {state.todaysSpecial.orders_remaining} left!
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </Button>
                ) : state.todaysSpecial && !state.todaysSpecial.is_available ? (
                  <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="font-semibold">Today's Special</div>
                      <div className="text-sm">{state.todaysSpecial.name} - Currently Unavailable</div>
                    </div>
                  </div>
                ) : null}

                {/* Usual Order */}
                {state.selectedResident.usualOrder && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-16 text-lg border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                    onClick={orderUsual}
                    disabled={state.loading.orderProcessing}
                  >
                    <div className="flex items-center">
                      <Clock className="mr-3 h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold">Their Usual</div>
                        <div className="text-sm text-gray-600">{state.selectedResident.usualOrder}</div>
                      </div>
                    </div>
                  </Button>
                )}

                {/* Voice Order Option */}
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full h-12 text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    onClose()
                    onShowVoicePanel()
                  }}
                  disabled={state.loading.orderProcessing}
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Something Else (Voice Order)
                </Button>

                {/* Dietary Warnings */}
                {state.selectedResident.resident.dietary_restrictions && (
                  <Alert className="mt-4 border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Dietary Alert:</strong> {state.selectedResident.resident.dietary_restrictions}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}

          {/* Processing Phase */}
          {state.phase === 'processing' && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
                <p className="text-gray-600">Processing order...</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * MIGRATION NOTES:
 * 
 * BEFORE (useState explosion):
 * - 6 separate useState calls for modal workflow
 * - Loading states could conflict and get out of sync
 * - Resident selection state could become inconsistent
 * - Modal phases were unclear and hard to debug
 * - Race conditions during async data loading
 * 
 * AFTER (useReducer pattern):
 * - Single state object with clear modal phases
 * - State machine prevents impossible states
 * - Atomic transitions for async operations
 * - Clear separation of loading vs UI states
 * - Predictable modal workflow that's easy to debug
 * 
 * MODAL WORKFLOW PATTERNS:
 * 
 * 1. ALWAYS use useReducer for complex modal workflows
 * 2. Define clear phases (loading, selection, processing, error)
 * 3. Prevent impossible states at the reducer level
 * 4. Keep async operations in the hook, not the reducer
 * 5. Test rapid user interactions for race conditions
 * 
 * VETERAN'S LESSON:
 * Modals with async operations are complex state machines.
 * useState creates bugs that only appear with slow networks or
 * rapid user interactions (double-clicks, quick navigation).
 * 
 * A junior developer trying to debug "why the modal sometimes
 * shows wrong state" with 6 useState variables will spend days.
 * 
 * With a state machine, you can see exactly which phase the modal
 * is in and what actions are possible from that state.
 * 
 * Choose debuggability over "simplicity".
 */