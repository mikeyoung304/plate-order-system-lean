#!/usr/bin/env node
/**
 * Fix KDS Backend Issues
 * Repair the rushed AI build issues with kitchen stations
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixKDSBackend() {
  console.log('🔧 Fixing KDS Backend Issues...')
  
  // Step 1: Clear any broken orders/routing that might exist
  console.log('\n1. Cleaning up existing KDS data...')
  
  try {
    await supabase.from('kds_order_routing').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('✅ Cleaned up existing orders and routing')
  } catch (error) {
    console.log('⚠️  Cleanup had issues (expected):', error)
  }
  
  // Step 2: Ensure KDS stations exist with proper structure
  console.log('\n2. Setting up KDS stations...')
  
  const kdsStations = [
    { 
      name: 'Grill Station', 
      type: 'grill', 
      color: '#FF6B6B', 
      position: 1, 
      is_active: true,
      settings: { temperature_alerts: true, timer_defaults: { burger: 8, chicken: 12, fish: 10 } }
    },
    { 
      name: 'Fryer Station', 
      type: 'fryer', 
      color: '#4ECDC4', 
      position: 2, 
      is_active: true,
      settings: { oil_temp_monitor: true, timer_defaults: { fries: 4, wings: 8, rings: 6 } }
    },
    { 
      name: 'Salad Station', 
      type: 'salad', 
      color: '#45B7D1', 
      position: 3, 
      is_active: true,
      settings: { freshness_tracking: true, prep_reminders: true }
    },
    { 
      name: 'Expo Station', 
      type: 'expo', 
      color: '#96CEB4', 
      position: 4, 
      is_active: true,
      settings: { quality_check: true, hold_time_alerts: true }
    },
    { 
      name: 'Bar Station', 
      type: 'bar', 
      color: '#DDA0DD', 
      position: 5, 
      is_active: true,
      settings: { inventory_tracking: true, age_verification: true }
    }
  ]
  
  // Delete existing stations and recreate
  await supabase.from('kds_stations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  const { data: stations, error: stationsError } = await supabase
    .from('kds_stations')
    .insert(kdsStations)
    .select()
  
  if (stationsError) {
    console.error('❌ Error creating stations:', stationsError)
    return false
  }
  
  console.log(`✅ Created ${stations.length} KDS stations`)
  
  // Step 3: Get guest user and table/seat data
  console.log('\n3. Getting user and table data...')
  
  const { data: users } = await supabase.auth.admin.listUsers()
  const guestUser = users.users.find(u => u.email === 'guest@restaurant.plate')
  
  if (!guestUser) {
    console.error('❌ Guest user not found')
    return false
  }
  
  const { data: tables } = await supabase.from('tables').select('*').limit(3)
  const { data: seats } = await supabase.from('seats').select('*').limit(5)
  
  if (!tables || !seats || tables.length === 0 || seats.length === 0) {
    console.error('❌ Tables or seats not found')
    return false
  }
  
  console.log(`✅ Found ${tables.length} tables and ${seats.length} seats`)
  
  // Step 4: Create test orders with proper relationships
  console.log('\n4. Creating test orders with proper station routing...')
  
  const testOrders = [
    {
      table_id: tables[0].id,
      seat_id: seats[0].id,
      resident_id: guestUser.id,
      server_id: guestUser.id,
      items: ['Grilled Chicken Breast', 'Garlic Fries', 'House Salad'],
      transcript: 'Grilled chicken with garlic fries and house salad',
      status: 'new',
      type: 'food'
    },
    {
      table_id: tables[1].id,
      seat_id: seats[1].id,
      resident_id: guestUser.id,
      server_id: guestUser.id,
      items: ['Fish and Chips', 'Coleslaw'],
      transcript: 'Fish and chips with coleslaw',
      status: 'in_progress',
      type: 'food'
    },
    {
      table_id: tables[0].id,
      seat_id: seats[2].id,
      resident_id: guestUser.id,
      server_id: guestUser.id,
      items: ['Craft Beer', 'Whiskey Sour'],
      transcript: 'One craft beer and a whiskey sour',
      status: 'new',
      type: 'drink'
    },
    {
      table_id: tables[2].id,
      seat_id: seats[3].id,
      resident_id: guestUser.id,
      server_id: guestUser.id,
      items: ['Bacon Burger', 'Onion Rings', 'Chocolate Shake'],
      transcript: 'Bacon burger with onion rings and chocolate shake',
      status: 'new',
      type: 'food'
    }
  ]
  
  const { data: insertedOrders, error: ordersError } = await supabase
    .from('orders')
    .insert(testOrders)
    .select()
  
  if (ordersError) {
    console.error('❌ Error creating orders:', ordersError)
    return false
  }
  
  console.log(`✅ Created ${insertedOrders.length} test orders`)
  
  // Step 5: Create intelligent routing based on items
  console.log('\n5. Creating intelligent station routing...')
  
  const routingEntries = []
  
  for (const order of insertedOrders) {
    console.log(`\nRouting order ${order.id} with items:`, order.items)
    
    if (order.type === 'food') {
      // Analyze items and route to appropriate stations
      for (const item of order.items) {
        const itemLower = item.toLowerCase()
        
        // Grill items
        if (itemLower.includes('chicken') || itemLower.includes('burger') || itemLower.includes('fish')) {
          const grillStation = stations.find(s => s.type === 'grill')
          if (grillStation) {
            routingEntries.push({
              order_id: order.id,
              station_id: grillStation.id,
              sequence: 1,
              routed_at: new Date().toISOString(),
              priority: 1,
              estimated_prep_time: itemLower.includes('chicken') ? 12 : itemLower.includes('fish') ? 10 : 8,
              notes: `${item} - ${itemLower.includes('chicken') ? 'Medium doneness' : itemLower.includes('fish') ? 'Crispy batter' : 'Well done'}`
            })
            console.log(`  → Routed "${item}" to Grill Station`)
          }
        }
        
        // Fryer items
        if (itemLower.includes('fries') || itemLower.includes('rings') || itemLower.includes('chips') && !itemLower.includes('fish')) {
          const fryerStation = stations.find(s => s.type === 'fryer')
          if (fryerStation) {
            routingEntries.push({
              order_id: order.id,
              station_id: fryerStation.id,
              sequence: 2,
              routed_at: new Date().toISOString(),
              priority: 1,
              estimated_prep_time: itemLower.includes('rings') ? 6 : 4,
              notes: `${item} - Extra crispy`
            })
            console.log(`  → Routed "${item}" to Fryer Station`)
          }
        }
        
        // Salad items
        if (itemLower.includes('salad') || itemLower.includes('slaw')) {
          const saladStation = stations.find(s => s.type === 'salad')
          if (saladStation) {
            routingEntries.push({
              order_id: order.id,
              station_id: saladStation.id,
              sequence: 3,
              routed_at: new Date().toISOString(),
              priority: 1,
              estimated_prep_time: 3,
              notes: `${item} - Fresh prep`
            })
            console.log(`  → Routed "${item}" to Salad Station`)
          }
        }
      }
      
      // Always route to expo for final assembly
      const expoStation = stations.find(s => s.type === 'expo')
      if (expoStation) {
        routingEntries.push({
          order_id: order.id,
          station_id: expoStation.id,
          sequence: 99, // Always last
          routed_at: new Date().toISOString(),
          priority: 1,
          estimated_prep_time: 2,
          notes: 'Final quality check and plating'
        })
        console.log(`  → Routed to Expo Station for final assembly`)
      }
      
    } else if (order.type === 'drink') {
      // Route all drinks to bar
      const barStation = stations.find(s => s.type === 'bar')
      if (barStation) {
        routingEntries.push({
          order_id: order.id,
          station_id: barStation.id,
          sequence: 1,
          routed_at: new Date().toISOString(),
          priority: 1,
          estimated_prep_time: 3,
          notes: order.items.join(', ')
        })
        console.log(`  → Routed drinks to Bar Station`)
      }
    }
  }
  
  if (routingEntries.length > 0) {
    const { error: routingError } = await supabase
      .from('kds_order_routing')
      .insert(routingEntries)
    
    if (routingError) {
      console.error('❌ Error creating routing entries:', routingError)
      return false
    }
    
    console.log(`\n✅ Created ${routingEntries.length} routing entries`)
  }
  
  // Step 6: Verify the fix by testing a query
  console.log('\n6. Verifying KDS functionality...')
  
  const { data: verifyData, error: verifyError } = await supabase
    .from('kds_order_routing')
    .select(`
      *,
      order:orders!inner (
        id, items, status, type, created_at,
        table:tables!table_id (label)
      ),
      station:kds_stations!station_id (id, name, type, color)
    `)
    .is('completed_at', null)
    .order('routed_at', { ascending: true })
  
  if (verifyError) {
    console.error('❌ Verification failed:', verifyError)
    return false
  }
  
  console.log(`✅ Verification successful: ${verifyData.length} active KDS orders found`)
  
  // Step 7: Show station breakdown
  console.log('\n📊 Station Breakdown:')
  const stationCounts = verifyData.reduce((acc: any, item: any) => {
    const stationName = item.station?.name || 'Unknown'
    acc[stationName] = (acc[stationName] || 0) + 1
    return acc
  }, {})
  
  Object.entries(stationCounts).forEach(([station, count]) => {
    console.log(`  ${station}: ${count} orders`)
  })
  
  console.log('\n✅ KDS Backend Fix Complete!')
  console.log('🔗 Visit http://localhost:3001/kitchen/kds to test')
  
  return true
}

fixKDSBackend().then(success => {
  process.exit(success ? 0 : 1)
})