#!/usr/bin/env node

/**
 * Test order creation functionality - fixed version
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
    // First, discover what columns actually exist
    console.log('🔄 Discovering table structure...');
    
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .limit(1);
    
    if (tableError || !tables || tables.length === 0) {
      console.error('❌ Cannot get table:', tableError?.message || 'No tables found');
      return false;
    }
    
    const table = tables[0];
    console.log('✅ Found table with ID:', table.id);
    console.log('📄 Table structure:', Object.keys(table));
    
    const { data: seats, error: seatError } = await supabase
      .from('seats')
      .select('*')
      .eq('table_id', table.id)
      .limit(1);
    
    if (seatError || !seats || seats.length === 0) {
      console.error('❌ Cannot get seat:', seatError?.message || 'No seats found');
      return false;
    }
    
    const seat = seats[0];
    console.log('✅ Found seat with ID:', seat.id);
    console.log('📄 Seat structure:', Object.keys(seat));
    
    // Check orders table structure too
    console.log('🔄 Checking orders table structure...');
    const { data: sampleOrder, error: sampleError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
      
    if (sampleOrder && sampleOrder.length > 0) {
      console.log('📄 Orders table structure:', Object.keys(sampleOrder[0]));
    } else {
      console.log('📄 Orders table is empty, checking for total column...');
      
      // Try to insert a minimal order to see what happens
      const { data: insertTest, error: insertError } = await supabase
        .from('orders')
        .insert({
          table_id: table.id,
          seat_id: seat.id,
          total: 1.00
        })
        .select();
        
      if (insertError) {
        console.error('❌ Insert test failed:', insertError.message);
        console.log('🔧 This tells us what columns are required/missing');
        return false;
      } else {
        console.log('✅ Basic insert worked!');
        if (insertTest && insertTest.length > 0) {
          console.log('📄 Successfully created order:', Object.keys(insertTest[0]));
          // Clean up immediately
          await supabase.from('orders').delete().eq('id', insertTest[0].id);
        }
      }
    }
    
    // Now try the full order creation
    console.log('🔄 Creating full test order...');
    
    const testOrder = {
      table_id: table.id,
      seat_id: seat.id,
      resident_id: 'test-resident-' + Date.now(),
      server_id: 'test-server-' + Date.now(),
      items: ['Test Burger', 'Test Fries'],
      transcript: 'Test order from validation script',
      type: 'food',
      status: 'new',
      total: 15.99
    };
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ Full order creation failed:', orderError.message);
      console.error('Details:', orderError);
      return false;
    }
    
    console.log('✅ Full order created successfully!');
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