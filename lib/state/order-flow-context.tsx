'use client'

import { ReactNode, createContext, useContext, useMemo, useReducer } from 'react'
import type { Table } from '@/lib/floor-plan-utils'
// import type { Profile } from '@/types/database' // Unused for now

export type OrderFlowStep = 
  | 'tableSelect' 
  | 'seatPicker' 
  | 'orderType' 
  | 'residentSelect' 
  | 'voiceOrder' 
  | 'confirmation'

export interface OrderFlowState {
  currentStep: OrderFlowStep
  selectedTable: Table | null
  selectedSeat: number | null
  orderType: 'food' | 'drink' | null
  selectedResident: string | null
  selectedSuggestion: any | null
  isProcessing: boolean
  error: string | null
}

export type OrderFlowAction =
  | { type: 'SELECT_TABLE'; payload: Table }
  | { type: 'SELECT_SEAT'; payload: number }
  | { type: 'SET_ORDER_TYPE'; payload: 'food' | 'drink' }
  | { type: 'SELECT_RESIDENT'; payload: string }
  | { type: 'SELECT_SUGGESTION'; payload: any }
  | { type: 'GO_TO_STEP'; payload: OrderFlowStep }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_FLOW' }

const initialState: OrderFlowState = {
  currentStep: 'tableSelect',
  selectedTable: null,
  selectedSeat: null,
  orderType: null,
  selectedResident: null,
  selectedSuggestion: null,
  isProcessing: false,
  error: null,
}

function orderFlowReducer(state: OrderFlowState, action: OrderFlowAction): OrderFlowState {
  switch (action.type) {
    case 'SELECT_TABLE':
      return {
        ...state,
        selectedTable: action.payload,
        currentStep: 'seatPicker',
        error: null,
      }
    
    case 'SELECT_SEAT':
      return {
        ...state,
        selectedSeat: action.payload,
        currentStep: 'orderType',
        error: null,
      }
    
    case 'SET_ORDER_TYPE':
      return {
        ...state,
        orderType: action.payload,
        currentStep: 'residentSelect',
        error: null,
      }
    
    case 'SELECT_RESIDENT':
      return {
        ...state,
        selectedResident: action.payload,
        currentStep: 'voiceOrder',
        error: null,
      }
    
    case 'SELECT_SUGGESTION':
      return {
        ...state,
        selectedSuggestion: action.payload,
        currentStep: 'confirmation',
        error: null,
      }
    
    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.payload,
        error: null,
      }
    
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isProcessing: false,
      }
    
    case 'RESET_FLOW':
      return {
        ...initialState,
      }
    
    default:
      return state
  }
}

interface OrderFlowContextValue {
  state: OrderFlowState
  actions: {
    selectTable: (table: Table) => void
    selectSeat: (seat: number) => void
    setOrderType: (type: 'food' | 'drink') => void
    selectResident: (residentId: string) => void
    selectSuggestion: (suggestion: any) => void
    goToStep: (step: OrderFlowStep) => void
    setProcessing: (processing: boolean) => void
    setError: (error: string | null) => void
    resetFlow: () => void
  }
}

const OrderFlowContext = createContext<OrderFlowContextValue | null>(null)

export function OrderFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderFlowReducer, initialState)

  const actions = useMemo(
    () => ({
      selectTable: (_table: Table) => dispatch({ type: 'SELECT_TABLE', payload: _table }),
      selectSeat: (_seat: number) => dispatch({ type: 'SELECT_SEAT', payload: _seat }),
      setOrderType: (_type: 'food' | 'drink') => dispatch({ type: 'SET_ORDER_TYPE', payload: _type }),
      selectResident: (_residentId: string) => dispatch({ type: 'SELECT_RESIDENT', payload: _residentId }),
      selectSuggestion: (_suggestion: any) => dispatch({ type: 'SELECT_SUGGESTION', payload: _suggestion }),
      goToStep: (_step: OrderFlowStep) => dispatch({ type: 'GO_TO_STEP', payload: _step }),
      setProcessing: (_processing: boolean) => dispatch({ type: 'SET_PROCESSING', payload: _processing }),
      setError: (_error: string | null) => dispatch({ type: 'SET_ERROR', payload: _error }),
      resetFlow: () => dispatch({ type: 'RESET_FLOW' }),
    }),
    [dispatch]
  )

  const value = useMemo(() => ({ state, actions }), [state, actions])

  return (
    <OrderFlowContext.Provider value={value}>
      {children}
    </OrderFlowContext.Provider>
  )
}

export function useOrderFlow(): OrderFlowContextValue {
  const context = useContext(OrderFlowContext)
  if (!context) {
    throw new Error('useOrderFlow must be used within OrderFlowProvider')
  }
  return context
}

// Convenience hooks for accessing specific parts of the state
export function useOrderFlowState() {
  const { state } = useOrderFlow()
  return state
}

export function useOrderFlowActions() {
  const { actions } = useOrderFlow()
  return actions
}