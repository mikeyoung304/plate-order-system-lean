/**
 * Optimized Supabase Real-time Subscriptions
 * Connection pooling, batching, and intelligent reconnection for <50ms updates
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import { KDSCacheManager } from '@/lib/cache/kds-cache'
import { debounce, measureApiCall, throttle } from '@/lib/performance-utils'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

interface SubscriptionConfig {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  callback: (payload: any) => void
  throttleMs?: number
  batchMs?: number
}

interface ConnectionStats {
  activeConnections: number
  totalSubscriptions: number
  messagesPerSecond: number
  reconnectCount: number
  lastReconnect?: Date
}

class OptimizedRealtimeManager {
  private supabase: SupabaseClient
  private channels = new Map<string, RealtimeChannel>()
  private subscriptions = new Map<string, SubscriptionConfig>()
  private connectionPool = new Map<string, RealtimeChannel>()
  private messageBuffer = new Map<string, any[]>()
  private batchTimers = new Map<string, NodeJS.Timeout>()
  private stats: ConnectionStats = {
    activeConnections: 0,
    totalSubscriptions: 0,
    messagesPerSecond: 0,
    reconnectCount: 0
  }
  
  private maxConnections = 5 // Limit concurrent connections
  private reconnectDelay = 1000 // Start with 1 second
  private maxReconnectDelay = 30000 // Max 30 seconds
  private heartbeatInterval = 30000 // 30 second heartbeat

  constructor() {
    this.supabase = createClient()
    this.startHeartbeat()
    this.startStatsCollection()
  }

  /**
   * Create an optimized subscription with connection pooling
   */
  async subscribe(config: SubscriptionConfig): Promise<string> {
    return measureApiCall('realtime_subscribe', async () => {
      const subscriptionId = this.generateSubscriptionId(config)
      
      // Check if we already have this subscription
      if (this.subscriptions.has(subscriptionId)) {
        console.warn(`Subscription ${subscriptionId} already exists`)
        return subscriptionId
      }

      // Create optimized callback with throttling/batching
      const optimizedCallback = this.createOptimizedCallback(config)
      
      // Get or create connection from pool
      const channel = await this.getOrCreateChannel(config.table)
      
      // Set up subscription
      channel
        .on('postgres_changes' as any, {
          event: config.event || '*',
          schema: 'public',
          table: config.table,
          filter: config.filter
        }, (payload) => {
          this.handleRealtimeMessage(subscriptionId, payload, optimizedCallback)
        })

      // Store subscription config
      this.subscriptions.set(subscriptionId, config)
      this.stats.totalSubscriptions++

      console.log(`📡 Created optimized subscription: ${subscriptionId}`)
      return subscriptionId
    })
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const config = this.subscriptions.get(subscriptionId)
    if (!config) {return}

    // Clear any pending batches
    const batchTimer = this.batchTimers.get(subscriptionId)
    if (batchTimer) {
      clearTimeout(batchTimer)
      this.batchTimers.delete(subscriptionId)
    }

    // Process any remaining buffered messages
    const bufferedMessages = this.messageBuffer.get(subscriptionId)
    if (bufferedMessages && bufferedMessages.length > 0) {
      config.callback(bufferedMessages)
      this.messageBuffer.delete(subscriptionId)
    }

    // Remove subscription
    this.subscriptions.delete(subscriptionId)
    this.stats.totalSubscriptions--

    // Check if we can close the channel (if no other subscriptions)
    const channelKey = this.getChannelKey(config.table)
    const hasOtherSubscriptions = Array.from(this.subscriptions.values())
      .some(sub => sub.table === config.table)

    if (!hasOtherSubscriptions) {
      const channel = this.channels.get(channelKey)
      if (channel) {
        await channel.unsubscribe()
        this.channels.delete(channelKey)
        this.stats.activeConnections--
        console.log(`🔌 Closed channel for table: ${config.table}`)
      }
    }

    console.log(`📡 Unsubscribed: ${subscriptionId}`)
  }

  /**
   * Get or create a pooled channel for a table
   */
  private async getOrCreateChannel(table: string): Promise<RealtimeChannel> {
    const channelKey = this.getChannelKey(table)
    
    // Return existing channel if available
    if (this.channels.has(channelKey)) {
      return this.channels.get(channelKey)!
    }

    // Check connection limit
    if (this.stats.activeConnections >= this.maxConnections) {
      // Find the least used channel to reuse
      const channel = Array.from(this.channels.values())[0]
      console.warn(`⚠️ Connection limit reached, reusing channel`)
      return channel
    }

    // Create new channel
    const channel = this.supabase.channel(`kds_${table}_${Date.now()}`, {
      config: {
        presence: { key: '' },
        broadcast: { self: false }
      }
    })

    // Set up connection handlers
    channel
      .on('system', {}, (payload) => {
        this.handleSystemMessage(channelKey, payload)
      })

    // Subscribe to channel with improved error handling
    try {
      const status = await channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Connected to real-time channel: ${table}`)
          this.stats.activeConnections++
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Channel error for ${table}:`, err)
          this.handleConnectionError(channelKey)
        } else if (status === 'TIMED_OUT') {
          console.warn(`Connection timeout for ${table}`)
          this.handleConnectionError(channelKey)
        } else if (status === 'CLOSED') {
          console.warn(`Channel closed for ${table}`)
          this.handleConnectionError(channelKey)
        }
      })
    } catch (subscribeError) {
      console.error(`Failed to subscribe to channel ${table}:`, subscribeError)
      this.handleConnectionError(channelKey)
      throw subscribeError
    }

    this.channels.set(channelKey, channel)
    return channel
  }

  /**
   * Handle real-time messages with batching and throttling
   */
  private handleRealtimeMessage(
    subscriptionId: string,
    payload: any,
    callback: (payload: any) => void
  ): void {
    const config = this.subscriptions.get(subscriptionId)
    if (!config) {return}

    // Update cache immediately for consistency
    this.updateCacheOnRealtimeEvent(payload)

    // Handle batching
    if (config.batchMs && config.batchMs > 0) {
      this.addToBatch(subscriptionId, payload, callback, config.batchMs)
    } else {
      callback(payload)
    }

    // Update stats
    this.updateMessageStats()
  }

  /**
   * Batch messages to reduce callback frequency
   */
  private addToBatch(
    subscriptionId: string,
    payload: any,
    callback: (payload: any) => void,
    batchMs: number
  ): void {
    // Add to buffer
    if (!this.messageBuffer.has(subscriptionId)) {
      this.messageBuffer.set(subscriptionId, [])
    }
    this.messageBuffer.get(subscriptionId)!.push(payload)

    // Clear existing timer
    const existingTimer = this.batchTimers.get(subscriptionId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer
    const timer = setTimeout(() => {
      const bufferedMessages = this.messageBuffer.get(subscriptionId)
      if (bufferedMessages && bufferedMessages.length > 0) {
        callback(bufferedMessages)
        this.messageBuffer.set(subscriptionId, [])
      }
      this.batchTimers.delete(subscriptionId)
    }, batchMs)

    this.batchTimers.set(subscriptionId, timer)
  }

  /**
   * Update cache based on real-time events
   */
  private updateCacheOnRealtimeEvent(payload: any): void {
    const { table, eventType, new: newRecord, old: oldRecord } = payload

    switch (table) {
      case 'kds_order_routing':
        // Invalidate order-related caches
        const orderId = newRecord?.order_id || oldRecord?.order_id
        const stationId = newRecord?.station_id || oldRecord?.station_id
        KDSCacheManager.invalidateOrderCaches(orderId, stationId)
        break

      case 'kds_stations':
        // Invalidate station caches
        KDSCacheManager.invalidateStationCaches()
        break

      case 'orders':
        // Invalidate order caches
        const tableId = newRecord?.table_id || oldRecord?.table_id
        KDSCacheManager.invalidateOrderCaches(newRecord?.id || oldRecord?.id, undefined, tableId)
        break
    }
  }

  /**
   * Create optimized callback with throttling
   */
  private createOptimizedCallback(config: SubscriptionConfig): (payload: any) => void {
    let callback = config.callback

    // Apply throttling if specified
    if (config.throttleMs && config.throttleMs > 0) {
      callback = throttle(callback, config.throttleMs)
    }

    return callback
  }

  /**
   * Handle system messages and connection issues
   */
  private handleSystemMessage(channelKey: string, payload: any): void {
    console.log(`📟 System message for ${channelKey}:`, payload)
    
    if (payload.type === 'error') {
      this.handleConnectionError(channelKey)
    }
  }

  /**
   * Handle connection errors with improved exponential backoff and state management
   */
  private async handleConnectionError(channelKey: string): Promise<void> {
    console.warn(`Handling connection error for ${channelKey}`)
    
    const channel = this.channels.get(channelKey)
    if (!channel) {return}

    // Properly close the channel before removing
    try {
      await channel.unsubscribe()
    } catch (closeError) {
      console.warn(`Error closing channel ${channelKey}:`, closeError)
    }

    // Remove from active channels
    this.channels.delete(channelKey)
    this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1)
    this.stats.reconnectCount++
    this.stats.lastReconnect = new Date()

    // Check if we have exceeded max reconnect attempts
    if (this.stats.reconnectCount > 10) {
      console.error(`Max reconnection attempts exceeded for ${channelKey}`)
      return
    }

    // Improved exponential backoff with jitter
    const baseDelay = Math.min(this.reconnectDelay * Math.pow(2, this.stats.reconnectCount), this.maxReconnectDelay)
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    const delay = baseDelay + jitter
    
    console.log(`Scheduling reconnection for ${channelKey} in ${delay.toFixed(0)}ms (attempt ${this.stats.reconnectCount})`)
    
    setTimeout(async () => {
      try {
        // Find subscriptions that need this channel
        const affectedSubscriptions = Array.from(this.subscriptions.entries())
          .filter(([_, config]) => this.getChannelKey(config.table) === channelKey)

        if (affectedSubscriptions.length > 0) {
          const table = affectedSubscriptions[0][1].table
          console.log(`Reconnecting channel for table: ${table}`)
          
          // Wait a bit before reconnecting to ensure clean state
          await new Promise(resolve => setTimeout(resolve, 500))
          await this.getOrCreateChannel(table)
        }
      } catch (reconnectError) {
        console.error(`Reconnection failed for ${channelKey}:`, reconnectError)
        // Schedule another retry if reconnection fails
        if (this.stats.reconnectCount <= 10) {
          setTimeout(() => this.handleConnectionError(channelKey), delay * 2)
        }
      }
    }, delay)
  }

  /**
   * Start heartbeat to maintain connections and detect dead connections
   */
  private startHeartbeat(): void {
    setInterval(() => {
      this.channels.forEach((channel, key) => {
        try {
          // Check if channel is still connected before sending ping
          if (channel && typeof channel.send === 'function') {
            channel.send({
              type: 'broadcast',
              event: 'ping',
              payload: { timestamp: Date.now() }
            })
          } else {
            console.warn(`Channel ${key} appears to be disconnected, removing`)
            this.channels.delete(key)
            this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1)
          }
        } catch (pingError) {
          console.warn(`Heartbeat failed for channel ${key}:`, pingError)
          // Remove dead channel and trigger reconnection
          this.handleConnectionError(key)
        }
      })
    }, this.heartbeatInterval)
  }

  /**
   * Start collecting performance statistics
   */
  private startStatsCollection(): void {
    let messageCount = 0
    let lastCount = 0

    setInterval(() => {
      this.stats.messagesPerSecond = messageCount - lastCount
      lastCount = messageCount
    }, 1000)

    // Store original updateMessageStats to count messages
    const originalUpdate = this.updateMessageStats
    this.updateMessageStats = () => {
      messageCount++
      originalUpdate.call(this)
    }
  }

  /**
   * Update message statistics
   */
  private updateMessageStats(): void {
    // Implementation handled by startStatsCollection
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(config: SubscriptionConfig): string {
    const filter = config.filter || 'no-filter'
    const event = config.event || 'all'
    return `${config.table}_${event}_${filter}_${Date.now()}`
  }

  /**
   * Generate channel key for pooling
   */
  private getChannelKey(table: string): string {
    return `channel_${table}`
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return { ...this.stats }
  }

  /**
   * Clean up all connections
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up real-time connections...')
    
    // Clear all timers
    this.batchTimers.forEach(timer => clearTimeout(timer))
    this.batchTimers.clear()

    // Unsubscribe from all channels
    for (const channel of this.channels.values()) {
      await channel.unsubscribe()
    }

    this.channels.clear()
    this.subscriptions.clear()
    this.messageBuffer.clear()
    
    this.stats = {
      activeConnections: 0,
      totalSubscriptions: 0,
      messagesPerSecond: 0,
      reconnectCount: 0
    }

    console.log('✅ Real-time cleanup complete')
  }
}

// Singleton instance
const realtimeManager = new OptimizedRealtimeManager()

// High-level subscription helpers for KDS
export class KDSRealtimeSubscriptions {
  /**
   * Subscribe to order updates with optimization
   */
  static subscribeToOrders(
    callback: (orders: any[]) => void,
    options: { stationId?: string; batchMs?: number } = {}
  ): Promise<string> {
    return realtimeManager.subscribe({
      table: 'kds_order_routing',
      event: '*',
      filter: options.stationId ? `station_id=eq.${options.stationId}` : undefined,
      callback,
      batchMs: options.batchMs || 500, // Batch updates for 500ms
      throttleMs: 100 // Throttle to max 10 updates/second
    })
  }

  /**
   * Subscribe to station updates
   */
  static subscribeToStations(
    callback: (stations: any[]) => void
  ): Promise<string> {
    return realtimeManager.subscribe({
      table: 'kds_stations',
      event: '*',
      callback,
      throttleMs: 1000 // Stations change less frequently
    })
  }

  /**
   * Subscribe to order completion events
   */
  static subscribeToOrderCompletions(
    callback: (completions: any[]) => void
  ): Promise<string> {
    return realtimeManager.subscribe({
      table: 'kds_order_routing',
      event: 'UPDATE',
      filter: 'completed_at=not.is.null',
      callback,
      batchMs: 1000 // Batch completions for better UX
    })
  }

  /**
   * Unsubscribe from updates
   */
  static unsubscribe(subscriptionId: string): Promise<void> {
    return realtimeManager.unsubscribe(subscriptionId)
  }

  /**
   * Get real-time performance stats
   */
  static getStats(): ConnectionStats {
    return realtimeManager.getStats()
  }

  /**
   * Clean up all subscriptions
   */
  static cleanup(): Promise<void> {
    return realtimeManager.cleanup()
  }
}

export { OptimizedRealtimeManager, realtimeManager }
export type { SubscriptionConfig, ConnectionStats }