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

async function checkExistingData() {
  console.log('🔍 Checking existing data structure...\n');

  try {
    // Check for any existing orders
    const { data: existingOrders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false });

    if (existingOrders && existingOrders.length > 0) {
      console.log(`📋 Found ${existingOrders.length} existing orders:\n`);
      existingOrders.forEach(order => {
        console.log('Order:', order.id.substring(0, 8));
        console.log('  Table ID:', order.table_id);
        console.log('  Seat ID:', order.seat_id);
        console.log('  Server ID:', order.server_id?.substring(0, 8));
        console.log('  Status:', order.status);
        console.log('  Items:', order.items?.length || 0);
        if (order.items && order.items.length > 0) {
          console.log('  Sample item:', JSON.stringify(order.items[0], null, 2));
        }
        console.log('---');
      });
    } else {
      console.log('No existing orders found');
    }

    // Check what tables/seats might look like
    const { data: tables } = await supabase
      .from('tables')
      .select('*')
      .limit(5);

    if (tables && tables.length > 0) {
      console.log('\n🪑 Found tables:');
      tables.forEach(table => {
        console.log(`  Table ${table.number || table.id}`);
      });
    }

    // Check seats
    const { data: seats } = await supabase
      .from('seats')
      .select('*')
      .limit(5);

    if (seats && seats.length > 0) {
      console.log('\n💺 Found seats:');
      seats.forEach(seat => {
        console.log(`  Seat ${seat.id.substring(0, 8)} - Table: ${seat.table_id}`);
      });
    }

    // Check residents (seems like this system might be for a care facility)
    const { data: residents } = await supabase
      .from('residents')
      .select('*')
      .limit(5);

    if (residents && residents.length > 0) {
      console.log('\n👥 Found residents:');
      residents.forEach(resident => {
        console.log(`  ${resident.name} (${resident.id.substring(0, 8)})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkExistingData();