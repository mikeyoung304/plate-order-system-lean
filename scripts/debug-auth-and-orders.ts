#!/usr/bin/env node
/**
 * Debug Auth and Orders Issue
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugAuthAndOrders() {
  console.log('🔍 Debugging Auth and Orders Issues...')
  
  // Step 1: Test authentication
  console.log('\n1. Testing authentication...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'guest@restaurant.plate',
    password: 'guest12345'
  })
  
  if (authError) {
    console.error('❌ Auth failed:', authError.message)
    return false
  }
  
  console.log('✅ Auth successful')
  console.log('   User ID:', authData.user.id)
  console.log('   Email:', authData.user.email)
  
  // Step 2: Test profile access  
  console.log('\n2. Testing profile access...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, role, name')
    .eq('user_id', authData.user.id)
    .single()
  
  if (profileError) {
    console.error('❌ Profile access failed:', profileError)
  } else {
    console.log('✅ Profile found:')
    console.log('   Role:', profile.role)
    console.log('   Name:', profile.name)
  }
  
  // Step 3: Check KDS data
  console.log('\n3. Testing KDS data access...')
  
  // Check orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
  
  if (ordersError) {
    console.error('❌ Orders access failed:', ordersError)
  } else {
    console.log(`✅ Orders found: ${orders.length}`)
    if (orders.length > 0) {
      console.log('   Sample order:', {
        id: orders[0].id,
        items: orders[0].items,
        status: orders[0].status,
        type: orders[0].type
      })
    }
  }
  
  // Check routing
  const { data: routing, error: routingError } = await supabase
    .from('kds_order_routing')
    .select('*')
  
  if (routingError) {
    console.error('❌ Routing access failed:', routingError)
  } else {
    console.log(`✅ Routing entries found: ${routing.length}`)
  }
  
  // Check the full KDS query
  const { data: kdsData, error: kdsError } = await supabase
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
  
  if (kdsError) {
    console.error('❌ KDS query failed:', kdsError)
  } else {
    console.log(`✅ KDS data found: ${kdsData.length} active orders`)
    if (kdsData.length > 0) {
      console.log('   Sample KDS order:')
      console.log('     Station:', kdsData[0].station?.name)
      console.log('     Items:', kdsData[0].order?.items)
      console.log('     Table:', kdsData[0].order?.table?.label)
    }
  }
  
  // Step 4: Summary
  console.log('\n📊 Debug Summary:')
  console.log(`   Auth: ${authError ? '❌' : '✅'}`)
  console.log(`   Profile: ${profileError ? '❌' : '✅'}`)
  console.log(`   Orders: ${ordersError ? '❌' : '✅'} (${orders?.length || 0} found)`)
  console.log(`   Routing: ${routingError ? '❌' : '✅'} (${routing?.length || 0} found)`)
  console.log(`   KDS Query: ${kdsError ? '❌' : '✅'} (${kdsData?.length || 0} found)`)
  
  if (orders?.length === 0 || routing?.length === 0) {
    console.log('\n⚠️  No orders/routing found - this explains "No pending orders" message')
    console.log('   Need to recreate test data')
  }
  
  return true
}

debugAuthAndOrders().catch(console.error)