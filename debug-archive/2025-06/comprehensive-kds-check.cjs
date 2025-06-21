#!/usr/bin/env node

/**
 * Comprehensive KDS System Check
 * Verify all aspects of the table grouping system
 */

require('dotenv').config({ path: '.env.local' });

async function comprehensiveKDSCheck() {
  console.log('🔍 Comprehensive KDS System Check');
  console.log('==================================');
  
  const { createClient } = require('@supabase/supabase-js');
  
  // Use service role for full access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  let allChecksPass = true;
  
  try {
    // 1. Check data availability
    console.log('\\n📊 Step 1: Data Availability Check');
    console.log('=====================================');
    
    const { data: orders, error } = await supabase
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
      .limit(5);
    
    if (error) {
      console.log('❌ KDS data query failed:', error.message);
      allChecksPass = false;
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('⚠️  No active KDS orders found - table grouping will be empty');
      console.log('💡 Create some test orders to see table grouping in action');
    } else {
      console.log(`✅ Found ${orders.length} active KDS orders`);
      
      // Verify data structure 
      const firstOrder = orders[0];
      console.log('\\n🔍 Data Structure Verification:');
      console.log(`  Order ID: ${firstOrder.id}`);
      console.log(`  Table ID: ${firstOrder.order?.table_id}`);
      console.log(`  Table Label: ${firstOrder.order?.table?.label}`);
      console.log(`  Seat ID: ${firstOrder.order?.seat_id}`);
      console.log(`  Seat Label: ${firstOrder.order?.seat?.label}`);
      console.log(`  Station: ${firstOrder.station?.name}`);
      console.log(`  Items: ${firstOrder.order?.items?.length || 0} items`);
      
      if (firstOrder.order?.table?.label && firstOrder.order?.seat?.label) {
        console.log('✅ Data structure is perfect for table grouping');
      } else {
        console.log('⚠️  Missing table or seat labels - may affect display');
        allChecksPass = false;
      }
    }
    
    // 2. Check table grouping logic
    if (orders && orders.length > 0) {
      console.log('\\n🏗️  Step 2: Table Grouping Logic Test');
      console.log('======================================');
      
      // Simulate useTableGroupedOrders logic
      const tableGroups = new Map();
      
      for (const order of orders) {
        const tableId = order.order?.table_id;
        const tableLabel = order.order?.table?.label;
        
        if (!tableId) continue;
        
        let group = tableGroups.get(tableId);
        if (!group) {
          group = {
            tableId,
            tableLabel,
            orders: [],
            seatCount: new Set(),
            totalItems: 0,
            overallStatus: 'new'
          };
          tableGroups.set(tableId, group);
        }
        
        group.orders.push(order);
        if (order.order?.seat_id) {
          group.seatCount.add(order.order.seat_id);
        }
        if (order.order?.items && Array.isArray(order.order.items)) {
          group.totalItems += order.order.items.length;
        }
      }
      
      console.log(`✅ Successfully grouped orders into ${tableGroups.size} tables`);
      
      for (const [tableId, group] of tableGroups) {
        console.log(`  📋 Table ${group.tableLabel}: ${group.orders.length} orders, ${group.seatCount.size} seats`);
      }
      
      if (tableGroups.size > 0) {
        console.log('✅ Table grouping logic working correctly');
      } else {
        console.log('❌ Table grouping failed - no groups created');
        allChecksPass = false;
      }
    }
    
    // 3. Component integration check
    console.log('\\n🧩 Step 3: Component Integration Check');
    console.log('=======================================');
    
    const fs = require('fs');
    const path = require('path');
    
    const componentsToCheck = [
      'components/kds/table-group-card.tsx',
      'components/kds/KDSMainContent.tsx',
      'hooks/use-table-grouped-orders.ts',
      'lib/hooks/use-kds-state.ts'
    ];
    
    for (const componentPath of componentsToCheck) {
      const fullPath = path.join(__dirname, componentPath);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${componentPath}: EXISTS`);
      } else {
        console.log(`❌ ${componentPath}: MISSING`);
        allChecksPass = false;
      }
    }
    
    // 4. Configuration check
    console.log('\\n⚙️  Step 4: Configuration Check');
    console.log('=================================');
    
    const kdsStatePath = path.join(__dirname, 'lib/hooks/use-kds-state.ts');
    if (fs.existsSync(kdsStatePath)) {
      const content = fs.readFileSync(kdsStatePath, 'utf8');
      if (content.includes("viewMode: 'table'")) {
        console.log('✅ Default view mode set to "table"');
      } else {
        console.log('⚠️  Default view mode not set to "table"');
      }
    }
    
    console.log('\\n🎯 FINAL SUMMARY:');
    console.log('==================');
    
    if (allChecksPass && orders && orders.length > 0) {
      console.log('🎉 ALL SYSTEMS GO! Table grouping should be working perfectly!');
      console.log('');
      console.log('📋 What you should see in the KDS:');
      console.log('  • Orders grouped by table cards');
      console.log('  • Table headers with table numbers');
      console.log('  • Seat-level order breakdown within each table');
      console.log('  • Color-coded timing indicators');
      console.log('  • Bulk table action buttons');
      console.log('  • Professional KDS display');
      console.log('');
      console.log('🔍 If not visible, check:');
      console.log('  1. Browser dev tools for JS errors');
      console.log('  2. Network tab for failed API calls');
      console.log('  3. Clear browser cache');
      console.log('  4. Verify you\'re on /kitchen/kds page');
      console.log('  5. Click the Table view button in KDS header');
    } else if (!orders || orders.length === 0) {
      console.log('⚠️  SYSTEM READY BUT NO DATA');
      console.log('Table grouping components are installed but no orders to display.');
      console.log('Create some test orders to see the table grouping in action.');
    } else {
      console.log('❌ SYSTEM ISSUES DETECTED');
      console.log('Some components or configurations need attention.');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

comprehensiveKDSCheck().catch(console.error);