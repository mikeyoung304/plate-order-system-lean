#!/usr/bin/env node

/**
 * Test Optimized KDS Performance
 * 
 * This script tests the newly implemented performance optimizations
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function measureQuery(description, queryFn) {
  console.log(`\n🔍 Testing: ${description}`)
  
  const times = []
  const iterations = 5
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()
    
    try {
      await queryFn()
      const endTime = performance.now()
      const duration = endTime - startTime
      times.push(duration)
      
      const status = duration < 30 ? '🎯' : duration < 50 ? '✅' : duration < 100 ? '⚠️' : '❌'
      console.log(`  Run ${i + 1}: ${duration.toFixed(2)}ms ${status}`)
    } catch (error) {
      console.error(`  Run ${i + 1}: ERROR - ${error.message}`)
      times.push(9999) // High penalty for errors
    }
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  
  const performanceStatus = avgTime < 30 ? '🚀 ULTRA-FAST' : avgTime < 50 ? '🎯 EXCELLENT' : avgTime < 100 ? '⚠️ ACCEPTABLE' : '❌ NEEDS WORK'
  
  console.log(`  📊 Average: ${avgTime.toFixed(2)}ms | Min: ${minTime.toFixed(2)}ms | Max: ${maxTime.toFixed(2)}ms`)
  console.log(`  ${performanceStatus}`)
  
  return { avgTime, minTime, maxTime, target: avgTime < 50 }
}

async function testOptimizedQueries() {
  console.log('🚀 Testing OPTIMIZED KDS Performance')
  console.log('🎯 New Target: <30ms ultra-fast, <50ms excellent')
  console.log('=' .repeat(60))
  
  const results = []
  
  // Test 1: Ultra-fast active orders query
  results.push(await measureQuery('Ultra-Fast Active Orders (Optimized)', async () => {
    const { data, error } = await supabase
      .from('kds_order_routing')
      .select('id, order_id, station_id, routed_at, priority, started_at, completed_at')
      .is('completed_at', null)
      .order('priority', { ascending: false })
      .order('routed_at', { ascending: true })
      .limit(15) // Aggressive limit for performance
    
    if (error) throw error
    return data
  }))
  
  // Test 2: Blazing fast stations
  results.push(await measureQuery('Blazing Fast Stations', async () => {
    const { data, error } = await supabase
      .from('kds_stations')
      .select('id, name, type, color, is_active')
      .eq('is_active', true)
      .order('position')
    
    if (error) throw error
    return data
  }))
  
  // Test 3: Essential order details only
  results.push(await measureQuery('Essential Order Details', async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, items, table_id, seat_id, created_at')
      .limit(10)
    
    if (error) throw error
    return data
  }))
  
  // Test 4: Table and seat lookup
  results.push(await measureQuery('Table/Seat Lookup', async () => {
    const [tablesResult, seatsResult] = await Promise.all([
      supabase.from('tables').select('id, label').limit(5),
      supabase.from('seats').select('id, label').limit(10)
    ])
    
    if (tablesResult.error) throw tablesResult.error
    if (seatsResult.error) throw seatsResult.error
    
    return { tables: tablesResult.data, seats: seatsResult.data }
  }))
  
  // Test 5: Network latency test
  results.push(await measureQuery('Pure Network Latency', async () => {
    const { error } = await supabase
      .from('kds_stations')
      .select('count', { count: 'exact', head: true })
    
    if (error) throw error
    return {}
  }))
  
  // Performance Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 OPTIMIZED PERFORMANCE SUMMARY')
  console.log('='.repeat(60))
  
  const excellentTargets = results.filter(r => r.avgTime < 50).length
  const ultraFastTargets = results.filter(r => r.avgTime < 30).length
  const totalTests = results.length
  const overallAverage = results.reduce((sum, r) => sum + r.avgTime, 0) / results.length
  
  console.log(`🚀 Ultra-Fast (<30ms): ${ultraFastTargets}/${totalTests} (${(ultraFastTargets/totalTests*100).toFixed(1)}%)`)
  console.log(`🎯 Excellent (<50ms): ${excellentTargets}/${totalTests} (${(excellentTargets/totalTests*100).toFixed(1)}%)`)
  console.log(`📈 Overall Average: ${overallAverage.toFixed(2)}ms`)
  
  if (overallAverage < 30) {
    console.log('🚀 ULTRA-FAST! Exceeding all performance expectations!')
    console.log('✨ KDS is now blazing fast for restaurant operations')
  } else if (overallAverage < 50) {
    console.log('🎯 EXCELLENT! All performance targets achieved!')
    console.log('✅ KDS is optimized for restaurant operations')
  } else if (overallAverage < 100) {
    console.log('⚠️  ACCEPTABLE performance, but more optimization possible')
    console.log('💡 Consider additional database optimizations')
  } else {
    console.log('❌ PERFORMANCE ISSUES still present')
    console.log('🚨 Additional optimization required')
  }
  
  // Improvement analysis
  const baselineAverage = 145.78 // From previous test
  const improvement = ((baselineAverage - overallAverage) / baselineAverage) * 100
  
  console.log('\n📈 PERFORMANCE IMPROVEMENT:')
  console.log(`• Baseline: ${baselineAverage}ms`)
  console.log(`• Optimized: ${overallAverage.toFixed(2)}ms`)
  console.log(`• Improvement: ${improvement.toFixed(1)}% faster`)
  
  if (improvement > 0) {
    console.log(`🚀 ${improvement > 50 ? 'MASSIVE' : improvement > 25 ? 'SIGNIFICANT' : 'MODERATE'} performance boost achieved!`)
  }
  
  // Recommendations
  console.log('\n📋 NEXT OPTIMIZATION STEPS:')
  if (overallAverage > 30) {
    console.log('• Implement connection pooling')
    console.log('• Add database indexes')
    console.log('• Consider read replicas')
    console.log('• Optimize RLS policies')
  } else {
    console.log('• Performance is now optimal!')
    console.log('• Monitor for regression')
    console.log('• Consider real-time optimizations')
  }
  
  return { excellentTargets, totalTests, overallAverage, improvement }
}

// Run the optimized tests
testOptimizedQueries()
  .then((summary) => {
    console.log('\n✨ Optimized performance testing completed')
    
    if (summary.overallAverage < 50) {
      console.log('🎉 SUCCESS: Performance targets achieved!')
      process.exit(0) // Success
    } else {
      console.log('⚠️  Performance improved but more work needed')
      process.exit(1) // Needs more optimization
    }
  })
  .catch((error) => {
    console.error('\n💥 Optimized performance testing failed:', error)
    process.exit(1)
  })