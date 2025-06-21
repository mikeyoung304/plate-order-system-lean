#!/usr/bin/env node

/**
 * Investigate the complete database schema to understand foreign key constraints
 */

require('dotenv').config({ path: '.env.local' });

async function investigateSchema() {
  console.log('🔍 INVESTIGATING DATABASE SCHEMA');
  console.log('================================\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  console.log('1. 📋 AVAILABLE TABLES:');
  console.log('======================');
  
  const tables = ['tables', 'seats', 'orders', 'profiles'];
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        const count = data?.length || 0;
        if (count > 0) {
          console.log(`✅ ${tableName}: Available (columns: ${Object.keys(data[0]).join(', ')})`);
        } else {
          console.log(`⚠️ ${tableName}: Empty table`);
        }
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }
  
  console.log('\n2. 🔗 CHECKING FOR RESIDENTS TABLE:');
  console.log('===================================');
  
  try {
    const { data: residents, error: resError } = await supabase
      .from('residents')
      .select('*')
      .limit(5);
      
    if (resError) {
      console.log('❌ residents table:', resError.message);
      console.log('🔧 This explains the foreign key constraint error!');
    } else {
      console.log('✅ residents table exists');
      console.log(`📊 Found ${residents?.length || 0} residents`);
      if (residents && residents.length > 0) {
        console.log('📄 Resident structure:', Object.keys(residents[0]));
        console.log('📋 Sample residents:');
        residents.forEach(r => {
          console.log(`   - ${r.id}: ${r.name || 'Unnamed'}`);
        });
      }
    }
  } catch (err) {
    console.log('❌ residents table access failed:', err.message);
  }
  
  console.log('\n3. 👥 CHECKING FOR SERVERS/STAFF TABLE:');
  console.log('======================================');
  
  const potentialStaffTables = ['servers', 'staff', 'employees'];
  let foundStaffTable = false;
  
  for (const staffTable of potentialStaffTables) {
    try {
      const { data: staff, error: staffError } = await supabase
        .from(staffTable)
        .select('*')
        .limit(5);
        
      if (!staffError && staff) {
        console.log(`✅ ${staffTable} table exists`);
        console.log(`📊 Found ${staff.length || 0} ${staffTable}`);
        if (staff.length > 0) {
          console.log('📄 Structure:', Object.keys(staff[0]));
        }
        foundStaffTable = true;
      }
    } catch (err) {
      // Table doesn't exist, continue
    }
  }
  
  if (!foundStaffTable) {
    console.log('❌ No dedicated staff/servers table found');
    console.log('🔧 server_id might need to reference profiles table instead');
  }
  
  console.log('\n4. 👤 CHECKING PROFILES TABLE FOR USER DATA:');
  console.log('===========================================');
  
  try {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
      
    if (profileError) {
      console.log('❌ profiles table:', profileError.message);
    } else {
      console.log('✅ profiles table exists');
      console.log(`📊 Found ${profiles?.length || 0} profiles`);
      if (profiles && profiles.length > 0) {
        console.log('📄 Profile structure:', Object.keys(profiles[0]));
        console.log('📋 Sample profiles:');
        profiles.forEach(p => {
          console.log(`   - ${p.id}: ${p.email || p.name || 'Unnamed'} (${p.role || 'no role'})`);
        });
      }
    }
  } catch (err) {
    console.log('❌ profiles table access failed:', err.message);
  }
  
  console.log('\n5. 🧪 TESTING ORDER CREATION WITH REAL DATA:');
  console.log('===========================================');
  
  try {
    // Get real table and seat
    const { data: tables } = await supabase.from('tables').select('*').limit(1);
    const { data: seats } = await supabase.from('seats').select('*').limit(1);
    const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
    
    if (!tables || !seats || tables.length === 0 || seats.length === 0) {
      console.log('❌ Missing table or seat data');
      return false;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ No profiles found - cannot test with real user');
      return false;
    }
    
    const table = tables[0];
    const seat = seats[0];
    const profile = profiles[0];
    
    console.log(`📋 Using: Table ${table.id}, Seat ${seat.id}, Profile ${profile.id}`);
    
    // Try to check if we can use profile as both resident and server
    const testOrder = {
      table_id: table.id,
      seat_id: seat.id,
      resident_id: profile.id,  // Use profile as resident
      server_id: profile.id,    // Use profile as server
      items: ['Test Item'],
      transcript: 'Test order with profile IDs',
      type: 'food',
      status: 'new',
      total: 10.00
    };
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (orderError) {
      console.log('❌ Order creation failed:', orderError.message);
      console.log('🔧 Details:', orderError);
    } else {
      console.log('✅ SUCCESS! Order created with profile IDs');
      console.log(`   Order ID: ${order.id}`);
      console.log('🧹 Cleaning up...');
      await supabase.from('orders').delete().eq('id', order.id);
      console.log('✅ Cleaned up');
    }
    
    return !orderError;
    
  } catch (err) {
    console.log('❌ Test failed:', err.message);
    return false;
  }
}

async function provideSolution() {
  console.log('\n💡 SOLUTION:');
  console.log('============');
  console.log('Based on the investigation, here\'s what needs to be fixed:');
  console.log('');
  console.log('1. 📋 DATABASE CONSTRAINTS:');
  console.log('   - resident_id must reference an existing record (probably profiles table)');
  console.log('   - server_id must reference an existing record (probably profiles table)');
  console.log('');
  console.log('2. 🔧 FRONTEND FIX NEEDED:');
  console.log('   - Get authenticated user ID from Supabase auth');
  console.log('   - Use user.id for both resident_id and server_id');
  console.log('   - Ensure user is properly authenticated before order creation');
  console.log('');
  console.log('3. 📁 FILES TO MODIFY:');
  console.log('   - components/server-client.tsx: Add proper user ID handling');
  console.log('   - Order creation flow: Pass authenticated user.id');
  console.log('');
  console.log('4. ✅ QUICK TEST:');
  console.log('   - Login as authenticated user first');
  console.log('   - Use that user\'s ID for order creation');
  console.log('   - Should resolve both UUID and foreign key issues');
}

async function main() {
  const success = await investigateSchema();
  await provideSolution();
  
  console.log('\n🏁 INVESTIGATION COMPLETE');
  console.log('========================');
  
  if (success) {
    console.log('✅ Found the solution: Use authenticated user profile ID');
    console.log('🔧 Frontend needs authentication integration fix');
  } else {
    console.log('❌ Additional investigation needed');
  }
  
  return success;
}

main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });