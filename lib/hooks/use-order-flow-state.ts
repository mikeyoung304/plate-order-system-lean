import { useCallback, useReducer } from 'react'

// Order flow state machine types
export type OrderFlowStep =
  | 'floorPlan'
  | 'seatPicker'
  | 'orderType'
  | 'residentSelect'
  | 'voiceOrder'

export interface OrderFlowState {
  currentStep: OrderFlowStep
  selectedTable: any | null
  selectedSeat: number | null
  orderType: 'food' | 'drink' | null
  selectedResident: string | null
  selectedSuggestion: any | null
  showVoiceOrderPanel: boolean
}

export type OrderFlowAction =
  | { type: 'SELECT_TABLE'; table: any }
  | { type: 'SELECT_SEAT'; seat: number }
  | { type: 'SELECT_ORDER_TYPE'; orderType: 'food' | 'drink' }
  | { type: 'SELECT_RESIDENT'; residentId: string }
  | { type: 'SELECT_SUGGESTION'; suggestion: any }
  | { type: 'SHOW_VOICE_ORDER' }
  | { type: 'HIDE_VOICE_ORDER' }
  | { type: 'RESET_FLOW' }
  | { type: 'GO_TO_STEP'; step: OrderFlowStep }

const initialState: OrderFlowState = {
  currentStep: 'floorPlan',
  selectedTable: null,
  selectedSeat: null,
  orderType: null,
  selectedResident: null,
  selectedSuggestion: null,
  showVoiceOrderPanel: false,
}

function orderFlowReducer(
  state: OrderFlowState,
  action: OrderFlowAction
): OrderFlowState {
  switch (action.type) {
    case 'SELECT_TABLE':
      return {
        ...state,
        selectedTable: action.table,
        currentStep: 'seatPicker',
        // Reset downstream selections
        selectedSeat: null,
        orderType: null,
        selectedResident: null,
        selectedSuggestion: null,
      }

    case 'SELECT_SEAT':
      return {
        ...state,
        selectedSeat: action.seat,
        currentStep: 'orderType',
        // Reset downstream selections
        orderType: null,
        selectedResident: null,
        selectedSuggestion: null,
      }

    case 'SELECT_ORDER_TYPE':
      return {
        ...state,
        orderType: action.orderType,
        currentStep: 'residentSelect',
        // Reset downstream selections
        selectedResident: null,
        selectedSuggestion: null,
      }

    case 'SELECT_RESIDENT':
      return {
        ...state,
        selectedResident: action.residentId,
        // Stay on same step to allow suggestion selection
      }

    case 'SELECT_SUGGESTION':
      return {
        ...state,
        selectedSuggestion: action.suggestion,
      }

    case 'SHOW_VOICE_ORDER':
      return {
        ...state,
        currentStep: 'voiceOrder',
        showVoiceOrderPanel: true,
      }

    case 'HIDE_VOICE_ORDER':
      return {
        ...state,
        currentStep: 'residentSelect',
        showVoiceOrderPanel: false,
      }

    case 'RESET_FLOW':
      return initialState

    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.step,
      }

    default:
      return state
  }
}

export function useOrderFlowState() {
  const [state, dispatch] = useReducer(orderFlowReducer, initialState)

  // Action creators
  const selectTable = useCallback((table: any) => {
    dispatch({ type: 'SELECT_TABLE', table })
  }, [])

  const selectSeat = useCallback((seat: number) => {
    dispatch({ type: 'SELECT_SEAT', seat })
  }, [])

  const selectOrderType = useCallback((orderType: 'food' | 'drink') => {
    dispatch({ type: 'SELECT_ORDER_TYPE', orderType })
  }, [])

  const selectResident = useCallback((residentId: string) => {
    dispatch({ type: 'SELECT_RESIDENT', residentId })
  }, [])

  const selectSuggestion = useCallback((suggestion: any) => {
    dispatch({ type: 'SELECT_SUGGESTION', suggestion })
  }, [])

  const showVoiceOrder = useCallback(() => {
    dispatch({ type: 'SHOW_VOICE_ORDER' })
  }, [])

  const hideVoiceOrder = useCallback(() => {
    dispatch({ type: 'HIDE_VOICE_ORDER' })
  }, [])

  const resetFlow = useCallback(() => {
    dispatch({ type: 'RESET_FLOW' })
  }, [])

  const goToStep = useCallback((step: OrderFlowStep) => {
    dispatch({ type: 'GO_TO_STEP', step })
  }, [])

  // Computed properties
  const canProceedToNextStep = (() => {
    switch (state.currentStep) {
      case 'floorPlan':
        return !!state.selectedTable
      case 'seatPicker':
        return !!state.selectedSeat
      case 'orderType':
        return !!state.orderType
      case 'residentSelect':
        return !!state.selectedResident
      case 'voiceOrder':
        return true
      default:
        return false
    }
  })()

  const isComplete =
    state.selectedTable &&
    state.selectedSeat &&
    state.orderType &&
    state.selectedResident

  return {
    // State
    ...state,
    canProceedToNextStep,
    isComplete,

    // Actions
    selectTable,
    selectSeat,
    selectOrderType,
    selectResident,
    selectSuggestion,
    showVoiceOrder,
    hideVoiceOrder,
    resetFlow,
    goToStep,
  }
}
