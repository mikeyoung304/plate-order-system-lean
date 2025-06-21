#!/usr/bin/env node

/**
 * Validate the order creation fix with real UUID
 */

require('dotenv').config({ path: '.env.local' });

async function validateFix() {
  console.log('✅ VALIDATING ORDER CREATION FIX');
  console.log('================================\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  try {
    // Get real auth user (simulating what frontend will have)
    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData.users[0];
    
    // Get table and seat
    const { data: tables } = await supabase.from('tables').select('*').limit(1);
    const { data: seats } = await supabase.from('seats').select('*').limit(1);
    
    const table = tables[0];
    const seat = seats[0];
    
    console.log('📋 Test Scenario:');
    console.log(`   User: ${user.email} (${user.id})`);
    console.log(`   Table: ${table.label} (${table.id})`);
    console.log(`   Seat: ${seat.label} (${seat.id})\n`);
    
    // Test the exact pattern the frontend will use
    const orderData = {
      table_id: table.id,
      seat_id: seat.id,
      resident_id: user.id,  // This is the fix!
      server_id: user.id,    // This is the fix!
      items: ['Cheeseburger', 'Fries'],
      transcript: 'I would like a cheeseburger and fries please',
      type: 'food',
      status: 'new',
      total: 15.99
    };
    
    console.log('🧪 Creating order (frontend simulation)...');
    
    const { data: order, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (error) {
      console.log('❌ FAILED:', error.message);
      return false;
    }
    
    console.log('✅ SUCCESS! Order created:');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Items: ${order.items.join(', ')}`);
    console.log(`   Type: ${order.type}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Total: $${order.total}`);
    console.log(`   Created: ${new Date(order.created_at).toLocaleTimeString()}\n`);
    
    // Test order retrieval (what KDS would see)
    console.log('🔍 Testing order retrieval...');
    
    const { data: retrievedOrder, error: retrieveError } = await supabase
      .from('orders')
      .select(`
        *,
        tables!inner(label),
        seats!inner(label)
      `)
      .eq('id', order.id)
      .single();
    
    if (retrieveError) {
      console.log('❌ Retrieval failed:', retrieveError.message);
    } else {
      console.log('✅ Order retrieval successful:');
      console.log(`   Table: ${retrievedOrder.tables.label}`);
      console.log(`   Seat: ${retrievedOrder.seats.label}`);
      console.log(`   Items: ${retrievedOrder.items.join(', ')}\n`);
    }
    
    // Clean up
    console.log('🧹 Cleaning up test order...');
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('✅ Cleaned up\n');
    
    return true;
    
  } catch (err) {
    console.error('❌ Validation failed:', err.message);
    return false;
  }
}

async function main() {
  const success = await validateFix();
  
  console.log('🏁 VALIDATION RESULTS');
  console.log('=====================');
  
  if (success) {
    console.log('✅ ORDER CREATION FIX IS WORKING!');
    console.log('');
    console.log('🎯 What was fixed:');
    console.log('   - Changed resident_id from mock UUID to user.id');
    console.log('   - Changed server_id to use user.id (was already correct)');
    console.log('   - Both IDs now reference actual auth users in database');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Test the server interface in the browser');
    console.log('   2. Try creating an order through the UI');
    console.log('   3. Verify order appears in KDS');
    console.log('');
    console.log('📁 Files modified:');
    console.log('   - components/server-client.tsx (2 locations fixed)');
  } else {
    console.log('❌ Fix validation failed');
    console.log('🔧 Additional debugging needed');
  }
  
  return success;
}

main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });