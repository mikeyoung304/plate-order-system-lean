#!/usr/bin/env node

/**
 * Route missing orders to KDS stations
 * Based on analysis, 4 orders need to be routed to KDS
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function routeMissingOrders() {
  console.log('🔍 Finding orders not routed to KDS...')
  
  try {
    // Get all orders
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, items, type')
      .order('created_at', { ascending: false })
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      return
    }
    
    // Get all routed orders  
    const { data: routedOrders, error: routedError } = await supabase
      .from('kds_order_routing')
      .select('order_id')
    
    if (routedError) {
      console.error('❌ Error fetching routed orders:', routedError)
      return
    }
    
    const routedOrderIds = new Set(routedOrders.map(r => r.order_id))
    const missingOrders = allOrders.filter(order => !routedOrderIds.has(order.id))
    
    console.log(`📊 Found ${allOrders.length} total orders, ${routedOrders.length} routed, ${missingOrders.length} missing`)
    
    if (missingOrders.length === 0) {
      console.log('✅ All orders are already routed to KDS')
      return
    }
    
    // Route missing orders
    for (const order of missingOrders) {
      console.log(`🎯 Routing order ${order.id} with items: ${JSON.stringify(order.items)}`)
      
      try {
        await routeOrderToKDS(order)
        console.log(`✅ Successfully routed order ${order.id}`)
      } catch (error) {
        console.error(`❌ Failed to route order ${order.id}:`, error.message)
      }
    }
    
    console.log('🏁 Finished routing missing orders')
    
  } catch (error) {
    console.error('❌ Error in routeMissingOrders:', error)
  }
}

async function routeOrderToKDS(order) {
  // Get available stations
  const { data: stations, error: stationsError } = await supabase
    .from('kds_stations')
    .select('*')
    .eq('active', true)
    .order('position')
    
  if (stationsError) {
    throw new Error(`Failed to fetch stations: ${stationsError.message}`)
  }
  
  if (stations.length === 0) {
    throw new Error('No active stations available')
  }
  
  // Routing logic (simplified version of intelligentOrderRouting)
  const routingRules = {
    grill: ['steak', 'burger', 'chicken', 'beef', 'pork', 'grilled', 'barbecue', 'bbq', 'ribeye'],
    fryer: ['fries', 'fried', 'tempura', 'wings', 'nuggets', 'crispy', 'loaded'],
    salad: ['salad', 'greens', 'vegetables', 'fresh', 'raw', 'lettuce', 'caesar'],
    prep: ['soup', 'sauce', 'dressing', 'marinade', 'prep', 'mashed'],
    dessert: ['dessert', 'cake', 'ice cream', 'sweet', 'chocolate', 'fruit', 'tiramisu', 'waffle'],
    bar: ['drink', 'beverage', 'cocktail', 'beer', 'wine']
  }
  
  const targetStations = []
  const items = Array.isArray(order.items) ? order.items : []
  const itemText = items.join(' ').toLowerCase()
  
  // Check if it's a beverage order
  if (order.type === 'beverage' || order.type === 'drink') {
    const barStation = stations.find(s => s.type === 'bar')
    if (barStation) {
      targetStations.push({ station: barStation, priority: 1, sequence: 1 })
    }
  } else {
    // Analyze food items
    let sequence = 1
    
    for (const [stationType, keywords] of Object.entries(routingRules)) {
      if (keywords.some(keyword => itemText.includes(keyword))) {
        const station = stations.find(s => s.type === stationType)
        if (station) {
          const priority = stationType === 'grill' ? 2 : 1
          targetStations.push({ station, priority, sequence: sequence++ })
        }
      }
    }
    
    // If no specific routing, route to expo station or first available
    if (targetStations.length === 0) {
      const expoStation = stations.find(s => s.type === 'expo') || stations[0]
      if (expoStation) {
        targetStations.push({
          station: expoStation,
          priority: 1,
          sequence: 1
        })
      }
    }
  }
  
  // Create routing entries
  for (const { station, priority, sequence } of targetStations) {
    const { error } = await supabase
      .from('kds_order_routing')
      .insert({
        order_id: order.id,
        station_id: station.id,
        sequence,
        priority,
        routed_at: new Date().toISOString(),
        status: 'routed'
      })
      
    if (error) {
      throw new Error(`Failed to create routing entry: ${error.message}`)
    }
    
    console.log(`   📍 Routed to ${station.type} station (priority: ${priority}, sequence: ${sequence})`)
  }
}

// Run the script
routeMissingOrders().then(() => {
  process.exit(0)
}).catch(error => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})