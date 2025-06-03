#!/usr/bin/env tsx

/**
 * Comprehensive Performance and Database Health Test
 * Tests database connectivity, query performance, real-time subscriptions, and system health
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { performance } from 'perf_hooks'

// Environment setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Create admin client for testing
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface TestResult {
  name: string
  duration: number
  success: boolean
  error?: string
  metadata?: any
}

class PerformanceTester {
  private results: TestResult[] = []

  async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    console.log(`🧪 Running: ${name}`)
    const start = performance.now()
    
    try {
      const result = await testFn()
      const duration = performance.now() - start
      
      const testResult: TestResult = {
        name,
        duration,
        success: true,
        metadata: result
      }
      
      this.results.push(testResult)
      console.log(`✅ ${name} - ${duration.toFixed(2)}ms`)
      return testResult
      
    } catch (error) {
      const duration = performance.now() - start
      const testResult: TestResult = {
        name,
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
      
      this.results.push(testResult)
      console.log(`❌ ${name} - ${duration.toFixed(2)}ms - ${testResult.error}`)
      return testResult
    }
  }

  getResults(): TestResult[] {
    return this.results
  }

  printSummary() {
    const successful = this.results.filter(r => r.success)
    const failed = this.results.filter(r => !r.success)
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)
    
    console.log('\n📊 PERFORMANCE TEST SUMMARY')
    console.log('================================')
    console.log(`Total Tests: ${this.results.length}`)
    console.log(`Successful: ${successful.length}`)
    console.log(`Failed: ${failed.length}`)
    console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`)
    console.log(`Average Duration: ${(totalDuration / this.results.length).toFixed(2)}ms`)
    
    if (failed.length > 0) {
      console.log('\n❌ FAILED TESTS:')
      failed.forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`)
      })
    }
    
    console.log('\n⚡ PERFORMANCE METRICS:')
    successful.forEach(test => {
      const status = test.duration < 100 ? '🟢' : test.duration < 500 ? '🟡' : '🔴'
      console.log(`  ${status} ${test.name}: ${test.duration.toFixed(2)}ms`)
    })
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive Performance Test')
  console.log('==========================================\n')
  
  const tester = new PerformanceTester()

  // 1. Database Connection Tests
  await tester.runTest('Database Connection', async () => {
    const { data, error } = await supabase.from('profiles').select('count').limit(1).single()
    if (error) throw error
    return { connected: true }
  })

  // 2. Core Tables Accessibility Tests
  const coreTables = ['profiles', 'tables', 'seats', 'orders']
  
  for (const table of coreTables) {
    await tester.runTest(`Table Access: ${table}`, async () => {
      const { data, error, count } = await supabase
        .from(table as any)
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      return { table, recordCount: count }
    })
  }

  // 3. KDS Stations Table Test
  await tester.runTest('KDS Stations Table Access', async () => {
    const { data, error, count } = await supabase
      .from('kds_stations')
      .select('*', { count: 'exact' })
    
    if (error) throw error
    return { recordCount: count, stations: data?.length || 0 }
  })

  // 4. Complex Query Performance Tests
  await tester.runTest('Complex Join Query Performance', async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        resident:profiles!orders_resident_id_fkey(id, role),
        server:profiles!orders_server_id_fkey(id, role),
        table:tables!orders_table_id_fkey(id, table_id, label),
        seat:seats!orders_seat_id_fkey(id, seat_id)
      `)
      .limit(10)
    
    if (error) throw error
    return { orderCount: data?.length || 0 }
  })

  // 5. Pagination Performance Test
  await tester.runTest('Pagination Performance', async () => {
    const pageSize = 20
    const { data, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, pageSize - 1)
    
    if (error) throw error
    return { pageSize, totalRecords: count, returnedRecords: data?.length || 0 }
  })

  // 6. Real-time Subscription Test
  await tester.runTest('Real-time Subscription Setup', async () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Subscription timeout'))
      }, 5000)

      const channel = supabase
        .channel('test-orders')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            clearTimeout(timeout)
            resolve({ subscribed: true, payload })
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            resolve({ subscribed: true, status })
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeout)
            reject(new Error(`Subscription error: ${status}`))
          }
        })

      // Clean up after test
      setTimeout(() => {
        supabase.removeChannel(channel)
      }, 1000)
    })
  })

  // 7. Concurrent Operations Test
  await tester.runTest('Concurrent Database Operations', async () => {
    const concurrentQueries = [
      supabase.from('profiles').select('id').limit(5),
      supabase.from('tables').select('id').limit(5),
      supabase.from('seats').select('id').limit(5),
      supabase.from('orders').select('id').limit(5),
      supabase.from('kds_stations').select('id').limit(5)
    ]
    
    const results = await Promise.allSettled(concurrentQueries)
    const successful = results.filter(r => r.status === 'fulfilled').length
    
    if (successful !== concurrentQueries.length) {
      throw new Error(`Only ${successful}/${concurrentQueries.length} concurrent queries succeeded`)
    }
    
    return { concurrentQueries: concurrentQueries.length, successful }
  })

  // 8. Database Index Performance Test
  await tester.runTest('Index Performance: Order Status', async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    return { recordsFound: data?.length || 0 }
  })

  // 9. Authentication Performance Test
  await tester.runTest('Auth Session Validation', async () => {
    // Test with a mock JWT validation
    const { data, error } = await supabase.auth.getSession()
    
    // We expect no session in server context, but no error
    return { hasSession: !!data.session, error: error?.message }
  })

  // 10. Memory Usage Check
  await tester.runTest('Memory Usage Check', async () => {
    const memBefore = process.memoryUsage()
    
    // Perform memory-intensive operation
    const largeQuery = await supabase
      .from('orders')
      .select('*')
      .limit(100)
    
    const memAfter = process.memoryUsage()
    
    return {
      heapUsedBefore: Math.round(memBefore.heapUsed / 1024 / 1024),
      heapUsedAfter: Math.round(memAfter.heapUsed / 1024 / 1024),
      heapDelta: Math.round((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024),
      recordsProcessed: largeQuery.data?.length || 0
    }
  })

  // Print comprehensive summary
  tester.printSummary()
  
  // Generate detailed report
  console.log('\n📋 DETAILED PERFORMANCE REPORT')
  console.log('===============================')
  
  const results = tester.getResults()
  const dbTests = results.filter(r => r.name.includes('Table Access') || r.name.includes('Database'))
  const perfTests = results.filter(r => r.name.includes('Performance') || r.name.includes('Concurrent'))
  const rtTests = results.filter(r => r.name.includes('Real-time'))
  
  console.log(`\n🗄️  Database Health: ${dbTests.filter(t => t.success).length}/${dbTests.length} tests passed`)
  console.log(`⚡ Performance: ${perfTests.filter(t => t.success).length}/${perfTests.length} tests passed`)
  console.log(`🔄 Real-time: ${rtTests.filter(t => t.success).length}/${rtTests.length} tests passed`)
  
  // Check for critical issues
  const criticalIssues = results.filter(r => !r.success && r.duration > 1000)
  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL PERFORMANCE ISSUES:')
    criticalIssues.forEach(issue => {
      console.log(`  - ${issue.name}: ${issue.error} (${issue.duration.toFixed(2)}ms)`)
    })
  }
  
  const slowTests = results.filter(r => r.success && r.duration > 500)
  if (slowTests.length > 0) {
    console.log('\n⚠️  SLOW OPERATIONS (>500ms):')
    slowTests.forEach(test => {
      console.log(`  - ${test.name}: ${test.duration.toFixed(2)}ms`)
    })
  }
  
  console.log('\n✅ Performance test completed!')
  
  // Exit with appropriate code
  const hasFailures = results.some(r => !r.success)
  process.exit(hasFailures ? 1 : 0)
}

// Run the tests
main().catch(error => {
  console.error('❌ Performance test failed:', error)
  process.exit(1)
})