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
import { createClient } from '@/lib/modassembly/supabase/client'
import { getRealtimeManager } from '@/lib/realtime/session-aware-subscriptions'
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
  const subscriptionIdRef = useRef<string | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  
  // Initialize Supabase client
  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
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
  
  // Connect to Supabase realtime with session awareness
  const connect = useCallback(async () => {
    if (!mountedRef.current) {return}
    
    try {
      // Clean up existing subscription
      if (subscriptionIdRef.current) {
        const realtimeManager = getRealtimeManager()
        await realtimeManager.unsubscribe(subscriptionIdRef.current)
        subscriptionIdRef.current = null
      }
      
      updateConnectionStatus('reconnecting')
      
      // Use session-aware manager for connection monitoring
      const realtimeManager = getRealtimeManager()
      
      // Create a dummy subscription for connection monitoring
      // We'll use the presence feature on a dedicated table
      subscriptionIdRef.current = await realtimeManager.subscribe({
        table: 'profiles', // Use profiles table for presence
        event: '*',
        onData: () => {
          // We don't actually care about profile changes,
          // just using this for connection monitoring
        },
        onConnect: () => {
          if (mountedRef.current) {
            updateConnectionStatus('connected', true)
          }
        },
        onDisconnect: () => {
          if (mountedRef.current) {
            updateConnectionStatus('disconnected')
            // Auto-reconnect handled by session-aware manager
          }
        },
        onError: (error) => {
          console.error('❌ [Connection] Real-time error:', error)
          if (mountedRef.current) {
            updateConnectionStatus('disconnected')
            // Session-aware manager will handle retry
          }
        }
      })
      
    } catch (error) {
      console.error('Connection error:', error)
      updateConnectionStatus('disconnected')
      // Don't manually schedule reconnect - let session-aware manager handle it
    }
  }, [updateConnectionStatus])
  
  // Disconnect from Supabase
  const disconnect = useCallback(async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current)
      stabilityTimeoutRef.current = null
    }
    
    if (subscriptionIdRef.current) {
      const realtimeManager = getRealtimeManager()
      await realtimeManager.unsubscribe(subscriptionIdRef.current)
      subscriptionIdRef.current = null
    }
    
    updateConnectionStatus('disconnected', true)
  }, [updateConnectionStatus])
  
  // Note: scheduleReconnect is no longer needed as session-aware manager handles retries
  
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