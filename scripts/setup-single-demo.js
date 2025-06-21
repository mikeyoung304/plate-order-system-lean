import { createClient } from '@supabase/supabase-js';

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupSingleDemo() {
  try {
    console.log('🎯 SETTING UP SINGLE DEMO SYSTEM');
    console.log('=================================');
    
    // Create tables (6 tables with different seat counts)
    const tables = [
      { label: 1, type: 'round', status: 'occupied' },
      { label: 2, type: 'square', status: 'occupied' },
      { label: 3, type: 'booth', status: 'occupied' },
      { label: 4, type: 'round', status: 'occupied' },
      { label: 5, type: 'square', status: 'occupied' },
      { label: 6, type: 'booth', status: 'occupied' },
    ];
    
    console.log('🪑 Creating tables...');
    const { data: createdTables, error: tableError } = await client
      .from('tables')
      .insert(tables)
      .select();
    
    if (tableError) {
      console.log('❌ Error creating tables:', tableError.message);
      return;
    }
    console.log('✅ Created', createdTables.length, 'tables');
    
    // Resident names for reference (will be stored in orders)
    const residentNames = [
      'Mable Meatballs', 'Waffles Ohulahan', 'Bernie Bend', 'Alfonzo Fondu',
      'Chuck Winstein', 'Larry Winstein', 'Mary Choppins', 'Theodore Theopson',
      'Angry Sam', 'Big Betty', 'Salazar Salads', 'Frankie Buns',
      'Amelia Torres', 'Mike Young', 'Uncle Sal', 'Diego Doplenutter', 'Bill the 2nd'
    ];
    
    console.log('👥 Resident names ready for orders:', residentNames.length);
    
    // Create seats 
    const seats = [];
    const tableSeats = [4, 2, 6, 4, 2, 4]; // seats per table
    
    for (let tableIndex = 0; tableIndex < createdTables.length; tableIndex++) {
      const table = createdTables[tableIndex];
      const seatCount = tableSeats[tableIndex];
      
      for (let seatNum = 1; seatNum <= seatCount; seatNum++) {
        seats.push({
          label: seatNum,
          table_id: table.id,
          status: 'available',
        });
      }
    }
    
    console.log('💺 Creating seats...');
    const { data: createdSeats, error: seatError } = await client
      .from('seats')
      .insert(seats)
      .select();
    
    if (seatError) {
      console.log('❌ Error creating seats:', seatError.message);
      return;
    }
    console.log('✅ Created', createdSeats.length, 'seats');
    
    // Create some active orders for KDS testing
    const menuItems = [
      { name: 'Meatball Marinara', category: 'grill', price: 12.99 },
      { name: 'Belgian Waffle Stack', category: 'grill', price: 9.99 },
      { name: 'Cheese Fondue Pot', category: 'fryer', price: 15.99 },
      { name: 'Angry Wings', category: 'fryer', price: 11.99 },
      { name: 'Big Betty Burger', category: 'grill', price: 14.99 },
      { name: 'Caesar Salad', category: 'salad', price: 8.99 },
      { name: 'Frankie Pulled Pork Bun', category: 'grill', price: 13.99 },
      { name: 'Uncle Sal Special Cocktail', category: 'bar', price: 7.99 },
      { name: 'Doplenutter Smoothie', category: 'bar', price: 5.99 },
    ];
    
    const orders = [];
    const guestUserId = 'b0055f8c-d2c3-425f-add2-e4ee6572829e';
    
    // Create 5 active orders with your resident names
    for (let i = 0; i < 5; i++) {
      const table = createdTables[i % createdTables.length];
      const tableSeats = createdSeats.filter(s => s.table_id === table.id);
      const seat = tableSeats[0]; // First seat of the table
      const item = menuItems[i % menuItems.length];
      const residentName = residentNames[i % residentNames.length];
      
      orders.push({
        table_id: table.id,
        seat_id: seat.id,
        resident_id: guestUserId, // Use guest user as resident for demo
        server_id: guestUserId,
        items: [item],
        transcript: `${residentName} ordered ${item.name}`,
        status: i < 3 ? 'pending' : 'preparing',
        type: item.category === 'bar' ? 'beverage' : 'food',
        created_at: new Date(Date.now() - (i * 300000)).toISOString(), // Stagger times
      });
    }
    
    console.log('🍽️ Creating active orders for KDS...');
    const { data: createdOrders, error: orderError } = await client
      .from('orders')
      .insert(orders)
      .select();
    
    if (orderError) {
      console.log('❌ Error creating orders:', orderError.message);
      return;
    }
    console.log('✅ Created', createdOrders.length, 'active orders');
    
    console.log('\n🎉 SINGLE DEMO SYSTEM COMPLETE!');
    console.log('===============================');
    console.log('✅ Tables:', createdTables.length);
    console.log('✅ Resident Names:', residentNames.length);
    console.log('✅ Seats:', createdSeats.length);
    console.log('✅ Active Orders:', createdOrders.length);
    console.log('\n👤 Login with: guest@restaurant.plate / guest12345');
    console.log('🎮 System ready for testing!');
    
  } catch (error) {
    console.error('Setup error:', error.message);
  }
}

setupSingleDemo();