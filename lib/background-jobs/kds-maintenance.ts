/**
 * KDS Background Jobs and Maintenance Operations
 * Optimized cleanup, metrics collection, and maintenance tasks for peak performance
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import { KDSCacheManager, SmartCacheRefresh } from '@/lib/cache/kds-cache'
import { performanceMonitor } from '@/lib/performance-utils'

interface JobConfig {
  name: string
  interval: number // milliseconds
  enabled: boolean
  maxDuration: number // max execution time in ms
  retryCount: number
}

interface JobResult {
  success: boolean
  duration: number
  error?: string
  processed: number
  timestamp: Date
}

interface MaintenanceStats {
  totalJobs: number
  successfulJobs: number
  failedJobs: number
  averageDuration: number
  lastRun: Date | null
  systemLoad: number
}

class KDSMaintenanceManager {
  private supabase = createClient()
  private jobs = new Map<string, NodeJS.Timeout>()
  private jobHistory = new Map<string, JobResult[]>()
  private isRunning = false
  private maxHistorySize = 100

  // Job configurations
  private readonly jobConfigs: Record<string, JobConfig> = {
    cleanupCompletedOrders: {
      name: 'Cleanup Completed Orders',
      interval: 300000, // 5 minutes
      enabled: true,
      maxDuration: 30000, // 30 seconds
      retryCount: 3
    },
    updateStationMetrics: {
      name: 'Update Station Metrics',
      interval: 60000, // 1 minute
      enabled: true,
      maxDuration: 15000, // 15 seconds
      retryCount: 2
    },
    optimizeIndexes: {
      name: 'Optimize Database Indexes',
      interval: 3600000, // 1 hour
      enabled: true,
      maxDuration: 120000, // 2 minutes
      retryCount: 1
    },
    cleanupCacheMetrics: {
      name: 'Cleanup Cache Metrics',
      interval: 900000, // 15 minutes
      enabled: true,
      maxDuration: 10000, // 10 seconds
      retryCount: 2
    },
    validateDataIntegrity: {
      name: 'Validate Data Integrity',
      interval: 1800000, // 30 minutes
      enabled: true,
      maxDuration: 60000, // 1 minute
      retryCount: 2
    }
  }

  /**
   * Start all maintenance jobs
   */
  async startMaintenance(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ Maintenance jobs already running')
      return
    }

    console.log('🔧 Starting KDS maintenance jobs...')
    this.isRunning = true

    // Start each enabled job
    for (const [jobKey, config] of Object.entries(this.jobConfigs)) {
      if (config.enabled) {
        this.scheduleJob(jobKey, config)
      }
    }

    // Start smart cache refresh
    try {
      const { fetchKDSStations } = await import('@/lib/modassembly/supabase/database/kds/core')
      const { fetchAllActiveOrders } = await import('@/lib/modassembly/supabase/database/kds/core')
      
      SmartCacheRefresh.startSmartRefresh(fetchKDSStations, fetchAllActiveOrders)
    } catch (_error) {
      console.error('Failed to start smart cache refresh:', _error)
    }

    console.log('✅ KDS maintenance jobs started')
  }

  /**
   * Stop all maintenance jobs
   */
  stopMaintenance(): void {
    console.log('🛑 Stopping KDS maintenance jobs...')
    
    // Clear all job timers
    this.jobs.forEach((timer, jobKey) => {
      clearInterval(timer)
      console.log(`  Stopped job: ${jobKey}`)
    })
    
    this.jobs.clear()
    this.isRunning = false

    // Stop smart cache refresh
    SmartCacheRefresh.stopSmartRefresh()

    console.log('✅ KDS maintenance jobs stopped')
  }

  /**
   * Schedule a specific job
   */
  private scheduleJob(jobKey: string, config: JobConfig): void {
    const timer = setInterval(async () => {
      await this.runJob(jobKey, config)
    }, config.interval)

    this.jobs.set(jobKey, timer)
    console.log(`📅 Scheduled job: ${config.name} (every ${config.interval / 1000}s)`)

    // Run job immediately on startup
    setTimeout(() => this.runJob(jobKey, config), 1000)
  }

  /**
   * Run a specific job with error handling and performance tracking
   */
  private async runJob(jobKey: string, config: JobConfig): Promise<void> {
    const startTime = Date.now()
    let attempt = 0
    
    while (attempt <= config.retryCount) {
      try {
        console.log(`🔄 Running job: ${config.name} (attempt ${attempt + 1}/${config.retryCount + 1})`)
        
        const result = await this.executeJobWithTimeout(jobKey, config)
        
        this.recordJobResult(jobKey, {
          success: true,
          duration: Date.now() - startTime,
          processed: result.processed,
          timestamp: new Date()
        })

        console.log(`✅ Job completed: ${config.name} (${result.processed} items, ${Date.now() - startTime}ms)`)
        return

      } catch (error) {
        attempt++
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        if (attempt > config.retryCount) {
          this.recordJobResult(jobKey, {
            success: false,
            duration: Date.now() - startTime,
            error: errorMessage,
            processed: 0,
            timestamp: new Date()
          })
          
          console.error(`❌ Job failed after ${config.retryCount + 1} attempts: ${config.name}`, error)
        } else {
          console.warn(`⚠️ Job attempt ${attempt} failed: ${config.name}, retrying...`)
          await this.sleep(1000 * attempt) // Exponential backoff
        }
      }
    }
  }

  /**
   * Execute job with timeout protection
   */
  private async executeJobWithTimeout(jobKey: string, config: JobConfig): Promise<{ processed: number }> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Job timed out after ${config.maxDuration}ms`))
      }, config.maxDuration)

      try {
        const result = await this.executeJob(jobKey)
        clearTimeout(timeout)
        resolve(result)
      } catch (error) {
        clearTimeout(timeout)
        reject(error)
      }
    })
  }

  /**
   * Execute specific job logic
   */
  private async executeJob(jobKey: string): Promise<{ processed: number }> {
    switch (jobKey) {
      case 'cleanupCompletedOrders':
        return this.cleanupCompletedOrders()
      
      case 'updateStationMetrics':
        return this.updateStationMetrics()
      
      case 'optimizeIndexes':
        return this.optimizeIndexes()
      
      case 'cleanupCacheMetrics':
        return this.cleanupCacheMetrics()
      
      case 'validateDataIntegrity':
        return this.validateDataIntegrity()
      
      default:
        throw new Error(`Unknown job: ${jobKey}`)
    }
  }

  /**
   * Clean up old completed orders to maintain performance
   */
  private async cleanupCompletedOrders(): Promise<{ processed: number }> {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    
    const { data, error } = await this.supabase.rpc('cleanup_old_kds_orders', {
      hours_old: 24
    })

    if (error) {
      throw new Error(`Cleanup failed: ${error.message}`)
    }

    // Also cleanup related performance metrics
    performanceMonitor.clear()

    return { processed: data || 0 }
  }

  /**
   * Update materialized view for station metrics
   */
  private async updateStationMetrics(): Promise<{ processed: number }> {
    const { error } = await this.supabase.rpc('refresh_kds_station_metrics')

    if (error) {
      throw new Error(`Metrics update failed: ${error.message}`)
    }

    return { processed: 1 }
  }

  /**
   * Optimize database indexes and analyze tables
   */
  private async optimizeIndexes(): Promise<{ processed: number }> {
    const tables = ['kds_order_routing', 'kds_stations', 'orders', 'tables', 'seats']
    let processed = 0

    for (const table of tables) {
      try {
        // Analyze table statistics
        const { error } = await this.supabase.rpc('execute_sql', {
          query: `ANALYZE ${table}`
        })

        if (error) {
          console.warn(`Failed to analyze table ${table}:`, error.message)
        } else {
          processed++
        }
      } catch (_error) {
        console.warn(`Failed to analyze table ${table}:`, _error)
      }
    }

    return { processed }
  }

  /**
   * Cleanup cache metrics and expired entries
   */
  private async cleanupCacheMetrics(): Promise<{ processed: number }> {
    // Get cache stats before cleanup
    const statsBefore = KDSCacheManager.getCacheStats()
    
    // Clear cache if hit rate is low (cache not effective)
    if (statsBefore.hitRate < 50) {
      console.log(`🗑️ Cache hit rate low (${statsBefore.hitRate}%), clearing cache`)
      KDSCacheManager.clearAll()
    }

    return { processed: 1 }
  }

  /**
   * Validate data integrity between related tables
   */
  private async validateDataIntegrity(): Promise<{ processed: number }> {
    let issues = 0

    try {
      // Check for orphaned order routing entries
      const { data: orphanedRouting } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT COUNT(*) as count
          FROM kds_order_routing kor
          LEFT JOIN orders o ON kor.order_id = o.id
          WHERE o.id IS NULL
        `
      })

      if (orphanedRouting?.[0]?.count > 0) {
        console.warn(`⚠️ Found ${orphanedRouting[0].count} orphaned order routing entries`)
        issues++
      }

      // Check for orders without routing
      const { data: unroutedOrders } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT COUNT(*) as count
          FROM orders o
          LEFT JOIN kds_order_routing kor ON o.id = kor.order_id
          WHERE kor.id IS NULL AND o.status NOT IN ('completed', 'cancelled')
        `
      })

      if (unroutedOrders?.[0]?.count > 0) {
        console.warn(`⚠️ Found ${unroutedOrders[0].count} orders without KDS routing`)
        issues++
      }

      return { processed: issues }

    } catch (error) {
      throw new Error(`Data integrity check failed: ${error}`)
    }
  }

  /**
   * Record job execution result
   */
  private recordJobResult(jobKey: string, result: JobResult): void {
    if (!this.jobHistory.has(jobKey)) {
      this.jobHistory.set(jobKey, [])
    }

    const history = this.jobHistory.get(jobKey)!
    history.push(result)

    // Keep only recent history
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize)
    }
  }

  /**
   * Get maintenance statistics
   */
  getMaintenanceStats(): MaintenanceStats {
    let totalJobs = 0
    let successfulJobs = 0
    let failedJobs = 0
    let totalDuration = 0
    let lastRun: Date | null = null

    this.jobHistory.forEach(history => {
      history.forEach(result => {
        totalJobs++
        totalDuration += result.duration

        if (result.success) {
          successfulJobs++
        } else {
          failedJobs++
        }

        if (!lastRun || result.timestamp > lastRun) {
          lastRun = result.timestamp
        }
      })
    })

    // Calculate system load based on recent job performance
    const recentJobs = Array.from(this.jobHistory.values())
      .flat()
      .filter(result => result.timestamp > new Date(Date.now() - 300000)) // Last 5 minutes
    
    const systemLoad = recentJobs.length > 0 
      ? recentJobs.reduce((sum, result) => sum + result.duration, 0) / recentJobs.length / 1000
      : 0

    return {
      totalJobs,
      successfulJobs,
      failedJobs,
      averageDuration: totalJobs > 0 ? totalDuration / totalJobs : 0,
      lastRun,
      systemLoad
    }
  }

  /**
   * Get job history for specific job
   */
  getJobHistory(jobKey: string): JobResult[] {
    return this.jobHistory.get(jobKey)?.slice() || []
  }

  /**
   * Check if maintenance is running
   */
  isMaintenanceRunning(): boolean {
    return this.isRunning
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Force run a specific job manually
   */
  async runJobManually(jobKey: string): Promise<JobResult> {
    const config = this.jobConfigs[jobKey]
    if (!config) {
      throw new Error(`Job not found: ${jobKey}`)
    }

    console.log(`🔄 Running job manually: ${config.name}`)
    
    try {
      await this.runJob(jobKey, config)
      const history = this.jobHistory.get(jobKey) || []
      return history[history.length - 1] || {
        success: false,
        duration: 0,
        error: 'No result recorded',
        processed: 0,
        timestamp: new Date()
      }
    } catch (error) {
      throw new Error(`Manual job execution failed: ${error}`)
    }
  }
}

// Singleton instance
const maintenanceManager = new KDSMaintenanceManager()

// Auto-start maintenance in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Start maintenance after a delay to allow app initialization
  setTimeout(() => {
    maintenanceManager.startMaintenance().catch(error => {
      console.error('Failed to start maintenance:', error)
    })
  }, 10000)
}

export { KDSMaintenanceManager, maintenanceManager }
export type { JobConfig, JobResult, MaintenanceStats }