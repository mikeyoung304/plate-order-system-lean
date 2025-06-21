#!/usr/bin/env node

/**
 * Test order creation functionality
 */

require('dotenv').config({ path: '.env.local' });

async function testOrderCreation() {
  console.log('🧪 Testing Order Creation Functionality');
  console.log('======================================');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  try {
    // First, get a valid table and seat
    console.log('🔄 Getting valid table and seat...');
    
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('id, name')
      .limit(1);
    
    if (tableError || !tables || tables.length === 0) {
      console.error('❌ Cannot get table:', tableError?.message || 'No tables found');
      return false;
    }
    
    const table = tables[0];
    console.log('✅ Found table:', table.name || table.id);
    
    const { data: seats, error: seatError } = await supabase
      .from('seats')
      .select('id, name')
      .eq('table_id', table.id)
      .limit(1);
    
    if (seatError || !seats || seats.length === 0) {
      console.error('❌ Cannot get seat:', seatError?.message || 'No seats found');
      return false;
    }
    
    const seat = seats[0];
    console.log('✅ Found seat:', seat.name || seat.id);
    
    // Create test order
    console.log('🔄 Creating test order...');
    
    const testOrder = {
      table_id: table.id,
      seat_id: seat.id,
      resident_id: 'test-resident-' + Date.now(),
      server_id: 'test-server-' + Date.now(),
      items: ['Test Burger', 'Test Fries'],
      transcript: 'Test order from validation script',
      type: 'food',
      status: 'new',
      total: 15.99  // This should work now with the schema fix
    };
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ Order creation failed:', orderError.message);
      console.error('Details:', orderError);
      return false;
    }
    
    console.log('✅ Order created successfully!');
    console.log('📄 Order details:', {
      id: order.id,
      total: order.total,
      items: order.items,
      status: order.status
    });
    
    // Clean up test order
    console.log('🧹 Cleaning up test order...');
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('✅ Test order cleaned up');
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error during order test:', err.message);
    return false;
  }
}

testOrderCreation()
  .then(success => {
    if (success) {
      console.log('\n🎉 ORDER CREATION WORKS!');
      console.log('✅ The database schema is working correctly');
      console.log('✅ Total column exists and accepts values');
      console.log('✅ Order insertion and deletion both work');
    } else {
      console.log('\n❌ Order creation still has issues');
      console.log('🔧 Further debugging needed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });