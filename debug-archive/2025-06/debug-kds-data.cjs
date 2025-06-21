#!/usr/bin/env node

/**
 * Debug KDS Data Structure
 * Check what data is actually being returned from KDS queries
 */

require('dotenv').config({ path: '.env.local' });

async function debugKDSData() {
  console.log('🔍 Debugging KDS Data Structure');
  console.log('===============================');
  
  const { createClient } = require('@supabase/supabase-js');
  
  // Use service role for full access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  try {
    console.log('🔄 Fetching KDS orders with full joins...');
    
    const { data, error } = await supabase
      .from('kds_order_routing')
      .select(`
        *,
        order:orders!inner (
          id, items, status, type, created_at, transcript, seat_id,
          table:tables!table_id (id, label),
          seat:seats!seat_id (id, label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `)
      .is('completed_at', null)
      .order('routed_at', { ascending: true })
      .limit(3);
    
    if (error) {
      console.error('❌ Query error:', error);
      return;
    }
    
    console.log(`📊 Found ${data?.length || 0} KDS orders`);
    
    if (data && data.length > 0) {
      console.log('\n🔍 Sample Order Structure:');
      console.log('==========================');
      
      const sampleOrder = data[0];
      console.log('📋 Full Order Object:');
      console.log(JSON.stringify(sampleOrder, null, 2));
      
      console.log('\n🏷️ Key Display Data:');
      console.log('--------------------');
      console.log('Order ID:', sampleOrder.id);
      console.log('Station:', sampleOrder.station?.name);
      console.log('Table Label:', sampleOrder.order?.table?.label);
      console.log('Seat Label:', sampleOrder.order?.seat?.label);
      console.log('Seat ID:', sampleOrder.order?.seat_id);
      console.log('Items:', sampleOrder.order?.items);
      console.log('Status:', sampleOrder.order?.status);
      console.log('Created:', sampleOrder.order?.created_at);
      
      console.log('\n📝 Expected Display Format:');
      console.log('----------------------------');
      const tableLabel = sampleOrder.order?.table?.label || '?';
      const seatLabel = sampleOrder.order?.seat?.label || sampleOrder.order?.seat_id?.slice(-2) || '?';
      console.log(`Badge: T${tableLabel}-S${seatLabel}`);
      console.log(`Info: Table ${tableLabel}, Seat ${seatLabel}`);
      
      // Check if seat data is missing
      if (!sampleOrder.order?.seat?.label && sampleOrder.order?.seat_id) {
        console.log('\n⚠️  ISSUE DETECTED:');
        console.log('Seat ID exists but seat label is missing!');
        console.log('This suggests the seat join is not working properly.');
        
        // Check if seat exists in seats table
        const { data: seatCheck } = await supabase
          .from('seats')
          .select('id, label')
          .eq('id', sampleOrder.order.seat_id)
          .single();
        
        if (seatCheck) {
          console.log(`✅ Seat exists in database: ${seatCheck.label}`);
          console.log('❌ But not being joined properly in KDS query');
        } else {
          console.log('❌ Seat does not exist in seats table');
        }
      }
    } else {
      console.log('❌ No KDS orders found');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugKDSData().catch(console.error);