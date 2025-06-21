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
  console.log('🚀 Creating test orders with actual schema...\n');

  try {
    // Get existing profiles to use as servers
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id, name, role')
      .limit(5);
    
    if (!profiles || profiles.length === 0) {
      console.error('❌ No profiles found in database');
      return;
    }

    console.log('Found profiles:', profiles.map(p => `${p.name} (${p.role})`).join(', '));

    // Use the first profile as the server
    const serverId = profiles[0].user_id;

    // Create test orders with items embedded
    const testOrders = [
      {
        table_id: '1',
        seat_id: '1A',
        server_id: serverId,
        status: 'pending',
        type: 'dine-in',
        total: 45.97,
        notes: 'Rush order - customer in a hurry',
        items: [
          {
            id: 'item-1',
            name: 'Grilled Chicken',
            quantity: 2,
            price: 18.99,
            station: 'hot',
            status: 'pending',
            notes: 'Well done, no sauce',
            seat_number: 1
          },
          {
            id: 'item-2',
            name: 'Caesar Salad',
            quantity: 1,
            price: 12.99,
            station: 'cold',
            status: 'pending',
            notes: 'Dressing on the side',
            seat_number: 2
          },
          {
            id: 'item-3',
            name: 'French Fries',
            quantity: 1,
            price: 6.99,
            station: 'hot',
            status: 'in_progress',
            notes: 'Extra crispy',
            seat_number: 1
          }
        ]
      },
      {
        table_id: '2',
        seat_id: '2B',
        server_id: serverId,
        status: 'pending',
        type: 'dine-in',
        total: 32.98,
        notes: 'Birthday celebration',
        items: [
          {
            id: 'item-4',
            name: 'Beef Burger',
            quantity: 1,
            price: 15.99,
            station: 'hot',
            status: 'pending',
            notes: 'Medium rare, add bacon',
            seat_number: 1
          },
          {
            id: 'item-5',
            name: 'Pasta Carbonara',
            quantity: 1,
            price: 16.99,
            station: 'hot',
            status: 'pending',
            notes: '',
            seat_number: 2
          }
        ]
      },
      {
        table_id: '3',
        seat_id: '3A',
        server_id: serverId,
        status: 'pending',
        type: 'dine-in',
        total: 26.97,
        notes: 'Vegetarian customer',
        items: [
          {
            id: 'item-6',
            name: 'Garden Salad',
            quantity: 1,
            price: 10.99,
            station: 'cold',
            status: 'pending',
            notes: 'No cheese, extra vegetables',
            seat_number: 1
          },
          {
            id: 'item-7',
            name: 'Veggie Wrap',
            quantity: 1,
            price: 12.99,
            station: 'cold',
            status: 'pending',
            notes: 'Gluten free wrap',
            seat_number: 1
          },
          {
            id: 'item-8',
            name: 'Sweet Potato Fries',
            quantity: 1,
            price: 7.99,
            station: 'hot',
            status: 'pending',
            notes: '',
            seat_number: 1
          }
        ]
      }
    ];

    // Insert orders
    for (const order of testOrders) {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select();

      if (error) {
        console.error(`❌ Error creating order for table ${order.table_id}:`, error);
      } else {
        console.log(`✅ Created order for table ${order.table_id} with ${order.items.length} items`);
      }
    }

    // Verify orders can be retrieved
    console.log('\n📊 Verifying orders...');
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError);
      return;
    }

    console.log(`\n✅ Found ${orders.length} orders in the database`);
    
    // Group by station
    const hotStationItems = [];
    const coldStationItems = [];
    
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.station === 'hot') {
            hotStationItems.push({ ...item, table: order.table_id, orderId: order.id });
          } else if (item.station === 'cold') {
            coldStationItems.push({ ...item, table: order.table_id, orderId: order.id });
          }
        });
      }
    });

    console.log(`\n🔥 Hot Station: ${hotStationItems.length} items`);
    hotStationItems.forEach(item => {
      console.log(`   - Table ${item.table}: ${item.quantity}x ${item.name} (${item.status})`);
      if (item.notes) console.log(`     Notes: ${item.notes}`);
    });

    console.log(`\n❄️  Cold Station: ${coldStationItems.length} items`);
    coldStationItems.forEach(item => {
      console.log(`   - Table ${item.table}: ${item.quantity}x ${item.name} (${item.status})`);
      if (item.notes) console.log(`     Notes: ${item.notes}`);
    });

    console.log('\n✨ Test orders created successfully!');
    console.log('\n🔍 Next steps:');
    console.log('1. Check the KDS page at /kitchen/kds');
    console.log('2. Orders should now appear grouped by station');
    console.log('3. If they don\'t appear, check the browser console for errors\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestOrders();