#!/usr/bin/env node

// Simple functionality test to verify the app is working

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eiipozoogrrfudhjoqms.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaXBvem9vZ3JyZnVkaGpvcW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzOTY0MTIsImV4cCI6MjA0OTk3MjQxMn0.Pj-V3CnhRU1EJ4bOwK1I9q6RNBg5VNFhq5xL9aZGq0g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFunctionality() {
  console.log('🧪 Testing core functionality...\n');

  try {
    // Test 1: Check tables exist
    console.log('1. Testing tables data...');
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('*')
      .limit(5);
    
    if (tablesError) {
      console.log('❌ Tables error:', tablesError.message);
    } else {
      console.log(`✅ Found ${tables.length} tables`);
      if (tables.length > 0) {
        console.log(`   Sample table: ${tables[0].label || tables[0].id}`);
      }
    }

    // Test 2: Check residents exist
    console.log('\n2. Testing residents data...');
    const { data: residents, error: residentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'resident')
      .limit(5);
    
    if (residentsError) {
      console.log('❌ Residents error:', residentsError.message);
    } else {
      console.log(`✅ Found ${residents.length} residents`);
      if (residents.length > 0) {
        console.log(`   Sample resident: ${residents[0].name || residents[0].id}`);
      }
    }

    // Test 3: Check orders
    console.log('\n3. Testing orders data...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    
    if (ordersError) {
      console.log('❌ Orders error:', ordersError.message);
    } else {
      console.log(`✅ Found ${orders.length} orders`);
      if (orders.length > 0) {
        console.log(`   Sample order: ${orders[0].items?.slice(0, 2).join(', ') || 'No items'}`);
      }
    }

    // Test 4: Check KDS stations
    console.log('\n4. Testing KDS stations...');
    const { data: stations, error: stationsError } = await supabase
      .from('kds_stations')
      .select('*')
      .eq('is_active', true);
    
    if (stationsError) {
      console.log('❌ KDS stations error:', stationsError.message);
    } else {
      console.log(`✅ Found ${stations.length} active KDS stations`);
      stations.forEach(station => {
        console.log(`   Station: ${station.name} (${station.id})`);
      });
    }

    // Test 5: Check KDS routing
    console.log('\n5. Testing KDS order routing...');
    const { data: routing, error: routingError } = await supabase
      .from('kds_order_routing')
      .select('*')
      .limit(5);
    
    if (routingError) {
      console.log('❌ KDS routing error:', routingError.message);
    } else {
      console.log(`✅ Found ${routing.length} KDS routing entries`);
    }

    console.log('\n🎯 SUMMARY:');
    console.log(`Tables: ${tables?.length || 0}`);
    console.log(`Residents: ${residents?.length || 0}`);
    console.log(`Orders: ${orders?.length || 0}`);
    console.log(`KDS Stations: ${stations?.length || 0}`);
    console.log(`KDS Routing: ${routing?.length || 0}`);

    if (tables?.length > 0 && residents?.length > 0 && stations?.length > 0) {
      console.log('\n✅ Core data exists - app should work!');
      return true;
    } else {
      console.log('\n⚠️  Missing core data - may need seeding');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  testFunctionality().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testFunctionality;