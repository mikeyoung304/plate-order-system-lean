import { useReducer, useCallback, useRef, useEffect } from 'react'

// Voice recording state machine types
export type VoiceRecordingStep = 'idle' | 'recording' | 'processing' | 'confirming' | 'submitting' | 'success' | 'error'

export interface VoiceRecordingState {
  step: VoiceRecordingStep
  transcription: string
  transcriptionItems: string[]
  dietaryAlerts: string[]
  error: string | null
  retryCount: number
  showConfirmation: boolean
}

export type VoiceRecordingAction =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'PROCESSING' }
  | { type: 'TRANSCRIPTION_SUCCESS'; transcription: string; items: string[]; alerts: string[] }
  | { type: 'TRANSCRIPTION_ERROR'; error: string }
  | { type: 'CONFIRM_ORDER' }
  | { type: 'SUBMIT_ORDER' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'CANCEL' }

const initialState: VoiceRecordingState = {
  step: 'idle',
  transcription: '',
  transcriptionItems: [],
  dietaryAlerts: [],
  error: null,
  retryCount: 0,
  showConfirmation: false
}

function voiceRecordingReducer(state: VoiceRecordingState, action: VoiceRecordingAction): VoiceRecordingState {
  switch (action.type) {
    case 'START_RECORDING':
      return {
        ...state,
        step: 'recording',
        error: null,
        transcription: '',
        transcriptionItems: [],
        dietaryAlerts: []
      }

    case 'STOP_RECORDING':
      return {
        ...state,
        step: 'processing'
      }

    case 'PROCESSING':
      return {
        ...state,
        step: 'processing'
      }

    case 'TRANSCRIPTION_SUCCESS':
      return {
        ...state,
        step: 'confirming',
        transcription: action.transcription,
        transcriptionItems: action.items,
        dietaryAlerts: action.alerts,
        showConfirmation: true,
        error: null,
        retryCount: 0
      }

    case 'TRANSCRIPTION_ERROR':
      const newRetryCount = state.retryCount + 1
      return {
        ...state,
        step: 'error',
        error: action.error,
        retryCount: newRetryCount,
        showConfirmation: false
      }

    case 'CONFIRM_ORDER':
      return {
        ...state,
        step: 'submitting',
        showConfirmation: false
      }

    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        step: 'success'
      }

    case 'SUBMIT_ERROR':
      return {
        ...state,
        step: 'error',
        error: action.error
      }

    case 'RETRY':
      return {
        ...state,
        step: 'idle',
        error: null,
        showConfirmation: false
      }

    case 'RESET':
      return initialState

    case 'CANCEL':
      return {
        ...state,
        step: 'idle',
        showConfirmation: false,
        error: null
      }

    default:
      return state
  }
}

export interface VoiceRecordingOptions {
  onSuccess?: (items: string[]) => void
  onError?: (error: string) => void
  maxRetries?: number
}

export function useVoiceRecordingState(options: VoiceRecordingOptions = {}) {
  const { onSuccess, onError, maxRetries = 3 } = options
  const [state, dispatch] = useReducer(voiceRecordingReducer, initialState)
  const audioRecorderRef = useRef<any>(null)

  // Action creators
  const startRecording = useCallback(async () => {
    try {
      dispatch({ type: 'START_RECORDING' })
      
      // Initialize audio recorder if needed
      if (!audioRecorderRef.current) {
        const { AudioRecorder } = await import('@/lib/modassembly/audio-recording/record')
        audioRecorderRef.current = new AudioRecorder()
      }
      
      // Check microphone permissions first
      const hasPermission = await audioRecorderRef.current.requestPermission()
      if (!hasPermission) {
        throw new Error('Microphone permission denied. Please allow microphone access in your browser settings.')
      }
      
      await audioRecorderRef.current.startRecording()
    } catch (error) {
      dispatch({ 
        type: 'TRANSCRIPTION_ERROR', 
        error: error instanceof Error ? error.message : 'Failed to start recording'
      })
    }
  }, [])

  const stopRecording = useCallback(async () => {
    try {
      dispatch({ type: 'STOP_RECORDING' })
      dispatch({ type: 'PROCESSING' })
      
      if (!audioRecorderRef.current) {
        throw new Error('No audio recorder available')
      }
      
      const recordingResult = await audioRecorderRef.current.stopRecording()
      
      // Send to transcription service
      const formData = new FormData()
      formData.append('audio', recordingResult.audioBlob)
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      
      // The API returns both transcription and items
      const transcription = result.transcription || ''
      const items = result.items && Array.isArray(result.items) ? result.items : parseTranscriptionToItems(transcription)
      const alerts = checkDietaryAlerts(items) // Simple keyword check
      
      dispatch({
        type: 'TRANSCRIPTION_SUCCESS',
        transcription,
        items,
        alerts
      })
      
    } catch (error) {
      dispatch({
        type: 'TRANSCRIPTION_ERROR',
        error: error instanceof Error ? error.message : 'Recording failed'
      })
      onError?.(error instanceof Error ? error.message : 'Recording failed')
    }
  }, [onError])

  const confirmOrder = useCallback(async () => {
    try {
      dispatch({ type: 'CONFIRM_ORDER' })
      
      // Submit order (this would integrate with order submission logic)
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      dispatch({ type: 'SUBMIT_SUCCESS' })
      onSuccess?.(state.transcriptionItems)
      
    } catch (error) {
      dispatch({
        type: 'SUBMIT_ERROR',
        error: error instanceof Error ? error.message : 'Failed to submit order'
      })
      onError?.(error instanceof Error ? error.message : 'Failed to submit order')
    }
  }, [state.transcriptionItems, onSuccess, onError])

  const retry = useCallback(() => {
    if (state.retryCount < maxRetries) {
      dispatch({ type: 'RETRY' })
    } else {
      onError?.('Maximum retry attempts reached')
    }
  }, [state.retryCount, maxRetries, onError])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const cancel = useCallback(() => {
    // Clean up audio recorder if recording
    if (audioRecorderRef.current && audioRecorderRef.current.isRecording()) {
      audioRecorderRef.current.cleanup()
    }
    dispatch({ type: 'CANCEL' })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.cleanup()
      }
    }
  }, [])

  // Computed properties
  const isRecording = state.step === 'recording'
  const isProcessing = state.step === 'processing'
  const isSubmitting = state.step === 'submitting'
  const hasError = state.step === 'error'
  const isSuccess = state.step === 'success'
  const canRetry = state.retryCount < maxRetries && hasError
  const shouldShowRetryMessage = state.retryCount > 0 && state.retryCount < maxRetries

  return {
    // State
    ...state,
    isRecording,
    isProcessing,
    isSubmitting,
    hasError,
    isSuccess,
    canRetry,
    shouldShowRetryMessage,
    
    // Actions
    startRecording,
    stopRecording,
    confirmOrder,
    retry,
    reset,
    cancel
  }
}

// Helper functions
function parseTranscriptionToItems(transcription: string): string[] {
  if (!transcription.trim()) return []
  
  // Simple parsing - split by common separators
  return transcription
    .split(/[,;]\s*|\sand\s+/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => item.replace(/^(i want|i'd like|please|give me)\s+/i, ''))
    .map(item => item.charAt(0).toUpperCase() + item.slice(1))
}

function checkDietaryAlerts(items: string[]): string[] {
  const alerts: string[] = []
  const itemsText = items.join(' ').toLowerCase()
  
  // Simple keyword-based alerts (would be more sophisticated in real app)
  if (itemsText.includes('nuts') || itemsText.includes('peanut')) {
    alerts.push('Contains nuts - check resident allergies')
  }
  if (itemsText.includes('dairy') || itemsText.includes('milk') || itemsText.includes('cheese')) {
    alerts.push('Contains dairy - check lactose intolerance')
  }
  if (itemsText.includes('gluten') || itemsText.includes('bread') || itemsText.includes('wheat')) {
    alerts.push('Contains gluten - check dietary restrictions')
  }
  
  return alerts
}