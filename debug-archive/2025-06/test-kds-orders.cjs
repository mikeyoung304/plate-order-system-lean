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

async function createTestOrders() {
  console.log('🚀 Creating test orders for KDS...\n');

  try {
    // First, get some valid IDs from the database
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();
    
    const { data: tables } = await supabase
      .from('table_configurations')
      .select('id')
      .limit(2);
    
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, name, price')
      .limit(3);

    if (!profiles || !tables || tables.length < 2 || !menuItems || menuItems.length < 3) {
      console.error('❌ Not enough data in database to create test orders');
      return;
    }

    const profileId = profiles.id;
    const table1Id = tables[0].id;
    const table2Id = tables[1].id;

    console.log('Using profile ID:', profileId);
    console.log('Using table IDs:', table1Id, table2Id);
    console.log('Using menu items:', menuItems.map(item => item.name).join(', '));

    // Create Order 1 - Two items for table 1
    const order1 = {
      table_id: table1Id,
      profile_id: profileId,
      order_status: 'active',
      notes: 'Test order 1 - Rush order'
    };

    const { data: createdOrder1, error: orderError1 } = await supabase
      .from('orders')
      .insert(order1)
      .select()
      .single();

    if (orderError1) {
      console.error('❌ Error creating order 1:', orderError1);
      return;
    }

    console.log('✅ Created order 1:', createdOrder1.id);

    // Add items to order 1
    const orderItems1 = [
      {
        order_id: createdOrder1.id,
        menu_item_id: menuItems[0].id,
        quantity: 2,
        seat_number: 1,
        item_status: 'pending',
        notes: 'No onions',
        station: 'hot'
      },
      {
        order_id: createdOrder1.id,
        menu_item_id: menuItems[1].id,
        quantity: 1,
        seat_number: 2,
        item_status: 'pending',
        notes: 'Extra spicy',
        station: 'hot'
      }
    ];

    const { error: itemsError1 } = await supabase
      .from('order_items')
      .insert(orderItems1);

    if (itemsError1) {
      console.error('❌ Error adding items to order 1:', itemsError1);
      return;
    }

    console.log('✅ Added items to order 1');

    // Create Order 2 - Three items for table 2
    const order2 = {
      table_id: table2Id,
      profile_id: profileId,
      order_status: 'active',
      notes: 'Test order 2 - Birthday celebration'
    };

    const { data: createdOrder2, error: orderError2 } = await supabase
      .from('orders')
      .insert(order2)
      .select()
      .single();

    if (orderError2) {
      console.error('❌ Error creating order 2:', orderError2);
      return;
    }

    console.log('✅ Created order 2:', createdOrder2.id);

    // Add items to order 2
    const orderItems2 = [
      {
        order_id: createdOrder2.id,
        menu_item_id: menuItems[0].id,
        quantity: 1,
        seat_number: 1,
        item_status: 'pending',
        notes: '',
        station: 'hot'
      },
      {
        order_id: createdOrder2.id,
        menu_item_id: menuItems[1].id,
        quantity: 1,
        seat_number: 1,
        item_status: 'in_progress',
        notes: 'Well done',
        station: 'hot'
      },
      {
        order_id: createdOrder2.id,
        menu_item_id: menuItems[2].id,
        quantity: 2,
        seat_number: 2,
        item_status: 'pending',
        notes: '',
        station: 'cold'
      }
    ];

    const { error: itemsError2 } = await supabase
      .from('order_items')
      .insert(orderItems2);

    if (itemsError2) {
      console.error('❌ Error adding items to order 2:', itemsError2);
      return;
    }

    console.log('✅ Added items to order 2');

    // Now verify the orders can be retrieved with KDS query
    console.log('\n📊 Verifying orders in KDS query...\n');

    const { data: kdsOrders, error: kdsError } = await supabase
      .from('orders')
      .select(`
        *,
        table_configurations!inner (
          id,
          table_number
        ),
        order_items!inner (
          *,
          menu_items (
            id,
            name,
            price
          )
        )
      `)
      .eq('order_status', 'active')
      .not('order_items.station', 'is', null);

    if (kdsError) {
      console.error('❌ Error fetching KDS orders:', kdsError);
      return;
    }

    console.log('✅ Found', kdsOrders.length, 'active orders in KDS query');
    
    kdsOrders.forEach(order => {
      console.log(`\n📋 Order ${order.id.substring(0, 8)}...`);
      console.log(`   Table: ${order.table_configurations.table_number}`);
      console.log(`   Items: ${order.order_items.length}`);
      console.log(`   Notes: ${order.notes || 'None'}`);
      
      order.order_items.forEach(item => {
        console.log(`   - ${item.quantity}x ${item.menu_items.name} (${item.station}) - ${item.item_status}`);
        if (item.notes) console.log(`     Notes: ${item.notes}`);
      });
    });

    console.log('\n✅ Test orders created successfully!');
    console.log('\n🔍 Now check the KDS page to see if these orders appear.');
    console.log('   If they don\'t appear, the issue is with the frontend display.');
    console.log('   If they do appear, the original issue was with the data.\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestOrders();