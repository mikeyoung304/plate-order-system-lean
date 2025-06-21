#!/usr/bin/env tsx
/**
 * Apply KDS Database Optimizations
 * Executes the SQL optimization script and validates performance improvements
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import { readFileSync } from 'fs'
import { join } from 'path'

class DatabaseOptimizer {
  private supabase = createClient()

  async applyOptimizations(): Promise<void> {
    console.log('🔧 Applying KDS Database Optimizations...')
    
    try {
      // Read the optimization SQL script
      const sqlScript = readFileSync(
        join(process.cwd(), 'scripts/optimize-kds-database.sql'),
        'utf-8'
      )

      // Split into individual statements (basic approach)
      const statements = sqlScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      let successCount = 0
      let errorCount = 0

      for (const statement of statements) {
        try {
          // Skip comments and empty statements
          if (statement.startsWith('/*') || statement.startsWith('--') || statement.length < 10) {
            continue
          }

          console.log(`Executing: ${statement.substring(0, 50)}...`)
          
          const { error } = await this.supabase.rpc('execute_sql', {
            query: statement
          })

          if (error) {
            console.error(`❌ Error executing statement: ${error.message}`)
            errorCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`❌ Failed to execute statement:`, err)
          errorCount++
        }
      }

      console.log(`✅ Optimization complete: ${successCount} successful, ${errorCount} errors`)

    } catch (_error) {
      console.error('❌ Failed to apply optimizations:', _error)
      throw error
    }
  }

  async validateOptimizations(): Promise<{
    indexesCreated: number
    functionsCreated: number
    viewsCreated: number
    performanceImprovement: number
  }> {
    console.log('🔍 Validating optimizations...')

    try {
      // Check indexes
      const { data: indexes } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT indexname 
          FROM pg_indexes 
          WHERE indexname LIKE 'idx_kds_%'
        `
      })

      // Check functions
      const { data: functions } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT proname 
          FROM pg_proc 
          WHERE proname LIKE '%kds%' OR proname LIKE '%station%'
        `
      })

      // Check materialized views
      const { data: views } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT matviewname 
          FROM pg_matviews 
          WHERE matviewname LIKE 'kds_%'
        `
      })

      // Run a test query to measure performance
      const startTime = performance.now()
      await this.supabase
        .from('kds_order_routing')
        .select(`
          *,
          order:orders!inner (
            id, items, status, type, created_at, transcript, seat_id,
            table:tables!table_id (id, label),
            seat:seats!seat_id (id, label)
          ),
          station:kds_stations!station_id (id, name, type, color)
        `)
        .is('completed_at', null)
        .order('routed_at', { ascending: true })
        .limit(50)
      
      const queryTime = performance.now() - startTime

      return {
        indexesCreated: indexes?.length || 0,
        functionsCreated: functions?.length || 0,
        viewsCreated: views?.length || 0,
        performanceImprovement: queryTime
      }

    } catch (_error) {
      console.error('❌ Validation failed:', _error)
      throw error
    }
  }

  async benchmarkQueries(): Promise<{
    avgQueryTime: number
    slowQueries: number
    fastQueries: number
  }> {
    console.log('📊 Benchmarking query performance...')

    const queryTimes: number[] = []
    const testQueries = [
      // Test 1: Get all active orders
      async () => {
        const start = performance.now()
        await this.supabase
          .from('kds_order_routing')
          .select('*, order:orders!inner(id, items, status)')
          .is('completed_at', null)
          .limit(100)
        return performance.now() - start
      },

      // Test 2: Get station orders
      async () => {
        const start = performance.now()
        await this.supabase
          .from('kds_order_routing')
          .select('*, order:orders!inner(id, items), station:kds_stations!inner(name)')
          .is('completed_at', null)
          .limit(50)
        return performance.now() - start
      },

      // Test 3: Get active stations
      async () => {
        const start = performance.now()
        await this.supabase
          .from('kds_stations')
          .select('*')
          .eq('is_active', true)
          .order('position')
        return performance.now() - start
      }
    ]

    // Run each test multiple times
    for (const testQuery of testQueries) {
      for (let i = 0; i < 5; i++) {
        try {
          const time = await testQuery()
          queryTimes.push(time)
        } catch (_error) {
          console.error('Query benchmark failed:', _error)
          queryTimes.push(999) // Mark as slow
        }
      }
    }

    const avgQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length
    const slowQueries = queryTimes.filter(time => time > 50).length
    const fastQueries = queryTimes.filter(time => time <= 25).length

    return {
      avgQueryTime,
      slowQueries,
      fastQueries
    }
  }

  async generatePerformanceReport(): Promise<void> {
    console.log('📈 Generating performance report...')

    try {
      // Get database statistics
      const { data: stats } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT 
            tablename,
            seq_scan,
            seq_tup_read,
            idx_scan,
            idx_tup_fetch,
            CASE 
              WHEN (seq_scan + COALESCE(idx_scan, 0)) > 0 
              THEN ROUND((seq_scan::NUMERIC / (seq_scan + COALESCE(idx_scan, 0))) * 100, 2)
              ELSE 0 
            END as seq_scan_pct
          FROM pg_stat_user_tables 
          WHERE tablename IN ('kds_order_routing', 'kds_stations', 'orders', 'tables', 'seats')
          ORDER BY seq_scan_pct DESC
        `
      })

      // Get index usage
      const { data: indexUsage } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT 
            tablename,
            indexname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
          FROM pg_stat_user_indexes 
          WHERE tablename IN ('kds_order_routing', 'kds_stations', 'orders', 'tables', 'seats')
            AND idx_scan > 0
          ORDER BY idx_scan DESC
          LIMIT 10
        `
      })

      console.log('\n📊 Database Performance Report')
      console.log('===============================')
      
      if (stats) {
        console.log('\n🗂️  Table Statistics:')
        stats.forEach((table: any) => {
          console.log(`  ${table.tablename}:`)
          console.log(`    Sequential scans: ${table.seq_scan} (${table.seq_scan_pct}%)`)
          console.log(`    Index scans: ${table.idx_scan || 0}`)
          console.log(`    Rows read: ${table.seq_tup_read + (table.idx_tup_fetch || 0)}`)
        })
      }

      if (indexUsage) {
        console.log('\n📈 Top Index Usage:')
        indexUsage.forEach((index: any) => {
          console.log(`  ${index.tablename}.${index.indexname}: ${index.idx_scan} scans`)
        })
      }

      // Run benchmark
      const benchmark = await this.benchmarkQueries()
      console.log('\n⚡ Query Performance:')
      console.log(`  Average query time: ${benchmark.avgQueryTime.toFixed(2)}ms`)
      console.log(`  Fast queries (<25ms): ${benchmark.fastQueries}`)
      console.log(`  Slow queries (>50ms): ${benchmark.slowQueries}`)

      // Performance assessment
      if (benchmark.avgQueryTime < 25) {
        console.log('  ✅ EXCELLENT: Average query time under 25ms target')
      } else if (benchmark.avgQueryTime < 50) {
        console.log('  ⚠️  GOOD: Average query time under 50ms target')
      } else {
        console.log('  ❌ NEEDS IMPROVEMENT: Average query time exceeds 50ms target')
      }

    } catch (_error) {
      console.error('❌ Failed to generate performance report:', _error)
    }
  }
}

// Main execution
async function main() {
  const optimizer = new DatabaseOptimizer()

  try {
    // Apply optimizations
    await optimizer.applyOptimizations()

    // Validate optimizations
    const validation = await optimizer.validateOptimizations()
    console.log('\n✅ Optimization Results:')
    console.log(`  Indexes created: ${validation.indexesCreated}`)
    console.log(`  Functions created: ${validation.functionsCreated}`)
    console.log(`  Views created: ${validation.viewsCreated}`)
    console.log(`  Test query time: ${validation.performanceImprovement.toFixed(2)}ms`)

    // Generate performance report
    await optimizer.generatePerformanceReport()

    console.log('\n🎉 KDS Database optimization complete!')

  } catch (_error) {
    console.error('❌ Optimization failed:', _error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { DatabaseOptimizer }