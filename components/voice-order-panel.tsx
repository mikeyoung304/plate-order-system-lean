import React, { memo, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mic,
  Square,
  XCircle,
} from 'lucide-react'
// Removed framer-motion import - using CSS animations
import { VoiceProcessingLoader } from '@/components/loading-states'
import { sanitizeText } from '@/lib/utils/security'
import { useVoiceRecordingState } from '@/lib/hooks/use-voice-recording-state'

type VoiceOrderPanelProps = {
  tableId: string
  tableName: string
  seatNumber: number
  orderType: 'food' | 'drink'
  onOrderSubmitted?: (orderData: {
    items: string[]
    transcription: string
  }) => void
  onCancel?: () => void
  testMode?: boolean
}

export const VoiceOrderPanel = memo(function VoiceOrderPanel({
  tableId,
  tableName,
  seatNumber,
  orderType,
  onOrderSubmitted,
  onCancel,
  testMode = false,
}: VoiceOrderPanelProps) {
  const sanitizedProps = useMemo(() => {
    if (!tableId || !tableName || typeof seatNumber !== 'number') {
      console.error('VoiceOrderPanel: Invalid props provided')
      return null
    }

    return {
      tableId: sanitizeText(tableId),
      tableName: sanitizeText(tableName),
      seatNumber: Math.max(1, Math.min(20, Math.floor(seatNumber))),
      orderType: ['food', 'drink'].includes(orderType) ? orderType : 'food',
    }
  }, [tableId, tableName, seatNumber, orderType])

  // --- Consolidated State Management ---
  const { toast } = useToast()

  const voiceState = useVoiceRecordingState({
    onSuccess: items => {
      if (onOrderSubmitted) {
        onOrderSubmitted({
          items,
          transcription: voiceState.transcription,
        })
      }
    },
    onError: error => {
      toast({
        title: 'Recording Error',
        description: error,
        variant: 'destructive',
      })
    },
    maxRetries: 3,
  })

  // Early return if props are invalid
  if (!sanitizedProps) {
    return (
      <div className='voice-order-panel p-4 border rounded-lg shadow-md bg-destructive/10 text-destructive flex items-center justify-center'>
        <AlertCircle className='mr-2 h-5 w-5' />
        Invalid configuration. Please check table and seat information.
      </div>
    )
  }

  // --- Simplified Helper Functions ---
  const handleCancel = useCallback(() => {
    voiceState.cancel()
    onCancel?.()
  }, [voiceState, onCancel])

  // --- Simplified Voice Recording Logic ---
  const handleStartRecording = useCallback(async () => {
    await voiceState.startRecording()
  }, [voiceState])

  const handleStopRecording = useCallback(async () => {
    await voiceState.stopRecording()
  }, [voiceState])

  const handleConfirmOrder = useCallback(async () => {
    await voiceState.confirmOrder()
  }, [voiceState])

  // --- Rendering Logic ---
  const transcriptionDisplayText = useMemo(() => {
    if (voiceState.isSubmitting) {
      return 'Submitting your order...'
    }
    if (voiceState.isProcessing) {
      return 'Processing audio...'
    }
    if (voiceState.isRecording) {
      return 'Listening... Tap to stop recording'
    }
    if (
      voiceState.showConfirmation &&
      voiceState.transcriptionItems.length > 0
    ) {
      return voiceState.transcriptionItems.join(' • ')
    }
    if (
      voiceState.showConfirmation &&
      voiceState.transcriptionItems.length === 0
    ) {
      return 'No items detected.'
    }
    if (voiceState.hasError && voiceState.shouldShowRetryMessage) {
      return `${voiceState.error} (Retry ${voiceState.retryCount}/3)`
    }
    if (voiceState.hasError) {
      return voiceState.error
    }
    return `Tap microphone to start recording your ${sanitizedProps.orderType} order`
  }, [voiceState, sanitizedProps.orderType])

  const getButtonIcon = () => {
    if (voiceState.isProcessing || voiceState.isSubmitting) {
      return <Loader2 className='h-6 w-6 animate-spin' />
    }
    if (voiceState.isRecording) {
      return <Square className='h-6 w-6 text-red-500 fill-red-500' />
    }
    return <Mic className='h-6 w-6' />
  }

  const isButtonDisabled = voiceState.isProcessing || voiceState.isSubmitting

  // --- JSX ---
  return (
    <div className='voice-order-panel p-4 border rounded-lg shadow-md bg-card text-card-foreground flex flex-col items-center space-y-4 max-w-md mx-auto'>
      {/* Title/Context - Using sanitized props */}
      <div className='text-center'>
        <p className='text-sm text-muted-foreground'>
          {sanitizedProps.tableName} - Seat {sanitizedProps.seatNumber} (
          {sanitizedProps.orderType})
        </p>
      </div>

      {/* Transcription Display Area with Enhanced Loading States */}
      <div className='w-full min-h-[80px] flex items-center justify-center'>
        {voiceState.isProcessing ? (
          <VoiceProcessingLoader
            stage='transcribing'
            message='Converting speech to text...'
          />
        ) : voiceState.isSubmitting ? (
          <VoiceProcessingLoader
            stage='saving'
            message='Submitting your order...'
          />
        ) : voiceState.isRecording ? (
          <VoiceProcessingLoader
            stage='listening'
            message='Listening to your order...'
          />
        ) : voiceState.showConfirmation &&
          voiceState.transcriptionItems.length > 0 ? (
          <div className='w-full p-4 border rounded-md bg-muted text-center'>
            <p className='text-sm font-medium mb-3 text-muted-foreground'>
              Your Order:
            </p>
            <ul className='space-y-2 voice-order-list'>
              {voiceState.transcriptionItems.map(
                (item: string, index: number) => (
                  <li
                    key={index}
                    className={`text-base flex items-center justify-center bg-white p-2 rounded shadow-sm voice-order-item-${Math.min(index + 1, 10)}`}
                  >
                    <span className='w-2 h-2 bg-primary rounded-full mr-3'></span>
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
        ) : (
          <div className='w-full p-4 border rounded-md bg-muted text-muted-foreground text-center'>
            <p className='text-lg font-medium'>{transcriptionDisplayText}</p>
          </div>
        )}
      </div>

      {/* Audio Visualization & Recording Indicator */}
      <div className='w-full h-[60px] flex items-center justify-center space-x-1 overflow-hidden'>
        {voiceState.isRecording &&
          Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className='voice-audio-bar w-1 bg-primary rounded-full'
              style={{ height: '5px', transition: 'height 0.1s ease-out' }}
            />
          ))}
      </div>

      {/* Action Buttons */}
      <div className='w-full flex flex-col items-center space-y-3'>
        {!voiceState.showConfirmation ? (
          <div className='flex flex-col items-center space-y-3'>
            {/* Recording Button */}
            <div
              className={`relative ${voiceState.isRecording ? 'voice-recording-indicator' : ''}`}
            >
              <Button
                size='lg'
                className={`w-20 h-20 rounded-full shadow-lg voice-order-button voice-button-hover voice-button-tap ${voiceState.isRecording ? 'bg-red-100 hover:bg-red-200 text-red-600 voice-button-recording' : 'bg-primary hover:bg-primary/90'} text-primary-foreground touch-manipulation`}
                onClick={
                  voiceState.isRecording
                    ? handleStopRecording
                    : handleStartRecording
                }
                disabled={isButtonDisabled}
                aria-label={
                  voiceState.isRecording ? 'Stop Recording' : 'Start Recording'
                }
              >
                {getButtonIcon()}
              </Button>
            </div>

            {/* Cancel Button */}
            <Button variant='outline' onClick={handleCancel} className='w-full'>
              Cancel Order
            </Button>
          </div>
        ) : (
          // Confirmation Buttons
          <div className='confirmation-buttons w-full flex justify-center space-x-4 voice-confirm-buttons'>
            <Button
              variant='outline'
              size='lg'
              onClick={voiceState.cancel}
              disabled={voiceState.isSubmitting}
              className='touch-manipulation'
            >
              <XCircle className='mr-2 h-5 w-5' /> Try Again
            </Button>
            <Button
              size='lg'
              onClick={handleConfirmOrder}
              disabled={voiceState.isSubmitting}
              className='touch-manipulation'
            >
              {voiceState.isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />{' '}
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className='mr-2 h-5 w-5' /> Submit Order
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Dietary Alerts */}
      {voiceState.dietaryAlerts.length > 0 && (
        <div className='dietary-alerts w-full p-3 border border-yellow-300 bg-yellow-50 rounded-md text-yellow-800 voice-dietary-alert'>
          <h4 className='font-semibold mb-1'>
            <AlertCircle className='inline-block h-4 w-4 mr-1' /> Potential
            Dietary Alert:
          </h4>
          <ul className='list-disc list-inside text-sm'>
            {voiceState.dietaryAlerts.map((alert: string) => (
              <li key={alert}>
                {alert.charAt(0).toUpperCase() + alert.slice(1)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})

VoiceOrderPanel.displayName = 'VoiceOrderPanel'
