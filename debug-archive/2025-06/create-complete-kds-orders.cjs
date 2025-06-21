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

async function createCompleteKDSOrders() {
  console.log('🚀 Creating complete test orders for KDS...\n');

  try {
    // Get all required data
    const { data: residents } = await supabase
      .from('residents')
      .select('*')
      .limit(3);

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

    if (!residents?.length) {
      console.error('❌ No residents found in database');
      
      // Check what profiles have resident role
      const { data: residentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'resident');
      
      console.log('Resident profiles:', residentProfiles?.length || 0);
      if (residentProfiles?.length > 0) {
        console.log('Found resident profiles:', residentProfiles.map(p => p.name).join(', '));
      }
      return;
    }

    console.log(`Found ${residents.length} residents: ${residents.map(r => r.name).join(', ')}`);

    // Create orders with all required fields including resident_id
    const testOrders = [
      {
        table_id: tables[0].id,
        seat_id: seats[0].id,
        resident_id: residents[0].id,  // Required field
        server_id: profiles[0].user_id,
        status: 'pending',
        type: 'dine-in',
        total: 45.97,
        notes: 'KDS Test - Hot station items',
        special_requests: 'Rush order',
        items: [
          {
            id: `item-${Date.now()}-1`,
            name: 'Grilled Chicken',
            price: 18.99,
            category: 'grill',
            quantity: 2,
            station: 'hot',
            status: 'pending',
            notes: 'Extra crispy',
            seat_number: 1
          },
          {
            id: `item-${Date.now()}-2`,
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
        resident_id: residents[1]?.id || residents[0].id,
        server_id: profiles[0].user_id,
        status: 'pending',
        type: 'dine-in',
        total: 32.97,
        notes: 'KDS Test - Cold station items',
        special_requests: '',
        items: [
          {
            id: `item-${Date.now()}-3`,
            name: 'Caesar Salad',
            price: 12.99,
            category: 'salads',
            quantity: 1,
            station: 'cold',
            status: 'pending',
            notes: 'No croutons',
            seat_number: 1
          },
          {
            id: `item-${Date.now()}-4`,
            name: 'Ice Cream Sundae',
            price: 8.99,
            category: 'desserts',
            quantity: 2,
            station: 'cold',
            status: 'pending',
            notes: 'Extra chocolate',
            seat_number: 1
          }
        ]
      },
      {
        table_id: tables[2]?.id || tables[0].id,
        seat_id: seats[2]?.id || seats[0].id,
        resident_id: residents[2]?.id || residents[0].id,
        server_id: profiles[0].user_id,
        status: 'pending',
        type: 'dine-in',
        total: 41.96,
        notes: 'KDS Test - Mixed stations',
        special_requests: 'Birthday meal',
        items: [
          {
            id: `item-${Date.now()}-5`,
            name: 'Beef Burger',
            price: 15.99,
            category: 'grill',
            quantity: 1,
            station: 'hot',
            status: 'pending',
            notes: 'Medium rare',
            seat_number: 1
          },
          {
            id: `item-${Date.now()}-6`,
            name: 'Onion Rings',
            price: 7.99,
            category: 'sides',
            quantity: 1,
            station: 'hot',
            status: 'pending',
            notes: '',
            seat_number: 1
          },
          {
            id: `item-${Date.now()}-7`,
            name: 'Garden Salad',
            price: 9.99,
            category: 'salads',
            quantity: 1,
            station: 'cold',
            status: 'in_progress',
            notes: 'Ranch on side',
            seat_number: 1
          },
          {
            id: `item-${Date.now()}-8`,
            name: 'Cheesecake',
            price: 7.99,
            category: 'desserts',
            quantity: 1,
            station: 'cold',
            status: 'pending',
            notes: 'Birthday candle',
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
        console.error('Details:', error);
      } else {
        successCount++;
        const hotCount = order.items.filter(i => i.station === 'hot').length;
        const coldCount = order.items.filter(i => i.station === 'cold').length;
        console.log(`✅ Created order ${successCount}: ${hotCount} hot items, ${coldCount} cold items`);
      }
    }

    if (successCount === 0) {
      console.log('\n❌ Failed to create any orders. The database schema might be different.');
      return;
    }

    // Verify the orders
    console.log('\n📊 Verifying KDS data...');
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'new'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (allOrders && allOrders.length > 0) {
      let totalHot = 0;
      let totalCold = 0;
      let noStation = 0;

      allOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (item.station === 'hot') totalHot++;
            else if (item.station === 'cold') totalCold++;
            else noStation++;
          });
        }
      });

      console.log(`\nFound ${allOrders.length} active orders:`);
      console.log(`🔥 Hot station items: ${totalHot}`);
      console.log(`❄️  Cold station items: ${totalCold}`);
      console.log(`❓ Items without station: ${noStation}`);
    }

    console.log('\n✨ Test orders created!');
    console.log('\n🔍 Next steps:');
    console.log('1. Go to /kitchen/kds');
    console.log('2. You should see orders grouped by Hot and Cold stations');
    console.log('3. If still no orders appear, the issue is likely in the frontend query or display logic\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createCompleteKDSOrders();