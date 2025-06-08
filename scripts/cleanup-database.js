import { createClient } from '@supabase/supabase-js';

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDatabase() {
  try {
    console.log('🗑️ CLEANING UP DATABASE');
    console.log('========================');
    
    // Get all users
    const { data: users } = await client.auth.admin.listUsers();
    
    // Find target user to keep
    const targetUser = users.users.find(u => u.email === 'guest@restaurant.plate');
    if (!targetUser) {
      console.log('❌ Target user guest@restaurant.plate not found!');
      return;
    }
    
    console.log('✅ Keeping user:', targetUser.email, '(' + targetUser.id + ')');
    
    // Delete all other users
    const usersToDelete = users.users.filter(u => u.id !== targetUser.id);
    console.log('🗑️ Deleting', usersToDelete.length, 'users...');
    
    let deleted = 0;
    for (const user of usersToDelete) {
      try {
        const { error } = await client.auth.admin.deleteUser(user.id);
        if (error) {
          console.log('❌ Failed to delete', user.email, ':', error.message);
        } else {
          console.log('✅ Deleted:', user.email);
          deleted++;
        }
      } catch (err) {
        console.log('❌ Error deleting', user.email, ':', err.message);
      }
    }
    
    console.log('\n📊 USER CLEANUP SUMMARY:');
    console.log('Users deleted:', deleted);
    console.log('Users remaining: 1 (guest@restaurant.plate)');
    
    // Clean up old orders
    console.log('\n🗑️ CLEANING UP OLD ORDERS...');
    const { data: deletedOrders, error: orderError } = await client
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all orders
    
    if (orderError) {
      console.log('❌ Error deleting orders:', orderError.message);
    } else {
      console.log('✅ Deleted all old orders');
    }
    
    // Clean up tables and seats
    console.log('\n🗑️ CLEANING UP TABLES AND SEATS...');
    await client.from('seats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('tables').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Deleted all tables and seats');
    
    console.log('\n🎉 DATABASE CLEANUP COMPLETE!');
    console.log('Ready for single demo system setup.');
    
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
}

cleanupDatabase();