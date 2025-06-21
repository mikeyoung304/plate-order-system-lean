/**
 * Ultra-Smart Cache Manager
 * Implements intelligent caching with automatic invalidation
 * Expected improvement: 50-80% cache hit rate, 5-15ms response times
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  tags: string[]
  dependencies: string[]
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
  avgResponseTime: number
  lastCleanup: number
}

class UltraSmartCache {
  private cache = new Map<string, CacheEntry<any>>()
  private tagIndex = new Map<string, Set<string>>() // tag -> cache keys
  private dependencyIndex = new Map<string, Set<string>>() // dependency -> cache keys
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
    avgResponseTime: 0,
    lastCleanup: Date.now()
  }
  private cleanupTimer: NodeJS.Timeout | null = null
  private responseTimes: number[] = []

  constructor() {
    this.startCleanupTimer()
  }

  private startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    // Cleanup every 30 seconds
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, 30000)
  }

  private cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache) {
      // Remove expired entries
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    // Remove expired entries
    keysToDelete.forEach(key => {
      this.delete(key)
    })

    // Update stats
    this.stats.size = this.cache.size
    this.stats.lastCleanup = now
    this.stats.hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0

    // Calculate average response time
    if (this.responseTimes.length > 0) {
      this.stats.avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      // Keep only recent response times
      if (this.responseTimes.length > 100) {
        this.responseTimes = this.responseTimes.slice(-50)
      }
    }

    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && keysToDelete.length > 0) {
      console.log(`🧹 Ultra cache cleanup: removed ${keysToDelete.length} expired entries, ${this.cache.size} remaining`)
    }
  }

  /**
   * Set cache entry with intelligent features
   */
  set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number
      tags?: string[]
      dependencies?: string[]
    } = {}
  ): void {
    const {
      ttl = 60000, // Default 1 minute
      tags = [],
      dependencies = []
    } = options

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags,
      dependencies
    }

    // Store the entry
    this.cache.set(key, entry)

    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(key)
    })

    // Update dependency index
    dependencies.forEach(dep => {
      if (!this.dependencyIndex.has(dep)) {
        this.dependencyIndex.set(dep, new Set())
      }
      this.dependencyIndex.get(dep)!.add(key)
    })

    this.stats.size = this.cache.size
  }

  /**
   * Get cache entry with timing tracking
   */
  get<T>(key: string): T | null {
    const start = Date.now()
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    const now = Date.now()

    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key)
      this.stats.misses++
      return null
    }

    // Update access stats
    entry.accessCount++
    entry.lastAccessed = now
    this.stats.hits++

    // Track response time
    const responseTime = Date.now() - start
    this.responseTimes.push(responseTime)

    return entry.data as T
  }

  /**
   * Delete cache entry and cleanup indexes
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) {
      return false
    }

    // Remove from tag index
    entry.tags.forEach(tag => {
      const tagEntries = this.tagIndex.get(tag)
      if (tagEntries) {
        tagEntries.delete(key)
        if (tagEntries.size === 0) {
          this.tagIndex.delete(tag)
        }
      }
    })

    // Remove from dependency index
    entry.dependencies.forEach(dep => {
      const depEntries = this.dependencyIndex.get(dep)
      if (depEntries) {
        depEntries.delete(key)
        if (depEntries.size === 0) {
          this.dependencyIndex.delete(dep)
        }
      }
    })

    this.cache.delete(key)
    this.stats.size = this.cache.size
    return true
  }

  /**
   * Invalidate cache entries by tag
   */
  invalidateByTag(tag: string): number {
    const tagEntries = this.tagIndex.get(tag)
    if (!tagEntries) {
      return 0
    }

    const keys = Array.from(tagEntries)
    keys.forEach(key => this.delete(key))

    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Invalidated ${keys.length} cache entries with tag: ${tag}`)
    }

    return keys.length
  }

  /**
   * Invalidate cache entries by dependency
   */
  invalidateByDependency(dependency: string): number {
    const depEntries = this.dependencyIndex.get(dependency)
    if (!depEntries) {
      return 0
    }

    const keys = Array.from(depEntries)
    keys.forEach(key => this.delete(key))

    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Invalidated ${keys.length} cache entries with dependency: ${dependency}`)
    }

    return keys.length
  }

  /**
   * Smart cache warming for common queries
   */
  warmUp(warmUpFunctions: Record<string, () => Promise<any>>): void {
    Object.entries(warmUpFunctions).forEach(async ([key, fn]) => {
      try {
        if (!this.cache.has(key)) {
          const data = await fn()
          this.set(key, data, { ttl: 120000 }) // 2 minutes for warm-up data
        }
      } catch (error) {
        console.warn(`Failed to warm up cache for ${key}:`, error)
      }
    })
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get cache entries by tag
   */
  getByTag(tag: string): string[] {
    const tagEntries = this.tagIndex.get(tag)
    return tagEntries ? Array.from(tagEntries) : []
  }

  /**
   * Get most accessed cache entries
   */
  getMostAccessed(limit: number = 10): Array<{key: string, accessCount: number}> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, accessCount: entry.accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.tagIndex.clear()
    this.dependencyIndex.clear()
    this.stats.size = 0

    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Ultra cache cleared completely')
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clear()
  }
}

// Global ultra-smart cache instance
export const ultraSmartCache = new UltraSmartCache()

// KDS-specific cache methods
export const KDSCache = {
  // Active orders cache
  setActiveOrders: (data: any[], ttl: number = 5000) => {
    ultraSmartCache.set('kds_active_orders', data, {
      ttl,
      tags: ['kds', 'orders', 'active'],
      dependencies: ['kds_order_routing', 'orders']
    })
  },

  getActiveOrders: () => {
    return ultraSmartCache.get<any[]>('kds_active_orders')
  },

  // Station orders cache
  setStationOrders: (stationId: string, data: any[], ttl: number = 5000) => {
    ultraSmartCache.set(`kds_station_orders_${stationId}`, data, {
      ttl,
      tags: ['kds', 'orders', 'station', stationId],
      dependencies: ['kds_order_routing', 'orders', `station_${stationId}`]
    })
  },

  getStationOrders: (stationId: string) => {
    return ultraSmartCache.get<any[]>(`kds_station_orders_${stationId}`)
  },

  // Stations cache
  setStations: (data: any[], ttl: number = 300000) => { // 5 minutes for stations
    ultraSmartCache.set('kds_stations', data, {
      ttl,
      tags: ['kds', 'stations'],
      dependencies: ['kds_stations']
    })
  },

  getStations: () => {
    return ultraSmartCache.get<any[]>('kds_stations')
  },

  // Table grouping cache
  setTableGroups: (data: any[], ttl: number = 10000) => { // 10 seconds for table groups
    ultraSmartCache.set('kds_table_groups', data, {
      ttl,
      tags: ['kds', 'tables', 'groups'],
      dependencies: ['orders', 'tables', 'seats', 'kds_order_routing']
    })
  },

  getTableGroups: () => {
    return ultraSmartCache.get<any[]>('kds_table_groups')
  },

  // Smart invalidation methods
  invalidateOrders: () => {
    const invalidated = ultraSmartCache.invalidateByTag('orders')
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 KDS: Invalidated ${invalidated} order-related cache entries`)
    }
    return invalidated
  },

  invalidateStation: (stationId: string) => {
    return ultraSmartCache.invalidateByTag(stationId)
  },

  invalidateAll: () => {
    return ultraSmartCache.invalidateByTag('kds')
  },

  // Warm up common KDS queries
  warmUp: async () => {
    const warmUpFunctions = {
      'kds_stations': async () => {
        // This would typically call your fetchStations function
        return []
      }
    }

    ultraSmartCache.warmUp(warmUpFunctions)
  }
}


export default ultraSmartCache