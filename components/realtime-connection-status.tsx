'use client'

/**
 * Real-time Connection Status Component
 * Shows the current status of the Supabase real-time connection
 * Following Luis's patterns for monitoring backend health
 */

import { useOptimizedOrders } from '@/lib/state/domains/optimized-orders-context'
import { AlertCircle, CheckCircle, Clock, WifiOff } from 'lucide-react'

export function RealtimeConnectionStatus() {
  const { connectionStatus } = useOptimizedOrders()

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'connecting':
        return <Clock className='h-4 w-4 text-yellow-500 animate-spin' />
      case 'disconnected':
        return <WifiOff className='h-4 w-4 text-gray-500' />
      case 'error':
        return <AlertCircle className='h-4 w-4 text-red-500' />
      default:
        return <WifiOff className='h-4 w-4 text-gray-500' />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Connection error'
      default:
        return 'Unknown status'
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600'
      case 'connecting':
        return 'text-yellow-600'
      case 'disconnected':
        return 'text-gray-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className='flex items-center space-x-2 text-sm'>
      {getStatusIcon()}
      <span className={getStatusColor()}>{getStatusText()}</span>
      {connectionStatus === 'error' && (
        <span className='text-xs text-gray-500'>
          (Check console for details)
        </span>
      )}
    </div>
  )
}

// Compact version for smaller displays
export function RealtimeConnectionIndicator() {
  const { connectionStatus } = useOptimizedOrders()

  const getIndicatorColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500 animate-pulse'
      case 'disconnected':
        return 'bg-gray-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div
      className={`h-2 w-2 rounded-full ${getIndicatorColor()}`}
      title={`Real-time connection: ${connectionStatus}`}
    />
  )
}
