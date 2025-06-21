#!/usr/bin/env node

/**
 * KDS Authentication & RLS Debug Script
 * Investigates authentication and RLS issues blocking KDS data access
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

async function debugAuthKDS() {
  console.log('🔍 KDS AUTHENTICATION & RLS DEBUG\n')
  
  try {
    // 1. Check current auth state
    console.log('1. Checking authentication state...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    const session = authData?.session
    const user = session?.user
    
    console.log(`Session exists: ${!!session}`)
    console.log(`User exists: ${!!user}`)
    if (user) {
      console.log(`User ID: ${user.id}`)
      console.log(`User email: ${user.email}`)
      console.log(`User role: ${user.app_metadata?.role || 'none'}`)
    }
    
    // 2. Try authenticating as guest
    console.log('\n2. Attempting guest authentication...')
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })
    
    if (signInError) {
      console.error('❌ Guest sign in error:', signInError)
      console.log('This might be expected if guest account doesn\'t exist')
    } else {
      console.log('✅ Guest authentication successful')
      console.log(`Guest user ID: ${signInData.user?.id}`)
      console.log(`Guest user role: ${signInData.user?.app_metadata?.role || 'none'}`)
    }
    
    // 3. Test direct table access
    console.log('\n3. Testing direct table access...')
    
    // Test kds_order_routing (should work for authenticated users)
    const { data: routingData, error: routingError } = await supabase
      .from('kds_order_routing')
      .select('*')
      .limit(5)
    
    if (routingError) {
      console.error('❌ KDS routing access error:', routingError)
    } else {
      console.log(`✅ KDS routing access: ${routingData?.length || 0} entries`)
    }
    
    // Test orders table (this is likely failing)
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, type')
      .limit(5)
    
    if (ordersError) {
      console.error('❌ Orders table access error:', ordersError)
    } else {
      console.log(`✅ Orders table access: ${ordersData?.length || 0} entries`)
    }
    
    // Test tables table
    const { data: tablesData, error: tablesError } = await supabase
      .from('tables')
      .select('id, label')
      .limit(5)
    
    if (tablesError) {
      console.error('❌ Tables table access error:', tablesError)
    } else {
      console.log(`✅ Tables table access: ${tablesData?.length || 0} entries`)
    }
    
    // Test seats table
    const { data: seatsData, error: seatsError } = await supabase
      .from('seats')
      .select('id, label')
      .limit(5)
    
    if (seatsError) {
      console.error('❌ Seats table access error:', seatsError)
    } else {
      console.log(`✅ Seats table access: ${seatsData?.length || 0} entries`)
    }
    
    // Test kds_stations table
    const { data: stationsData, error: stationsError } = await supabase
      .from('kds_stations')
      .select('id, name, is_active')
      .limit(5)
    
    if (stationsError) {
      console.error('❌ Stations table access error:', stationsError)
    } else {
      console.log(`✅ Stations table access: ${stationsData?.length || 0} entries`)
    }
    
    // 4. Test the exact query from fetchAllActiveOrders
    console.log('\n4. Testing fetchAllActiveOrders query...')
    const { data: fullQuery, error: fullError } = await supabase
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
      console.error('❌ Full query error:', fullError)
      
      // Try to identify which join is failing
      console.log('\n🔍 Testing individual joins...')
      
      // Test kds_order_routing + orders join
      const { data: ordersJoin, error: ordersJoinError } = await supabase
        .from('kds_order_routing')
        .select(`
          *,
          order:orders!inner (id, items, status, type)
        `)
        .limit(1)
      
      if (ordersJoinError) {
        console.error('❌ Orders join error:', ordersJoinError)
      } else {
        console.log('✅ Orders join works')
      }
      
      // Test orders + tables join
      const { data: tablesJoin, error: tablesJoinError } = await supabase
        .from('orders')
        .select(`
          id,
          table:tables!table_id (id, label)
        `)
        .limit(1)
      
      if (tablesJoinError) {
        console.error('❌ Tables join error:', tablesJoinError)
      } else {
        console.log('✅ Tables join works')
      }
      
    } else {
      console.log(`✅ Full query successful: ${fullQuery?.length || 0} results`)
    }
    
    // 5. Create test data if needed
    console.log('\n5. Checking if test data exists...')
    
    // Check if there are any orders at all
    const { count: orderCount, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Order count error:', countError)
    } else {
      console.log(`Total orders in database: ${orderCount || 0}`)
    }
    
    // Check if there are any routing entries
    const { count: routingCount, error: routingCountError } = await supabase
      .from('kds_order_routing')
      .select('*', { count: 'exact', head: true })
    
    if (routingCountError) {
      console.error('❌ Routing count error:', routingCountError)
    } else {
      console.log(`Total routing entries: ${routingCount || 0}`)
    }
    
    // 6. Recommendations
    console.log('\n📋 RECOMMENDATIONS:')
    
    if (!session) {
      console.log('🔴 CRITICAL: No authenticated session')
      console.log('   - KDS requires authentication to work')
      console.log('   - Try signing in as guest@restaurant.plate / guest12345')
    }
    
    if (routingError) {
      console.log('🔴 CRITICAL: Cannot access kds_order_routing table')
      console.log('   - Check RLS policies for kds_order_routing')
      console.log('   - Ensure user has required role')
    }
    
    if (ordersError) {
      console.log('🔴 CRITICAL: Cannot access orders table')
      console.log('   - This is likely the main blocker')
      console.log('   - Check RLS policies for orders table')
      console.log('   - Ensure user role is in allowed roles')
    }
    
    if ((orderCount || 0) === 0) {
      console.log('🟡 WARNING: No orders in database')
      console.log('   - Create test orders to see KDS in action')
    }
    
    if ((routingCount || 0) === 0) {
      console.log('🟡 WARNING: No routing entries in database')
      console.log('   - Orders need to be routed to KDS stations')
      console.log('   - Check intelligent routing function')
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

debugAuthKDS()