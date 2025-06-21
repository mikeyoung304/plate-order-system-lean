#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
  console.log('🔍 Inspecting database schema...\n');

  try {
    // Check auth.users first (profiles might be linked to auth)
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    console.log('👤 Auth Users:', authUser?.users?.length || 0);
    if (authUser?.users?.length > 0) {
      authUser.users.slice(0, 3).forEach(u => {
        console.log(`   - ${u.email} (${u.id})`);
      });
    }

    // Try to query profiles with just id
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (!profileError && profiles?.length > 0) {
      console.log('\n📊 Profile columns:', Object.keys(profiles[0]));
    } else if (profileError) {
      console.log('\n❌ Profile error:', profileError.message);
    }

    // Check table_configurations schema
    const { data: tables, error: tableError } = await supabase
      .from('table_configurations')
      .select('*')
      .limit(1);

    if (!tableError && tables?.length > 0) {
      console.log('\n📊 Table columns:', Object.keys(tables[0]));
    } else if (tableError) {
      console.log('\n❌ Table error:', tableError.message);
    }

    // Check menu_items schema
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .limit(1);

    if (!menuError && menuItems?.length > 0) {
      console.log('\n📊 Menu Item columns:', Object.keys(menuItems[0]));
    } else if (menuError) {
      console.log('\n❌ Menu Items error:', menuError.message);
    }

    // Check orders schema
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (!orderError && orders?.length > 0) {
      console.log('\n📊 Order columns:', Object.keys(orders[0]));
    } else if (orderError) {
      console.log('\n❌ Orders error:', orderError.message);
    }

    // Check order_items schema
    const { data: orderItems, error: itemError } = await supabase
      .from('order_items')
      .select('*')
      .limit(1);

    if (!itemError && orderItems?.length > 0) {
      console.log('\n📊 Order Item columns:', Object.keys(orderItems[0]));
    } else if (itemError) {
      console.log('\n❌ Order Items error:', itemError.message);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

inspectSchema();