/**
 * High-Performance KDS Caching System
 * In-memory caching with intelligent invalidation for <50ms response times
 */

import { measureApiCall } from '@/lib/performance-utils'
import type { KDSOrderRouting, KDSStation } from '@/lib/modassembly/supabase/database/kds/types'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
}

interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalEntries: number
  memoryUsage: number
}

class HighPerformanceCache {
  private cache = new Map<string, CacheEntry<any>>()
  private stats = { hits: 0, misses: 0 }
  private maxSize = 500 // Reduced for better performance
  private defaultTTL = 5000 // 5 seconds default TTL for faster updates
  
  // Performance-optimized get
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }
    
    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }
    
    this.stats.hits++
    return entry.data
  }
  
  // Performance-optimized set with LRU eviction
  set<T>(key: string, data: T, ttl = this.defaultTTL, tags: string[] = []): void {
    // Evict expired entries and maintain size limit
    if (this.cache.size >= this.maxSize) {
      this.evictOldEntries()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags
    })
  }
  
  // Batch get for multiple keys
  getBatch<T>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>()
    
    for (const key of keys) {
      const value = this.get<T>(key)
      if (value !== null) {
        results.set(key, value)
      }
    }
    
    return results
  }
  
  // Invalidate by tags
  invalidateByTags(tags: string[]): number {
    let deletedCount = 0
    const tagSet = new Set(tags)
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tagSet.has(tag))) {
        this.cache.delete(key)
        deletedCount++
      }
    }
    
    return deletedCount
  }
  
  // Clear specific keys
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
  
  // Clear all cache
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0 }
  }
  
  // Get cache statistics
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      totalEntries: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    }
  }
  
  private evictOldEntries(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    // Remove expired entries first
    for (const [key, entry] of entries) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key)
      }
    }
    
    // If still over limit, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const toRemove = this.cache.size - this.maxSize + 100 // Remove extra 100 for buffer
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      for (let i = 0; i < toRemove && i < sortedEntries.length; i++) {
        this.cache.delete(sortedEntries[i][0])
      }
    }
  }
  
  private estimateMemoryUsage(): number {
    let size = 0
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2 // Approximate string size
      size += JSON.stringify(entry.data).length * 2
      size += 100 // Overhead for entry structure
    }
    return size
  }
}

// Global cache instance
const kdsCache = new HighPerformanceCache()

// KDS-specific cache keys and utilities
class KDSCacheManager {
  // Cache key generators
  private static keys = {
    stations: () => 'kds:stations:active',
    stationOrders: (stationId: string) => `kds:station:${stationId}:orders`,
    allActiveOrders: () => 'kds:orders:all:active',
    tableGroupedOrders: () => 'kds:orders:table-grouped',
    orderRouting: (orderId: string) => `kds:order:${orderId}:routing`,
    stationMetrics: (stationId: string) => `kds:station:${stationId}:metrics`,
  }
  
  // Cache TTL settings (in milliseconds) - Optimized for <50ms performance
  private static ttl = {
    stations: 120000, // 2 minutes - stations change rarely
    orders: 5000,     // 5 seconds - aggressive caching for performance
    metrics: 15000,   // 15 seconds - metrics update regularly
  }
  
  // Cache tags for intelligent invalidation
  private static tags = {
    stations: ['stations'],
    orders: ['orders'],
    stationOrders: (stationId: string) => ['orders', `station:${stationId}`],
    tableOrders: (tableId: string) => ['orders', `table:${tableId}`],
  }
  
  // Get cached stations with fallback
  static async getStations(
    fallbackFn: () => Promise<KDSStation[]>
  ): Promise<KDSStation[]> {
    return measureApiCall('cache_get_stations', async () => {
      const cacheKey = this.keys.stations()
      const cached = kdsCache.get<KDSStation[]>(cacheKey)
      
      if (cached) {
        return cached
      }
      
      const data = await fallbackFn()
      kdsCache.set(cacheKey, data, this.ttl.stations, this.tags.stations)
      return data
    })
  }
  
  // Get cached station orders with fallback
  static async getStationOrders(
    stationId: string,
    fallbackFn: () => Promise<KDSOrderRouting[]>
  ): Promise<KDSOrderRouting[]> {
    return measureApiCall('cache_get_station_orders', async () => {
      const cacheKey = this.keys.stationOrders(stationId)
      const cached = kdsCache.get<KDSOrderRouting[]>(cacheKey)
      
      if (cached) {
        return cached
      }
      
      const data = await fallbackFn()
      kdsCache.set(cacheKey, data, this.ttl.orders, this.tags.stationOrders(stationId))
      return data
    })
  }
  
  // Get cached active orders with fallback
  static async getAllActiveOrders(
    fallbackFn: () => Promise<KDSOrderRouting[]>
  ): Promise<KDSOrderRouting[]> {
    return measureApiCall('cache_get_all_active_orders', async () => {
      const cacheKey = this.keys.allActiveOrders()
      const cached = kdsCache.get<KDSOrderRouting[]>(cacheKey)
      
      if (cached) {
        return cached
      }
      
      const data = await fallbackFn()
      kdsCache.set(cacheKey, data, this.ttl.orders, this.tags.orders)
      return data
    })
  }
  
  // Get cached table-grouped orders
  static async getTableGroupedOrders(
    fallbackFn: () => Promise<any[]>
  ): Promise<any[]> {
    return measureApiCall('cache_get_table_grouped_orders', async () => {
      const cacheKey = this.keys.tableGroupedOrders()
      const cached = kdsCache.get<any[]>(cacheKey)
      
      if (cached) {
        return cached
      }
      
      const data = await fallbackFn()
      kdsCache.set(cacheKey, data, this.ttl.orders, this.tags.orders)
      return data
    })
  }
  
  // Preload frequently accessed data
  static async preloadCache(
    stationsFn: () => Promise<KDSStation[]>,
    activeOrdersFn: () => Promise<KDSOrderRouting[]>
  ): Promise<void> {
    await Promise.all([
      this.getStations(stationsFn),
      this.getAllActiveOrders(activeOrdersFn)
    ])
  }
  
  // Invalidate order-related caches when orders change
  static invalidateOrderCaches(orderId?: string, stationId?: string, tableId?: string): void {
    const tagsToInvalidate = ['orders']
    
    if (stationId) {
      tagsToInvalidate.push(`station:${stationId}`)
    }
    
    if (tableId) {
      tagsToInvalidate.push(`table:${tableId}`)
    }
    
    const deletedCount = kdsCache.invalidateByTags(tagsToInvalidate)
    // Performance optimization: Only log if significant cache invalidation in development
    if (deletedCount > 10 && process.env.NODE_ENV === 'development') {
      console.log(`Invalidated ${deletedCount} cache entries for order changes`)
    }
  }
  
  // Invalidate station caches when stations change
  static invalidateStationCaches(): void {
    const deletedCount = kdsCache.invalidateByTags(['stations'])
    // Performance optimization: Only log significant changes in development
    if (deletedCount > 5 && process.env.NODE_ENV === 'development') {
      console.log(`Invalidated ${deletedCount} cache entries for station changes`)
    }
  }
  
  // Get cache performance stats
  static getCacheStats() {
    return kdsCache.getStats()
  }
  
  // Clear all KDS caches
  static clearAll(): void {
    kdsCache.clear()
    // Performance optimization: Removed emoji logging
  }
  
  // Warm up cache with critical data
  static async warmUpCache(
    stationsFn: () => Promise<KDSStation[]>,
    activeOrdersFn: () => Promise<KDSOrderRouting[]>
  ): Promise<void> {
    // Performance optimization: Removed emoji logging that impacts performance
    const startTime = performance.now()
    
    try {
      await Promise.all([
        this.getStations(stationsFn),
        this.getAllActiveOrders(activeOrdersFn)
      ])
      
      const duration = performance.now() - startTime
      // Only log cache warm-up in development mode
      if (duration > 100 && process.env.NODE_ENV === 'development') {
        console.log(`Cache warm-up completed in ${duration.toFixed(2)}ms`)
      }
    } catch (_error) {
      // Only log cache errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Cache warm-up failed:', _error)
      }
    }
  }
}

// Batch cache operations for multiple stations
class BatchCacheOperations {
  // Get orders for multiple stations in parallel
  static async getMultipleStationOrders(
    stationIds: string[],
    fallbackFn: (stationId: string) => Promise<KDSOrderRouting[]>
  ): Promise<Map<string, KDSOrderRouting[]>> {
    return measureApiCall('cache_batch_station_orders', async () => {
      const results = new Map<string, KDSOrderRouting[]>()
      const cacheMisses: string[] = []
      
      // Check cache for all stations
      for (const stationId of stationIds) {
        const cacheKey = KDSCacheManager['keys'].stationOrders(stationId)
        const cached = kdsCache.get<KDSOrderRouting[]>(cacheKey)
        
        if (cached) {
          results.set(stationId, cached)
        } else {
          cacheMisses.push(stationId)
        }
      }
      
      // Fetch missing data in parallel
      if (cacheMisses.length > 0) {
        const fetchPromises = cacheMisses.map(async (stationId) => {
          const data = await fallbackFn(stationId)
          const cacheKey = KDSCacheManager['keys'].stationOrders(stationId)
          kdsCache.set(
            cacheKey, 
            data, 
            KDSCacheManager['ttl'].orders, 
            KDSCacheManager['tags'].stationOrders(stationId)
          )
          return [stationId, data] as const
        })
        
        const fetchedData = await Promise.all(fetchPromises)
        fetchedData.forEach(([stationId, data]) => {
          results.set(stationId, data)
        })
      }
      
      return results
    })
  }
}

// Smart cache refresh for real-time updates
class SmartCacheRefresh {
  private static refreshIntervals = new Map<string, NodeJS.Timeout>()
  
  // Start intelligent refresh for critical data
  static startSmartRefresh(
    stationsFn: () => Promise<KDSStation[]>,
    activeOrdersFn: () => Promise<KDSOrderRouting[]>
  ): void {
    // Refresh stations every 2 minutes
    this.refreshIntervals.set('stations', setInterval(async () => {
      try {
        await KDSCacheManager.getStations(stationsFn)
      } catch (_error) {
        // Only log smart refresh errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Smart refresh failed for stations:', _error)
        }
      }
    }, 120000))
    
    // Refresh active orders every 10 seconds
    this.refreshIntervals.set('orders', setInterval(async () => {
      try {
        await KDSCacheManager.getAllActiveOrders(activeOrdersFn)
      } catch (_error) {
        // Only log smart refresh errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Smart refresh failed for orders:', _error)
        }
      }
    }, 10000))
    
    // Only log smart refresh status in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Started smart cache refresh')
    }
  }
  
  // Stop smart refresh
  static stopSmartRefresh(): void {
    this.refreshIntervals.forEach((interval) => {
      clearInterval(interval)
    })
    this.refreshIntervals.clear()
    // Only log smart refresh status in development
    if (process.env.NODE_ENV === 'development') {
      console.log('⏹️ Stopped smart cache refresh')
    }
  }
}

export { KDSCacheManager, BatchCacheOperations, SmartCacheRefresh }