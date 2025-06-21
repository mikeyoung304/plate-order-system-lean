'use client'

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useVoice } from '@/contexts/kds/voice-context'

interface VoiceCommandIndicatorProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'minimal' | 'detailed' | 'badge'
}

export const VoiceCommandIndicator = memo(function VoiceCommandIndicator({
  className,
  showText = true,
  size = 'md',
  variant = 'detailed',
}: VoiceCommandIndicatorProps) {
  const { state, startListening, stopListening } = useVoice()

  const {
    isListening,
    isProcessing,
    recognitionSupported,
    recognitionError,
    audioEnabled,
    lastCommand,
  } = state

  // Size classes
  const sizeClasses = {
    sm: {
      icon: 'h-3 w-3',
      text: 'text-xs',
      badge: 'text-xs px-2 py-0.5',
      indicator: 'w-1.5 h-1.5',
    },
    md: {
      icon: 'h-4 w-4',
      text: 'text-sm',
      badge: 'text-sm px-2 py-1',
      indicator: 'w-2 h-2',
    },
    lg: {
      icon: 'h-5 w-5',
      text: 'text-base',
      badge: 'text-base px-3 py-1.5',
      indicator: 'w-3 h-3',
    },
  }

  const sizes = sizeClasses[size]

  // Determine current status
  const getStatus = () => {
    if (!recognitionSupported) {
      return {
        type: 'unsupported',
        icon: <MicOff className={sizes.icon} />,
        color: 'bg-gray-400',
        text: 'Voice Not Supported',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-600 dark:text-gray-400',
      }
    }

    if (recognitionError) {
      return {
        type: 'error',
        icon: <AlertTriangle className={sizes.icon} />,
        color: 'bg-red-500',
        text: recognitionError,
        bgColor: 'bg-red-50 dark:bg-red-950',
        textColor: 'text-red-700 dark:text-red-300',
      }
    }

    if (isProcessing) {
      return {
        type: 'processing',
        icon: <Loader2 className={cn(sizes.icon, 'animate-spin')} />,
        color: 'bg-yellow-500',
        text: 'Processing Command...',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        textColor: 'text-yellow-700 dark:text-yellow-300',
      }
    }

    if (isListening) {
      return {
        type: 'listening',
        icon: <Mic className={sizes.icon} />,
        color: 'bg-red-500 animate-pulse',
        text: 'Listening...',
        bgColor: 'bg-red-50 dark:bg-red-950',
        textColor: 'text-red-700 dark:text-red-300',
      }
    }

    return {
      type: 'ready',
      icon: audioEnabled ? (
        <Volume2 className={sizes.icon} />
      ) : (
        <VolumeX className={sizes.icon} />
      ),
      color: 'bg-green-500',
      text: audioEnabled ? 'Voice Ready' : 'Voice Ready (Muted)',
      bgColor: 'bg-green-50 dark:bg-green-950',
      textColor: 'text-green-700 dark:text-green-300',
    }
  }

  const status = getStatus()

  // Handle click to toggle listening
  const handleClick = () => {
    if (!recognitionSupported || recognitionError) {return}
    
    if (isListening) {
      stopListening()
    } else if (!isProcessing) {
      startListening()
    }
  }

  // Render variants
  switch (variant) {
    case 'minimal':
      return (
        <div
          className={cn(
            'flex items-center gap-1 cursor-pointer',
            recognitionSupported && 'hover:opacity-75',
            className
          )}
          onClick={handleClick}
          title={status.text}
        >
          <div className={cn('rounded-full', sizes.indicator, status.color)} />
          {status.icon}
        </div>
      )

    case 'badge':
      return (
        <Badge
          variant="outline"
          className={cn(
            'flex items-center gap-1.5 cursor-pointer transition-colors',
            status.bgColor,
            status.textColor,
            sizes.badge,
            recognitionSupported && 'hover:opacity-75',
            className
          )}
          onClick={handleClick}
          title={status.text}
        >
          <div className={cn('rounded-full', sizes.indicator, status.color)} />
          {status.icon}
          {showText && (
            <span className="truncate max-w-24">
              {status.type === 'listening' ? 'Listening' : 
               status.type === 'processing' ? 'Processing' :
               status.type === 'ready' ? 'Ready' : 'Error'}
            </span>
          )}
        </Badge>
      )

    case 'detailed':
    default:
      return (
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
            status.bgColor,
            status.textColor,
            recognitionSupported && !recognitionError && 'cursor-pointer hover:shadow-sm',
            isListening && 'ring-2 ring-red-500/20',
            className
          )}
          onClick={handleClick}
          title={status.text}
        >
          {/* Status indicator */}
          <div className={cn('rounded-full', sizes.indicator, status.color)} />
          
          {/* Icon */}
          {status.icon}
          
          {/* Status text */}
          {showText && (
            <div className="flex flex-col">
              <span className={cn('font-medium', sizes.text)}>
                {status.type === 'listening' ? 'Listening for commands' :
                 status.type === 'processing' ? 'Processing command' :
                 status.type === 'ready' ? 'Voice commands ready' :
                 status.type === 'error' ? 'Voice error' :
                 'Voice unavailable'}
              </span>
              
              {/* Show last command if available */}
              {lastCommand && status.type === 'ready' && (
                <span className="text-xs opacity-75 truncate max-w-32">
                  Last: "{lastCommand.command}"
                </span>
              )}
              
              {/* Show confidence for processing */}
              {lastCommand && status.type === 'processing' && (
                <span className="text-xs opacity-75">
                  Confidence: {Math.round(lastCommand.confidence * 100)}%
                </span>
              )}
            </div>
          )}
          
          {/* Click hint for interactive variants */}
          {recognitionSupported && !recognitionError && showText && (
            <div className="text-xs opacity-50 ml-auto">
              {isListening ? 'Click to stop' : 'Click to listen'}
            </div>
          )}
        </div>
      )
  }
})

VoiceCommandIndicator.displayName = 'VoiceCommandIndicator'