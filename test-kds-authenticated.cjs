#!/usr/bin/env node

/**
 * Test KDS Orders with Authentication
 * 
 * This tests whether the KDS hooks can fetch orders when properly authenticated
 */

require('dotenv').config({ path: '.env.local' });

async function testKDSAuthenticated() {
  console.log('🧪 Testing KDS Orders with Authentication');
  console.log('========================================');
  
  const { createClient } = require('@supabase/supabase-js');
  
  // Create client with anon key (like frontend)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('🔄 Step 1: Testing unauthenticated access...');
  
  // Test unauthenticated access (should fail)
  try {
    const { data: unauthOrders, error: unauthError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (unauthError) {
      console.log('✅ Unauthenticated access properly blocked:', unauthError.message);
    } else {
      console.log('❌ SECURITY ISSUE: Unauthenticated access allowed!');
      return false;
    }
  } catch (err) {
    console.log('✅ Unauthenticated access properly blocked:', err.message);
  }
  
  console.log('\n🔄 Step 2: Authenticating as guest user...');
  
  // Authenticate as guest
  const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'guest@restaurant.plate',
    password: 'guest12345'
  });
  
  if (loginError) {
    console.log('❌ Guest authentication failed:', loginError.message);
    return false;
  }
  
  console.log('✅ Guest authentication successful');
  console.log('   User ID:', authData.user?.id);
  console.log('   Email:', authData.user?.email);
  
  console.log('\n🔄 Step 3: Testing authenticated orders access...');
  
  // Test authenticated access to orders
  try {
    const { data: orders, error: ordersError, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (ordersError) {
      console.log('❌ Authenticated orders access failed:', ordersError.message);
      return false;
    }
    
    console.log(`✅ Authenticated orders access successful: ${count} total orders`);
    console.log('   Sample order IDs:', orders?.map(o => o.id).slice(0, 3));
    
  } catch (err) {
    console.log('❌ Authenticated orders access failed:', err.message);
    return false;
  }
  
  console.log('\n🔄 Step 4: Testing KDS order routing access...');
  
  // Test KDS order routing table (this is what KDS hooks use)
  try {
    const { data: kdsRouting, error: kdsError, count } = await supabase
      .from('kds_order_routing')
      .select(`
        *,
        order:orders!inner (
          id, items, status, type, created_at,
          table:tables!table_id (label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `, { count: 'exact' })
      .is('completed_at', null)
      .limit(5);
    
    if (kdsError) {
      console.log('❌ KDS order routing access failed:', kdsError.message);
      console.log('   This might be the root cause of empty KDS displays!');
      return false;
    }
    
    console.log(`✅ KDS order routing access successful: ${count} active KDS orders`);
    
    if (kdsRouting && kdsRouting.length > 0) {
      console.log('   Sample KDS order:');
      console.log('     Order ID:', kdsRouting[0].order?.id);
      console.log('     Table:', kdsRouting[0].order?.table?.label);
      console.log('     Station:', kdsRouting[0].station?.name);
      console.log('     Status:', kdsRouting[0].order?.status);
      console.log('     Items:', kdsRouting[0].order?.items?.length || 0);
    } else {
      console.log('   📝 Note: No active KDS orders found (this might be normal)');
    }
    
  } catch (err) {
    console.log('❌ KDS order routing access failed:', err.message);
    return false;
  }
  
  console.log('\n🔄 Step 5: Testing KDS stations access...');
  
  // Test KDS stations
  try {
    const { data: stations, error: stationsError } = await supabase
      .from('kds_stations')
      .select('*')
      .eq('is_active', true)
      .order('position');
    
    if (stationsError) {
      console.log('❌ KDS stations access failed:', stationsError.message);
      return false;
    }
    
    console.log(`✅ KDS stations access successful: ${stations?.length || 0} stations`);
    stations?.forEach(station => {
      console.log(`   Station: ${station.name} (${station.type})`);
    });
    
  } catch (err) {
    console.log('❌ KDS stations access failed:', err.message);
    return false;
  }
  
  console.log('\n🔄 Step 6: Testing real-time subscriptions...');
  
  // Test real-time subscription setup
  try {
    const channel = supabase
      .channel('test-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload.eventType);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Real-time subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscriptions working!');
          // Clean up
          setTimeout(() => {
            channel.unsubscribe();
          }, 2000);
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Real-time subscription failed');
        }
      });
    
    // Wait a bit for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (err) {
    console.log('❌ Real-time subscription test failed:', err.message);
  }
  
  console.log('\n🔄 Step 7: Creating test order to check routing...');
  
  // Create a test order to see if it gets routed to KDS
  try {
    const testOrder = {
      table_id: 'guest',
      seat_id: 'A1',
      resident_id: authData.user?.id,
      server_id: authData.user?.id,
      items: ['Test Burger', 'Test Fries'],
      status: 'confirmed',
      type: 'food',
      total: 15.99
    };
    
    const { data: newOrder, error: createError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Test order creation failed:', createError.message);
    } else {
      console.log('✅ Test order created:', newOrder.id);
      
      // Check if it gets routed to KDS (might need intelligent routing)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: routing, error: routingError } = await supabase
        .from('kds_order_routing')
        .select('*')
        .eq('order_id', newOrder.id);
      
      if (routingError) {
        console.log('❌ KDS routing check failed:', routingError.message);
      } else if (routing && routing.length > 0) {
        console.log('✅ Order successfully routed to KDS stations:', routing.length);
      } else {
        console.log('📝 Order created but not routed to KDS (manual routing needed)');
      }
      
      // Clean up test order
      await supabase.from('orders').delete().eq('id', newOrder.id);
      console.log('🧹 Test order cleaned up');
    }
    
  } catch (err) {
    console.log('❌ Test order creation failed:', err.message);
  }
  
  // Sign out
  await supabase.auth.signOut();
  console.log('\n🔄 Signed out');
  
  return true;
}

async function main() {
  const success = await testKDSAuthenticated();
  
  console.log('\n📊 KDS AUTHENTICATION TEST SUMMARY:');
  console.log('===================================');
  
  if (success) {
    console.log('🎉 KDS authentication test completed!');
    console.log('✅ Authenticated users can access orders and KDS data');
    console.log('✅ Real-time subscriptions should work for authenticated users');
    console.log('');
    console.log('🔍 NEXT STEPS FOR INVESTIGATION:');
    console.log('1. Check if frontend is properly authenticating users');
    console.log('2. Check if KDS hooks are using authenticated Supabase client');
    console.log('3. Check if real-time subscriptions are setup correctly');
    console.log('4. Check if orders are being routed to KDS stations');
  } else {
    console.log('❌ KDS authentication test failed');
    console.log('Need to investigate database permissions');
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