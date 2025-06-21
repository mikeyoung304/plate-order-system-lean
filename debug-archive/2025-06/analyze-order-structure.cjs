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

async function analyzeOrderStructure() {
  console.log('🔍 Analyzing order structure and creating KDS test data...\n');

  try {
    // Get one complete existing order to understand the structure
    const { data: sampleOrder, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .limit(1)
      .single();

    if (sampleOrder) {
      console.log('📋 Sample order structure:');
      console.log(JSON.stringify(sampleOrder, null, 2));
      console.log('\n');
    }

    // Get resident profiles
    const { data: residentProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'resident')
      .limit(3);

    const { data: serverProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['server', 'admin', 'cook'])
      .limit(1);

    if (!residentProfiles?.length || !serverProfiles?.length) {
      console.error('❌ Not enough profiles found');
      return;
    }

    console.log(`Using residents: ${residentProfiles.map(p => p.name).join(', ')}`);
    console.log(`Using server: ${serverProfiles[0].name} (${serverProfiles[0].role})\n`);

    // Create orders that match the existing structure but with station info
    const testOrders = [
      {
        table_id: sampleOrder?.table_id || 'dd5c5a4c-3872-42f8-aa27-491d597a2ad8',
        seat_id: sampleOrder?.seat_id || '75abf17e-3737-4773-b8c9-0adeefa73eaa',
        resident_id: residentProfiles[0].user_id || residentProfiles[0].id,
        server_id: serverProfiles[0].user_id,
        status: 'pending',
        type: 'dine-in',
        total: 35.98,
        notes: 'KDS Test 1 - Hot Station Focus',
        special_requests: 'Rush - customer waiting',
        items: [
          {
            id: `hot-${Date.now()}-1`,
            name: 'Bacon Cheeseburger',
            price: 16.99,
            category: 'grill',
            quantity: 1,
            station: 'hot',
            item_status: 'pending',
            notes: 'Medium well, extra bacon',
            seat: 1
          },
          {
            id: `hot-${Date.now()}-2`,
            name: 'Loaded Fries',
            price: 8.99,
            category: 'sides',
            quantity: 1,
            station: 'hot',
            item_status: 'in_progress',
            notes: 'Extra cheese sauce',
            seat: 1
          },
          {
            id: `cold-${Date.now()}-1`,
            name: 'Side Salad',
            price: 6.99,
            category: 'salads',
            quantity: 1,
            station: 'cold',
            item_status: 'pending',
            notes: 'Ranch dressing',
            seat: 1
          }
        ]
      },
      {
        table_id: sampleOrder?.table_id || '3e5b7654-a838-4281-a37c-1f870c8ba4cb',
        seat_id: sampleOrder?.seat_id || '113b1121-2e9e-4c35-b95c-8e0379ff7006',
        resident_id: residentProfiles[1]?.user_id || residentProfiles[0].user_id,
        server_id: serverProfiles[0].user_id,
        status: 'pending',
        type: 'dine-in',
        total: 28.97,
        notes: 'KDS Test 2 - Cold Station Focus',
        special_requests: '',
        items: [
          {
            id: `cold-${Date.now()}-2`,
            name: 'Chef Salad',
            price: 14.99,
            category: 'salads',
            quantity: 1,
            station: 'cold',
            item_status: 'pending',
            notes: 'No ham, extra turkey',
            seat: 1
          },
          {
            id: `cold-${Date.now()}-3`,
            name: 'Fruit Bowl',
            price: 7.99,
            category: 'sides',
            quantity: 1,
            station: 'cold',
            item_status: 'pending',
            notes: 'No melon',
            seat: 1
          },
          {
            id: `cold-${Date.now()}-4`,
            name: 'Tiramisu',
            price: 8.99,
            category: 'desserts',
            quantity: 1,
            station: 'cold',
            item_status: 'pending',
            notes: 'Extra whipped cream',
            seat: 1
          }
        ]
      },
      {
        table_id: sampleOrder?.table_id || '5ad1c524-dada-4cbe-b639-8dbdabada093',
        seat_id: sampleOrder?.seat_id || 'a37f2e09-0821-4f4d-b5b4-e074eb4f1155',
        resident_id: residentProfiles[2]?.user_id || residentProfiles[0].user_id,
        server_id: serverProfiles[0].user_id,
        status: 'pending',
        type: 'dine-in',
        total: 52.96,
        notes: 'KDS Test 3 - Mixed Stations',
        special_requests: 'Birthday dinner',
        items: [
          {
            id: `hot-${Date.now()}-3`,
            name: 'Ribeye Steak',
            price: 28.99,
            category: 'grill',
            quantity: 1,
            station: 'hot',
            item_status: 'pending',
            notes: 'Medium rare, extra garlic butter',
            seat: 1
          },
          {
            id: `hot-${Date.now()}-4`,
            name: 'Mashed Potatoes',
            price: 6.99,
            category: 'sides',
            quantity: 1,
            station: 'hot',
            item_status: 'pending',
            notes: 'Extra gravy',
            seat: 1
          },
          {
            id: `cold-${Date.now()}-5`,
            name: 'Caesar Salad',
            price: 11.99,
            category: 'salads',
            quantity: 1,
            station: 'cold',
            item_status: 'in_progress',
            notes: 'Light dressing',
            seat: 1
          },
          {
            id: `cold-${Date.now()}-6`,
            name: 'Birthday Cake Slice',
            price: 8.99,
            category: 'desserts',
            quantity: 1,
            station: 'cold',
            item_status: 'pending',
            notes: 'Add candle and song',
            seat: 1
          }
        ]
      }
    ];

    // Insert the test orders
    let created = 0;
    for (const order of testOrders) {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select();

      if (error) {
        console.error(`❌ Error creating order ${created + 1}:`, error.message);
      } else {
        created++;
        const hot = order.items.filter(i => i.station === 'hot').length;
        const cold = order.items.filter(i => i.station === 'cold').length;
        console.log(`✅ Created order ${created}: ${order.notes} (${hot} hot, ${cold} cold items)`);
      }
    }

    // Final check
    console.log('\n📊 Final KDS check...');
    const { data: finalOrders } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'new'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (finalOrders) {
      let hotTotal = 0, coldTotal = 0, noStation = 0;
      
      finalOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (item.station === 'hot') hotTotal++;
            else if (item.station === 'cold') coldTotal++;
            else noStation++;
          });
        }
      });

      console.log(`\nDatabase now contains:`);
      console.log(`- ${finalOrders.length} active orders`);
      console.log(`- ${hotTotal} items for hot station`);
      console.log(`- ${coldTotal} items for cold station`);
      console.log(`- ${noStation} items without station assignment`);
      
      if (noStation > 0) {
        console.log('\n⚠️  Warning: Some existing orders don\'t have station info');
        console.log('This might be why the KDS shows no orders');
      }
    }

    console.log('\n✨ Done!');
    console.log('\n🔍 Please check /kitchen/kds now');
    console.log('If orders still don\'t appear, the issue is in the frontend code\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeOrderStructure();