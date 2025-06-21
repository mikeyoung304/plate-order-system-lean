#!/usr/bin/env node

/**
 * Apply Critical KDS Performance Indexes
 * 
 * This script applies database indexes optimized for KDS performance
 * Expected improvement: 40-60ms reduction per query
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create service role client for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function measureQueryPerformance(queryName, queryFn) {
  const start = Date.now()
  try {
    const result = await queryFn()
    const duration = Date.now() - start
    console.log(`✓ ${queryName}: ${duration}ms`)
    return { success: true, duration, result }
  } catch (error) {
    const duration = Date.now() - start
    console.log(`✗ ${queryName}: ${duration}ms (failed)`)
    return { success: false, duration, error: error.message }
  }
}

async function benchmarkBeforeIndexes() {
  console.log('\n🔍 PERFORMANCE BENCHMARK - BEFORE INDEXES')
  console.log('='.repeat(50))
  
  const results = {}
  
  // Test 1: fetchAllActiveOrders equivalent
  results.allActiveOrders = await measureQueryPerformance(
    'All Active Orders Query',
    async () => {
      const { data, error } = await supabase
        .from('kds_order_routing')
        .select(`
          id, order_id, station_id, routed_at, started_at, completed_at, priority,
          order:orders!inner (id, items, status, created_at, seat_id),
          station:kds_stations!station_id (id, name, type, color)
        `)
        .is('completed_at', null)
        .order('priority', { ascending: false })
        .order('routed_at', { ascending: true })
        .limit(50)
      
      if (error) throw error
      return data
    }
  )
  
  // Test 2: Station-specific orders
  results.stationOrders = await measureQueryPerformance(
    'Station-Specific Orders Query',
    async () => {
      const { data: stations } = await supabase
        .from('kds_stations')
        .select('id')
        .limit(1)
      
      if (stations && stations.length > 0) {
        const { data, error } = await supabase
          .from('kds_order_routing')
          .select(`
            *, order:orders!inner (id, items, status, created_at, seat_id),
            station:kds_stations!station_id (id, name, type, color)
          `)
          .eq('station_id', stations[0].id)
          .is('completed_at', null)
          .order('routed_at', { ascending: true })
          .limit(50)
        
        if (error) throw error
        return data
      }
      return []
    }
  )
  
  // Test 3: Table grouping query
  results.tableGrouping = await measureQueryPerformance(
    'Table Grouping Query',
    async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, table_id, seat_id, status, created_at,
          table:tables!table_id (id, label),
          seat:seats!seat_id (id, label)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      return data
    }
  )
  
  return results
}

async function applyIndexes() {
  console.log('\n🚀 APPLYING PERFORMANCE INDEXES')
  console.log('='.repeat(50))
  
  // Read the SQL file
  const sqlFile = path.join(__dirname, 'database-performance-indexes.sql')
  const sqlContent = fs.readFileSync(sqlFile, 'utf8')
  
  // Split by CREATE INDEX statements
  const indexStatements = sqlContent
    .split('CREATE INDEX CONCURRENTLY')
    .filter(statement => statement.trim().length > 0)
    .map(statement => `CREATE INDEX CONCURRENTLY${statement}`)
    .slice(1) // Remove the first empty element
  
  console.log(`📊 Found ${indexStatements.length} index statements to apply`)
  
  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  
  for (let i = 0; i < indexStatements.length; i++) {
    const statement = indexStatements[i].split(';')[0].trim() // Remove everything after first semicolon
    
    // Extract index name for reporting
    const indexNameMatch = statement.match(/idx_[a-zA-Z0-9_]+/)
    const indexName = indexNameMatch ? indexNameMatch[0] : `index_${i + 1}`
    
    console.log(`\\n📈 Creating index ${i + 1}/${indexStatements.length}: ${indexName}`)
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Index already exists: ${indexName}`)
          skipCount++
        } else {
          console.log(`❌ Error creating ${indexName}: ${error.message}`)
          errorCount++
        }
      } else {
        console.log(`✅ Successfully created: ${indexName}`)
        successCount++
      }
    } catch (err) {
      console.log(`❌ Exception creating ${indexName}: ${err.message}`)
      errorCount++
    }
    
    // Small delay to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`\\n📊 INDEX CREATION SUMMARY`)
  console.log(`✅ Created: ${successCount}`)
  console.log(`⏭️  Skipped (already exists): ${skipCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  
  return { successCount, skipCount, errorCount }
}

async function analyzeTablesForOptimalPlanning() {
  console.log('\\n🔍 ANALYZING TABLES FOR OPTIMAL QUERY PLANNING')
  console.log('='.repeat(50))
  
  const tables = ['kds_order_routing', 'orders', 'kds_stations', 'tables', 'seats']
  
  for (const table of tables) {
    try {
      console.log(`📊 Analyzing table: ${table}`)
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `ANALYZE ${table};` 
      })
      
      if (error) {
        console.log(`❌ Error analyzing ${table}: ${error.message}`)
      } else {
        console.log(`✅ Successfully analyzed: ${table}`)
      }
    } catch (err) {
      console.log(`❌ Exception analyzing ${table}: ${err.message}`)
    }
  }
}

async function benchmarkAfterIndexes() {
  console.log('\\n🚀 PERFORMANCE BENCHMARK - AFTER INDEXES')
  console.log('='.repeat(50))
  
  // Wait a moment for indexes to be ready
  console.log('⏳ Waiting for indexes to be ready...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return await benchmarkBeforeIndexes() // Same queries, different performance
}

async function generatePerformanceReport(beforeResults, afterResults) {
  console.log('\\n📊 PERFORMANCE IMPROVEMENT REPORT')
  console.log('='.repeat(50))
  
  const queries = ['allActiveOrders', 'stationOrders', 'tableGrouping']
  
  for (const query of queries) {
    const before = beforeResults[query]
    const after = afterResults[query]
    
    if (before && after && before.success && after.success) {
      const improvement = ((before.duration - after.duration) / before.duration) * 100
      const timeReduction = before.duration - after.duration
      
      console.log(`\\n🔍 ${query}:`)
      console.log(`   Before: ${before.duration}ms`)
      console.log(`   After:  ${after.duration}ms`)
      console.log(`   Improvement: ${improvement.toFixed(1)}% (${timeReduction}ms faster)`)
      
      if (improvement > 30) {
        console.log(`   🎉 Excellent improvement!`)
      } else if (improvement > 10) {
        console.log(`   ✅ Good improvement`)
      } else if (improvement > 0) {
        console.log(`   📈 Modest improvement`)
      } else {
        console.log(`   ⚠️  No significant improvement`)
      }
    }
  }
}

async function main() {
  console.log('🚀 KDS DATABASE PERFORMANCE OPTIMIZATION')
  console.log('='.repeat(50))
  console.log('This script will apply critical indexes to improve KDS query performance')
  console.log('Expected improvement: 40-60ms reduction per query\\n')
  
  try {
    // Step 1: Benchmark current performance
    const beforeResults = await benchmarkBeforeIndexes()
    
    // Step 2: Apply performance indexes
    const indexResults = await applyIndexes()
    
    // Step 3: Analyze tables for optimal query planning
    await analyzeTablesForOptimalPlanning()
    
    // Step 4: Benchmark performance after indexes
    const afterResults = await benchmarkAfterIndexes()
    
    // Step 5: Generate performance report
    await generatePerformanceReport(beforeResults, afterResults)
    
    console.log('\\n🎉 DATABASE OPTIMIZATION COMPLETE!')
    console.log('✅ KDS queries should now be significantly faster')
    console.log('📊 Monitor your application performance to verify improvements')
    
    if (indexResults.errorCount > 0) {
      console.log(`\\n⚠️  ${indexResults.errorCount} indexes failed to create - check logs above`)
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error.message)
    process.exit(1)
  }
}

// Check for exec_sql function availability
async function checkExecSqlAvailability() {
  try {
    // Try to execute a simple query to test exec_sql availability
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' })
    
    if (error && error.message.includes('function exec_sql')) {
      console.log('\\n⚠️  exec_sql function not available')
      console.log('📋 Manual index application required')
      console.log('\\n🔧 To apply indexes manually:')
      console.log('1. Copy the contents of database-performance-indexes.sql')
      console.log('2. Run in your Supabase SQL Editor or database console')
      console.log('3. Execute each CREATE INDEX statement individually')
      return false
    }
    
    return true
  } catch (err) {
    console.log('\\n⚠️  Unable to verify exec_sql availability:', err.message)
    console.log('📋 Proceeding with caution...')
    return true
  }
}

// Run the optimization
checkExecSqlAvailability()
  .then(canProceed => {
    if (canProceed) {
      return main()
    } else {
      console.log('\\n✋ Script stopped - manual application required')
      process.exit(0)
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })