const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eiipozoogrrfudhjoqms.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaXBvem9vZ3JyZnVkaGpvcW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDIwNzI3OSwiZXhwIjoyMDU5NzgzMjc5fQ.p7DodpQaPooDVFQTAkXKWRdp0ZGMzzXib9cfxGauLko';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkStationsAndRouting() {
  console.log('🏭 KDS Stations Configuration:');
  console.log('=================================');
  
  const { data: stations, error: stationError } = await supabase
    .from('kds_stations')
    .select('*')
    .order('position');
  
  if (stationError) {
    console.error('❌ Error fetching stations:', stationError);
    return;
  }
  
  stations.forEach((station, idx) => {
    console.log(`${idx + 1}. ${station.name} (${station.type})`);
    console.log(`   ID: ${station.id}`);
    console.log(`   Active: ${station.is_active}`);
    console.log(`   Position: ${station.position}`);
    console.log(`   Color: ${station.color}`);
    console.log('');
  });
  
  console.log('🔢 Database Orders vs Routed Orders Analysis:');
  console.log('=============================================');
  
  const { data: allOrders, error: orderError } = await supabase
    .from('orders')
    .select('id, items, type, created_at, status')
    .order('created_at', { ascending: false })
    .limit(20);
    
  const { data: routedOrders, error: routingError } = await supabase
    .from('kds_order_routing')
    .select('order_id, station_id, routed_at')
    .is('completed_at', null);
  
  if (orderError || routingError) {
    console.error('❌ Error fetching data:', orderError || routingError);
    return;
  }
  
  console.log(`📊 Total Orders: ${allOrders?.length || 0}`);
  console.log(`📊 Active Routed Orders: ${routedOrders?.length || 0}`);
  
  const routedOrderIds = new Set(routedOrders?.map(r => r.order_id) || []);
  const unroutedOrders = allOrders?.filter(order => !routedOrderIds.has(order.id)) || [];
  
  console.log(`📊 Unrouted Orders: ${unroutedOrders.length}`);
  
  if (unroutedOrders.length > 0) {
    console.log('\n⚠️  Orders NOT Routed to KDS:');
    unroutedOrders.slice(0, 8).forEach((order, idx) => {
      const itemsText = Array.isArray(order.items) 
        ? order.items.map(item => typeof item === 'object' ? item.name || item : item).join(', ')
        : JSON.stringify(order.items);
      console.log(`  ${idx + 1}. Order ${order.id.slice(-6)} - ${order.type} - Status: ${order.status}`);
      console.log(`     Items: ${itemsText}`);
      console.log(`     Created: ${new Date(order.created_at).toLocaleString()}`);
      console.log('');
    });
  }
  
  console.log('\n🎯 Routing Keywords Analysis:');
  console.log('============================');
  
  // Test routing keywords against actual order items
  const routingRules = {
    grill: ['steak', 'burger', 'chicken', 'beef', 'pork', 'grilled', 'barbecue', 'bbq'],
    fryer: ['fries', 'fried', 'tempura', 'wings', 'nuggets', 'crispy'],
    salad: ['salad', 'greens', 'vegetables', 'fresh', 'raw', 'lettuce'],
    prep: ['soup', 'sauce', 'dressing', 'marinade', 'prep'],
    dessert: ['dessert', 'cake', 'ice cream', 'sweet', 'chocolate', 'fruit'],
  };
  
  // Sample some routed orders to see routing accuracy
  const { data: sampleRoutedOrders } = await supabase
    .from('kds_order_routing')
    .select(`
      *,
      order:orders!inner (id, items, type),
      station:kds_stations!station_id (name, type)
    `)
    .is('completed_at', null)
    .limit(5);
    
  if (sampleRoutedOrders && sampleRoutedOrders.length > 0) {
    console.log('Sample Routing Analysis:');
    sampleRoutedOrders.forEach((routing, idx) => {
      const itemsText = Array.isArray(routing.order.items) 
        ? routing.order.items.map(item => typeof item === 'object' ? item.name || item : item).join(' ').toLowerCase()
        : JSON.stringify(routing.order.items).toLowerCase();
      
      console.log(`${idx + 1}. Station: ${routing.station.name} (${routing.station.type})`);
      console.log(`   Items: ${itemsText}`);
      
      // Check if routing makes sense
      const stationType = routing.station.type;
      const keywords = routingRules[stationType] || [];
      const matchedKeywords = keywords.filter(keyword => itemsText.includes(keyword));
      
      if (matchedKeywords.length > 0) {
        console.log(`   ✅ Routing Logic: Matched keywords [${matchedKeywords.join(', ')}]`);
      } else if (stationType === 'expo') {
        console.log(`   ✅ Routing Logic: Default expo routing`);
      } else {
        console.log(`   ⚠️  Routing Logic: No obvious keyword match for ${stationType}`);
      }
      console.log('');
    });
  }
  
  console.log('\n📈 Summary & Recommendations:');
  console.log('=============================');
  
  if (unroutedOrders.length > 0) {
    console.log(`❌ ISSUE: ${unroutedOrders.length} orders exist but are not routed to KDS`);
    console.log('   This suggests either:');
    console.log('   1. Orders were created before routing logic was implemented');
    console.log('   2. intelligentOrderRouting() is not being called during order creation');
    console.log('   3. There was an error during the routing process');
    console.log('');
    console.log('🔧 RECOMMENDATION: Run routing for unrouted orders');
    console.log('   Use intelligentOrderRouting(orderId) for each unrouted order');
  }
  
  if (routedOrders.length > 0) {
    console.log(`✅ GOOD: ${routedOrders.length} orders are properly routed to KDS stations`);
  }
  
  console.log(`📊 Station Count: ${stations.length} active stations available`);
  console.log(`📊 Routing Coverage: ${Math.round((routedOrders.length / Math.max(allOrders.length, 1)) * 100)}% of recent orders are routed`);
}

checkStationsAndRouting().catch(console.error);