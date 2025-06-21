#!/usr/bin/env node

/**
 * Fix KDS Routing - Route existing orders and fix the system
 */

require('dotenv').config({ path: '.env.local' });

async function fixKDSRouting() {
  console.log('🔧 Fixing KDS Routing System');
  console.log('===========================');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  // Authenticate first
  const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'guest@restaurant.plate',
    password: 'guest12345'
  });
  
  if (loginError) {
    console.log('❌ Authentication failed:', loginError.message);
    return false;
  }
  
  console.log('✅ Authenticated successfully');
  
  console.log('\n🔄 Step 1: Get all unrouted orders...');
  
  // Get all orders that need routing (active orders)
  const { data: unroutedOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id, status, type, items, table_id, created_at')
    .in('status', ['new', 'confirmed', 'preparing', 'pending'])
    .order('created_at', { ascending: true });
  
  if (ordersError) {
    console.log('❌ Failed to fetch orders:', ordersError.message);
    return false;
  }
  
  console.log(`📊 Found ${unroutedOrders?.length || 0} active orders to route`);
  
  if (!unroutedOrders || unroutedOrders.length === 0) {
    console.log('📝 No active orders to route');
    return true;
  }
  
  console.log('\n🔄 Step 2: Get available KDS stations...');
  
  const { data: stations, error: stationsError } = await supabase
    .from('kds_stations')
    .select('*')
    .eq('is_active', true)
    .order('position');
  
  if (stationsError) {
    console.log('❌ Failed to fetch stations:', stationsError.message);
    return false;
  }
  
  console.log(`📊 Found ${stations?.length || 0} active stations`);
  stations?.forEach(station => {
    console.log(`   ${station.name} (${station.type}) - ${station.id}`);
  });
  
  if (!stations || stations.length === 0) {
    console.log('❌ No active stations found - cannot route orders');
    return false;
  }
  
  console.log('\n🔄 Step 3: Implement intelligent routing logic...');
  
  // Smart routing rules based on order type and items
  const getStationsForOrder = (order) => {
    const routeToStations = [];
    
    if (order.type === 'beverage' || order.type === 'drink') {
      // Route beverages to bar
      const barStation = stations.find(s => s.type === 'bar');
      if (barStation) {
        routeToStations.push({ station: barStation, priority: 1, sequence: 1 });
      }
      return routeToStations;
    }
    
    // Analyze food items
    const items = Array.isArray(order.items) ? order.items : [];
    const itemText = items.map(item => 
      typeof item === 'string' ? item : (item.name || '')
    ).join(' ').toLowerCase();
    
    console.log(`   Order ${order.id.slice(0, 8)}: "${itemText}"`);
    
    let sequence = 1;
    
    // Routing rules for different stations
    const routingRules = {
      grill: ['burger', 'steak', 'chicken', 'beef', 'pork', 'grilled', 'bbq', 'meatball', 'marinara'],
      fryer: ['fries', 'fried', 'wings', 'nuggets', 'crispy', 'tempura'],
      salad: ['salad', 'greens', 'vegetables', 'fresh', 'raw', 'lettuce'],
      bar: ['beer', 'wine', 'cocktail', 'soda', 'juice', 'drink'],
      expo: [] // Expo handles final assembly
    };
    
    // Check which stations need this order
    for (const [stationType, keywords] of Object.entries(routingRules)) {
      if (stationType === 'expo') continue; // Skip expo for now
      
      const matches = keywords.some(keyword => itemText.includes(keyword));
      
      if (matches) {
        const station = stations.find(s => s.type === stationType);
        if (station) {
          const priority = stationType === 'grill' ? 2 : 1; // Grill gets higher priority
          routeToStations.push({ station, priority, sequence: sequence++ });
          console.log(`     → Route to ${station.name} (${stationType})`);
        }
      }
    }
    
    // If no specific routing found, route to first available food station (usually grill)
    if (routeToStations.length === 0) {
      const defaultStation = stations.find(s => s.type === 'grill') || 
                             stations.find(s => s.type !== 'bar' && s.type !== 'expo') ||
                             stations[0];
      
      if (defaultStation) {
        routeToStations.push({ station: defaultStation, priority: 1, sequence: 1 });
        console.log(`     → Default route to ${defaultStation.name}`);
      }
    }
    
    return routeToStations;
  };
  
  console.log('\n🔄 Step 4: Route all unrouted orders...');
  
  let routedCount = 0;
  let failedCount = 0;
  
  for (const order of unroutedOrders) {
    console.log(`\n🔄 Routing order ${order.id.slice(0, 8)}...`);
    
    try {
      const stationsToRoute = getStationsForOrder(order);
      
      if (stationsToRoute.length === 0) {
        console.log(`   ❌ No stations determined for order ${order.id.slice(0, 8)}`);
        failedCount++;
        continue;
      }
      
      // Route to all determined stations
      for (const { station, priority, sequence } of stationsToRoute) {
        const routingData = {
          order_id: order.id,
          station_id: station.id,
          sequence: sequence,
          priority: priority,
          routed_at: new Date().toISOString(),
          recall_count: 0
        };
        
        const { error: routingError } = await supabase
          .from('kds_order_routing')
          .insert(routingData);
        
        if (routingError) {
          if (routingError.message.includes('duplicate') || routingError.code === '23505') {
            console.log(`   📝 Already routed to ${station.name}`);
          } else {
            console.log(`   ❌ Failed to route to ${station.name}:`, routingError.message);
            failedCount++;
          }
        } else {
          console.log(`   ✅ Routed to ${station.name}`);
          routedCount++;
        }
      }
      
    } catch (err) {
      console.log(`   ❌ Error routing order ${order.id.slice(0, 8)}:`, err.message);
      failedCount++;
    }
  }
  
  console.log('\n🔄 Step 5: Verify routing worked...');
  
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
    .is('completed_at', null)
    .order('routed_at', { ascending: false })
    .limit(10);
  
  if (verifyError) {
    console.log('❌ Verification failed:', verifyError.message);
  } else {
    console.log(`✅ Verification successful: ${verifyRouting?.length || 0} active KDS orders`);
    
    if (verifyRouting && verifyRouting.length > 0) {
      console.log('   Sample routed orders:');
      verifyRouting.slice(0, 5).forEach((routing, i) => {
        console.log(`   ${i + 1}. ${routing.order?.id?.slice(0, 8)} → ${routing.station?.name}`);
        console.log(`      Table: ${routing.order?.table?.label || routing.order?.table_id}`);
        console.log(`      Items: ${JSON.stringify(routing.order?.items)}`);
      });
    }
  }
  
  console.log('\n🔄 Step 6: Update order status to confirmed...');
  
  // Update order status to confirmed so they show up properly in KDS
  for (const order of unroutedOrders) {
    if (order.status === 'new' || order.status === 'pending') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);
      
      if (updateError) {
        console.log(`   ❌ Failed to update order ${order.id.slice(0, 8)} status`);
      } else {
        console.log(`   ✅ Updated order ${order.id.slice(0, 8)} to confirmed`);
      }
    }
  }
  
  await supabase.auth.signOut();
  
  console.log('\n📊 ROUTING FIX SUMMARY:');
  console.log(`✅ Successfully routed: ${routedCount} order-station mappings`);
  console.log(`❌ Failed routings: ${failedCount}`);
  console.log(`📋 Orders processed: ${unroutedOrders.length}`);
  
  return routedCount > 0;
}

async function main() {
  const success = await fixKDSRouting();
  
  console.log('\n🎉 KDS ROUTING FIX COMPLETED!');
  console.log('============================');
  
  if (success) {
    console.log('✅ Orders have been routed to KDS stations');
    console.log('✅ KDS displays should now show orders');
    console.log('');
    console.log('🔍 NEXT STEPS:');
    console.log('1. Test KDS displays in the app');
    console.log('2. Verify real-time updates work');
    console.log('3. Fix order creation to auto-route new orders');
    console.log('4. Test bump/complete functionality');
  } else {
    console.log('❌ Routing fix failed or no orders to route');
    console.log('   Check the logs above for details');
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