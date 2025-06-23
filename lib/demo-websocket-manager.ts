/**
 * Demo-Optimized WebSocket Connection Manager
 * Ensures reliable real-time connections for investor demos
 * Handles connection recovery, timeouts, and graceful degradation
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { demoLogger } from './demo-optimized-logger'
import { LRUCache } from '@/lib/utils/lru-cache'

interface ConnectionConfig {
  maxRetries: number
  initialRetryDelay: number
  maxRetryDelay: number
  healthCheckInterval: number
  connectionTimeout: number
}

interface SubscriptionConfig {
  table: string
  event?: string
  filter?: string
  callback: (payload: any) => void
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed'

export class DemoWebSocketManager {
  private supabase: SupabaseClient | null = null
  private channels: LRUCache<string, RealtimeChannel>
  private subscriptions: LRUCache<string, SubscriptionConfig>
  private connectionStatus: ConnectionStatus = 'disconnected'
  private retryAttempts = 0
  private retryTimeouts = new Map<string, NodeJS.Timeout>()
  private healthCheckInterval: NodeJS.Timeout | null = null
  private isActive = true
  private circuitBreakerFailures = 0
  private circuitBreakerOpenUntil = 0
  private readonly circuitBreakerThreshold = 5
  private readonly circuitBreakerTimeout = 30000 // 30 seconds
  private readonly maxConnections = 50 // Limit for demo environment

  private config: ConnectionConfig = {
    maxRetries: 5,
    initialRetryDelay: 1000,
    maxRetryDelay: 30000,
    healthCheckInterval: 30000, // 30 seconds
    connectionTimeout: 10000, // 10 seconds
  }

  private statusCallbacks = new Set<(status: ConnectionStatus) => void>()

  constructor(customConfig?: Partial<ConnectionConfig>) {
    this.config = { ...this.config, ...customConfig }
    this.channels = new LRUCache<string, RealtimeChannel>(this.maxConnections)
    this.subscriptions = new LRUCache<string, SubscriptionConfig>(this.maxConnections)
    this.initialize()
  }

  private async initialize() {
    try {
      this.supabase = createClient()
      this.startHealthCheck()
      this.connectionStatus = 'disconnected'
      demoLogger.info('Demo WebSocket Manager initialized')
    } catch (error) {
      demoLogger.error('Failed to initialize WebSocket Manager', error as Error)
      this.connectionStatus = 'failed'
    }
  }

  private updateConnectionStatus(status: ConnectionStatus) {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status
      demoLogger.websocket(`Status changed to ${status}`)
      this.statusCallbacks.forEach(callback => {
        try {
          callback(status)
        } catch (error) {
          demoLogger.error('Status callback error', error as Error)
        }
      })
    }
  }

  private startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(() => {
      if (!this.isActive) {return}

      // Check if we have active channels but they're not working
      if (this.channels.size > 0 && this.connectionStatus === 'connected') {
        this.performHealthCheck()
      }
    }, this.config.healthCheckInterval)
  }

  private async performHealthCheck() {
    try {
      // Simple query to test database connectivity
      if (!this.supabase) {return}

      const { error } = await this.supabase
        .from('kds_stations')
        .select('id')
        .limit(1)

      if (error) {
        demoLogger.warn('Health check failed, reconnecting', { error: String(error) })
        this.reconnectAll()
      }
    } catch (error) {
      demoLogger.warn('Health check error', { error: error instanceof Error ? error.message : String(error) })
      this.reconnectAll()
    }
  }

  private getRetryDelay(): number {
    return Math.min(
      this.config.initialRetryDelay * Math.pow(2, this.retryAttempts),
      this.config.maxRetryDelay
    )
  }

  private isCircuitBreakerOpen(): boolean {
    return Date.now() < this.circuitBreakerOpenUntil
  }

  private recordFailure() {
    this.circuitBreakerFailures++
    if (this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
      this.circuitBreakerOpenUntil = Date.now() + this.circuitBreakerTimeout
      if (process.env.NODE_ENV === 'development') {
        console.log(`Circuit breaker opened due to ${this.circuitBreakerFailures} failures`)
      }
    }
  }

  private recordSuccess() {
    this.circuitBreakerFailures = 0
    this.circuitBreakerOpenUntil = 0
  }

  public subscribe(id: string, config: SubscriptionConfig): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isActive || !this.supabase) {
        resolve(false)
        return
      }

      // Check circuit breaker
      if (this.isCircuitBreakerOpen()) {
        // Circuit breaker is open - silently refusing subscription
        resolve(false)
        return
      }

      // Store subscription config for reconnection
      this.subscriptions.set(id, config)

      // Clean up existing channel if it exists
      this.unsubscribe(id)

      try {
        this.updateConnectionStatus('connecting')

        // Create unique channel name
        const channelName = `demo-${id}-${Date.now()}`
        
        const channel = this.supabase
          .channel(channelName)
          
        ;(channel as any).on(
          'postgres_changes',
          {
            event: config.event || '*',
            schema: 'public',
            table: config.table,
            ...(config.filter ? { filter: config.filter } : {}),
          },
          (payload: any) => {
              if (!this.isActive) {return}
              
              try {
                config.callback(payload)
              } catch (error) {
                demoLogger.error(`Subscription callback error for ${id}`, error as Error)
              }
            }
          )
          
        channel.subscribe((status) => {
            if (!this.isActive) {return}

            demoLogger.websocket(`Subscription ${id} status: ${status}`)

            if (status === 'SUBSCRIBED') {
              this.updateConnectionStatus('connected')
              this.retryAttempts = 0
              this.clearRetryTimeout(id)
              this.recordSuccess()
              resolve(true)
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              demoLogger.warn(`Channel error for ${id}: ${status}`)
              this.updateConnectionStatus('disconnected')
              this.recordFailure()
              this.scheduleRetry(id)
              resolve(false)
            } else if (status === 'CLOSED') {
              demoLogger.warn(`Channel closed for ${id}`)
              this.updateConnectionStatus('disconnected')
              this.recordFailure()
              if (this.isActive) {
                // Wait a bit before retrying to avoid rapid reconnection attempts
                setTimeout(() => {
                  if (this.isActive) {
                    this.scheduleRetry(id)
                  }
                }, 1000)
              }
              resolve(false)
            }
          })

        this.channels.set(id, channel)

        // Set connection timeout
        setTimeout(() => {
          if (this.connectionStatus === 'connecting') {
            demoLogger.warn(`Connection timeout for ${id}`)
            this.scheduleRetry(id)
            resolve(false)
          }
        }, this.config.connectionTimeout)

      } catch (error) {
        demoLogger.error(`Failed to subscribe to ${id}`, error as Error)
        this.recordFailure()
        this.scheduleRetry(id)
        resolve(false)
      }
    })
  }

  private scheduleRetry(id: string) {
    if (this.retryAttempts >= this.config.maxRetries) {
      demoLogger.error(`Max retry attempts reached for ${id}`)
      this.updateConnectionStatus('failed')
      return
    }

    this.clearRetryTimeout(id)
    
    const delay = this.getRetryDelay()
    this.updateConnectionStatus('reconnecting')
    
    const timeout = setTimeout(async () => {
      if (this.isActive && this.subscriptions.has(id)) {
        this.retryAttempts++
        demoLogger.info(`Retrying subscription ${id} (attempt ${this.retryAttempts})`)
        
        // Re-initialize Supabase client on retry to handle stale connections
        try {
          this.supabase = createClient()
        } catch (error) {
          demoLogger.error('Failed to reinitialize Supabase client on retry', error as Error)
        }
        
        const config = this.subscriptions.get(id)
        if (config) {
          await this.subscribe(id, config)
        }
      }
    }, delay)

    this.retryTimeouts.set(id, timeout)
  }

  private clearRetryTimeout(id: string) {
    const timeout = this.retryTimeouts.get(id)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(id)
    }
  }

  public unsubscribe(id: string) {
    const channel = this.channels.get(id)
    if (channel && this.supabase) {
      try {
        this.supabase.removeChannel(channel)
      } catch (error) {
        demoLogger.warn(`Error removing channel ${id}`, { error: error instanceof Error ? error.message : String(error) })
      }
    }

    this.channels.delete(id)
    this.subscriptions.delete(id)
    this.clearRetryTimeout(id)

    if (this.channels.size === 0) {
      this.updateConnectionStatus('disconnected')
    }
  }

  public reconnectAll() {
    demoLogger.info('Reconnecting all subscriptions')
    
    // Reset retry attempts for fresh start
    this.retryAttempts = 0
    
    // Get all current subscriptions
    const subscriptionsToReconnect: Array<[string, SubscriptionConfig]> = []
    this.subscriptions.forEach((config, id) => {
      subscriptionsToReconnect.push([id, config])
    })
    
    // Clear all existing channels
    const channelIds: string[] = []
    this.channels.forEach((_, id) => channelIds.push(id))
    channelIds.forEach(id => this.unsubscribe(id))
    
    // Reconnect all subscriptions
    subscriptionsToReconnect.forEach(([id, config]) => {
      setTimeout(() => {
        if (this.isActive) {
          this.subscribe(id, config)
        }
      }, 100) // Small delay to avoid overwhelming the connection
    })
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback)
    
    // Call immediately with current status
    callback(this.connectionStatus)
    
    return () => {
      this.statusCallbacks.delete(callback)
    }
  }

  public getStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  public getActiveSubscriptions(): string[] {
    const ids: string[] = []
    this.subscriptions.forEach((_, id) => ids.push(id))
    return ids
  }

  public getConnectionStats() {
    return {
      status: this.connectionStatus,
      activeChannels: this.channels.size,
      activeSubscriptions: this.subscriptions.size,
      retryAttempts: this.retryAttempts,
      isActive: this.isActive,
      circuitBreakerFailures: this.circuitBreakerFailures,
      circuitBreakerOpen: this.isCircuitBreakerOpen(),
      circuitBreakerOpenUntil: this.circuitBreakerOpenUntil,
    }
  }

  public destroy() {
    demoLogger.info('Destroying WebSocket Manager')
    
    this.isActive = false
    
    // Clear health check
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    
    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
    
    // Remove all channels
    const channelIds: string[] = []
    this.channels.forEach((_, id) => channelIds.push(id))
    channelIds.forEach(id => this.unsubscribe(id))
    
    // Clear callbacks
    this.statusCallbacks.clear()
    
    this.updateConnectionStatus('disconnected')
  }
}

// Global instance optimized for demos
export const demoWebSocketManager = new DemoWebSocketManager({
  maxRetries: 8, // More retries for demo reliability
  initialRetryDelay: 500, // Faster initial retry
  maxRetryDelay: 15000, // Shorter max delay
  healthCheckInterval: 20000, // More frequent health checks
  connectionTimeout: 8000, // Shorter timeout for faster detection
})

// Hook for React components
import { useEffect, useState } from 'react'

export function useDemoWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [stats, setStats] = useState(demoWebSocketManager.getConnectionStats())

  useEffect(() => {
    const unsubscribe = demoWebSocketManager.onStatusChange(setStatus)
    
    const statsInterval = setInterval(() => {
      setStats(demoWebSocketManager.getConnectionStats())
    }, 2000)

    return () => {
      unsubscribe()
      clearInterval(statsInterval)
    }
  }, [])

  return {
    status,
    stats,
    subscribe: demoWebSocketManager.subscribe.bind(demoWebSocketManager),
    unsubscribe: demoWebSocketManager.unsubscribe.bind(demoWebSocketManager),
    reconnectAll: demoWebSocketManager.reconnectAll.bind(demoWebSocketManager),
  }
}

export default demoWebSocketManager