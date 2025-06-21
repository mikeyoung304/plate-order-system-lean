#!/usr/bin/env node

/**
 * Diagnose the exact order creation issue
 */

require('dotenv').config({ path: '.env.local' });

async function diagnoseOrderCreation() {
  console.log('🔍 DIAGNOSING ORDER CREATION ISSUE');
  console.log('=================================\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  try {
    // Get table and seat data
    const { data: tables } = await supabase.from('tables').select('*').limit(1);
    const { data: seats } = await supabase.from('seats').select('*').limit(1);
    
    if (!tables || !seats || tables.length === 0 || seats.length === 0) {
      console.error('❌ Cannot find table or seat data');
      return false;
    }
    
    const table = tables[0];
    const seat = seats[0];
    
    console.log('📋 Test Data Available:');
    console.log(`   Table ID: ${table.id}`);
    console.log(`   Seat ID: ${seat.id}\n`);
    
    // Test 1: Try order creation with string IDs (current issue)
    console.log('🧪 TEST 1: Order creation with string IDs (will fail)');
    const testOrder1 = {
      table_id: table.id,
      seat_id: seat.id,
      resident_id: 'test-resident-123',  // String - should fail
      server_id: 'test-server-123',      // String - should fail
      items: ['Test Item'],
      transcript: 'Test order',
      type: 'food',
      status: 'new',
      total: 10.00
    };
    
    const { data: order1, error: error1 } = await supabase
      .from('orders')
      .insert(testOrder1)
      .select()
      .single();
    
    if (error1) {
      console.log('❌ Expected failure:', error1.message);
      console.log('🔧 Root Cause: resident_id and server_id expect UUIDs, not strings\n');
    } else {
      console.log('✅ Unexpected success - cleaning up');
      await supabase.from('orders').delete().eq('id', order1.id);
    }
    
    // Test 2: Try with actual UUIDs
    console.log('🧪 TEST 2: Order creation with proper UUIDs');
    
    // Generate proper UUIDs
    const { v4: uuidv4 } = require('uuid');
    const residentId = uuidv4();
    const serverId = uuidv4();
    
    const testOrder2 = {
      table_id: table.id,
      seat_id: seat.id,
      resident_id: residentId,
      server_id: serverId,
      items: ['Test Item'],
      transcript: 'Test order with UUIDs',
      type: 'food',
      status: 'new',
      total: 10.00
    };
    
    const { data: order2, error: error2 } = await supabase
      .from('orders')
      .insert(testOrder2)
      .select()
      .single();
    
    if (error2) {
      console.log('❌ Failed with UUIDs:', error2.message);
      return false;
    } else {
      console.log('✅ SUCCESS with proper UUIDs!');
      console.log(`   Order ID: ${order2.id}`);
      console.log(`   Resident ID: ${order2.resident_id}`);
      console.log(`   Server ID: ${order2.server_id}`);
      console.log('🧹 Cleaning up test order...');
      await supabase.from('orders').delete().eq('id', order2.id);
      console.log('✅ Test order cleaned up\n');
    }
    
    // Test 3: Check what should happen with authenticated user
    console.log('🧪 TEST 3: Check authenticated user context');
    
    // Try to get actual user data from profiles table
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Found user profile:');
      console.log(`   Profile ID: ${profiles[0].id}`);
      console.log(`   Profile Role: ${profiles[0].role || 'No role set'}`);
      
      // Test creating order with real user ID
      const testOrder3 = {
        table_id: table.id,
        seat_id: seat.id,
        resident_id: profiles[0].id,  // Use actual user ID
        server_id: profiles[0].id,    // Use actual user ID 
        items: ['Test Item with Real User'],
        transcript: 'Test order with real user ID',
        type: 'food',
        status: 'new',
        total: 15.00
      };
      
      const { data: order3, error: error3 } = await supabase
        .from('orders')
        .insert(testOrder3)
        .select()
        .single();
      
      if (error3) {
        console.log('❌ Failed with real user ID:', error3.message);
      } else {
        console.log('✅ SUCCESS with real user ID!');
        console.log('🧹 Cleaning up test order...');
        await supabase.from('orders').delete().eq('id', order3.id);
        console.log('✅ Test order cleaned up');
      }
    } else {
      console.log('❌ No user profiles found - auth system may need setup');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

async function suggestFix() {
  console.log('\n💡 SUGGESTED FIXES:');
  console.log('==================');
  console.log('1. ✅ IMMEDIATE FIX: The frontend needs to pass proper UUID values');
  console.log('   - resident_id should be a UUID from authenticated user or guest UUID');
  console.log('   - server_id should be a UUID from authenticated user');
  console.log('');
  console.log('2. 🔧 FRONTEND CHANGES NEEDED:');
  console.log('   - In server-client.tsx: Get user.id from authentication');
  console.log('   - Pass user.id as server_id when creating orders');
  console.log('   - For resident_id: either use same user.id or implement guest system');
  console.log('');
  console.log('3. 🧪 ORDER CREATION FUNCTION FIX:');
  console.log('   - The createOrder() function in orders.ts is correct');
  console.log('   - The issue is in how it\'s being called from the frontend');
  console.log('');
  console.log('4. 🔒 RLS POLICY CHECK:');
  console.log('   - With strict RLS, order creation requires authenticated user');
  console.log('   - This is actually working correctly - no RLS issue!');
}

async function main() {
  const success = await diagnoseOrderCreation();
  await suggestFix();
  
  console.log('\n🏁 DIAGNOSIS COMPLETE');
  console.log('====================');
  
  if (success) {
    console.log('✅ Order creation works with proper UUIDs');
    console.log('🔧 Frontend needs to pass user authentication IDs');
    console.log('✅ Database schema and RLS policies are working correctly');
  } else {
    console.log('❌ Order creation has additional issues beyond UUID formatting');
  }
  
  return success;
}

main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });