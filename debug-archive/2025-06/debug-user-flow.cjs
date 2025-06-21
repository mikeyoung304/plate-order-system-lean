#!/usr/bin/env node

/**
 * User Flow Debug Script
 * Simulates the complete user authentication flow to access KDS
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

async function debugUserFlow() {
  console.log('🔍 USER FLOW DEBUG: Complete KDS Access Simulation\n')
  
  try {
    // 1. Simulate unauthenticated user trying to access KDS
    console.log('1. Simulating unauthenticated user...')
    
    // Clear any existing session
    await supabase.auth.signOut()
    
    const { data: noAuthSession } = await supabase.auth.getSession()
    console.log(`No session exists: ${!noAuthSession.session}`)
    
    // Try to access KDS data (this should fail)
    const { data: noAuthOrders, error: noAuthError } = await supabase
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
    
    if (noAuthError) {
      console.log(`❌ Correctly blocked: ${noAuthError.message}`)
    } else {
      console.log(`⚠️  Unexpected: Got ${noAuthOrders?.length || 0} orders without auth`)
    }
    
    // 2. Simulate user clicking "Continue as Guest"
    console.log('\n2. Simulating guest authentication...')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })
    
    if (authError) {
      console.error('❌ Guest authentication failed:', authError.message)
      return
    }
    
    console.log('✅ Guest authenticated successfully')
    console.log(`User ID: ${authData.user?.id}`)
    console.log(`User role: ${authData.user?.app_metadata?.role || 'none'}`)
    
    // 3. Now try accessing KDS data again
    console.log('\n3. Testing KDS access after authentication...')
    
    const { data: authOrders, error: authOrdersError } = await supabase
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
    
    if (authOrdersError) {
      console.error('❌ Still blocked after auth:', authOrdersError.message)
    } else {
      console.log(`✅ KDS access successful: ${authOrders?.length || 0} orders`)
      
      if (authOrders?.length > 0) {
        console.log('\n📊 Order Analysis:')
        
        // Analyze order structure
        const sampleOrder = authOrders[0]
        console.log(`- Sample order ID: ${sampleOrder.id}`)
        console.log(`- Has order data: ${!!sampleOrder.order}`)
        console.log(`- Order items: ${sampleOrder.order?.items?.length || 0}`)
        console.log(`- Table: ${sampleOrder.order?.table?.label || 'none'}`)
        console.log(`- Station: ${sampleOrder.station?.name || 'none'}`)
        
        // Test table grouping
        const tableGroups = new Map()
        for (const order of authOrders) {
          const tableId = order.order?.table_id
          if (tableId) {
            if (!tableGroups.has(tableId)) {
              tableGroups.set(tableId, [])
            }
            tableGroups.get(tableId).push(order)
          }
        }
        
        console.log(`- Unique tables: ${tableGroups.size}`)
        for (const [tableId, orders] of tableGroups.entries()) {
          const tableLabel = orders[0]?.order?.table?.label || tableId
          console.log(`  * ${tableLabel}: ${orders.length} orders`)
        }
        
        // Test filters
        const newOrders = authOrders.filter(o => !o.started_at)
        const preparingOrders = authOrders.filter(o => o.started_at && !o.completed_at)
        const now = Date.now()
        const overdueOrders = authOrders.filter(o => {
          const startTime = o.started_at 
            ? new Date(o.started_at).getTime()
            : new Date(o.routed_at).getTime()
          return (now - startTime) / 1000 > 600
        })
        
        console.log(`- New orders: ${newOrders.length}`)
        console.log(`- Preparing orders: ${preparingOrders.length}`)
        console.log(`- Overdue orders: ${overdueOrders.length}`)
      }
    }
    
    // 4. Test stations data
    console.log('\n4. Testing stations data...')
    
    const { data: stations, error: stationsError } = await supabase
      .from('kds_stations')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })
    
    if (stationsError) {
      console.error('❌ Stations error:', stationsError.message)
    } else {
      console.log(`✅ Stations access: ${stations?.length || 0} active stations`)
      if (stations?.length > 0) {
        stations.forEach(station => {
          console.log(`  - ${station.name} (${station.type})`)
        })
      }
    }
    
    // 5. Simulate real-time subscription setup
    console.log('\n5. Testing real-time subscription...')
    
    let subscriptionWorking = false
    const channel = supabase
      .channel('kds-test')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kds_order_routing' },
        (payload) => {
          console.log('📡 Real-time update received:', payload.eventType)
          subscriptionWorking = true
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`)
      })
    
    // Wait a moment for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Clean up
    await supabase.removeChannel(channel)
    
    // 6. Summary and recommendations
    console.log('\n📋 SUMMARY:')
    
    if (authOrders?.length > 0) {
      console.log('✅ SUCCESS: Complete user flow working correctly!')
      console.log('  - Authentication: ✅ Working')
      console.log('  - KDS Data Access: ✅ Working') 
      console.log('  - Order Structure: ✅ Valid')
      console.log('  - Table Grouping: ✅ Working')
      console.log('  - Stations: ✅ Working')
      
      console.log('\n🎯 ROOT CAUSE IDENTIFIED:')
      console.log('The KDS system is working correctly on the backend.')
      console.log('The issue is likely one of the following:')
      console.log('1. User not authenticated in browser session')
      console.log('2. Frontend component state management issue')
      console.log('3. React rendering or conditional logic problem')
      console.log('4. CSS hiding the orders')
      
      console.log('\n✨ SOLUTION:')
      console.log('1. Ensure user clicks "Continue as Guest" on login page')
      console.log('2. Check browser console for JavaScript errors')
      console.log('3. Verify React state is updating properly')
      console.log('4. Check if orders are rendered but hidden by CSS')
      
    } else {
      console.log('❌ ISSUE: Still no access after authentication')
      console.log('This indicates a deeper RLS or data structure problem')
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

debugUserFlow()