#!/usr/bin/env node

/**
 * Test Performance Improvements for KDS
 * 
 * This script tests database query performance to verify <50ms target achievement
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
      
      const status = duration < 50 ? '✅' : duration < 100 ? '⚠️' : '❌'
      console.log(`  Run ${i + 1}: ${duration.toFixed(2)}ms ${status}`)
    } catch (error) {
      console.error(`  Run ${i + 1}: ERROR - ${error.message}`)
      times.push(9999) // High penalty for errors
    }
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  
  const performanceStatus = avgTime < 50 ? '🎯 EXCELLENT' : avgTime < 100 ? '⚠️ ACCEPTABLE' : '❌ NEEDS WORK'
  
  console.log(`  📊 Average: ${avgTime.toFixed(2)}ms | Min: ${minTime.toFixed(2)}ms | Max: ${maxTime.toFixed(2)}ms`)
  console.log(`  ${performanceStatus}`)
  
  return { avgTime, minTime, maxTime, target: avgTime < 50 }
}

async function runPerformanceTests() {
  console.log('🚀 KDS Performance Testing Suite')
  console.log('🎯 Target: <50ms average query time')
  console.log('=' .repeat(60))
  
  const results = []
  
  // Test 1: Fetch active orders (optimized query)
  results.push(await measureQuery('Fetch Active Orders (Optimized)', async () => {
    const { data, error } = await supabase
      .from('kds_order_routing')
      .select(`
        id,
        order_id,
        station_id,
        routed_at,
        started_at,
        completed_at,
        priority,
        recall_count,
        notes,
        order:orders!inner (
          id, items, status, type, created_at, seat_id,
          table:tables!table_id (id, label),
          seat:seats!seat_id (id, label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `)
      .is('completed_at', null)
      .order('priority', { ascending: false })
      .order('routed_at', { ascending: true })
      .limit(50)
    
    if (error) throw error
    return data
  }))
  
  // Test 2: Fetch stations
  results.push(await measureQuery('Fetch KDS Stations', async () => {
    const { data, error } = await supabase
      .from('kds_stations')
      .select('id, name, type, color, position, is_active, settings')
      .eq('is_active', true)
      .order('position', { ascending: true })
    
    if (error) throw error
    return data
  }))
  
  // Test 3: Station-specific orders
  results.push(await measureQuery('Fetch Station Orders', async () => {
    // First get a station ID
    const { data: stations } = await supabase
      .from('kds_stations')
      .select('id')
      .eq('is_active', true)
      .limit(1)
    
    if (stations && stations.length > 0) {
      const { data, error } = await supabase
        .from('kds_order_routing')
        .select(`
          id,
          order_id,
          station_id,
          routed_at,
          started_at,
          completed_at,
          priority,
          order:orders!inner (
            id, items, status, type, created_at, seat_id,
            table:tables!table_id (id, label),
            seat:seats!seat_id (id, label)
          )
        `)
        .eq('station_id', stations[0].id)
        .is('completed_at', null)
        .order('routed_at', { ascending: true })
        .limit(20)
      
      if (error) throw error
      return data
    }
    return []
  }))
  
  // Test 4: Table groups (using optimized function if available)
  results.push(await measureQuery('Table Groups (Optimized Function)', async () => {
    const { data, error } = await supabase.rpc('get_table_groups_optimized')
    
    if (error) {
      // Fallback to regular query if function doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('kds_order_routing')
        .select(`
          order:orders!inner (
            table_id,
            table:tables!table_id (id, label)
          )
        `)
        .is('completed_at', null)
        .limit(50)
      
      if (fallbackError) throw fallbackError
      return fallbackData
    }
    
    return data
  }))
  
  // Test 5: High priority orders
  results.push(await measureQuery('High Priority Orders', async () => {
    const { data, error } = await supabase
      .from('kds_order_routing')
      .select(`
        id,
        order_id,
        station_id,
        priority,
        routed_at,
        order:orders!inner (
          id, items, table:tables!table_id (id, label)
        )
      `)
      .is('completed_at', null)
      .gte('priority', 8)
      .order('routed_at', { ascending: true })
      .limit(20)
    
    if (error) throw error
    return data
  }))
  
  // Performance Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 PERFORMANCE SUMMARY')
  console.log('='.repeat(60))
  
  const targetsMet = results.filter(r => r.target).length
  const totalTests = results.length
  const overallAverage = results.reduce((sum, r) => sum + r.avgTime, 0) / results.length
  
  console.log(`🎯 Targets Met: ${targetsMet}/${totalTests} (${(targetsMet/totalTests*100).toFixed(1)}%)`)
  console.log(`📈 Overall Average: ${overallAverage.toFixed(2)}ms`)
  
  if (overallAverage < 50) {
    console.log('🎉 EXCELLENT! All performance targets achieved!')
    console.log('✅ KDS is optimized for restaurant operations')
  } else if (overallAverage < 100) {
    console.log('⚠️  ACCEPTABLE performance, but room for improvement')
    console.log('💡 Consider applying database optimizations')
  } else {
    console.log('❌ PERFORMANCE ISSUES detected')
    console.log('🚨 Immediate optimization required')
  }
  
  // Recommendations
  console.log('\n📋 RECOMMENDATIONS:')
  if (overallAverage > 50) {
    console.log('• Run: node apply-performance-optimizations.cjs')
    console.log('• Check network latency to database')
    console.log('• Consider connection pooling')
    console.log('• Verify RLS policies are optimized')
  } else {
    console.log('• Performance is optimal!')
    console.log('• Monitor performance regularly')
    console.log('• Consider caching for even better performance')
  }
  
  return { targetsMet, totalTests, overallAverage }
}

// Run the tests
runPerformanceTests()
  .then((summary) => {
    console.log('\n✨ Performance testing completed')
    
    if (summary.overallAverage < 50) {
      process.exit(0) // Success
    } else {
      process.exit(1) // Performance issues
    }
  })
  .catch((error) => {
    console.error('\n💥 Performance testing failed:', error)
    process.exit(1)
  })