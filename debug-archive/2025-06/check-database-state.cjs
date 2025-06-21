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

async function checkDatabaseState() {
  console.log('🔍 Checking database state...\n');

  try {
    // Check profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .limit(5);
    
    console.log('👤 Profiles:', profiles?.length || 0);
    if (profiles?.length > 0) {
      profiles.forEach(p => console.log(`   - ${p.email} (${p.role})`));
    }

    // Check tables
    const { data: tables, error: tableError } = await supabase
      .from('table_configurations')
      .select('id, table_number, section')
      .limit(10);
    
    console.log('\n🪑 Tables:', tables?.length || 0);
    if (tables?.length > 0) {
      tables.forEach(t => console.log(`   - Table ${t.table_number} in ${t.section}`));
    }

    // Check menu items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price, category')
      .limit(10);
    
    console.log('\n🍽️  Menu Items:', menuItems?.length || 0);
    if (menuItems?.length > 0) {
      menuItems.forEach(m => console.log(`   - ${m.name} ($${m.price}) - ${m.category}`));
    }

    // Check existing orders
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, order_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('\n📋 Recent Orders:', orders?.length || 0);
    if (orders?.length > 0) {
      orders.forEach(o => console.log(`   - ${o.id.substring(0, 8)} (${o.order_status}) - ${new Date(o.created_at).toLocaleString()}`));
    }

    // Check order items
    const { data: orderItems, error: itemError } = await supabase
      .from('order_items')
      .select('id, station, item_status')
      .limit(10);
    
    console.log('\n📦 Order Items:', orderItems?.length || 0);
    if (orderItems?.length > 0) {
      const stationCounts = {};
      orderItems.forEach(item => {
        stationCounts[item.station] = (stationCounts[item.station] || 0) + 1;
      });
      Object.entries(stationCounts).forEach(([station, count]) => {
        console.log(`   - ${station}: ${count} items`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabaseState();