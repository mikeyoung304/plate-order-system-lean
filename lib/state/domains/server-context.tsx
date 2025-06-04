'use client'

/**
 * Server Operations Context
 * 
 * Manages server workflow state, seat selection, order flow, and UI state.
 * Extracted from the monolithic restaurant-state-context.tsx to focus
 * on server-specific operations and state management.
 */

import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
} from 'react'
import type { Table } from '@/lib/floor-plan-utils'

// Server workflow steps
type ServerWorkflowStep = 
  | 'floorPlan'
  | 'seatPicker'
  | 'orderType'
  | 'residentSelect'
  | 'voiceOrder'
  | 'confirmation'

// Order type selection
type OrderType = 'food' | 'drink' | null

// Server state interface
interface ServerState {
  // Current workflow
  currentStep: ServerWorkflowStep
  canProceed: boolean
  
  // Table and seat selection
  selectedTable: Table | null
  selectedSeat: number | null
  
  // Order details
  orderType: OrderType
  selectedResident: any | null
  orderItems: string[]
  specialInstructions: string
  
  // Voice recording state
  isRecording: boolean
  transcript: string
  
  // UI state
  showSeatPicker: boolean
  showResidentSelector: boolean
  showVoicePanel: boolean
  
  // Validation state
  errors: Record<string, string>
}

// Server actions
type ServerAction =
  | { type: 'SET_STEP'; payload: ServerWorkflowStep }
  | { type: 'SELECT_TABLE'; payload: Table | null }
  | { type: 'SELECT_SEAT'; payload: number | null }
  | { type: 'SET_ORDER_TYPE'; payload: OrderType }
  | { type: 'SELECT_RESIDENT'; payload: any | null }
  | { type: 'SET_ORDER_ITEMS'; payload: string[] }
  | { type: 'ADD_ORDER_ITEM'; payload: string }
  | { type: 'REMOVE_ORDER_ITEM'; payload: string }
  | { type: 'SET_SPECIAL_INSTRUCTIONS'; payload: string }
  | { type: 'SET_RECORDING'; payload: boolean }
  | { type: 'SET_TRANSCRIPT'; payload: string }
  | { type: 'TOGGLE_SEAT_PICKER'; payload?: boolean }
  | { type: 'TOGGLE_RESIDENT_SELECTOR'; payload?: boolean }
  | { type: 'TOGGLE_VOICE_PANEL'; payload?: boolean }
  | { type: 'SET_ERROR'; payload: { field: string; error: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'RESET_ORDER' }
  | { type: 'RESET_ALL' }

// Initial state
const initialState: ServerState = {
  currentStep: 'floorPlan',
  canProceed: false,
  selectedTable: null,
  selectedSeat: null,
  orderType: null,
  selectedResident: null,
  orderItems: [],
  specialInstructions: '',
  isRecording: false,
  transcript: '',
  showSeatPicker: false,
  showResidentSelector: false,
  showVoicePanel: false,
  errors: {},
}

// Validation functions
function validateStep(state: ServerState, step: ServerWorkflowStep): boolean {
  switch (step) {
    case 'floorPlan':
      return true // Always valid
    case 'seatPicker':
      return state.selectedTable !== null
    case 'orderType':
      return state.selectedTable !== null && state.selectedSeat !== null
    case 'residentSelect':
      return state.orderType !== null
    case 'voiceOrder':
      return state.selectedResident !== null
    case 'confirmation':
      return state.orderItems.length > 0
    default:
      return false
  }
}

function canProceedFromStep(state: ServerState): boolean {
  switch (state.currentStep) {
    case 'floorPlan':
      return state.selectedTable !== null
    case 'seatPicker':
      return state.selectedSeat !== null
    case 'orderType':
      return state.orderType !== null
    case 'residentSelect':
      return state.selectedResident !== null
    case 'voiceOrder':
      return state.orderItems.length > 0
    case 'confirmation':
      return true
    default:
      return false
  }
}

// Reducer function
function serverReducer(state: ServerState, action: ServerAction): ServerState {
  let newState: ServerState
  
  switch (action.type) {
    case 'SET_STEP':
      if (!validateStep(state, action.payload)) {
        return state // Don't allow invalid step transitions
      }
      newState = { ...state, currentStep: action.payload }
      break
      
    case 'SELECT_TABLE':
      newState = {
        ...state,
        selectedTable: action.payload,
        selectedSeat: null, // Reset seat when table changes
        selectedResident: null, // Reset resident when table changes
        showSeatPicker: action.payload !== null,
      }
      break
      
    case 'SELECT_SEAT':
      newState = {
        ...state,
        selectedSeat: action.payload,
        showSeatPicker: false,
      }
      break
      
    case 'SET_ORDER_TYPE':
      newState = {
        ...state,
        orderType: action.payload,
        showResidentSelector: action.payload !== null,
      }
      break
      
    case 'SELECT_RESIDENT':
      newState = {
        ...state,
        selectedResident: action.payload,
        showResidentSelector: false,
        showVoicePanel: action.payload !== null,
      }
      break
      
    case 'SET_ORDER_ITEMS':
      newState = { ...state, orderItems: action.payload }
      break
      
    case 'ADD_ORDER_ITEM':
      newState = {
        ...state,
        orderItems: [...state.orderItems, action.payload],
      }
      break
      
    case 'REMOVE_ORDER_ITEM':
      newState = {
        ...state,
        orderItems: state.orderItems.filter(item => item !== action.payload),
      }
      break
      
    case 'SET_SPECIAL_INSTRUCTIONS':
      newState = { ...state, specialInstructions: action.payload }
      break
      
    case 'SET_RECORDING':
      newState = { ...state, isRecording: action.payload }
      break
      
    case 'SET_TRANSCRIPT':
      newState = { ...state, transcript: action.payload }
      break
      
    case 'TOGGLE_SEAT_PICKER':
      newState = {
        ...state,
        showSeatPicker: action.payload ?? !state.showSeatPicker,
      }
      break
      
    case 'TOGGLE_RESIDENT_SELECTOR':
      newState = {
        ...state,
        showResidentSelector: action.payload ?? !state.showResidentSelector,
      }
      break
      
    case 'TOGGLE_VOICE_PANEL':
      newState = {
        ...state,
        showVoicePanel: action.payload ?? !state.showVoicePanel,
      }
      break
      
    case 'SET_ERROR':
      newState = {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.field]: action.payload.error,
        },
      }
      break
      
    case 'CLEAR_ERROR':
      const { [action.payload]: removed, ...remainingErrors } = state.errors
      newState = { ...state, errors: remainingErrors }
      break
      
    case 'CLEAR_ALL_ERRORS':
      newState = { ...state, errors: {} }
      break
      
    case 'RESET_ORDER':
      newState = {
        ...state,
        orderType: null,
        selectedResident: null,
        orderItems: [],
        specialInstructions: '',
        transcript: '',
        isRecording: false,
        currentStep: 'orderType',
        showResidentSelector: false,
        showVoicePanel: false,
        errors: {},
      }
      break
      
    case 'RESET_ALL':
      newState = initialState
      break
      
    default:
      return state
  }
  
  // Update canProceed for the new state
  newState.canProceed = canProceedFromStep(newState)
  
  return newState
}

// Context interface
interface ServerContextValue {
  // State
  state: ServerState
  
  // Workflow navigation
  setStep: (step: ServerWorkflowStep) => void
  nextStep: () => void
  previousStep: () => void
  canGoToStep: (step: ServerWorkflowStep) => boolean
  
  // Table and seat operations
  selectTable: (table: Table | null) => void
  selectSeat: (seat: number | null) => void
  
  // Order operations
  setOrderType: (type: OrderType) => void
  selectResident: (resident: any | null) => void
  setOrderItems: (items: string[]) => void
  addOrderItem: (item: string) => void
  removeOrderItem: (item: string) => void
  setSpecialInstructions: (instructions: string) => void
  
  // Voice operations
  startRecording: () => void
  stopRecording: () => void
  setTranscript: (transcript: string) => void
  
  // UI operations
  toggleSeatPicker: (show?: boolean) => void
  toggleResidentSelector: (show?: boolean) => void
  toggleVoicePanel: (show?: boolean) => void
  
  // Validation and errors
  setError: (field: string, error: string) => void
  clearError: (field: string) => void
  clearAllErrors: () => void
  hasErrors: boolean
  
  // Reset operations
  resetOrder: () => void
  resetAll: () => void
  
  // Utilities
  isStepValid: (step: ServerWorkflowStep) => boolean
  getCurrentStepName: () => string
}

const ServerContext = createContext<ServerContextValue | null>(null)

interface ServerProviderProps {
  children: ReactNode
}

export function ServerProvider({ children }: ServerProviderProps) {
  const [state, dispatch] = useReducer(serverReducer, initialState)
  const mountedRef = useRef(true)
  
  // Workflow step order
  const stepOrder: ServerWorkflowStep[] = [
    'floorPlan',
    'seatPicker',
    'orderType',
    'residentSelect',
    'voiceOrder',
    'confirmation',
  ]
  
  // Workflow navigation
  const setStep = useCallback((step: ServerWorkflowStep) => {
    dispatch({ type: 'SET_STEP', payload: step })
  }, [])
  
  const nextStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(state.currentStep)
    if (currentIndex < stepOrder.length - 1 && state.canProceed) {
      const nextStepName = stepOrder[currentIndex + 1]
      dispatch({ type: 'SET_STEP', payload: nextStepName })
    }
  }, [state.currentStep, state.canProceed])
  
  const previousStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(state.currentStep)
    if (currentIndex > 0) {
      const prevStepName = stepOrder[currentIndex - 1]
      dispatch({ type: 'SET_STEP', payload: prevStepName })
    }
  }, [state.currentStep])
  
  const canGoToStep = useCallback((step: ServerWorkflowStep) => {
    return validateStep(state, step)
  }, [state])
  
  // Table and seat operations
  const selectTable = useCallback((table: Table | null) => {
    dispatch({ type: 'SELECT_TABLE', payload: table })
  }, [])
  
  const selectSeat = useCallback((seat: number | null) => {
    dispatch({ type: 'SELECT_SEAT', payload: seat })
  }, [])
  
  // Order operations
  const setOrderType = useCallback((type: OrderType) => {
    dispatch({ type: 'SET_ORDER_TYPE', payload: type })
  }, [])
  
  const selectResident = useCallback((resident: any | null) => {
    dispatch({ type: 'SELECT_RESIDENT', payload: resident })
  }, [])
  
  const setOrderItems = useCallback((items: string[]) => {
    dispatch({ type: 'SET_ORDER_ITEMS', payload: items })
  }, [])
  
  const addOrderItem = useCallback((item: string) => {
    dispatch({ type: 'ADD_ORDER_ITEM', payload: item })
  }, [])
  
  const removeOrderItem = useCallback((item: string) => {
    dispatch({ type: 'REMOVE_ORDER_ITEM', payload: item })
  }, [])
  
  const setSpecialInstructions = useCallback((instructions: string) => {
    dispatch({ type: 'SET_SPECIAL_INSTRUCTIONS', payload: instructions })
  }, [])
  
  // Voice operations
  const startRecording = useCallback(() => {
    dispatch({ type: 'SET_RECORDING', payload: true })
  }, [])
  
  const stopRecording = useCallback(() => {
    dispatch({ type: 'SET_RECORDING', payload: false })
  }, [])
  
  const setTranscript = useCallback((transcript: string) => {
    dispatch({ type: 'SET_TRANSCRIPT', payload: transcript })
  }, [])
  
  // UI operations
  const toggleSeatPicker = useCallback((show?: boolean) => {
    dispatch({ type: 'TOGGLE_SEAT_PICKER', payload: show })
  }, [])
  
  const toggleResidentSelector = useCallback((show?: boolean) => {
    dispatch({ type: 'TOGGLE_RESIDENT_SELECTOR', payload: show })
  }, [])
  
  const toggleVoicePanel = useCallback((show?: boolean) => {
    dispatch({ type: 'TOGGLE_VOICE_PANEL', payload: show })
  }, [])
  
  // Validation and errors
  const setError = useCallback((field: string, error: string) => {
    dispatch({ type: 'SET_ERROR', payload: { field, error } })
  }, [])
  
  const clearError = useCallback((field: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: field })
  }, [])
  
  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' })
  }, [])
  
  // Reset operations
  const resetOrder = useCallback(() => {
    dispatch({ type: 'RESET_ORDER' })
  }, [])
  
  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' })
  }, [])
  
  // Utilities
  const isStepValid = useCallback((step: ServerWorkflowStep) => {
    return validateStep(state, step)
  }, [state])
  
  const getCurrentStepName = useCallback(() => {
    switch (state.currentStep) {
      case 'floorPlan': return 'Select Table'
      case 'seatPicker': return 'Select Seat'
      case 'orderType': return 'Order Type'
      case 'residentSelect': return 'Select Resident'
      case 'voiceOrder': return 'Voice Order'
      case 'confirmation': return 'Confirm Order'
      default: return 'Unknown Step'
    }
  }, [state.currentStep])
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])
  
  // Context value
  const contextValue: ServerContextValue = {
    state,
    setStep,
    nextStep,
    previousStep,
    canGoToStep,
    selectTable,
    selectSeat,
    setOrderType,
    selectResident,
    setOrderItems,
    addOrderItem,
    removeOrderItem,
    setSpecialInstructions,
    startRecording,
    stopRecording,
    setTranscript,
    toggleSeatPicker,
    toggleResidentSelector,
    toggleVoicePanel,
    setError,
    clearError,
    clearAllErrors,
    hasErrors: Object.keys(state.errors).length > 0,
    resetOrder,
    resetAll,
    isStepValid,
    getCurrentStepName,
  }
  
  return (
    <ServerContext.Provider value={contextValue}>
      {children}
    </ServerContext.Provider>
  )
}

// Hook for using server context
export function useServer() {
  const context = useContext(ServerContext)
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider')
  }
  return context
}

// Hook for workflow state only
export function useServerWorkflow() {
  const { state, setStep, nextStep, previousStep, getCurrentStepName } = useServer()
  return {
    currentStep: state.currentStep,
    canProceed: state.canProceed,
    setStep,
    nextStep,
    previousStep,
    stepName: getCurrentStepName(),
  }
}

// Hook for order state only
export function useServerOrder() {
  const {
    state,
    setOrderType,
    selectResident,
    setOrderItems,
    addOrderItem,
    removeOrderItem,
    setSpecialInstructions,
  } = useServer()
  
  return {
    orderType: state.orderType,
    selectedResident: state.selectedResident,
    orderItems: state.orderItems,
    specialInstructions: state.specialInstructions,
    setOrderType,
    selectResident,
    setOrderItems,
    addOrderItem,
    removeOrderItem,
    setSpecialInstructions,
  }
}