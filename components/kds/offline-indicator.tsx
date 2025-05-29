"use client"

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OfflineIndicatorProps {
  onRetry?: () => void
  className?: string
}

export function OfflineIndicator({ onRetry, className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [showReconnecting, setShowReconnecting] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnecting(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnecting(true)
      
      // Hide reconnecting message after 5 seconds
      setTimeout(() => {
        setShowReconnecting(false)
      }, 5000)
    }

    // Check initial state
    setIsOnline(navigator.onLine)

    // Listen for changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !showReconnecting) return null

  return (
    <Alert 
      variant="destructive" 
      className={cn(
        'fixed bottom-4 right-4 w-auto max-w-sm animate-in slide-in-from-bottom-2',
        className
      )}
    >
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2">
        {showReconnecting ? (
          <>
            <RefreshCw className="h-3 w-3 animate-spin" />
            Reconnecting to server...
          </>
        ) : (
          <>
            You are currently offline
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="ml-2"
              >
                Retry
              </Button>
            )}
          </>
        )}
      </AlertDescription>
    </Alert>
  )
}