#!/usr/bin/env node
/**
 * Test Client-side KDS Access
 * Test if the client can access KDS data with anon key
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testClientKDSAccess() {
  console.log('🧪 Testing Client-side KDS Access...')
  
  // First authenticate as guest
  console.log('\n1. Authenticating as guest...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'guest@restaurant.plate',
    password: 'guest12345'
  })
  
  if (authError) {
    console.error('❌ Auth failed:', authError.message)
    return false
  }
  
  console.log('✅ Authenticated as guest')
  
  // Test 2: Try to access KDS data the way the app would
  console.log('\n2. Testing KDS data access...')
  
  const { data: routingData, error: routingError } = await supabase
    .from('kds_order_routing')
    .select(`
      *,
      order:orders!inner (
        id, items, status, type, created_at, transcript,
        table:tables!table_id (label)
      ),
      station:kds_stations!station_id (id, name, type, color)
    `)
    .is('completed_at', null)
    .order('routed_at', { ascending: true })
  
  if (routingError) {
    console.error('❌ KDS query failed:', routingError)
    return false
  }
  
  console.log(`✅ Found ${routingData.length} KDS orders`)
  
  // Test 3: Test individual table access
  console.log('\n3. Testing individual table access...')
  
  // Orders table
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(5)
  
  if (ordersError) {
    console.error('❌ Orders access failed:', ordersError)
  } else {
    console.log(`✅ Orders: ${orders.length} found`)
  }
  
  // KDS stations
  const { data: stations, error: stationsError } = await supabase
    .from('kds_stations')
    .select('*')
  
  if (stationsError) {
    console.error('❌ Stations access failed:', stationsError)
  } else {
    console.log(`✅ Stations: ${stations.length} found`)
  }
  
  // KDS routing
  const { data: routing, error: routingSimpleError } = await supabase
    .from('kds_order_routing')
    .select('*')
    .limit(5)
  
  if (routingSimpleError) {
    console.error('❌ Routing access failed:', routingSimpleError)
  } else {
    console.log(`✅ Routing: ${routing.length} found`)
  }
  
  // Test 4: Test station-specific query
  if (stations && stations.length > 0) {
    const station = stations[0]
    console.log(`\n4. Testing station-specific query for ${station.name}...`)
    
    const { data: stationOrders, error: stationError } = await supabase
      .from('kds_order_routing')
      .select(`
        *,
        order:orders!inner (
          id, items, status, type, created_at, transcript,
          table:tables!table_id (label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `)
      .eq('station_id', station.id)
      .is('completed_at', null)
      .order('routed_at', { ascending: true })
    
    if (stationError) {
      console.error('❌ Station-specific query failed:', stationError)
    } else {
      console.log(`✅ Station orders: ${stationOrders.length} found for ${station.name}`)
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`  - Authentication: ${authError ? '❌' : '✅'}`)
  console.log(`  - KDS Data Access: ${routingError ? '❌' : '✅'}`)
  console.log(`  - Orders Table: ${ordersError ? '❌' : '✅'}`)
  console.log(`  - Stations Table: ${stationsError ? '❌' : '✅'}`)
  console.log(`  - Routing Table: ${routingSimpleError ? '❌' : '✅'}`)
  
  return !routingError && !authError
}

testClientKDSAccess().then(success => {
  console.log(success ? '\n🎉 Client KDS access working!' : '\n❌ Client KDS access has issues')
  process.exit(success ? 0 : 1)
})