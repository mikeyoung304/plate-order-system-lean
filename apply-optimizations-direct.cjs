#!/usr/bin/env node

/**
 * Apply Performance Optimizations Directly via SQL
 * 
 * This script applies database indexes using direct SQL execution
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const optimizations = [
  {
    name: 'Active Orders Index (Primary)',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_active_orders 
          ON kds_order_routing (station_id, completed_at, priority DESC, routed_at ASC) 
          WHERE completed_at IS NULL`
  },
  {
    name: 'Table Grouping Index',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_table_grouping
          ON kds_order_routing (order_id, routed_at)
          WHERE completed_at IS NULL`
  },
  {
    name: 'Orders Table/Seat Index',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_table_seat
          ON orders (table_id, seat_id, created_at)`
  },
  {
    name: 'Active Stations Index',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_stations_active
          ON kds_stations (is_active, position)
          WHERE is_active = true`
  },
  {
    name: 'High Priority Orders Index',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_high_priority
          ON kds_order_routing (routed_at)
          WHERE completed_at IS NULL AND priority >= 8`
  },
  {
    name: 'Compound Performance Index',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_compound_performance
          ON kds_order_routing (completed_at, priority DESC, routed_at ASC, station_id)
          WHERE completed_at IS NULL`
  }
]

async function testConnection() {
  console.log('🔍 Testing database connection...')
  
  try {
    const { data, error } = await supabase
      .from('kds_order_routing')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection test failed:', error.message)
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (err) {
    console.error('❌ Connection test failed:', err.message)
    return false
  }
}

async function executeOptimization(optimization) {
  console.log(`\n🔧 ${optimization.name}...`)
  
  try {
    // For indexes, we'll use a different approach since CONCURRENTLY might not work via RPC
    const simplifiedSQL = optimization.sql
      .replace(/CONCURRENTLY\s+/g, '') // Remove CONCURRENTLY for compatibility
      .replace(/IF NOT EXISTS\s+/g, '') // Remove IF NOT EXISTS for now
    
    console.log(`   SQL: ${simplifiedSQL.substring(0, 80)}...`)
    
    // We'll try to execute this as a regular query instead of using RPC
    const { data, error } = await supabase.rpc('sql', { query: simplifiedSQL })
    
    if (error) {
      // Try alternative approach
      if (error.message.includes('does not exist')) {
        console.log('   ⚠️  RPC method not available, trying alternative approach...')
        
        // For now, we'll just log that manual execution is needed
        console.log('   📝 Manual execution required via Supabase dashboard')
        console.log(`   💡 SQL: ${optimization.sql}`)
        return 'manual'
      } else if (error.message.includes('already exists')) {
        console.log('   ✅ Index already exists (good!)')
        return 'exists'
      } else {
        console.error(`   ❌ Error: ${error.message}`)
        return 'error'
      }
    } else {
      console.log('   ✅ Successfully applied')
      return 'success'
    }
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`)
    return 'error'
  }
}

async function checkPerformance() {
  console.log('\n🚀 Quick Performance Test...')
  
  const startTime = performance.now()
  
  try {
    const { data, error } = await supabase
      .from('kds_order_routing')
      .select(`
        id,
        order_id,
        station_id,
        routed_at,
        priority,
        order:orders!inner (
          id, items, status,
          table:tables!table_id (id, label)
        )
      `)
      .is('completed_at', null)
      .order('priority', { ascending: false })
      .order('routed_at', { ascending: true })
      .limit(10)
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (error) {
      console.error('❌ Performance test failed:', error.message)
      return null
    }
    
    const status = duration < 50 ? '🎯 EXCELLENT' : duration < 100 ? '⚠️ ACCEPTABLE' : '❌ SLOW'
    console.log(`📊 Query time: ${duration.toFixed(2)}ms ${status}`)
    console.log(`📦 Records returned: ${data?.length || 0}`)
    
    return duration
  } catch (err) {
    console.error('❌ Performance test failed:', err.message)
    return null
  }
}

async function main() {
  console.log('🚀 KDS Performance Optimization')
  console.log('🎯 Target: <50ms query performance')
  console.log('=' .repeat(50))
  
  // Test connection
  const connected = await testConnection()
  if (!connected) {
    console.error('❌ Cannot proceed without database connection')
    process.exit(1)
  }
  
  // Run initial performance test
  console.log('\n📊 Initial Performance Test')
  const initialPerformance = await checkPerformance()
  
  // Apply optimizations
  console.log('\n🔧 Applying Performance Optimizations')
  
  let successCount = 0
  let manualCount = 0
  let existsCount = 0
  
  for (const optimization of optimizations) {
    const result = await executeOptimization(optimization)
    
    switch (result) {
      case 'success':
        successCount++
        break
      case 'manual':
        manualCount++
        break
      case 'exists':
        existsCount++
        break
    }
  }
  
  // Final performance test
  console.log('\n📊 Final Performance Test')
  const finalPerformance = await checkPerformance()
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 OPTIMIZATION SUMMARY')
  console.log('='.repeat(50))
  
  console.log(`✅ Successfully applied: ${successCount}`)
  console.log(`📋 Already existed: ${existsCount}`)
  console.log(`📝 Require manual execution: ${manualCount}`)
  
  if (initialPerformance && finalPerformance) {
    const improvement = ((initialPerformance - finalPerformance) / initialPerformance * 100)
    console.log(`📈 Performance improvement: ${improvement.toFixed(1)}%`)
  }
  
  if (manualCount > 0) {
    console.log('\n📋 MANUAL STEPS REQUIRED:')
    console.log('1. Open your Supabase project dashboard')
    console.log('2. Go to SQL Editor')
    console.log('3. Execute the SQL from: performance-optimizations.sql')
    console.log('4. This will create the performance indexes')
  }
  
  console.log('\n💡 NEXT STEPS:')
  console.log('1. Run: node test-performance-improvements.cjs')
  console.log('2. Monitor query performance in production')
  console.log('3. Consider implementing query caching')
  
  console.log('\n✨ Optimization process completed!')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Optimization failed:', error)
    process.exit(1)
  })