#!/usr/bin/env node

/**
 * KDS Rendering Debug Script
 * Investigates the exact issue with orders showing counts but not rendering in UI
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugKDSRendering() {
  console.log('🔍 KDS RENDERING DEBUG INVESTIGATION\n')
  
  try {
    // 1. Check raw kds_order_routing data
    console.log('1. Checking raw kds_order_routing table...')
    const { data: rawRouting, error: routingError } = await supabase
      .from('kds_order_routing')
      .select('*')
      .is('completed_at', null)
      .order('routed_at', { ascending: true })
    
    if (routingError) {
      console.error('❌ Error fetching routing data:', routingError)
      return
    }
    
    console.log(`✅ Found ${rawRouting?.length || 0} raw routing entries`)
    if (rawRouting?.length > 0) {
      console.log('📄 Sample routing entry:')
      console.log(JSON.stringify(rawRouting[0], null, 2))
    }
    
    // 2. Check the exact query used by fetchAllActiveOrders
    console.log('\n2. Testing fetchAllActiveOrders query...')
    const { data: fullOrders, error: fullError } = await supabase
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
    
    if (fullError) {
      console.error('❌ Error with full query:', fullError)
      return
    }
    
    console.log(`✅ Full query returned ${fullOrders?.length || 0} orders`)
    
    // 3. Analyze the structure of returned data
    if (fullOrders?.length > 0) {
      console.log('\n3. Analyzing order data structure...')
      const sampleOrder = fullOrders[0]
      
      console.log('📄 Sample full order:')
      console.log(JSON.stringify(sampleOrder, null, 2))
      
      // Check if required fields are present
      console.log('\n🔍 Field validation:')
      console.log(`- Has ID: ${!!sampleOrder.id}`)
      console.log(`- Has order relation: ${!!sampleOrder.order}`)
      console.log(`- Order has items: ${!!sampleOrder.order?.items}`)
      console.log(`- Items array length: ${sampleOrder.order?.items?.length || 0}`)
      console.log(`- Has table relation: ${!!sampleOrder.order?.table}`)
      console.log(`- Has seat relation: ${!!sampleOrder.order?.seat}`)
      console.log(`- Has station relation: ${!!sampleOrder.station}`)
    }
    
    // 4. Test table grouping logic
    if (fullOrders?.length > 0) {
      console.log('\n4. Testing table grouping logic...')
      const tableGroups = new Map()
      
      for (const order of fullOrders) {
        const tableId = order.order?.table_id
        if (!tableId) {
          console.log(`⚠️  Order ${order.id} missing table_id`)
          continue
        }
        
        if (!tableGroups.has(tableId)) {
          tableGroups.set(tableId, [])
        }
        tableGroups.get(tableId).push(order)
      }
      
      console.log(`✅ Grouped into ${tableGroups.size} tables:`)
      for (const [tableId, orders] of tableGroups.entries()) {
        console.log(`  - Table ${tableId}: ${orders.length} orders`)
      }
    }
    
    // 5. Check for data filtering issues
    console.log('\n5. Testing filter conditions...')
    
    // Check 'new' filter (no started_at)
    const newOrders = fullOrders?.filter(order => !order.started_at) || []
    console.log(`- 'new' orders: ${newOrders.length}`)
    
    // Check 'preparing' filter (has started_at, no completed_at)
    const preparingOrders = fullOrders?.filter(order => 
      order.started_at && !order.completed_at
    ) || []
    console.log(`- 'preparing' orders: ${preparingOrders.length}`)
    
    // Check 'overdue' filter (over 10 minutes)
    const now = Date.now()
    const overdueOrders = fullOrders?.filter(order => {
      const startTime = order.started_at 
        ? new Date(order.started_at).getTime()
        : new Date(order.routed_at).getTime()
      return (now - startTime) / 1000 > 600
    }) || []
    console.log(`- 'overdue' orders: ${overdueOrders.length}`)
    
    // 6. Check specific view mode filtering
    console.log('\n6. Testing view mode rendering conditions...')
    
    // Test table view grouping
    if (fullOrders?.length > 0) {
      console.log('\n🔍 Table view analysis:')
      
      // Find orders with valid table relations
      const ordersWithTables = fullOrders.filter(order => 
        order.order?.table_id && order.order?.table
      )
      console.log(`- Orders with valid table relations: ${ordersWithTables.length}`)
      
      // Find orders with items
      const ordersWithItems = fullOrders.filter(order => 
        order.order?.items && Array.isArray(order.order.items) && order.order.items.length > 0
      )
      console.log(`- Orders with items: ${ordersWithItems.length}`)
      
      // Check for empty items arrays
      const ordersWithEmptyItems = fullOrders.filter(order => 
        order.order?.items && Array.isArray(order.order.items) && order.order.items.length === 0
      )
      console.log(`- Orders with empty items: ${ordersWithEmptyItems.length}`)
    }
    
    // 7. Check stations data
    console.log('\n7. Checking stations data...')
    const { data: stations, error: stationError } = await supabase
      .from('kds_stations')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })
    
    if (stationError) {
      console.error('❌ Error fetching stations:', stationError)
    } else {
      console.log(`✅ Found ${stations?.length || 0} active stations`)
      if (stations?.length > 0) {
        console.log('🏢 Stations:')
        stations.forEach(station => {
          console.log(`  - ${station.name} (${station.type})`)
        })
      }
    }
    
    // 8. Summary and recommendations
    console.log('\n📋 SUMMARY:')
    console.log(`- Total routing entries: ${rawRouting?.length || 0}`)
    console.log(`- Full query results: ${fullOrders?.length || 0}`)
    console.log(`- Active stations: ${stations?.length || 0}`)
    
    if ((rawRouting?.length || 0) > 0 && (fullOrders?.length || 0) === 0) {
      console.log('\n🚨 ISSUE IDENTIFIED:')
      console.log('Raw routing data exists but full query returns no results.')
      console.log('This suggests a JOIN problem - likely missing related data.')
      
      // Check for orphaned routing entries
      console.log('\n🔍 Checking for orphaned data...')
      
      for (const routing of rawRouting.slice(0, 3)) { // Check first 3
        console.log(`\nChecking routing entry ${routing.id}:`)
        
        // Check if order exists
        const { data: orderCheck } = await supabase
          .from('orders')
          .select('id, table_id, seat_id')
          .eq('id', routing.order_id)
          .single()
        
        console.log(`  - Order exists: ${!!orderCheck}`)
        
        if (orderCheck) {
          // Check if table exists
          const { data: tableCheck } = await supabase
            .from('tables')
            .select('id, label')
            .eq('id', orderCheck.table_id)
            .single()
          
          console.log(`  - Table exists: ${!!tableCheck}`)
          
          // Check if seat exists
          const { data: seatCheck } = await supabase
            .from('seats')
            .select('id, label')
            .eq('id', orderCheck.seat_id)
            .single()
          
          console.log(`  - Seat exists: ${!!seatCheck}`)
        }
        
        // Check if station exists
        const { data: stationCheck } = await supabase
          .from('kds_stations')
          .select('id, name')
          .eq('id', routing.station_id)
          .single()
        
        console.log(`  - Station exists: ${!!stationCheck}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

debugKDSRendering()