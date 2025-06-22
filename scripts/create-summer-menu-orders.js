#!/usr/bin/env node

/**
 * Creates test orders using summer menu items for KDS testing
 * Uses existing guest user and table structure
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eiipozoogrrfudhjoqms.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Summer menu test data
const testData = [
  {
    "table": 1,
    "guests": 4,
    "orders": [
      { "seat": 1, "items": [{ "name": "Summer Sampler", "qty": 1 }], "drink": "Sweet Tea" },
      { "seat": 2, "items": [{ "name": "Peach & Prosciutto Caprese", "qty": 1 }], "drink": "Iced Tea" },
      { "seat": 3, "items": [{ "name": "Watermelon Tataki", "qty": 1 }], "drink": "Lemonade" },
      { "seat": 4, "items": [{ "name": "Peach Arugula Salad", "qty": 1, "mods": ["Add Prosciutto"] }], "drink": "Water" }
    ]
  },
  {
    "table": 2,
    "guests": 4,
    "orders": [
      { "seat": 1, "items": [{ "name": "Tea Sandwiches", "qty": 1 }], "drink": "Coffee" },
      { "seat": 2, "items": [{ "name": "Jalapeno Pimento Bites", "qty": 1 }], "drink": "Coke" },
      { "seat": 3, "items": [{ "name": "Summer Salad", "qty": 1, "mods": ["Add Salmon"] }], "drink": "Unsweet Tea" },
      { "seat": 4, "items": [{ "name": "Tuna Salad", "qty": 1 }], "drink": "Sprite" }
    ]
  },
  {
    "table": 3,
    "guests": 3,
    "orders": [
      { "seat": 1, "items": [{ "name": "Greek Bowl", "qty": 1 }], "drink": "Water" },
      { "seat": 2, "items": [{ "name": "Soul Bowl", "qty": 1 }], "drink": "Water" },
      { "seat": 3, "items": [{ "name": "Chicken Fajita Keto", "qty": 1, "mods": ["Add Rice"] }], "drink": "Diet Coke" }
    ]
  },
  {
    "table": 4,
    "guests": 3,
    "orders": [
      { "seat": 1, "items": [{ "name": "Peach Chicken", "qty": 1 }], "drink": "Lemonade" },
      { "seat": 2, "items": [{ "name": "Teriyaki Salmon Over Rice", "qty": 1 }], "drink": "Water" },
      { "seat": 3, "items": [{ "name": "Veggie/Sides Plate", "qty": 1, "mods": ["Select 4"] }], "drink": "Iced Tea" }
    ]
  },
  {
    "table": 5,
    "guests": 3,
    "orders": [
      { "seat": 1, "items": [{ "name": "Chicken Salad Sandwich", "qty": 1 }], "drink": "Sweet Tea" },
      { "seat": 2, "items": [{ "name": "Chopped Italian Sandwich", "qty": 1 }], "drink": "Coke" },
      { "seat": 3, "items": [{ "name": "Summer Vegan Bowl", "qty": 1 }], "drink": "Water" }
    ]
  },
  {
    "table": 6,
    "guests": 3,
    "orders": [
      { "seat": 1, "items": [{ "name": "Hamburger Steak over rice", "qty": 1 }], "drink": "Unsweet Tea" },
      { "seat": 2, "items": [{ "name": "Greek Chicken Thighs (2) Over Rice", "qty": 1 }], "drink": "Water" },
      { "seat": 3, "items": [{ "name": "Summer Salad", "qty": 1, "mods": ["Add Chicken"] }], "drink": "Lemonade" }
    ]
  },
  {
    "table": 7,
    "guests": 3,
    "orders": [
      { "seat": 1, "items": [{ "name": "Cold Plate – Chicken Salad", "qty": 1 }], "drink": "Water" },
      { "seat": 2, "items": [{ "name": "Greek Salad", "qty": 1 }], "drink": "Iced Tea" },
      { "seat": 3, "items": [{ "name": "Potatoes Romanoff", "qty": 1, "a_la_carte": true }], "drink": "Sprite" }
    ]
  },
  {
    "table": 8,
    "guests": 2,
    "orders": [
      { "seat": 1, "items": [{ "name": "Watermelon Tataki", "qty": 1 }], "drink": "Sweet Tea" },
      { "seat": 2, "items": [{ "name": "Greek Salad", "qty": 1 }], "drink": "Water" }
    ]
  },
  {
    "table": 9,
    "guests": 1,
    "orders": [
      { "seat": 1, "items": [{ "name": "Summer Succotash", "qty": 1 }], "drink": "Unsweet Tea" }
    ]
  },
  {
    "table": 10,
    "guests": 1,
    "orders": [
      { "seat": 1, "items": [{ "name": "Peach & Prosciutto Caprese", "qty": 1 }], "drink": "Sparkling Water" }
    ]
  }
]

// Guest user ID from existing data
const GUEST_USER_ID = 'b0055f8c-d2c3-425f-add2-e4ee6572829e'

// KDS Station UUIDs
const STATION_UUIDS = {
  GRILL: '819864b3-239a-4e7d-936d-89b84a42ac4e',
  FRYER: '16077ddf-0453-416e-b703-667b72a49435',
  SALAD: 'd95a34df-3138-45a3-a524-50ea430bc0e5',
  EXPO: '47a865cb-0398-417b-8508-9a6c091c17b7',
  BAR: '1722affe-4e59-4393-b349-5ab5b40bce96'
}

// Menu item categorization for KDS routing
const menuCategories = {
  // Starters & Apps (salad station)
  'Summer Sampler': STATION_UUIDS.SALAD,
  'Peach & Prosciutto Caprese': STATION_UUIDS.SALAD,
  'Watermelon Tataki': STATION_UUIDS.SALAD,
  'Jalapeno Pimento Bites': STATION_UUIDS.SALAD,
  
  // Salads (salad station)
  'Peach Arugula Salad': STATION_UUIDS.SALAD,
  'Summer Salad': STATION_UUIDS.SALAD,
  'Greek Salad': STATION_UUIDS.SALAD,
  'Tuna Salad': STATION_UUIDS.SALAD,
  
  // Sandwiches (grill station)
  'Tea Sandwiches': STATION_UUIDS.GRILL,
  'Chicken Salad Sandwich': STATION_UUIDS.GRILL,
  'Chopped Italian Sandwich': STATION_UUIDS.GRILL,
  
  // Bowls (expo station)
  'Greek Bowl': STATION_UUIDS.EXPO,
  'Soul Bowl': STATION_UUIDS.EXPO,
  'Summer Vegan Bowl': STATION_UUIDS.EXPO,
  
  // Hot Entrees (grill station)
  'Chicken Fajita Keto': STATION_UUIDS.GRILL,
  'Peach Chicken': STATION_UUIDS.GRILL,
  'Teriyaki Salmon Over Rice': STATION_UUIDS.GRILL,
  'Hamburger Steak over rice': STATION_UUIDS.GRILL,
  'Greek Chicken Thighs (2) Over Rice': STATION_UUIDS.GRILL,
  
  // Cold Plates (salad station)
  'Cold Plate – Chicken Salad': STATION_UUIDS.SALAD,
  'Veggie/Sides Plate': STATION_UUIDS.SALAD,
  
  // Sides (salad station)
  'Potatoes Romanoff': STATION_UUIDS.SALAD,
  'Summer Succotash': STATION_UUIDS.SALAD,
  
  // Beverages (bar station)
  'Sweet Tea': STATION_UUIDS.BAR,
  'Iced Tea': STATION_UUIDS.BAR,
  'Unsweet Tea': STATION_UUIDS.BAR,
  'Lemonade': STATION_UUIDS.BAR,
  'Water': STATION_UUIDS.BAR,
  'Coffee': STATION_UUIDS.BAR,
  'Coke': STATION_UUIDS.BAR,
  'Sprite': STATION_UUIDS.BAR,
  'Diet Coke': STATION_UUIDS.BAR,
  'Sparkling Water': STATION_UUIDS.BAR
}

async function clearExistingOrders() {
  console.log('🧹 Clearing existing test orders...')
  
  // Delete from KDS routing first (foreign key constraints)
  const { error: routingError } = await supabase
    .from('kds_order_routing')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    
  if (routingError) {
    console.error('Error clearing KDS routing:', routingError)
  }
  
  // Delete orders
  const { error: ordersError } = await supabase
    .from('orders')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    
  if (ordersError) {
    console.error('Error clearing orders:', ordersError)
  } else {
    console.log('✅ Existing orders cleared')
  }
}

async function getTableAndSeatInfo() {
  console.log('📋 Fetching table and seat information...')
  
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('id, label')
    .order('label')
    
  if (tablesError) {
    console.error('Error fetching tables:', tablesError)
    return null
  }
  
  const { data: seats, error: seatsError } = await supabase
    .from('seats')
    .select('id, table_id, label')
    .order('label')
    
  if (seatsError) {
    console.error('Error fetching seats:', seatsError)
    return null
  }
  
  console.log(`✅ Found ${tables.length} tables and ${seats.length} seats`)
  return { tables, seats }
}

async function createOrdersWithKDSRouting() {
  console.log('🍽️ Creating summer menu test orders...')
  
  const tableSeats = await getTableAndSeatInfo()
  if (!tableSeats) {
    console.error('❌ Could not fetch table/seat information')
    return
  }
  
  const { tables, seats } = tableSeats
  
  let totalOrders = 0
  let totalItems = 0
  
  for (const tableData of testData) {
    const table = tables.find(t => t.label === tableData.table)
    if (!table) {
      console.error(`❌ Table ${tableData.table} not found`)
      continue
    }
    
    console.log(`\n🏷️ Processing Table ${tableData.table} (${tableData.guests} guests)...`)
    
    for (const orderData of tableData.orders) {
      const seat = seats.find(s => s.table_id === table.id && s.label === orderData.seat)
      if (!seat) {
        console.error(`❌ Seat ${orderData.seat} not found for table ${tableData.table}`)
        continue
      }
      
      // Create food order
      const foodItems = orderData.items.map((item, index) => ({
        id: `item_${Date.now()}_${index}`,
        name: item.name,
        quantity: item.qty,
        special_instructions: item.mods ? item.mods.join(', ') : null,
        category: menuCategories[item.name] || 'expo',
        price: Math.floor(Math.random() * 15) + 8 // Random price 8-22
      }))
      
      const { data: foodOrder, error: foodError } = await supabase
        .from('orders')
        .insert({
          table_id: table.id,
          seat_id: seat.id,
          resident_id: GUEST_USER_ID,
          server_id: GUEST_USER_ID,
          items: foodItems,
          status: 'new',
          type: 'food',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
        
      if (foodError) {
        console.error(`❌ Error creating food order for table ${tableData.table}, seat ${orderData.seat}:`, foodError)
        continue
      }
      
      // Create drink order
      const drinkItem = {
        id: `drink_${Date.now()}`,
        name: orderData.drink,
        quantity: 1,
        category: 'bar',
        price: Math.floor(Math.random() * 5) + 2 // Random price 2-6
      }
      
      const { data: drinkOrder, error: drinkError } = await supabase
        .from('orders')
        .insert({
          table_id: table.id,
          seat_id: seat.id,
          resident_id: GUEST_USER_ID,
          server_id: GUEST_USER_ID,
          items: [drinkItem],
          status: 'new',
          type: 'beverage',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
        
      if (drinkError) {
        console.error(`❌ Error creating drink order:`, drinkError)
      }
      
      // Route food order through KDS
      if (foodOrder) {
        const primaryStation = menuCategories[foodItems[0].name] || STATION_UUIDS.EXPO
        
        const { error: routingError } = await supabase
          .from('kds_order_routing')
          .insert({
            order_id: foodOrder.id,
            station_id: primaryStation,
            sequence: 1,
            routed_at: new Date().toISOString(),
            priority: 1,
            recall_count: 0
          })
          
        if (routingError) {
          console.error(`❌ Error routing order to KDS:`, routingError)
        }
      }
      
      // Route drink order through KDS
      if (drinkOrder) {
        const { error: drinkRoutingError } = await supabase
          .from('kds_order_routing')
          .insert({
            order_id: drinkOrder.id,
            station_id: STATION_UUIDS.BAR,
            sequence: 1,
            routed_at: new Date().toISOString(),
            priority: 1,
            recall_count: 0
          })
          
        if (drinkRoutingError) {
          console.error(`❌ Error routing drink to KDS:`, drinkRoutingError)
        }
      }
      
      totalOrders += 2 // food + drink
      totalItems += foodItems.length + 1
      
      console.log(`   ✅ Seat ${orderData.seat}: ${foodItems[0].name} + ${orderData.drink}`)
    }
  }
  
  console.log(`\n🎉 Successfully created ${totalOrders} orders with ${totalItems} items across ${testData.length} tables`)
}

async function verifyOrders() {
  console.log('\n🔍 Verifying created orders...')
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      items,
      type,
      status,
      tables!inner(label),
      seats!inner(label)
    `)
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error verifying orders:', error)
    return
  }
  
  console.log(`\n📊 Verification Summary:`)
  console.log(`Total Orders: ${orders.length}`)
  
  const byType = orders.reduce((acc, order) => {
    acc[order.type] = (acc[order.type] || 0) + 1
    return acc
  }, {})
  
  console.log(`Food Orders: ${byType.food || 0}`)
  console.log(`Beverage Orders: ${byType.beverage || 0}`)
  
  const sampleOrders = orders.slice(0, 3)
  console.log(`\n📝 Sample Orders:`)
  sampleOrders.forEach(order => {
    const itemNames = order.items.map(item => item.name).join(', ')
    console.log(`   Table ${order.tables.label}, Seat ${order.seats.label}: ${itemNames}`)
  })
}

async function main() {
  console.log('🚀 Summer Menu Test Data Creation')
  console.log('================================\n')
  
  try {
    await clearExistingOrders()
    await createOrdersWithKDSRouting()
    await verifyOrders()
    
    console.log('\n✅ Summer menu test data creation completed successfully!')
    console.log('\n💡 Next steps:')
    console.log('   - Start the development server: npm run dev')
    console.log('   - Navigate to /kitchen/kds to see the orders')
    console.log('   - Test the KDS interface with your summer menu items')
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }