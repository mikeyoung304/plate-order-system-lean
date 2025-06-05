#!/usr/bin/env node

// Test with service role key for admin access

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eiipozoogrrfudhjoqms.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Set it with: export SUPABASE_SERVICE_ROLE_KEY="your_service_key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function testWithAuth() {
  console.log('🧪 Testing with service role authentication...\n');

  try {
    // Test 1: Check profiles table
    console.log('1. Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles.length} profiles`);
      if (profiles.length > 0) {
        console.log(`   Sample profile: ${profiles[0].name || profiles[0].id} (${profiles[0].role})`);
      }
    }

    // Test 2: Check tables
    console.log('\n2. Testing tables...');
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

    // Test 3: Check orders
    console.log('\n3. Testing orders...');
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

    // Test 4: Create sample data if missing
    if (tables.length === 0) {
      console.log('\n🔧 Creating sample tables...');
      const { data: newTables, error: createTablesError } = await supabase
        .from('tables')
        .insert([
          { label: '1', status: 'available', type: 'circle' },
          { label: '2', status: 'available', type: 'circle' },
          { label: '3', status: 'available', type: 'circle' },
        ])
        .select();
      
      if (createTablesError) {
        console.log('❌ Failed to create tables:', createTablesError.message);
      } else {
        console.log(`✅ Created ${newTables.length} sample tables`);
      }
    }

    return { profiles, tables, orders };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

if (require.main === module) {
  testWithAuth().then(result => {
    if (result) {
      console.log('\n🎯 Summary:');
      console.log(`- Profiles: ${result.profiles?.length || 0}`);
      console.log(`- Tables: ${result.tables?.length || 0}`);
      console.log(`- Orders: ${result.orders?.length || 0}`);
      
      if (result.profiles?.length > 0 && result.tables?.length > 0) {
        console.log('\n✅ Basic data exists - server page should work!');
      } else {
        console.log('\n⚠️  Missing data - need more seeding');
      }
    }
    process.exit(result ? 0 : 1);
  });
}

module.exports = testWithAuth;