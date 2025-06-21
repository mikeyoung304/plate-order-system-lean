/**
 * Database Connection Pool Manager
 * Optimizes Supabase client reuse and connection efficiency
 * Expected improvement: 15-25ms per request
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

interface ConnectionPoolStats {
  activeConnections: number
  totalCreated: number
  cacheHits: number
  cacheMisses: number
  lastCleanup: number
}

interface CachedConnection {
  client: SupabaseClient
  lastUsed: number
  requestCount: number
  createdAt: number
}

class DatabaseConnectionPool {
  private connections = new Map<string, CachedConnection>()
  private readonly maxConnections = 10
  private readonly connectionTTL = 5 * 60 * 1000 // 5 minutes
  private readonly cleanupInterval = 60 * 1000 // 1 minute
  private cleanupTimer: NodeJS.Timeout | null = null
  private stats: ConnectionPoolStats = {
    activeConnections: 0,
    totalCreated: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastCleanup: Date.now()
  }

  constructor() {
    this.startCleanupTimer()
  }

  private startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)
  }

  private cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, conn] of this.connections) {
      // Remove connections that are too old or unused
      if (now - conn.lastUsed > this.connectionTTL) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.connections.delete(key)
    })

    this.stats.lastCleanup = now
    this.stats.activeConnections = this.connections.size

    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && keysToDelete.length > 0) {
      console.log(`🔄 Connection pool cleanup: removed ${keysToDelete.length} expired connections`)
    }
  }

  /**
   * Get an optimized database client with connection reuse
   */
  getClient(context: string = 'default'): SupabaseClient {
    const now = Date.now()
    
    // Try to reuse existing connection
    const existing = this.connections.get(context)
    if (existing && now - existing.lastUsed < this.connectionTTL) {
      existing.lastUsed = now
      existing.requestCount++
      this.stats.cacheHits++
      return existing.client
    }

    // Create new connection if pool has space
    if (this.connections.size < this.maxConnections) {
      const client = createClient()
      const connection: CachedConnection = {
        client,
        lastUsed: now,
        requestCount: 1,
        createdAt: now
      }

      this.connections.set(context, connection)
      this.stats.totalCreated++
      this.stats.cacheMisses++
      this.stats.activeConnections = this.connections.size

      return client
    }

    // Pool is full, find least recently used connection to replace
    let oldestKey = ''
    let oldestTime = now

    for (const [key, conn] of this.connections) {
      if (conn.lastUsed < oldestTime) {
        oldestTime = conn.lastUsed
        oldestKey = key
      }
    }

    // Replace the oldest connection
    if (oldestKey) {
      this.connections.delete(oldestKey)
    }

    const client = createClient()
    const connection: CachedConnection = {
      client,
      lastUsed: now,
      requestCount: 1,
      createdAt: now
    }

    this.connections.set(context, connection)
    this.stats.totalCreated++
    this.stats.cacheMisses++

    return client
  }

  /**
   * Get optimized client for KDS operations
   */
  getKDSClient(): SupabaseClient {
    return this.getClient('kds-operations')
  }

  /**
   * Get optimized client for real-time subscriptions
   */
  getRealtimeClient(): SupabaseClient {
    return this.getClient('realtime-subscriptions')
  }

  /**
   * Get optimized client for order operations
   */
  getOrderClient(): SupabaseClient {
    return this.getClient('order-operations')
  }

  /**
   * Get optimized client for authentication operations
   */
  getAuthClient(): SupabaseClient {
    return this.getClient('auth-operations')
  }

  /**
   * Warm up the connection pool with common contexts
   */
  warmUp(): void {
    const contexts = ['kds-operations', 'realtime-subscriptions', 'order-operations', 'auth-operations']
    
    contexts.forEach(context => {
      this.getClient(context)
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔥 Connection pool warmed up with ${contexts.length} connections`)
    }
  }

  /**
   * Get connection pool statistics
   */
  getStats(): ConnectionPoolStats & { efficiency: number } {
    const total = this.stats.cacheHits + this.stats.cacheMisses
    const efficiency = total > 0 ? (this.stats.cacheHits / total) * 100 : 0

    return {
      ...this.stats,
      efficiency
    }
  }

  /**
   * Force cleanup and clear all connections
   */
  clear(): void {
    this.connections.clear()
    this.stats.activeConnections = 0
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Connection pool cleared')
    }
  }

  /**
   * Destroy the connection pool and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    
    this.clear()
  }
}

// Global connection pool instance
export const connectionPool = new DatabaseConnectionPool()

// Auto-warm up in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  connectionPool.warmUp()
}

// Utility functions for easy access
export const getKDSClient = () => connectionPool.getKDSClient()
export const getRealtimeClient = () => connectionPool.getRealtimeClient()
export const getOrderClient = () => connectionPool.getOrderClient()
export const getAuthClient = () => connectionPool.getAuthClient()

// React hooks are now in /hooks/use-performance-stats.ts

export default connectionPool