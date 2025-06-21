#!/usr/bin/env node

/**
 * Debug Live KDS Display
 * Comprehensive check of all KDS data flows and potential rendering issues
 */

require('dotenv').config({ path: '.env.local' });

async function debugLiveKDS() {
  console.log('🔍 Debugging Live KDS Display Issues');
  console.log('=====================================');
  
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
    console.log('🔄 Step 1: Fetching ALL KDS orders to find the problematic one...');
    
    const { data: allOrders, error } = await supabase
      .from('kds_order_routing')
      .select(`
        *,
        order:orders!inner (
          id, items, status, type, created_at, transcript, seat_id, table_id,
          table:tables!table_id (id, label),
          seat:seats!seat_id (id, label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `)
      .is('completed_at', null)
      .order('routed_at', { ascending: true })
      .limit(10);
    
    if (error) {
      console.error('❌ Query error:', error);
      return;
    }
    
    console.log(`📊 Found ${allOrders?.length || 0} active KDS orders`);
    
    if (allOrders && allOrders.length > 0) {
      console.log('\\n🔍 Analyzing Each Order for Display Issues:');
      console.log('===========================================');
      
      allOrders.forEach((order, index) => {
        console.log(`\\n📋 Order ${index + 1}:`);
        console.log('  Routing ID:', order.id);
        console.log('  Order ID:', order.order?.id);
        console.log('  Table ID:', order.order?.table_id);
        console.log('  Table Label:', order.order?.table?.label);
        console.log('  Seat ID:', order.order?.seat_id);
        console.log('  Seat Label:', order.order?.seat?.label);
        console.log('  Station:', order.station?.name);
        
        // Check for the specific problematic pattern
        const tableLabel = order.order?.table?.label;
        const seatLabel = order.order?.seat?.label;
        const seatId = order.order?.seat_id;
        
        console.log('  \\n🎯 Display Analysis:');
        console.log('    Expected Badge:', `T${tableLabel || '?'}-S${seatLabel || '?'}`);
        console.log('    Expected Info:', `Table ${tableLabel || '?'}, Seat ${seatLabel || '?'}`);
        
        // Check for potential issues
        if (!seatLabel && seatId) {
          console.log('    ⚠️  ISSUE: Seat label missing but seat ID exists');
          console.log('    ❌ This could cause UUID fallback display');
        }
        
        if (!tableLabel && order.order?.table_id) {
          console.log('    ⚠️  ISSUE: Table label missing but table ID exists');
        }
        
        // Look for the specific pattern the user mentioned
        if (seatId && seatId.length > 10) {
          console.log('    🚨 POTENTIAL MATCH: Long seat ID could be the UUID in display');
          console.log(`    🚨 If this renders as "Table ${tableLabel}Seat ${seatId}", that's the bug!`);
        }
      });
      
      console.log('\\n🔍 Step 2: Checking for data inconsistencies...');
      
      // Check seats table directly
      const { data: seats } = await supabase
        .from('seats')
        .select('*')
        .limit(5);
      
      console.log('\\n📋 Sample Seats Data:');
      seats?.forEach(seat => {
        console.log(`  Seat ${seat.id}: label="${seat.label}"`);
      });
      
      // Check tables table directly
      const { data: tables } = await supabase
        .from('tables')
        .select('*')
        .limit(5);
      
      console.log('\\n📋 Sample Tables Data:');
      tables?.forEach(table => {
        console.log(`  Table ${table.id}: label="${table.label}"`);
      });
      
      console.log('\\n🔍 Step 3: Testing specific join queries...');
      
      // Test a potentially problematic order
      const problemOrder = allOrders.find(o => !o.order?.seat?.label);
      if (problemOrder) {
        console.log('\\n🚨 Found order with missing seat label!');
        console.log('Order ID:', problemOrder.order?.id);
        console.log('Seat ID:', problemOrder.order?.seat_id);
        
        // Check if the seat actually exists
        const { data: seatCheck } = await supabase
          .from('seats')
          .select('*')
          .eq('id', problemOrder.order.seat_id)
          .single();
        
        if (seatCheck) {
          console.log('✅ Seat exists in database:', seatCheck);
          console.log('❌ But join is not working in KDS query');
        } else {
          console.log('❌ Seat does not exist in database - this is the problem!');
        }
      }
      
    } else {
      console.log('❌ No KDS orders found - this might be why display looks empty');
    }
    
    console.log('\\n🎯 SUMMARY:');
    console.log('============');
    console.log('Based on the analysis above:');
    console.log('1. Check for orders with missing seat/table labels but existing IDs');
    console.log('2. If found, the issue is likely broken foreign key relationships');
    console.log('3. The degraded display happens when components fall back to raw IDs');
    console.log('4. Solution: Fix the data inconsistencies or improve join queries');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugLiveKDS().catch(console.error);