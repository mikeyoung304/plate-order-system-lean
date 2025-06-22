/**
 * Session-Aware Real-time Subscriptions
 * Fixes authentication issues with WebSocket connections
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { performanceMonitor } from '@/lib/performance-utils'

interface SubscriptionOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onData: (payload: any) => void
  onError?: (error: Error) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  retryCount: number
  lastError?: Error
  lastConnected?: Date
}

export class SessionAwareRealtimeManager {
  private supabase: SupabaseClient
  private channels = new Map<string, RealtimeChannel>()
  private connectionStates = new Map<string, ConnectionState>()
  private retryTimeouts = new Map<string, NodeJS.Timeout>()
  
  // Configuration
  private readonly maxRetries = 5
  private readonly baseRetryDelay = 1000
  private readonly maxRetryDelay = 30000
  private readonly heartbeatInterval = 25000
  private heartbeatTimer?: NodeJS.Timeout

  constructor() {
    this.supabase = createClient()
    this.startHeartbeat()
  }

  /**
   * Create a session-aware subscription with automatic retry
   */
  async subscribe(options: SubscriptionOptions): Promise<string> {
    const channelId = `${options.table}_${Date.now()}`
    const startTime = Date.now()

    try {
      // Initialize connection state
      this.connectionStates.set(channelId, {
        status: 'connecting',
        retryCount: 0
      })

      // Check session before subscribing
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error(`Authentication required: ${sessionError?.message || 'No active session'}`)
      }

      // Create channel with session token
      const channel = this.supabase.channel(channelId, {
        config: {
          presence: { key: session.user.id },
          broadcast: { self: false },
          private: true
        },
        params: {
          // Pass session token for authentication
          apikey: session.access_token
        }
      })

      // Set up event handlers
      this.setupChannelHandlers(channel, channelId, options)

      // Subscribe with timeout
      await this.subscribeWithTimeout(channel, channelId, options)

      // Store channel
      this.channels.set(channelId, channel)

      // Track performance
      performanceMonitor.track('realtime_subscribe', startTime, true)

      return channelId
    } catch (error) {
      performanceMonitor.track('realtime_subscribe', startTime, false, error instanceof Error ? error.message : 'Unknown error')
      
      // Handle error with retry
      await this.handleSubscriptionError(channelId, error as Error, options)
      throw error
    }
  }

  /**
   * Unsubscribe and clean up
   */
  async unsubscribe(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId)
    const retryTimeout = this.retryTimeouts.get(channelId)

    // Clear retry timeout
    if (retryTimeout) {
      clearTimeout(retryTimeout)
      this.retryTimeouts.delete(channelId)
    }

    // Unsubscribe from channel
    if (channel) {
      try {
        await channel.unsubscribe()
        this.supabase.removeChannel(channel)
      } catch (error) {
        console.error(`Error unsubscribing from ${channelId}:`, error)
      }
    }

    // Clean up state
    this.channels.delete(channelId)
    this.connectionStates.delete(channelId)
  }

  /**
   * Subscribe with timeout to prevent hanging
   */
  private async subscribeWithTimeout(
    channel: RealtimeChannel,
    channelId: string,
    options: SubscriptionOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Subscription timeout'))
      }, 10000) // 10 second timeout

      channel.subscribe((status, error) => {
        clearTimeout(timeout)

        const state = this.connectionStates.get(channelId)
        if (!state) return

        switch (status) {
          case 'SUBSCRIBED':
            console.log(`✅ [Realtime] Connected: ${channelId}`)
            this.connectionStates.set(channelId, {
              ...state,
              status: 'connected',
              lastConnected: new Date(),
              retryCount: 0
            })
            options.onConnect?.()
            resolve()
            break

          case 'CHANNEL_ERROR':
          case 'TIMED_OUT':
          case 'CLOSED':
            const errorMsg = error?.message || `Channel ${status}`
            console.error(`❌ [Realtime] ${status}: ${channelId} - ${errorMsg}`)
            this.connectionStates.set(channelId, {
              ...state,
              status: 'error',
              lastError: new Error(errorMsg)
            })
            options.onDisconnect?.()
            reject(new Error(errorMsg))
            break
        }
      })
    })
  }

  /**
   * Set up channel event handlers
   */
  private setupChannelHandlers(
    channel: RealtimeChannel,
    channelId: string,
    options: SubscriptionOptions
  ): void {
    // Database changes
    channel.on(
      'postgres_changes',
      {
        event: options.event || '*',
        schema: 'public',
        table: options.table,
        filter: options.filter
      },
      (payload) => {
        const state = this.connectionStates.get(channelId)
        if (state?.status === 'connected') {
          options.onData(payload)
        }
      }
    )

    // System events
    channel.on('system', {}, (payload) => {
      console.log(`📟 [Realtime] System event on ${channelId}:`, payload)
      
      if (payload.extension === 'postgres_changes' && payload.status === 'error') {
        this.handleSubscriptionError(
          channelId,
          new Error(payload.error?.message || 'System error'),
          options
        )
      }
    })

    // Presence events for connection monitoring
    channel.on('presence', { event: 'sync' }, () => {
      const state = this.connectionStates.get(channelId)
      if (state && state.status !== 'connected') {
        console.log(`🔄 [Realtime] Reconnected: ${channelId}`)
        this.connectionStates.set(channelId, {
          ...state,
          status: 'connected',
          lastConnected: new Date()
        })
        options.onConnect?.()
      }
    })
  }

  /**
   * Handle subscription errors with exponential backoff retry
   */
  private async handleSubscriptionError(
    channelId: string,
    error: Error,
    options: SubscriptionOptions
  ): Promise<void> {
    const state = this.connectionStates.get(channelId)
    if (!state) return

    // Update state
    this.connectionStates.set(channelId, {
      ...state,
      status: 'error',
      lastError: error,
      retryCount: state.retryCount + 1
    })

    // Notify error handler
    options.onError?.(error)

    // Check if we should retry
    if (state.retryCount >= this.maxRetries) {
      console.error(`🛑 [Realtime] Max retries exceeded for ${channelId}`)
      options.onDisconnect?.()
      return
    }

    // Calculate retry delay with exponential backoff and jitter
    const baseDelay = Math.min(
      this.baseRetryDelay * Math.pow(2, state.retryCount),
      this.maxRetryDelay
    )
    const jitter = Math.random() * 1000
    const retryDelay = baseDelay + jitter

    console.log(`🔄 [Realtime] Retrying ${channelId} in ${Math.round(retryDelay)}ms (attempt ${state.retryCount + 1}/${this.maxRetries})`)

    // Clean up existing channel
    const existingChannel = this.channels.get(channelId)
    if (existingChannel) {
      try {
        await existingChannel.unsubscribe()
        this.supabase.removeChannel(existingChannel)
      } catch (cleanupError) {
        console.error(`Error cleaning up channel ${channelId}:`, cleanupError)
      }
      this.channels.delete(channelId)
    }

    // Schedule retry
    const retryTimeout = setTimeout(async () => {
      this.retryTimeouts.delete(channelId)
      
      try {
        await this.subscribe(options)
      } catch (retryError) {
        console.error(`🔄 [Realtime] Retry failed for ${channelId}:`, retryError)
      }
    }, retryDelay)

    this.retryTimeouts.set(channelId, retryTimeout)
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.channels.forEach(async (channel, channelId) => {
        const state = this.connectionStates.get(channelId)
        if (state?.status === 'connected') {
          try {
            // Send presence update as heartbeat
            await channel.track({ heartbeat: Date.now() })
          } catch (error) {
            console.warn(`💓 [Realtime] Heartbeat failed for ${channelId}:`, error)
          }
        }
      })
    }, this.heartbeatInterval)
  }

  /**
   * Clean up all resources
   */
  async destroy(): Promise<void> {
    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()

    // Unsubscribe from all channels
    const unsubscribePromises = Array.from(this.channels.keys()).map(channelId =>
      this.unsubscribe(channelId).catch(error =>
        console.error(`Error unsubscribing ${channelId} during destroy:`, error)
      )
    )

    await Promise.all(unsubscribePromises)
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {
      totalChannels: this.channels.size,
      connected: 0,
      disconnected: 0,
      error: 0,
      connecting: 0
    }

    this.connectionStates.forEach(state => {
      stats[state.status]++
    })

    return stats
  }
}

// Singleton instance
let realtimeManager: SessionAwareRealtimeManager | null = null

export function getRealtimeManager(): SessionAwareRealtimeManager {
  if (!realtimeManager) {
    realtimeManager = new SessionAwareRealtimeManager()
  }
  return realtimeManager
}

export function resetRealtimeManager(): void {
  if (realtimeManager) {
    realtimeManager.destroy()
    realtimeManager = null
  }
}