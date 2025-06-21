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

async function seedAndTestKDS() {
  console.log('🌱 Seeding database and creating test orders for KDS...\n');

  try {
    // Step 1: Create a test profile (cook/kitchen user)
    console.log('👤 Creating test profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        email: 'test-cook@restaurant.plate',
        full_name: 'Test Cook',
        role: 'cook'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      return;
    }
    console.log('✅ Created profile:', profile.email);

    // Step 2: Create test tables
    console.log('\n🪑 Creating test tables...');
    const tablesToCreate = [
      { table_number: 1, section: 'Main', capacity: 4 },
      { table_number: 2, section: 'Main', capacity: 2 },
      { table_number: 3, section: 'Patio', capacity: 6 },
      { table_number: 4, section: 'Bar', capacity: 2 }
    ];

    const { data: tables, error: tableError } = await supabase
      .from('table_configurations')
      .insert(tablesToCreate)
      .select();

    if (tableError) {
      console.error('❌ Error creating tables:', tableError);
      return;
    }
    console.log('✅ Created', tables.length, 'tables');

    // Step 3: Create test menu items
    console.log('\n🍽️  Creating test menu items...');
    const menuItemsToCreate = [
      { name: 'Grilled Chicken', price: 18.99, category: 'Entrees', station: 'hot' },
      { name: 'Caesar Salad', price: 12.99, category: 'Salads', station: 'cold' },
      { name: 'Beef Burger', price: 15.99, category: 'Entrees', station: 'hot' },
      { name: 'French Fries', price: 6.99, category: 'Sides', station: 'hot' },
      { name: 'Ice Cream', price: 7.99, category: 'Desserts', station: 'cold' },
      { name: 'Pasta Carbonara', price: 16.99, category: 'Entrees', station: 'hot' }
    ];

    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .insert(menuItemsToCreate)
      .select();

    if (menuError) {
      console.error('❌ Error creating menu items:', menuError);
      return;
    }
    console.log('✅ Created', menuItems.length, 'menu items');

    // Step 4: Create test orders
    console.log('\n📋 Creating test orders...');
    
    // Order 1 - Table 1, multiple items
    const { data: order1, error: order1Error } = await supabase
      .from('orders')
      .insert({
        table_id: tables[0].id,
        profile_id: profile.id,
        order_status: 'active',
        notes: 'Allergic to nuts'
      })
      .select()
      .single();

    if (order1Error) {
      console.error('❌ Error creating order 1:', order1Error);
      return;
    }

    const order1Items = [
      {
        order_id: order1.id,
        menu_item_id: menuItems.find(m => m.name === 'Grilled Chicken').id,
        quantity: 2,
        seat_number: 1,
        item_status: 'pending',
        notes: 'Well done',
        station: 'hot'
      },
      {
        order_id: order1.id,
        menu_item_id: menuItems.find(m => m.name === 'Caesar Salad').id,
        quantity: 1,
        seat_number: 2,
        item_status: 'pending',
        notes: 'No croutons',
        station: 'cold'
      },
      {
        order_id: order1.id,
        menu_item_id: menuItems.find(m => m.name === 'French Fries').id,
        quantity: 2,
        seat_number: 1,
        item_status: 'in_progress',
        notes: '',
        station: 'hot'
      }
    ];

    await supabase.from('order_items').insert(order1Items);
    console.log('✅ Created order 1 with', order1Items.length, 'items');

    // Order 2 - Table 2, rush order
    const { data: order2, error: order2Error } = await supabase
      .from('orders')
      .insert({
        table_id: tables[1].id,
        profile_id: profile.id,
        order_status: 'active',
        notes: 'RUSH - Customer in a hurry'
      })
      .select()
      .single();

    if (order2Error) {
      console.error('❌ Error creating order 2:', order2Error);
      return;
    }

    const order2Items = [
      {
        order_id: order2.id,
        menu_item_id: menuItems.find(m => m.name === 'Beef Burger').id,
        quantity: 1,
        seat_number: 1,
        item_status: 'pending',
        notes: 'No pickles, add bacon',
        station: 'hot'
      },
      {
        order_id: order2.id,
        menu_item_id: menuItems.find(m => m.name === 'French Fries').id,
        quantity: 1,
        seat_number: 1,
        item_status: 'pending',
        notes: 'Extra crispy',
        station: 'hot'
      }
    ];

    await supabase.from('order_items').insert(order2Items);
    console.log('✅ Created order 2 with', order2Items.length, 'items (RUSH)');

    // Order 3 - Table 3, mixed stations
    const { data: order3, error: order3Error } = await supabase
      .from('orders')
      .insert({
        table_id: tables[2].id,
        profile_id: profile.id,
        order_status: 'active',
        notes: 'Birthday celebration'
      })
      .select()
      .single();

    if (order3Error) {
      console.error('❌ Error creating order 3:', order3Error);
      return;
    }

    const order3Items = [
      {
        order_id: order3.id,
        menu_item_id: menuItems.find(m => m.name === 'Pasta Carbonara').id,
        quantity: 1,
        seat_number: 1,
        item_status: 'pending',
        notes: '',
        station: 'hot'
      },
      {
        order_id: order3.id,
        menu_item_id: menuItems.find(m => m.name === 'Caesar Salad').id,
        quantity: 2,
        seat_number: 2,
        item_status: 'pending',
        notes: 'Dressing on the side',
        station: 'cold'
      },
      {
        order_id: order3.id,
        menu_item_id: menuItems.find(m => m.name === 'Ice Cream').id,
        quantity: 1,
        seat_number: 3,
        item_status: 'pending',
        notes: 'Birthday candle',
        station: 'cold'
      }
    ];

    await supabase.from('order_items').insert(order3Items);
    console.log('✅ Created order 3 with', order3Items.length, 'items (mixed stations)');

    // Step 5: Verify KDS query
    console.log('\n📊 Verifying KDS query...');
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

    console.log('\n✅ KDS Query Results:');
    console.log('Found', kdsOrders.length, 'active orders');
    
    kdsOrders.forEach(order => {
      console.log(`\n📋 Order ${order.id.substring(0, 8)}...`);
      console.log(`   Table: ${order.table_configurations.table_number}`);
      console.log(`   Status: ${order.order_status}`);
      console.log(`   Notes: ${order.notes || 'None'}`);
      console.log(`   Items: ${order.order_items.length}`);
      
      const hotItems = order.order_items.filter(i => i.station === 'hot');
      const coldItems = order.order_items.filter(i => i.station === 'cold');
      
      if (hotItems.length > 0) {
        console.log('   🔥 Hot Station:');
        hotItems.forEach(item => {
          console.log(`      - ${item.quantity}x ${item.menu_items.name} (${item.item_status})`);
          if (item.notes) console.log(`        Notes: ${item.notes}`);
        });
      }
      
      if (coldItems.length > 0) {
        console.log('   ❄️  Cold Station:');
        coldItems.forEach(item => {
          console.log(`      - ${item.quantity}x ${item.menu_items.name} (${item.item_status})`);
          if (item.notes) console.log(`        Notes: ${item.notes}`);
        });
      }
    });

    console.log('\n✨ Database seeded successfully!');
    console.log('\n🔍 Next steps:');
    console.log('1. Check the KDS page at /kitchen/kds');
    console.log('2. If orders appear - the original issue was missing data');
    console.log('3. If orders don\'t appear - there\'s a frontend display issue');
    console.log('\nThe database now contains:');
    console.log('- 1 cook profile');
    console.log('- 4 tables');
    console.log('- 6 menu items');
    console.log('- 3 active orders with multiple items\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

seedAndTestKDS();