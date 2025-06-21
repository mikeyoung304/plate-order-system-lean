#!/usr/bin/env node

/**
 * KDS Performance Diagnosis Tool
 * 
 * This script analyzes the root causes of slow database performance (325ms-1591ms vs target <50ms)
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

async function diagnosePerformanceIssues() {
  console.log('🔍 KDS Performance Diagnosis')
  console.log('🎯 Target: <50ms | Current: 325ms-1591ms')
  console.log('=' .repeat(60))

  // 1. Check if tables exist and have data
  console.log('\n📊 1. Database Structure Analysis')
  try {
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['kds_order_routing', 'orders', 'tables', 'kds_stations'])
    
    if (tablesError) {
      console.log(`❌ Cannot access schema information: ${tablesError.message}`)
    } else {
      const tableNames = tables.map(t => t.table_name)
      console.log(`✅ Found tables: ${tableNames.join(', ')}`)
    }
  } catch (err) {
    console.log(`⚠️  Schema check failed: ${err.message}`)
  }

  // 2. Check record counts
  console.log('\n📈 2. Record Count Analysis')
  const tablesToCheck = ['kds_order_routing', 'orders', 'tables', 'kds_stations']
  
  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${count} records`)
      }
    } catch (err) {
      console.log(`⚠️  ${table}: Exception - ${err.message}`)
    }
  }

  // 3. Test simple queries with timing
  console.log('\n⏱️  3. Query Performance Analysis')
  
  const queries = [
    {
      name: 'Simple Station Query',
      fn: () => supabase.from('kds_stations').select('id, name').limit(5)
    },
    {
      name: 'Simple Orders Query',
      fn: () => supabase.from('orders').select('id, created_at').limit(5)
    },
    {
      name: 'KDS Routing Basic',
      fn: () => supabase.from('kds_order_routing').select('id, order_id').limit(5)
    },
    {
      name: 'Complex Join Query',
      fn: () => supabase
        .from('kds_order_routing')
        .select(`
          id,
          order:orders!inner (id, items),
          station:kds_stations!station_id (id, name)
        `)
        .limit(2)
    }
  ]

  for (const query of queries) {
    const startTime = performance.now()
    try {
      const { data, error } = await query.fn()
      const duration = performance.now() - startTime
      
      if (error) {
        console.log(`❌ ${query.name}: ${error.message}`)
      } else {
        const status = duration < 50 ? '✅' : duration < 100 ? '⚠️' : '❌'
        console.log(`${status} ${query.name}: ${duration.toFixed(2)}ms (${data?.length || 0} records)`)
      }
    } catch (err) {
      console.log(`💥 ${query.name}: Exception - ${err.message}`)
    }
  }

  // 4. Check RLS policies impact
  console.log('\n🔒 4. RLS Policy Impact Analysis')
  
  // Test with service role vs anon
  const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  
  const testQuery = async (client, clientType) => {
    const startTime = performance.now()
    try {
      const { data, error } = await client
        .from('kds_order_routing')
        .select('id, order_id')
        .limit(10)
      
      const duration = performance.now() - startTime
      
      if (error) {
        console.log(`❌ ${clientType}: ${error.message}`)
      } else {
        console.log(`✅ ${clientType}: ${duration.toFixed(2)}ms (${data?.length || 0} records)`)
      }
    } catch (err) {
      console.log(`💥 ${clientType}: ${err.message}`)
    }
  }

  await testQuery(supabase, 'Service Role')
  await testQuery(anonClient, 'Anonymous')

  // 5. Check for missing indexes
  console.log('\n🗂️  5. Index Analysis')
  try {
    const { data: indexes, error } = await supabase
      .from('pg_indexes')
      .select('indexname, tablename')
      .eq('schemaname', 'public')
      .like('tablename', '%kds%')
    
    if (error) {
      console.log(`❌ Cannot check indexes: ${error.message}`)
    } else {
      console.log(`📋 Found ${indexes.length} KDS-related indexes:`)
      indexes.forEach(idx => {
        console.log(`  • ${idx.indexname} on ${idx.tablename}`)
      })
    }
  } catch (err) {
    console.log(`⚠️  Index check failed: ${err.message}`)
  }

  // 6. Network latency test
  console.log('\n🌐 6. Network Latency Test')
  const latencyTests = []
  
  for (let i = 0; i < 5; i++) {
    const startTime = performance.now()
    try {
      await supabase.from('kds_stations').select('count', { count: 'exact', head: true })
      const latency = performance.now() - startTime
      latencyTests.push(latency)
    } catch (err) {
      latencyTests.push(9999)
    }
  }
  
  const avgLatency = latencyTests.reduce((a, b) => a + b, 0) / latencyTests.length
  const minLatency = Math.min(...latencyTests)
  console.log(`📊 Network latency - Avg: ${avgLatency.toFixed(2)}ms, Min: ${minLatency.toFixed(2)}ms`)

  // 7. Recommendations
  console.log('\n💡 7. Performance Recommendations')
  
  if (avgLatency > 200) {
    console.log('🌐 HIGH NETWORK LATENCY detected')
    console.log('  • Check database region vs application location')
    console.log('  • Consider connection pooling')
    console.log('  • Use read replicas if available')
  }
  
  console.log('🔧 Database Optimizations Needed:')
  console.log('  • CREATE INDEX ON kds_order_routing (completed_at, station_id, routed_at)')
  console.log('  • CREATE INDEX ON kds_order_routing (order_id) WHERE completed_at IS NULL')
  console.log('  • CREATE INDEX ON orders (table_id, seat_id)')
  console.log('  • ANALYZE all tables to update statistics')
  
  console.log('🏗️  Application Optimizations:')
  console.log('  • Implement aggressive caching (5-second TTL)')
  console.log('  • Use connection pooling')
  console.log('  • Reduce payload size (select only needed fields)')
  console.log('  • Consider database-level aggregation functions')
  
  console.log('🔒 RLS Policy Optimizations:')
  console.log('  • Simplify RLS policies to avoid nested subqueries')
  console.log('  • Use indexed columns in policy conditions')
  console.log('  • Consider bypassing RLS for service role operations')
}

// Run diagnosis
diagnosePerformanceIssues()
  .then(() => {
    console.log('\n✨ Performance diagnosis completed')
  })
  .catch((error) => {
    console.error('\n💥 Diagnosis failed:', error)
    process.exit(1)
  })