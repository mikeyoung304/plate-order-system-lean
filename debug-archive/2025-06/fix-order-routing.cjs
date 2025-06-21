#!/usr/bin/env node

/**
 * Fix order routing by calling intelligentOrderRouting for all orders
 * This ensures all existing orders are properly routed to KDS stations
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://eiipozoogrrfudhjoqms.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaXBvem9vZ3JyZnVkaGpvcW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDIwNzI3OSwiZXhwIjoyMDU5NzgzMjc5fQ.p7DodpQaPooDVFQTAkXKWRdp0ZGMzzXib9cfxGauLko'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function fixOrderRouting() {
  console.log('🔍 Checking order routing status...')
  
  try {
    // Get all orders
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, items, type, created_at')
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
    
    console.log(`📊 Analysis:`)
    console.log(`   Total Orders: ${allOrders.length}`)
    console.log(`   Routed Orders: ${routedOrders.length}`)
    console.log(`   Missing from KDS: ${missingOrders.length}`)
    
    if (missingOrders.length === 0) {
      console.log('✅ All orders are already routed to KDS!')
      
      // Show current KDS order count  
      const { data: kdsData } = await supabase
        .from('kds_order_routing')
        .select('id, order_id, station_id, status')
        .neq('status', 'completed')
      
      console.log(`📈 Active KDS orders: ${kdsData?.length || 0}`)
      return
    }
    
    console.log('\n🎯 Orders needing routing:')
    missingOrders.forEach((order, i) => {
      console.log(`${i + 1}. ${order.id.slice(0, 8)} - ${JSON.stringify(order.items)}`)
    })
    
    // Route missing orders using simplified routing logic
    let routedCount = 0
    for (const order of missingOrders) {
      console.log(`\n🔄 Routing order ${order.id.slice(0, 8)}...`)
      
      try {
        await routeOrderSimple(order)
        routedCount++
        console.log(`   ✅ Successfully routed`)
      } catch (error) {
        console.error(`   ❌ Failed to route: ${error.message}`)
      }
    }
    
    console.log(`\n🏁 Routing complete: ${routedCount}/${missingOrders.length} orders routed`)
    
    // Verify final status
    const { data: finalRouted } = await supabase
      .from('kds_order_routing')
      .select('order_id')
    
    console.log(`📊 Final KDS routing count: ${finalRouted?.length || 0}`)
    
  } catch (error) {
    console.error('❌ Error in fixOrderRouting:', error)
  }
}

async function routeOrderSimple(order) {
  // Get available stations
  const { data: stations, error: stationsError } = await supabase
    .from('kds_stations')
    .select('*')
    .eq('is_active', true)
    .order('position')
    
  if (stationsError) {
    throw new Error(`Failed to fetch stations: ${stationsError.message}`)
  }
  
  if (stations.length === 0) {
    throw new Error('No active stations available')
  }
  
  // Enhanced routing rules matching the updated keywords
  const routingRules = {
    grill: ['steak', 'burger', 'chicken', 'beef', 'pork', 'grilled', 'barbecue', 'bbq', 'ribeye', 'filet', 'sirloin', 'cheeseburger', 'bacon', 'patty'],
    fryer: ['fries', 'fried', 'tempura', 'wings', 'nuggets', 'crispy', 'loaded', 'onion rings', 'calamari', 'fish and chips'],
    salad: ['salad', 'greens', 'vegetables', 'fresh', 'raw', 'lettuce', 'caesar', 'greek', 'chef', 'garden', 'spinach'],
    prep: ['soup', 'sauce', 'dressing', 'marinade', 'prep', 'mashed', 'potatoes', 'side', 'fondue', 'pot'],
    dessert: ['dessert', 'cake', 'ice cream', 'sweet', 'chocolate', 'fruit', 'tiramisu', 'waffle', 'belgian', 'stack', 'slice', 'birthday', 'bowl'],
    bar: ['drink', 'beverage', 'cocktail', 'beer', 'wine']
  }
  
  const targetStations = []
  const items = Array.isArray(order.items) ? order.items : []
  
  // Extract item names for keyword matching
  const itemNames = items.map(item => {
    if (typeof item === 'object' && item.name) {
      return item.name
    }
    return String(item)
  })
  const itemText = itemNames.join(' ').toLowerCase()
  
  console.log(`   📋 Items: ${itemNames.join(', ')}`)
  
  // Check if it's a beverage order
  if (order.type === 'beverage' || order.type === 'drink') {
    const barStation = stations.find(s => s.type === 'bar')
    if (barStation) {
      targetStations.push({ station: barStation, priority: 1, sequence: 1 })
      console.log(`   📍 → Bar station (beverage)`)
    }
  } else {
    // Analyze food items
    let sequence = 1
    
    for (const [stationType, keywords] of Object.entries(routingRules)) {
      const matchedKeywords = keywords.filter(keyword => itemText.includes(keyword))
      if (matchedKeywords.length > 0) {
        const station = stations.find(s => s.type === stationType)
        if (station) {
          const priority = stationType === 'grill' ? 2 : 1
          targetStations.push({ station, priority, sequence: sequence++ })
          console.log(`   📍 → ${stationType} station (matched: ${matchedKeywords.join(', ')})`)
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
        console.log(`   📍 → ${expoStation.type} station (default)`)
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
        routed_at: new Date().toISOString()
      })
      
    if (error) {
      throw new Error(`Failed to create routing entry: ${error.message}`)
    }
  }
  
  return targetStations.length
}

// Run the script
fixOrderRouting().then(() => {
  process.exit(0)
}).catch(error => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})