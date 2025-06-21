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

async function createKDSTestOrders() {
  console.log('🚀 Creating test orders for KDS display...\n');

  try {
    // Get existing data to use
    const { data: tables } = await supabase
      .from('tables')
      .select('*')
      .limit(3);

    const { data: seats } = await supabase
      .from('seats')
      .select('*')
      .limit(3);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (!tables?.length || !seats?.length || !profiles?.length) {
      console.error('❌ Not enough data in database');
      return;
    }

    console.log(`Using ${tables.length} tables, ${seats.length} seats, and profile: ${profiles[0].name}`);

    // Create orders with proper station information in items
    const testOrders = [
      {
        table_id: tables[0].id,
        seat_id: seats[0].id,
        server_id: profiles[0].user_id,
        status: 'pending',
        type: 'dine-in',
        total: 45.97,
        notes: 'KDS Test Order 1 - RUSH',
        items: [
          {
            name: 'Grilled Chicken Sandwich',
            price: 18.99,
            category: 'grill',
            quantity: 2,
            station: 'hot',
            status: 'pending',
            notes: 'Extra crispy, no mayo',
            seat_number: 1
          },
          {
            name: 'Caesar Salad',
            price: 12.99,
            category: 'salads',
            quantity: 1,
            station: 'cold',
            status: 'pending',
            notes: 'Dressing on side',
            seat_number: 2
          },
          {
            name: 'French Fries',
            price: 6.99,
            category: 'sides',
            quantity: 1,
            station: 'hot',
            status: 'in_progress',
            notes: 'Well done',
            seat_number: 1
          }
        ]
      },
      {
        table_id: tables[1]?.id || tables[0].id,
        seat_id: seats[1]?.id || seats[0].id,
        server_id: profiles[0].user_id,
        status: 'pending',
        type: 'dine-in',
        total: 52.97,
        notes: 'KDS Test Order 2',
        items: [
          {
            name: 'NY Strip Steak',
            price: 28.99,
            category: 'grill',
            quantity: 1,
            station: 'hot',
            status: 'pending',
            notes: 'Medium rare, extra butter',
            seat_number: 1
          },
          {
            name: 'Loaded Baked Potato',
            price: 8.99,
            category: 'sides',
            quantity: 1,
            station: 'hot',
            status: 'pending',
            notes: 'Extra bacon',
            seat_number: 1
          },
          {
            name: 'House Salad',
            price: 9.99,
            category: 'salads',
            quantity: 1,
            station: 'cold',
            status: 'pending',
            notes: 'Ranch dressing',
            seat_number: 1
          },
          {
            name: 'Chocolate Mousse',
            price: 7.99,
            category: 'desserts',
            quantity: 1,
            station: 'cold',
            status: 'pending',
            notes: 'Birthday candle',
            seat_number: 1
          }
        ]
      },
      {
        table_id: tables[2]?.id || tables[0].id,
        seat_id: seats[2]?.id || seats[0].id,
        server_id: profiles[0].user_id,
        status: 'pending',
        type: 'dine-in',
        total: 31.97,
        notes: 'KDS Test Order 3 - Vegetarian',
        items: [
          {
            name: 'Veggie Burger',
            price: 14.99,
            category: 'grill',
            quantity: 1,
            station: 'hot',
            status: 'pending',
            notes: 'Gluten free bun',
            seat_number: 1
          },
          {
            name: 'Sweet Potato Fries',
            price: 7.99,
            category: 'sides',
            quantity: 1,
            station: 'hot',
            status: 'pending',
            notes: '',
            seat_number: 1
          },
          {
            name: 'Greek Salad',
            price: 11.99,
            category: 'salads',
            quantity: 1,
            station: 'cold',
            status: 'in_progress',
            notes: 'No feta cheese',
            seat_number: 1
          }
        ]
      }
    ];

    // Insert orders
    let successCount = 0;
    for (const order of testOrders) {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select();

      if (error) {
        console.error(`❌ Error creating order:`, error.message);
      } else {
        successCount++;
        console.log(`✅ Created order ${successCount} with ${order.items.length} items`);
      }
    }

    // Check current orders with station info
    console.log('\n📊 Checking KDS-ready orders...');
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allOrders && allOrders.length > 0) {
      const hotItems = [];
      const coldItems = [];
      
      allOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (item.station === 'hot') {
              hotItems.push({ 
                ...item, 
                orderId: order.id.substring(0, 8),
                tableId: order.table_id.substring(0, 8),
                orderNotes: order.notes 
              });
            } else if (item.station === 'cold') {
              coldItems.push({ 
                ...item, 
                orderId: order.id.substring(0, 8),
                tableId: order.table_id.substring(0, 8),
                orderNotes: order.notes 
              });
            }
          });
        }
      });

      console.log(`\n🔥 Hot Station Items: ${hotItems.length}`);
      hotItems.forEach(item => {
        console.log(`   Order ${item.orderId}: ${item.quantity}x ${item.name} - ${item.status}`);
        if (item.notes) console.log(`     Item notes: ${item.notes}`);
        if (item.orderNotes) console.log(`     Order notes: ${item.orderNotes}`);
      });

      console.log(`\n❄️  Cold Station Items: ${coldItems.length}`);
      coldItems.forEach(item => {
        console.log(`   Order ${item.orderId}: ${item.quantity}x ${item.name} - ${item.status}`);
        if (item.notes) console.log(`     Item notes: ${item.notes}`);
        if (item.orderNotes) console.log(`     Order notes: ${item.orderNotes}`);
      });

      console.log(`\n📝 Items without station: ${allOrders.reduce((count, order) => {
        if (order.items && Array.isArray(order.items)) {
          return count + order.items.filter(item => !item.station).length;
        }
        return count;
      }, 0)}`);
    }

    console.log('\n✨ Test complete!');
    console.log('\n🔍 Next steps:');
    console.log('1. Check the KDS page at /kitchen/kds');
    console.log('2. Look for orders grouped by Hot and Cold stations');
    console.log('3. If no orders appear, check browser console for errors');
    console.log('4. The issue might be that existing orders don\'t have station info in items\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createKDSTestOrders();