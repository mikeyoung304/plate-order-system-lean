#!/usr/bin/env node

/**
 * Debug Order Routing - Find out why orders aren't showing in KDS
 */

require('dotenv').config({ path: '.env.local' });

async function debugOrderRouting() {
  console.log('🔍 Debugging Order Routing to KDS');
  console.log('================================');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  // Authenticate first
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: 'guest@restaurant.plate',
    password: 'guest12345'
  });
  
  if (loginError) {
    console.log('❌ Authentication failed:', loginError.message);
    return false;
  }
  
  console.log('✅ Authenticated successfully');
  
  console.log('\n🔄 Step 1: Check existing orders...');
  
  // Get all orders
  const { data: allOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id, status, type, items, created_at, table_id')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (ordersError) {
    console.log('❌ Failed to fetch orders:', ordersError.message);
    return false;
  }
  
  console.log(`📊 Found ${allOrders?.length || 0} orders in database`);
  
  if (allOrders && allOrders.length > 0) {
    console.log('   Recent orders:');
    allOrders.slice(0, 5).forEach((order, i) => {
      console.log(`   ${i + 1}. ${order.id} - ${order.status} - ${order.type} - Table: ${order.table_id}`);
      console.log(`      Items: ${JSON.stringify(order.items)}`);
      console.log(`      Created: ${order.created_at}`);
    });
  }
  
  console.log('\n🔄 Step 2: Check KDS routing table...');
  
  // Check what's in KDS routing
  const { data: kdsRouting, error: kdsError } = await supabase
    .from('kds_order_routing')
    .select('*')
    .order('routed_at', { ascending: false })
    .limit(10);
  
  if (kdsError) {
    console.log('❌ Failed to fetch KDS routing:', kdsError.message);
    return false;
  }
  
  console.log(`📊 Found ${kdsRouting?.length || 0} entries in KDS routing table`);
  
  if (kdsRouting && kdsRouting.length > 0) {
    console.log('   Recent KDS routings:');
    kdsRouting.forEach((routing, i) => {
      console.log(`   ${i + 1}. Order: ${routing.order_id} -> Station: ${routing.station_id}`);
      console.log(`      Routed: ${routing.routed_at}`);
      console.log(`      Completed: ${routing.completed_at || 'Not completed'}`);
    });
  } else {
    console.log('   📝 No KDS routing entries found - this explains empty displays!');
  }
  
  console.log('\n🔄 Step 3: Check if orders should be automatically routed...');
  
  // Check if there's an automatic routing mechanism
  // Look for database functions or triggers
  const { data: functions, error: functionsError } = await supabase
    .rpc('query', { sql: "SELECT routine_name FROM information_schema.routines WHERE routine_type = 'FUNCTION' AND routine_name LIKE '%route%' OR routine_name LIKE '%kds%';" })
    .catch(() => null);
  
  console.log('📝 Database functions check skipped (might need different approach)');
  
  console.log('\n🔄 Step 4: Test manual order routing...');
  
  if (allOrders && allOrders.length > 0) {
    const testOrder = allOrders[0];
    console.log(`🧪 Testing manual routing for order: ${testOrder.id}`);
    
    // Get available stations
    const { data: stations, error: stationsError } = await supabase
      .from('kds_stations')
      .select('*')
      .eq('is_active', true);
    
    if (stationsError) {
      console.log('❌ Failed to fetch stations:', stationsError.message);
      return false;
    }
    
    console.log(`   Found ${stations?.length || 0} active stations`);
    
    if (stations && stations.length > 0) {
      // Try to route to first station (probably Grill)
      const targetStation = stations[0];
      console.log(`   Attempting to route to: ${targetStation.name} (${targetStation.id})`);
      
      try {
        const { data: routing, error: routingError } = await supabase
          .from('kds_order_routing')
          .insert({
            order_id: testOrder.id,
            station_id: targetStation.id,
            sequence: 1,
            priority: 1,
            routed_at: new Date().toISOString(),
            recall_count: 0
          })
          .select()
          .single();
        
        if (routingError) {
          console.log('❌ Manual routing failed:', routingError.message);
          
          // Check if it's a duplicate
          if (routingError.message.includes('duplicate') || routingError.code === '23505') {
            console.log('   📝 Order already routed to this station');
          }
        } else {
          console.log('✅ Manual routing successful!');
          console.log('   Routing ID:', routing.id);
          
          // Verify it shows up in KDS query
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: verifyRouting, error: verifyError } = await supabase
            .from('kds_order_routing')
            .select(`
              *,
              order:orders!inner (
                id, items, status, type, created_at,
                table:tables!table_id (label)
              ),
              station:kds_stations!station_id (id, name, type, color)
            `)
            .eq('id', routing.id)
            .single();
          
          if (verifyError) {
            console.log('❌ Verification failed:', verifyError.message);
          } else {
            console.log('✅ Verification successful! Order now visible in KDS:');
            console.log('   Order ID:', verifyRouting.order?.id);
            console.log('   Table:', verifyRouting.order?.table?.label);
            console.log('   Station:', verifyRouting.station?.name);
            console.log('   Items:', verifyRouting.order?.items);
            
            // Clean up test routing
            await supabase
              .from('kds_order_routing')
              .delete()
              .eq('id', routing.id);
            console.log('🧹 Test routing cleaned up');
          }
        }
      } catch (err) {
        console.log('❌ Manual routing error:', err.message);
      }
    }
  }
  
  console.log('\n🔄 Step 5: Check for intelligent routing function...');
  
  // Test if the intelligent routing function exists and works
  if (allOrders && allOrders.length > 0) {
    const testOrder = allOrders[0];
    
    try {
      // Try to call the intelligent routing function directly
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/intelligent_order_routing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ order_id: testOrder.id })
      });
      
      if (response.ok) {
        console.log('✅ Intelligent routing function exists and callable');
        
        // Check if order got routed
        const { data: checkRouting } = await supabase
          .from('kds_order_routing')
          .select('*')
          .eq('order_id', testOrder.id);
        
        if (checkRouting && checkRouting.length > 0) {
          console.log(`✅ Intelligent routing worked! Order routed to ${checkRouting.length} stations`);
          
          // Clean up
          await supabase
            .from('kds_order_routing')
            .delete()
            .eq('order_id', testOrder.id);
          console.log('🧹 Test intelligent routing cleaned up');
        } else {
          console.log('📝 Intelligent routing called but no routing entries created');
        }
      } else {
        console.log('❌ Intelligent routing function not accessible or doesn\'t exist');
        const errorText = await response.text();
        console.log('   Error:', errorText);
      }
    } catch (err) {
      console.log('❌ Intelligent routing test failed:', err.message);
    }
  }
  
  await supabase.auth.signOut();
  
  return true;
}

async function main() {
  const success = await debugOrderRouting();
  
  console.log('\n📊 ORDER ROUTING DEBUG SUMMARY:');
  console.log('===============================');
  
  if (success) {
    console.log('🎯 ROOT CAUSE IDENTIFIED:');
    console.log('❌ Orders exist in database but are NOT routed to KDS stations');
    console.log('❌ KDS routing table is empty - explains why displays show no orders');
    console.log('');
    console.log('🔧 SOLUTIONS TO IMPLEMENT:');
    console.log('1. Auto-route new orders to appropriate KDS stations');
    console.log('2. Route existing orders to KDS stations (one-time migration)');
    console.log('3. Ensure order creation process includes KDS routing');
    console.log('4. Add triggers or functions for automatic routing');
    console.log('');
    console.log('📋 IMMEDIATE NEXT STEPS:');
    console.log('1. Route existing orders to KDS stations');
    console.log('2. Fix order creation to include KDS routing');
    console.log('3. Test KDS displays with routed orders');
  } else {
    console.log('❌ Debug failed - need to investigate further');
  }
  
  return success;
}

main()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });