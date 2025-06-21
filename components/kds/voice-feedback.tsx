'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useVoice } from '@/contexts/kds/voice-context'

interface VoiceFeedbackProps {
  className?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
  showVisualOnly?: boolean
  autoHideDelay?: number
  maxItems?: number
}

interface FeedbackItemProps {
  feedback: any
  onDismiss?: (id: string) => void
  showDismiss?: boolean
}

const FeedbackItem = memo(function FeedbackItem({
  feedback,
  onDismiss,
  showDismiss = true,
}: FeedbackItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50)

    // Auto progress countdown
    const duration = 4000 // 4 seconds
    const interval = 50
    const steps = duration / interval
    const decrement = 100 / steps

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const next = prev - decrement
        if (next <= 0) {
          clearInterval(progressTimer)
          handleDismiss()
          return 0
        }
        return next
      })
    }, interval)

    return () => clearInterval(progressTimer)
  }, [])

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      onDismiss?.(feedback.id)
    }, 200)
  }, [feedback.id, onDismiss])

  const getIcon = () => {
    switch (feedback.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getColors = () => {
    switch (feedback.type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-950',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-800 dark:text-green-200',
          progress: 'bg-green-500',
        }
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-950',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          progress: 'bg-red-500',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          progress: 'bg-yellow-500',
        }
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          progress: 'bg-blue-500',
        }
    }
  }

  const colors = getColors()

  return (
    <Card
      className={cn(
        'transition-all duration-200 shadow-lg',
        colors.bg,
        colors.border,
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={cn('text-sm font-medium', colors.text)}>
              {feedback.message}
            </div>
            
            {/* Progress bar */}
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className={cn('h-1 rounded-full transition-all duration-100', colors.progress)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          
          {showDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 hover:bg-black/10"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

export const VoiceFeedback = memo(function VoiceFeedback({
  className,
  position = 'top-right',
  showVisualOnly = false,
  autoHideDelay = 4000,
  maxItems = 3,
}: VoiceFeedbackProps) {
  const { state, setAudioEnabled } = useVoice()
  const [visibleFeedback, setVisibleFeedback] = useState<any[]>([])

  // Sync with voice context feedback queue
  useEffect(() => {
    const newFeedback = state.feedbackQueue
      .filter(f => !f.played)
      .slice(0, maxItems)
    
    setVisibleFeedback(newFeedback)
  }, [state.feedbackQueue, maxItems])

  const handleDismiss = useCallback((id: string) => {
    setVisibleFeedback(prev => prev.filter(f => f.id !== id))
  }, [])

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled(!state.audioEnabled)
  }, [state.audioEnabled, setAudioEnabled])

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
      default:
        return 'top-4 right-4'
    }
  }

  // Don't render if no feedback to show
  if (visibleFeedback.length === 0 && !showVisualOnly) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 max-w-sm w-full',
        getPositionClasses(),
        className
      )}
    >
      {/* Audio control (always visible if showVisualOnly) */}
      {showVisualOnly && (
        <div className="flex justify-end mb-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleAudio}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 shadow-sm"
          >
            {state.audioEnabled ? (
              <Volume2 className="h-3 w-3" />
            ) : (
              <VolumeX className="h-3 w-3" />
            )}
            <span className="text-xs">
              {state.audioEnabled ? 'Audio On' : 'Audio Off'}
            </span>
          </Button>
        </div>
      )}

      {/* Feedback items */}
      <div className="space-y-2">
        {visibleFeedback.map((feedback, index) => (
          <FeedbackItem
            key={feedback.id}
            feedback={feedback}
            onDismiss={handleDismiss}
            showDismiss={true}
          />
        ))}
      </div>

      {/* Status indicator when no active feedback */}
      {visibleFeedback.length === 0 && showVisualOnly && (
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              {state.isListening ? (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Listening for commands...
                </>
              ) : state.isProcessing ? (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  Processing command...
                </>
              ) : state.recognitionSupported ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Voice ready
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  Voice unavailable
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

// Compact version for inline use
export const CompactVoiceFeedback = memo(function CompactVoiceFeedback({
  className,
}: {
  className?: string
}) {
  const { state } = useVoice()
  const [currentFeedback, setCurrentFeedback] = useState<any>(null)

  useEffect(() => {
    const latest = state.feedbackQueue
      .filter(f => !f.played)
      .sort((a, b) => b.timestamp - a.timestamp)[0]
    
    if (latest) {
      setCurrentFeedback(latest)
      
      // Auto-hide after delay
      const timer = setTimeout(() => {
        setCurrentFeedback(null)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [state.feedbackQueue])

  if (!currentFeedback) {
    return null
  }

  const getIcon = () => {
    switch (currentFeedback.type) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case 'info':
      default:
        return <Info className="h-3 w-3 text-blue-500" />
    }
  }

  const getBadgeVariant = () => {
    switch (currentFeedback.type) {
      case 'success':
        return 'default'
      case 'error':
        return 'destructive'
      case 'warning':
        return 'secondary'
      case 'info':
      default:
        return 'outline'
    }
  }

  return (
    <Badge
      variant={getBadgeVariant()}
      className={cn(
        'flex items-center gap-1.5 text-xs animate-in slide-in-from-right',
        className
      )}
    >
      {getIcon()}
      <span className="truncate max-w-32">{currentFeedback.message}</span>
    </Badge>
  )
})

VoiceFeedback.displayName = 'VoiceFeedback'
CompactVoiceFeedback.displayName = 'CompactVoiceFeedback'