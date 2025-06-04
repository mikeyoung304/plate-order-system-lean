'use client'

/**
 * Connection State Context
 * 
 * Manages real-time connection status and handles reconnection logic.
 * Extracted from the monolithic restaurant-state-context.tsx for better
 * separation of concerns and easier testing.
 */

import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createOptimizedClient } from '@/lib/modassembly/supabase/optimized-client'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

// Connection state interface
interface ConnectionState {
  status: 'connected' | 'disconnected' | 'reconnecting'
  lastConnected: Date | null
  reconnectAttempts: number
  isStable: boolean
}

// Connection context interface
interface ConnectionContextValue {
  // State
  connectionState: ConnectionState
  
  // Actions
  connect: () => Promise<void>
  disconnect: () => void
  reconnect: () => Promise<void>
  
  // Utilities
  isConnected: boolean
  canReconnect: boolean
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null)

interface ConnectionProviderProps {
  children: ReactNode
  onConnectionChange?: (status: ConnectionState['status']) => void
}

export function ConnectionProvider({ 
  children, 
  onConnectionChange 
}: ConnectionProviderProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    isStable: false,
  })
  
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  
  // Initialize Supabase client
  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createOptimizedClient()
    }
  }, [])
  
  // Update connection status with proper state management
  const updateConnectionStatus = useCallback(
    (status: ConnectionState['status'], resetAttempts = false) => {
      if (!mountedRef.current) {return}
      
      setConnectionState(prev => {
        const newState = {
          ...prev,
          status,
          reconnectAttempts: resetAttempts ? 0 : prev.reconnectAttempts,
          lastConnected: status === 'connected' ? new Date() : prev.lastConnected,
          isStable: false,
        }
        
        // Notify external listeners
        onConnectionChange?.(status)
        
        return newState
      })
      
      // Mark connection as stable after 5 seconds
      if (status === 'connected') {
        if (stabilityTimeoutRef.current) {
          clearTimeout(stabilityTimeoutRef.current)
        }
        
        stabilityTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setConnectionState(prev => ({ ...prev, isStable: true }))
          }
        }, 5000)
      }
    },
    [onConnectionChange]
  )
  
  // Connect to Supabase realtime
  const connect = useCallback(async () => {
    if (!supabaseRef.current || !mountedRef.current) {return}
    
    try {
      // Clean up existing channel
      if (channelRef.current) {
        await supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
      
      updateConnectionStatus('reconnecting')
      
      // Create new channel for connection monitoring
      const channel = supabaseRef.current.channel('connection-monitor')
      
      channel
        .on('presence', { event: 'sync' }, () => {
          updateConnectionStatus('connected', true)
        })
        .on('presence', { event: 'join' }, () => {
          updateConnectionStatus('connected')
        })
        .on('presence', { event: 'leave' }, () => {
          if (mountedRef.current) {
            updateConnectionStatus('disconnected')
            // Auto-reconnect after a short delay
            scheduleReconnect()
          }
        })
      
      // Subscribe and track the channel
      const subscription = await channel.subscribe((status) => {
        if (!mountedRef.current) {return}
        
        switch (status) {
          case 'SUBSCRIBED':
            updateConnectionStatus('connected', true)
            break
          case 'CHANNEL_ERROR':
          case 'TIMED_OUT':
          case 'CLOSED':
            updateConnectionStatus('disconnected')
            scheduleReconnect()
            break
        }
      })
      
      channelRef.current = channel
      
    } catch (error) {
      console.error('Connection error:', error)
      updateConnectionStatus('disconnected')
      scheduleReconnect()
    }
  }, [updateConnectionStatus])
  
  // Disconnect from Supabase
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current)
      stabilityTimeoutRef.current = null
    }
    
    if (channelRef.current && supabaseRef.current) {
      supabaseRef.current.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    updateConnectionStatus('disconnected', true)
  }, [updateConnectionStatus])
  
  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) {return}
    
    const maxAttempts = 10
    const baseDelay = 1000
    
    setConnectionState(prev => {
      const attempts = prev.reconnectAttempts + 1
      
      if (attempts <= maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(2, attempts - 1), 30000)
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect()
          }
        }, delay)
      }
      
      return { ...prev, reconnectAttempts: attempts }
    })
  }, [connect])
  
  // Manual reconnect
  const reconnect = useCallback(async () => {
    setConnectionState(prev => ({ ...prev, reconnectAttempts: 0 }))
    await connect()
  }, [connect])
  
  // Auto-connect on mount
  useEffect(() => {
    connect()
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionState.status === 'disconnected') {
        reconnect()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connect, reconnect, connectionState.status])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [disconnect])
  
  // Context value
  const contextValue: ConnectionContextValue = {
    connectionState,
    connect,
    disconnect,
    reconnect,
    isConnected: connectionState.status === 'connected',
    canReconnect: connectionState.reconnectAttempts < 10,
  }
  
  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  )
}

// Hook for using connection context
export function useConnection() {
  const context = useContext(ConnectionContext)
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider')
  }
  return context
}

// Hook for connection status only (lighter weight)
export function useConnectionStatus() {
  const { connectionState, isConnected } = useConnection()
  return {
    status: connectionState.status,
    isConnected,
    isStable: connectionState.isStable,
    lastConnected: connectionState.lastConnected,
    reconnectAttempts: connectionState.reconnectAttempts,
  }
}