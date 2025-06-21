'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/modassembly/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string
  lastConnected?: Date
  reconnectAttempts: number
  channel?: RealtimeChannel
}

interface SubscriptionConfig {
  channelName: string
  table: string
  schema?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onData: (payload: any) => void
  onError?: (error: Error) => void
}

// Global connection manager to prevent duplicate connections
class ConnectionManager {
  private static instance: ConnectionManager
  private connections = new Map<string, ConnectionState>()
  private subscriptions = new Map<string, Set<SubscriptionConfig>>()
  private retryTimeouts = new Map<string, NodeJS.Timeout>()
  
  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  // Jittered exponential backoff calculation
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000) // Max 30 seconds
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    return baseDelay + jitter
  }

  subscribe(config: SubscriptionConfig): () => void {
    const { channelName } = config
    
    // Add to subscriptions
    if (!this.subscriptions.has(channelName)) {
      this.subscriptions.set(channelName, new Set())
    }
    this.subscriptions.get(channelName)!.add(config)

    // Create or reuse connection
    this.ensureConnection(channelName)

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channelName, config)
    }
  }

  private unsubscribe(channelName: string, config: SubscriptionConfig) {
    const subscriptions = this.subscriptions.get(channelName)
    if (subscriptions) {
      subscriptions.delete(config)
      
      // If no more subscriptions, clean up connection
      if (subscriptions.size === 0) {
        this.cleanupConnection(channelName)
      }
    }
  }

  private ensureConnection(channelName: string) {
    if (this.connections.has(channelName)) {
      const connection = this.connections.get(channelName)!
      if (connection.status === 'connected' || connection.status === 'connecting') {
        return // Connection already active
      }
    }

    this.createConnection(channelName)
  }

  private createConnection(channelName: string) {
    const supabase = createClient()
    const subscriptions = this.subscriptions.get(channelName)
    
    if (!subscriptions || subscriptions.size === 0) {
      return
    }

    // Clear any existing retry timeout
    const existingTimeout = this.retryTimeouts.get(channelName)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      this.retryTimeouts.delete(channelName)
    }

    // Clean up any existing connection first
    const existingConnection = this.connections.get(channelName)
    if (existingConnection?.channel) {
      try {
        supabase.removeChannel(existingConnection.channel)
      } catch (cleanupError) {
        console.warn(`Error cleaning up existing connection for ${channelName}:`, cleanupError)
      }
    }

    // Initialize connection state
    const connectionState: ConnectionState = {
      status: 'connecting',
      reconnectAttempts: existingConnection?.reconnectAttempts || 0,
    }
    this.connections.set(channelName, connectionState)

    try {
      // Create channel with unique name to prevent conflicts
      const uniqueChannelName = `${channelName}_${Date.now()}`
      const channel = supabase.channel(uniqueChannelName, {
        config: {
          presence: { key: '' },
          broadcast: { self: false }
        }
      })

      // Add all subscriptions to the channel
      for (const config of subscriptions) {
        const subscriptionConfig: any = {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
        }
        
        if (config.filter) {
          subscriptionConfig.filter = config.filter
        }

        channel.on(
          'postgres_changes' as any,
          subscriptionConfig,
          (payload: any) => {
            try {
              config.onData(payload)
            } catch (error) {
              console.error(`[ConnectionManager] Error in subscription callback:`, error)
              config.onError?.(error as Error)
            }
          }
        )
      }

      // Setup connection event handlers
      channel.on('system', {}, (payload) => {
        if (payload.type === 'connected') {
          connectionState.status = 'connected'
          connectionState.lastConnected = new Date()
          connectionState.reconnectAttempts = 0
          this.connections.set(channelName, connectionState)
        }
      })

      // Subscribe to the channel
      channel.subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          connectionState.status = 'connected'
          connectionState.channel = channel
          connectionState.lastConnected = new Date()
          connectionState.reconnectAttempts = 0
          this.connections.set(channelName, connectionState)
        } else if (status === 'CHANNEL_ERROR') {
          connectionState.status = 'error'
          connectionState.error = error?.message || 'Channel error'
          this.connections.set(channelName, connectionState)
          
          // Schedule reconnection with backoff
          this.scheduleReconnection(channelName)
        } else if (status === 'TIMED_OUT') {
          connectionState.status = 'error'
          connectionState.error = 'Connection timed out'
          this.connections.set(channelName, connectionState)
          
          // Schedule reconnection
          this.scheduleReconnection(channelName)
        }
      })

      connectionState.channel = channel
      this.connections.set(channelName, connectionState)

    } catch (error) {
      console.error(`[ConnectionManager] Failed to create connection for ${channelName}:`, error)
      connectionState.status = 'error'
      connectionState.error = error instanceof Error ? error.message : 'Unknown error'
      this.connections.set(channelName, connectionState)
      
      // Schedule reconnection
      this.scheduleReconnection(channelName)
    }
  }

  private scheduleReconnection(channelName: string) {
    const connection = this.connections.get(channelName)
    if (!connection) {return}

    // Increment reconnection attempts
    connection.reconnectAttempts += 1
    this.connections.set(channelName, connection)

    // Don't exceed max attempts
    if (connection.reconnectAttempts > 10) {
      console.error(`[ConnectionManager] Max reconnection attempts reached for ${channelName}`)
      return
    }

    const delay = this.calculateBackoffDelay(connection.reconnectAttempts)
    console.log(`[ConnectionManager] Scheduling reconnection for ${channelName} in ${delay}ms (attempt ${connection.reconnectAttempts})`)

    const timeout = setTimeout(() => {
      this.retryTimeouts.delete(channelName)
      this.createConnection(channelName)
    }, delay)

    this.retryTimeouts.set(channelName, timeout)
  }

  private cleanupConnection(channelName: string) {
    const connection = this.connections.get(channelName)
    if (connection?.channel) {
      const supabase = createClient()
      supabase.removeChannel(connection.channel)
    }

    // Clear retry timeout
    const timeout = this.retryTimeouts.get(channelName)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(channelName)
    }

    this.connections.delete(channelName)
    this.subscriptions.delete(channelName)
  }

  getConnectionState(channelName: string): ConnectionState | undefined {
    return this.connections.get(channelName)
  }

  // Cleanup all connections (for app shutdown)
  cleanup() {
    for (const [channelName] of this.connections) {
      this.cleanupConnection(channelName)
    }
  }
}

/**
 * Optimized React hook for Supabase real-time subscriptions
 * Features:
 * - Connection deduplication
 * - Automatic reconnection with jittered exponential backoff
 * - Proper cleanup on unmount
 * - Connection state tracking
 */
export function useOptimizedRealtime(config: SubscriptionConfig) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connecting',
    reconnectAttempts: 0
  })
  
  const configRef = useRef(config)
  configRef.current = config

  // Update connection state when it changes
  useEffect(() => {
    const manager = ConnectionManager.getInstance()
    const interval = setInterval(() => {
      const state = manager.getConnectionState(config.channelName)
      if (state) {
        setConnectionState(state)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [config.channelName])

  // Subscribe to real-time updates
  useEffect(() => {
    const manager = ConnectionManager.getInstance()
    const unsubscribe = manager.subscribe(configRef.current)

    return unsubscribe
  }, [config.channelName, config.table, config.event, config.filter])

  return {
    connectionState,
    isConnected: connectionState.status === 'connected',
    isConnecting: connectionState.status === 'connecting',
    hasError: connectionState.status === 'error',
    error: connectionState.error,
    reconnectAttempts: connectionState.reconnectAttempts,
  }
}

// Hook for manual reconnection
export function useRealtimeReconnect() {
  return useCallback((channelName: string) => {
    const manager = ConnectionManager.getInstance()
    const connection = manager.getConnectionState(channelName)
    if (connection) {
      // Force reconnection by cleaning up and recreating
      manager['cleanupConnection'](channelName)
      manager['ensureConnection'](channelName)
    }
  }, [])
}

// Cleanup function for app shutdown
export function cleanupAllConnections() {
  const manager = ConnectionManager.getInstance()
  manager.cleanup()
}