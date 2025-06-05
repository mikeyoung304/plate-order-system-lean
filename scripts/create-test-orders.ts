#!/usr/bin/env node
/**
 * Create Test Orders for KDS Testing
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

async function createTestOrders() {
  console.log('🍽️  Creating test orders for KDS...')
  
  // Get guest user ID
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) {
    console.error('❌ Error fetching users:', userError)
    return false
  }
  
  const guestUser = users.users.find(u => u.email === 'guest@restaurant.plate')
  if (!guestUser) {
    console.error('❌ Guest user not found')
    return false
  }
  
  // Get tables and seats
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('*')
    .limit(3)
  
  if (tablesError || !tables || tables.length === 0) {
    console.error('❌ No tables found:', tablesError)
    return false
  }
  
  const { data: seats, error: seatsError } = await supabase
    .from('seats')
    .select('*')
    .in('table_id', tables.map(t => t.id))
    .limit(5)
  
  if (seatsError || !seats || seats.length === 0) {
    console.error('❌ No seats found:', seatsError)
    return false
  }
  
  // Get KDS stations
  const { data: stations, error: stationsError } = await supabase
    .from('kds_stations')
    .select('*')
  
  if (stationsError || !stations || stations.length === 0) {
    console.error('❌ No KDS stations found:', stationsError)
    return false
  }
  
  console.log(`✅ Found ${tables.length} tables, ${seats.length} seats, ${stations.length} stations`)
  
  // Create test orders (using actual schema)
  const testOrders = [
    {
      table_id: tables[0].id,
      seat_id: seats[0].id,
      resident_id: guestUser.id,
      server_id: guestUser.id,
      items: ['Grilled Chicken', 'Caesar Salad', 'Fries'],
      transcript: 'I would like grilled chicken with caesar salad and fries please',
      status: 'new',
      type: 'food'
    },
    {
      table_id: tables[1].id,
      seat_id: seats[1].id,
      resident_id: guestUser.id,
      server_id: guestUser.id,
      items: ['Fish and Chips', 'Cole Slaw'],
      transcript: 'Fish and chips with cole slaw',
      status: 'in_progress',
      type: 'food'
    },
    {
      table_id: tables[0].id,
      seat_id: seats[2].id,
      resident_id: guestUser.id,
      server_id: guestUser.id,
      items: ['Coca Cola', 'Iced Tea'],
      transcript: 'One coke and one iced tea',
      status: 'new',
      type: 'drink'
    },
    {
      table_id: tables[2].id,
      seat_id: seats[3].id,
      resident_id: guestUser.id,
      server_id: guestUser.id,
      items: ['Burger', 'Onion Rings', 'Milkshake'],
      transcript: 'Burger with onion rings and a milkshake',
      status: 'new',
      type: 'food'
    },
    {
      table_id: tables[1].id,
      seat_id: seats[4].id,
      resident_id: guestUser.id,
      server_id: guestUser.id,
      items: ['Chicken Wings', 'Ranch Dressing'],
      transcript: 'Hot wings with ranch',
      status: 'ready',
      type: 'food'
    }
  ]
  
  // Insert orders
  const { data: insertedOrders, error: ordersError } = await supabase
    .from('orders')
    .insert(testOrders)
    .select()
  
  if (ordersError) {
    console.error('❌ Error creating orders:', ordersError)
    return false
  }
  
  console.log(`✅ Created ${insertedOrders.length} test orders`)
  
  // Create KDS routing entries for each order
  console.log('🔀 Creating KDS routing entries...')
  
  const routingEntries = []
  
  for (const order of insertedOrders) {
    // Route food orders to appropriate stations
    if (order.type === 'food') {
      const grillItems = order.items.filter((item: string) => 
        item.toLowerCase().includes('chicken') || 
        item.toLowerCase().includes('burger') || 
        item.toLowerCase().includes('fish')
      )
      
      const fryerItems = order.items.filter((item: string) =>
        item.toLowerCase().includes('fries') || 
        item.toLowerCase().includes('wings') || 
        item.toLowerCase().includes('rings')
      )
      
      const saladItems = order.items.filter((item: string) =>
        item.toLowerCase().includes('salad') || 
        item.toLowerCase().includes('slaw')
      )
      
      // Route to grill station
      if (grillItems.length > 0) {
        const grillStation = stations.find(s => s.type === 'grill')
        if (grillStation) {
          routingEntries.push({
            order_id: order.id,
            station_id: grillStation.id,
            sequence: 1,
            routed_at: new Date().toISOString(),
            priority: order.status === 'new' ? 1 : 2,
            estimated_prep_time: 15
          })
        }
      }
      
      // Route to fryer station
      if (fryerItems.length > 0) {
        const fryerStation = stations.find(s => s.type === 'fryer')
        if (fryerStation) {
          routingEntries.push({
            order_id: order.id,
            station_id: fryerStation.id,
            sequence: 2,
            routed_at: new Date().toISOString(),
            priority: order.status === 'new' ? 1 : 2,
            estimated_prep_time: 8
          })
        }
      }
      
      // Route to salad station
      if (saladItems.length > 0) {
        const saladStation = stations.find(s => s.type === 'salad')
        if (saladStation) {
          routingEntries.push({
            order_id: order.id,
            station_id: saladStation.id,
            sequence: 3,
            routed_at: new Date().toISOString(),
            priority: order.status === 'new' ? 1 : 2,
            estimated_prep_time: 5
          })
        }
      }
    } else {
      // Route drink orders to bar
      const barStation = stations.find(s => s.type === 'bar')
      if (barStation) {
        routingEntries.push({
          order_id: order.id,
          station_id: barStation.id,
          sequence: 1,
          routed_at: new Date().toISOString(),
          priority: order.status === 'new' ? 1 : 2,
          estimated_prep_time: 3
        })
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
    
    console.log(`✅ Created ${routingEntries.length} KDS routing entries`)
  }
  
  // Show summary
  console.log('\n📊 Order Summary:')
  const statusCounts = insertedOrders.reduce((acc: any, order: any) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {})
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count} orders`)
  })
  
  console.log('\n✅ Test orders created successfully!')
  console.log('🔗 Visit http://localhost:3001/kitchen/kds to see orders in KDS')
  
  return true
}

createTestOrders().then(success => {
  process.exit(success ? 0 : 1)
})