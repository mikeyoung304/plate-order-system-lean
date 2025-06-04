/**
 * Optimized Supabase Client Configuration
 * 
 * Enhanced client with connection pooling, caching, and performance optimizations
 * for supporting 1000+ concurrent users with sub-1s real-time updates.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// Client pool configuration
const CLIENT_POOL_CONFIG = {
  MAX_CLIENTS: 5, // Maximum number of client instances to pool
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
}

// Connection pool for managing multiple client instances
class SupabaseClientPool {
  private clients: SupabaseClient<Database>[] = []
  private currentIndex = 0
  private healthChecks = new Map<number, { lastCheck: number; isHealthy: boolean }>()
  private heartbeatInterval: NodeJS.Timeout | null = null
  
  constructor() {
    this.initializePool()
    this.startHealthMonitoring()
  }
  
  private initializePool(): void {
    for (let i = 0; i < CLIENT_POOL_CONFIG.MAX_CLIENTS; i++) {
      const client = this.createOptimizedClient()
      this.clients.push(client)
      this.healthChecks.set(i, { lastCheck: Date.now(), isHealthy: true })
    }
  }
  
  private createOptimizedClient(): SupabaseClient<Database> {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 100, // Increased event handling capacity
          },
        },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-client-info': 'plater-optimized-client',
          },
        },
      }
    )
  }
  
  private startHealthMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      this.performHealthChecks()
    }, CLIENT_POOL_CONFIG.HEARTBEAT_INTERVAL)
  }
  
  private async performHealthChecks(): Promise<void> {
    const now = Date.now()
    
    for (let i = 0; i < this.clients.length; i++) {
      try {
        // Perform a lightweight health check
        const { error } = await this.clients[i]
          .from('profiles')
          .select('user_id')
          .limit(1)
        
        this.healthChecks.set(i, {
          lastCheck: now,
          isHealthy: !error,
        })
        
        // If client is unhealthy, recreate it
        if (error) {
          console.warn(`Client ${i} unhealthy, recreating...`)
          this.clients[i] = this.createOptimizedClient()
        }
      } catch (error) {
        console.error(`Health check failed for client ${i}:`, error)
        this.healthChecks.set(i, {
          lastCheck: now,
          isHealthy: false,
        })
        
        // Recreate unhealthy client
        this.clients[i] = this.createOptimizedClient()
      }
    }
  }
  
  // Get next healthy client using round-robin
  getClient(): SupabaseClient<Database> {
    let attempts = 0
    
    while (attempts < this.clients.length) {
      const clientIndex = this.currentIndex
      this.currentIndex = (this.currentIndex + 1) % this.clients.length
      
      const healthCheck = this.healthChecks.get(clientIndex)
      if (healthCheck?.isHealthy) {
        return this.clients[clientIndex]
      }
      
      attempts++
    }
    
    // If no healthy clients, return the first one and log warning
    console.warn('No healthy clients available, returning first client')
    return this.clients[0]
  }
  
  // Get all clients for real-time subscriptions
  getAllClients(): SupabaseClient<Database>[] {
    return this.clients.filter((_, index) => {
      const healthCheck = this.healthChecks.get(index)
      return healthCheck?.isHealthy !== false
    })
  }
  
  // Get pool statistics
  getPoolStats() {
    const healthyCount = Array.from(this.healthChecks.values())
      .filter(check => check.isHealthy).length
    
    return {
      totalClients: this.clients.length,
      healthyClients: healthyCount,
      unhealthyClients: this.clients.length - healthyCount,
      currentIndex: this.currentIndex,
    }
  }
  
  // Cleanup resources
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    // Note: Supabase clients don't have a destroy method
    // but we can clear references
    this.clients.length = 0
    this.healthChecks.clear()
  }
}

// Global client pool instance
let clientPool: SupabaseClientPool | null = null

// Initialize client pool (singleton)
function getClientPool(): SupabaseClientPool {
  if (!clientPool) {
    clientPool = new SupabaseClientPool()
  }
  return clientPool
}

// Enhanced client factory with intelligent pooling
export function createOptimizedClient(): SupabaseClient<Database> {
  if (typeof window === 'undefined') {
    // Server-side: create individual clients
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  // Client-side: use pooled clients
  const pool = getClientPool()
  return pool.getClient()
}

// Get multiple clients for real-time load balancing
export function createOptimizedClientPool(): SupabaseClient<Database>[] {
  if (typeof window === 'undefined') {
    // Server-side: return single client
    return [createOptimizedClient()]
  }
  
  const pool = getClientPool()
  return pool.getAllClients()
}

// Get client pool statistics
export function getClientPoolStats() {
  if (typeof window === 'undefined' || !clientPool) {
    return {
      totalClients: 1,
      healthyClients: 1,
      unhealthyClients: 0,
      currentIndex: 0,
    }
  }
  
  return clientPool.getPoolStats()
}

// Cleanup client pool (useful for testing)
export function destroyClientPool(): void {
  if (clientPool) {
    clientPool.destroy()
    clientPool = null
  }
}

// Legacy compatibility - use regular client for backward compatibility
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Enhanced query builder with caching and optimizations
export class OptimizedQueryBuilder {
  private client: SupabaseClient<Database>
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly DEFAULT_TTL = 30000 // 30 seconds
  
  constructor(client?: SupabaseClient<Database>) {
    this.client = client || createOptimizedClient()
  }
  
  // Cached query with TTL
  async cachedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<{ data: T | null; error: any }>,
    ttl = this.DEFAULT_TTL
  ): Promise<{ data: T | null; error: any; fromCache: boolean }> {
    const now = Date.now()
    const cached = this.cache.get(queryKey)
    
    // Return cached data if valid
    if (cached && now - cached.timestamp < cached.ttl) {
      return { data: cached.data, error: null, fromCache: true }
    }
    
    // Execute query
    const result = await queryFn()
    
    // Cache successful results
    if (!result.error && result.data) {
      this.cache.set(queryKey, {
        data: result.data,
        timestamp: now,
        ttl,
      })
    }
    
    return { ...result, fromCache: false }
  }
  
  // Batch query execution
  async batchQuery<T>(
    queries: Array<{
      key: string
      query: () => Promise<{ data: T | null; error: any }>
      ttl?: number
    }>
  ): Promise<Array<{ data: T | null; error: any; fromCache: boolean }>> {
    const results = await Promise.all(
      queries.map(({ key, query, ttl }) => 
        this.cachedQuery(key, query, ttl)
      )
    )
    
    return results
  }
  
  // Clear cache
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }
    
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }
  
  // Get cache statistics
  getCacheStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0
    
    for (const entry of this.cache.values()) {
      if (now - entry.timestamp < entry.ttl) {
        validEntries++
      } else {
        expiredEntries++
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: validEntries / Math.max(this.cache.size, 1),
    }
  }
}

// Global optimized query builder instance
let globalQueryBuilder: OptimizedQueryBuilder | null = null

export function getOptimizedQueryBuilder(): OptimizedQueryBuilder {
  if (!globalQueryBuilder) {
    globalQueryBuilder = new OptimizedQueryBuilder()
  }
  return globalQueryBuilder
}

// Connection health monitoring
export async function testConnectionHealth(): Promise<{
  success: boolean
  latency: number
  error?: string
}> {
  const start = performance.now()
  
  try {
    const client = createOptimizedClient()
    const { error } = await client
      .from('profiles')
      .select('user_id')
      .limit(1)
    
    const latency = performance.now() - start
    
    if (error) {
      return {
        success: false,
        latency,
        error: error.message,
      }
    }
    
    return {
      success: true,
      latency,
    }
  } catch (error) {
    return {
      success: false,
      latency: performance.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}