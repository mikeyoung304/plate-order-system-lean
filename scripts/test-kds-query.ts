#!/usr/bin/env node
/**
 * Test KDS Query
 * Debug the KDS order fetching issue
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testKDSQueries() {
  console.log('🧪 Testing KDS Queries...')
  
  // Test 1: Check orders table
  console.log('\n1. Testing orders table access...')
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(5)
  
  if (ordersError) {
    console.error('❌ Orders table error:', ordersError)
  } else {
    console.log(`✅ Found ${orders?.length || 0} orders`)
    if (orders && orders.length > 0) {
      console.log('Sample order:', JSON.stringify(orders[0], null, 2))
    }
  }
  
  // Test 2: Check kds_order_routing table
  console.log('\n2. Testing kds_order_routing table access...')
  const { data: routing, error: routingError } = await supabase
    .from('kds_order_routing')
    .select('*')
    .limit(5)
  
  if (routingError) {
    console.error('❌ KDS routing table error:', routingError)
  } else {
    console.log(`✅ Found ${routing?.length || 0} routing entries`)
    if (routing && routing.length > 0) {
      console.log('Sample routing:', JSON.stringify(routing[0], null, 2))
    }
  }
  
  // Test 3: Test the complex join query (like KDS uses)
  console.log('\n3. Testing KDS join query...')
  const { data: joinedData, error: joinError } = await supabase
    .from('kds_order_routing')
    .select(`
      *,
      order:orders!inner (
        *,
        resident:profiles!resident_id (name),
        server:profiles!server_id (name),
        table:tables!table_id (label)
      ),
      station:kds_stations!station_id (*)
    `)
    .is('completed_at', null)
    .order('routed_at', { ascending: true })
    .limit(10)
  
  if (joinError) {
    console.error('❌ Join query error:', joinError)
  } else {
    console.log(`✅ Found ${joinedData?.length || 0} joined orders`)
    if (joinedData && joinedData.length > 0) {
      console.log('Sample joined data:', JSON.stringify(joinedData[0], null, 2))
    }
  }
  
  // Test 4: Check profile relations
  console.log('\n4. Testing profile relations...')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, name, role')
    .limit(5)
  
  if (profilesError) {
    console.error('❌ Profiles error:', profilesError)
  } else {
    console.log(`✅ Found ${profiles?.length || 0} profiles`)
    profiles?.forEach(profile => {
      console.log(`  - ${profile.name} (${profile.role}): ${profile.user_id}`)
    })
  }
  
  // Test 5: Check tables
  console.log('\n5. Testing tables...')
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('id, table_id, label')
    .limit(5)
  
  if (tablesError) {
    console.error('❌ Tables error:', tablesError)
  } else {
    console.log(`✅ Found ${tables?.length || 0} tables`)
    tables?.forEach(table => {
      console.log(`  - Table ${table.label}: ${table.id}`)
    })
  }
  
  // Test 6: Check KDS stations
  console.log('\n6. Testing KDS stations...')
  const { data: stations, error: stationsError } = await supabase
    .from('kds_stations')
    .select('*')
  
  if (stationsError) {
    console.error('❌ Stations error:', stationsError)
  } else {
    console.log(`✅ Found ${stations?.length || 0} stations`)
    stations?.forEach(station => {
      console.log(`  - ${station.name} (${station.type}): ${station.id}`)
    })
  }
  
  // Test 7: Try specific station query
  if (stations && stations.length > 0) {
    const firstStation = stations[0]
    console.log(`\n7. Testing station-specific query for ${firstStation.name}...`)
    
    const { data: stationOrders, error: stationError } = await supabase
      .from('kds_order_routing')
      .select(`
        *,
        order:orders!inner (
          *,
          resident:profiles!resident_id (name),
          server:profiles!server_id (name),
          table:tables!table_id (label)
        ),
        station:kds_stations!station_id (*)
      `)
      .eq('station_id', firstStation.id)
      .is('completed_at', null)
      .order('routed_at', { ascending: true })
    
    if (stationError) {
      console.error('❌ Station query error:', stationError)
    } else {
      console.log(`✅ Found ${stationOrders?.length || 0} orders for ${firstStation.name}`)
    }
  }
}

testKDSQueries().catch(console.error)