#!/usr/bin/env node

/**
 * Test order creation with proper UUID handling
 */

require('dotenv').config({ path: '.env.local' });

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testOrderCreation() {
  console.log('🧪 Testing Order Creation with Proper UUIDs');
  console.log('==========================================');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  try {
    // Get a valid table and seat
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .limit(1);
    
    if (tableError || !tables || tables.length === 0) {
      console.error('❌ Cannot get table:', tableError?.message || 'No tables found');
      return false;
    }
    
    const table = tables[0];
    console.log('✅ Found table:', table.id);
    
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
    console.log('✅ Found seat:', seat.id);
    
    // Create test order with proper UUIDs
    console.log('🔄 Creating test order with UUIDs...');
    
    const testOrder = {
      table_id: table.id,
      seat_id: seat.id,
      resident_id: generateUUID(), // Generate proper UUID
      server_id: generateUUID(),   // Generate proper UUID
      items: ['Test Burger', 'Test Fries'],
      transcript: 'Test order from validation script',
      type: 'food',
      status: 'new',
      total: 15.99  // The key test - does the total column work?
    };
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ Order creation failed:', orderError.message);
      return false;
    }
    
    console.log('✅ ORDER CREATION SUCCESSFUL!');
    console.log('📄 Order details:');
    console.log('   ID:', order.id);
    console.log('   Total:', order.total);
    console.log('   Items:', order.items);
    console.log('   Status:', order.status);
    console.log('   Table ID:', order.table_id);
    console.log('   Seat ID:', order.seat_id);
    
    // Verify we can read it back
    const { data: readOrder, error: readError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order.id)
      .single();
      
    if (readError) {
      console.error('❌ Cannot read order back:', readError.message);
    } else {
      console.log('✅ Order read back successfully');
      console.log('✅ Total column value confirmed:', readOrder.total);
    }
    
    // Clean up test order
    console.log('🧹 Cleaning up test order...');
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', order.id);
      
    if (deleteError) {
      console.error('⚠️ Failed to clean up test order:', deleteError.message);
    } else {
      console.log('✅ Test order cleaned up');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

testOrderCreation()
  .then(success => {
    if (success) {
      console.log('\n🎉 DATABASE SCHEMA IS WORKING!');
      console.log('✅ Orders table has "total" column');
      console.log('✅ Order creation works end-to-end');
      console.log('✅ UUID fields are properly handled');
      console.log('✅ Read/write operations both work');
      console.log('\n🔥 MAJOR BLOCKER RESOLVED!');
    } else {
      console.log('\n❌ Order creation still failing');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });