#!/usr/bin/env tsx
/**
 * Performance Analysis Script for KDS Queries
 * Analyzes current query performance and identifies optimization opportunities
 */

import { createClient } from '@/lib/modassembly/supabase/client'

interface QueryAnalysis {
  queryName: string
  executionTime: number
  planningTime: number
  totalRows: number
  bufferHits: number
  bufferMisses: number
  indexUsage: string[]
  seqScans: string[]
  recommendations: string[]
}

interface PerformanceResults {
  timestamp: string
  totalQueries: number
  averageResponseTime: number
  slowQueries: QueryAnalysis[]
  recommendations: string[]
}

class KDSPerformanceAnalyzer {
  private supabase = createClient()

  async analyzeQuery(query: string, params: any[] = []): Promise<QueryAnalysis> {
    const startTime = performance.now()
    
    try {
      // Get execution plan
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`
      const { data: planData, error: planError } = await this.supabase.rpc('execute_sql', {
        query: explainQuery,
        params
      })

      if (planError) {
        console.error('Error analyzing query:', planError)
        throw planError
      }

      const executionTime = performance.now() - startTime
      const plan = planData?.[0]?.['QUERY PLAN']?.[0] || {}

      return {
        queryName: this.extractQueryName(query),
        executionTime,
        planningTime: plan['Planning Time'] || 0,
        totalRows: plan['Plan']?.['Actual Rows'] || 0,
        bufferHits: this.extractBufferStats(plan, 'hit'),
        bufferMisses: this.extractBufferStats(plan, 'miss'),
        indexUsage: this.extractIndexUsage(plan),
        seqScans: this.extractSequentialScans(plan),
        recommendations: this.generateRecommendations(plan, executionTime)
      }
    } catch (_error) {
      console.error('Query analysis failed:', _error)
      return {
        queryName: this.extractQueryName(query),
        executionTime: performance.now() - startTime,
        planningTime: 0,
        totalRows: 0,
        bufferHits: 0,
        bufferMisses: 0,
        indexUsage: [],
        seqScans: [],
        recommendations: ['Query analysis failed - check query syntax']
      }
    }
  }

  async analyzeKDSQueries(): Promise<PerformanceResults> {
    console.log('🔍 Analyzing KDS Query Performance...')
    const startTime = Date.now()
    const analyses: QueryAnalysis[] = []

    // Core KDS queries to analyze
    const testQueries = [
      {
        name: 'fetch_active_orders',
        query: `
          SELECT kor.*, 
                 o.id, o.items, o.status, o.type, o.created_at, o.transcript, o.seat_id,
                 t.id as table_id, t.label as table_label,
                 s.id as seat_id_full, s.label as seat_label,
                 ks.id as station_id_full, ks.name as station_name, ks.type as station_type, ks.color as station_color
          FROM kds_order_routing kor
          INNER JOIN orders o ON kor.order_id = o.id
          LEFT JOIN tables t ON o.table_id = t.id
          LEFT JOIN seats s ON o.seat_id = s.id
          INNER JOIN kds_stations ks ON kor.station_id = ks.id
          WHERE kor.completed_at IS NULL
          ORDER BY kor.routed_at ASC
          LIMIT 100
        `
      },
      {
        name: 'fetch_station_orders',
        query: `
          SELECT kor.*, 
                 o.id, o.items, o.status, o.type, o.created_at, o.transcript, o.seat_id,
                 t.id as table_id, t.label as table_label,
                 s.id as seat_id_full, s.label as seat_label,
                 ks.id as station_id_full, ks.name as station_name, ks.type as station_type, ks.color as station_color
          FROM kds_order_routing kor
          INNER JOIN orders o ON kor.order_id = o.id
          LEFT JOIN tables t ON o.table_id = t.id
          LEFT JOIN seats s ON o.seat_id = s.id
          INNER JOIN kds_stations ks ON kor.station_id = ks.id
          WHERE kor.station_id = $1 AND kor.completed_at IS NULL
          ORDER BY kor.routed_at ASC
          LIMIT 50
        `,
        params: ['dummy-station-id']
      },
      {
        name: 'fetch_kds_stations',
        query: `
          SELECT * FROM kds_stations 
          WHERE is_active = true 
          ORDER BY position ASC
        `
      },
      {
        name: 'table_grouped_orders',
        query: `
          SELECT o.table_id, t.label as table_label,
                 COUNT(*) as order_count,
                 MIN(o.created_at) as earliest_order,
                 MAX(o.created_at) as latest_order,
                 array_agg(DISTINCT kor.station_id) as stations
          FROM orders o
          INNER JOIN kds_order_routing kor ON o.id = kor.order_id
          LEFT JOIN tables t ON o.table_id = t.id
          WHERE kor.completed_at IS NULL
          GROUP BY o.table_id, t.label
          ORDER BY earliest_order ASC
        `
      }
    ]

    for (const testQuery of testQueries) {
      try {
        console.log(`Analyzing: ${testQuery.name}`)
        const analysis = await this.analyzeQuery(testQuery.query, testQuery.params || [])
        analyses.push(analysis)
      } catch (_error) {
        console.error(`Failed to analyze ${testQuery.name}:`, _error)
      }
    }

    // Analyze database statistics
    await this.analyzeDatabaseStats()

    const totalTime = Date.now() - startTime
    const averageResponseTime = analyses.reduce((sum, a) => sum + a.executionTime, 0) / analyses.length

    return {
      timestamp: new Date().toISOString(),
      totalQueries: analyses.length,
      averageResponseTime,
      slowQueries: analyses.filter(a => a.executionTime > 50), // >50ms queries
      recommendations: this.generateGlobalRecommendations(analyses)
    }
  }

  private async analyzeDatabaseStats(): Promise<void> {
    try {
      // Get table statistics
      const { data: tableStats } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            seq_scan,
            seq_tup_read,
            idx_scan,
            idx_tup_fetch,
            n_tup_ins,
            n_tup_upd,
            n_tup_del
          FROM pg_stat_user_tables 
          WHERE tablename IN ('orders', 'kds_order_routing', 'kds_stations', 'tables', 'seats')
        `
      })

      console.log('📊 Database Table Statistics:')
      tableStats?.forEach((stat: any) => {
        const seqScanRatio = stat.seq_scan / (stat.seq_scan + (stat.idx_scan || 1))
        console.log(`  ${stat.tablename}:`)
        console.log(`    Sequential scans: ${stat.seq_scan} (${(seqScanRatio * 100).toFixed(1)}%)`)
        console.log(`    Index scans: ${stat.idx_scan || 0}`)
        console.log(`    Rows: ${stat.n_tup_ins} inserted, ${stat.n_tup_upd} updated, ${stat.n_tup_del} deleted`)
      })

      // Get index usage statistics
      const { data: indexStats } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
          FROM pg_stat_user_indexes 
          WHERE tablename IN ('orders', 'kds_order_routing', 'kds_stations', 'tables', 'seats')
          ORDER BY idx_scan DESC
        `
      })

      console.log('🗂️  Index Usage Statistics:')
      indexStats?.forEach((stat: any) => {
        console.log(`  ${stat.tablename}.${stat.indexname}: ${stat.idx_scan} scans`)
      })

    } catch (_error) {
      console.error('Failed to analyze database statistics:', _error)
    }
  }

  private extractQueryName(query: string): string {
    const lines = query.trim().split('\n')
    const firstLine = lines.find(line => line.trim().length > 0) || query
    return firstLine.trim().substring(0, 50) + '...'
  }

  private extractBufferStats(plan: any, type: 'hit' | 'miss'): number {
    // Recursively search for buffer statistics in query plan
    if (!plan) return 0
    
    let total = 0
    const key = type === 'hit' ? 'Shared Hit Blocks' : 'Shared Read Blocks'
    
    if (plan[key]) total += plan[key]
    if (plan.Plans) {
      plan.Plans.forEach((subPlan: any) => {
        total += this.extractBufferStats(subPlan, type)
      })
    }
    
    return total
  }

  private extractIndexUsage(plan: any): string[] {
    const indexes: string[] = []
    
    if (plan['Index Name']) {
      indexes.push(plan['Index Name'])
    }
    
    if (plan.Plans) {
      plan.Plans.forEach((subPlan: any) => {
        indexes.push(...this.extractIndexUsage(subPlan))
      })
    }
    
    return [...new Set(indexes)]
  }

  private extractSequentialScans(plan: any): string[] {
    const seqScans: string[] = []
    
    if (plan['Node Type'] === 'Seq Scan' && plan['Relation Name']) {
      seqScans.push(plan['Relation Name'])
    }
    
    if (plan.Plans) {
      plan.Plans.forEach((subPlan: any) => {
        seqScans.push(...this.extractSequentialScans(subPlan))
      })
    }
    
    return [...new Set(seqScans)]
  }

  private generateRecommendations(plan: any, executionTime: number): string[] {
    const recommendations: string[] = []
    
    if (executionTime > 50) {
      recommendations.push('Query execution time >50ms - consider optimization')
    }
    
    if (plan['Planning Time'] > 10) {
      recommendations.push('High planning time - consider prepared statements')
    }
    
    const seqScans = this.extractSequentialScans(plan)
    if (seqScans.length > 0) {
      recommendations.push(`Sequential scans detected on: ${seqScans.join(', ')} - add indexes`)
    }
    
    return recommendations
  }

  private generateGlobalRecommendations(analyses: QueryAnalysis[]): string[] {
    const recommendations: string[] = []
    
    const slowQueries = analyses.filter(a => a.executionTime > 50)
    if (slowQueries.length > 0) {
      recommendations.push(`${slowQueries.length} queries exceed 50ms target`)
    }
    
    const allSeqScans = analyses.flatMap(a => a.seqScans)
    const uniqueSeqScans = [...new Set(allSeqScans)]
    if (uniqueSeqScans.length > 0) {
      recommendations.push(`Add indexes for tables: ${uniqueSeqScans.join(', ')}`)
    }
    
    const avgExecutionTime = analyses.reduce((sum, a) => sum + a.executionTime, 0) / analyses.length
    if (avgExecutionTime > 25) {
      recommendations.push('Average query time exceeds 25ms - implement caching')
    }
    
    return recommendations
  }
}

// Main execution
async function main() {
  const analyzer = new KDSPerformanceAnalyzer()
  
  try {
    const results = await analyzer.analyzeKDSQueries()
    
    console.log('\n📈 KDS Performance Analysis Results')
    console.log('=====================================')
    console.log(`Timestamp: ${results.timestamp}`)
    console.log(`Total queries analyzed: ${results.totalQueries}`)
    console.log(`Average response time: ${results.averageResponseTime.toFixed(2)}ms`)
    console.log(`Slow queries (>50ms): ${results.slowQueries.length}`)
    
    if (results.slowQueries.length > 0) {
      console.log('\n🐌 Slow Queries:')
      results.slowQueries.forEach(query => {
        console.log(`  ${query.queryName}`)
        console.log(`    Execution time: ${query.executionTime.toFixed(2)}ms`)
        console.log(`    Planning time: ${query.planningTime.toFixed(2)}ms`)
        console.log(`    Sequential scans: ${query.seqScans.join(', ') || 'None'}`)
        console.log(`    Recommendations: ${query.recommendations.join(', ')}`)
      })
    }
    
    if (results.recommendations.length > 0) {
      console.log('\n💡 Global Recommendations:')
      results.recommendations.forEach(rec => {
        console.log(`  • ${rec}`)
      })
    }
    
    // Write results to file for further analysis
    const fs = require('fs')
    const path = require('path')
    const outputPath = path.join(process.cwd(), 'performance-analysis-results.json')
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`\n📄 Results saved to: ${outputPath}`)
    
  } catch (_error) {
    console.error('Performance analysis failed:', _error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { KDSPerformanceAnalyzer, type PerformanceResults, type QueryAnalysis }