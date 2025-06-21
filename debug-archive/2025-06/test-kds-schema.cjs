const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key for testing
const supabaseUrl = 'https://eiipozoogrrfudhjoqms.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaXBvem9vZ3JyZnVkaGpvcW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDIwNzI3OSwiZXhwIjoyMDU5NzgzMjc5fQ.p7DodpQaPooDVFQTAkXKWRdp0ZGMzzXib9cfxGauLko'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testDatabaseSchema() {
  console.log('🔍 Testing Database Schema and Data...\n')
  
  try {
    // Test KDS Order Routing table
    console.log('1. Testing kds_order_routing structure:')
    const { data: routingData, error: routingError } = await supabase
      .from('kds_order_routing')
      .select('*')
      .limit(3)

    if (routingError) {
      console.error('❌ KDS Routing Error:', routingError)
    } else {
      console.log(`✅ Found ${routingData?.length || 0} KDS routing entries`)
      if (routingData && routingData.length > 0) {
        console.log('\n📋 Sample KDS Routing Entry:')
        console.log(JSON.stringify(routingData[0], null, 2))
      }
    }

    // Test Orders table
    console.log('\n2. Testing orders table:')
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(3)

    if (ordersError) {
      console.error('❌ Orders Error:', ordersError)
    } else {
      console.log(`✅ Found ${ordersData?.length || 0} orders`)
      if (ordersData && ordersData.length > 0) {
        console.log('\n📋 Sample Order:')
        console.log(JSON.stringify(ordersData[0], null, 2))
        
        // Analyze items structure
        ordersData.forEach((order, idx) => {
          console.log(`\nOrder ${idx + 1} Items Analysis:`)
          console.log(`- Items type: ${typeof order.items}`)
          console.log(`- Items value: ${JSON.stringify(order.items)}`)
          if (Array.isArray(order.items)) {
            order.items.forEach((item, itemIdx) => {
              console.log(`  Item ${itemIdx}: ${typeof item} = ${JSON.stringify(item)}`)
            })
          }
        })
      }
    }

    // Test KDS full query like the app does
    console.log('\n3. Testing complete KDS query with joins:')
    const { data: fullKdsData, error: fullKdsError } = await supabase
      .from('kds_order_routing')
      .select(`
        *,
        order:orders!inner (
          id, items, status, type, created_at,
          table:tables!table_id (label),
          seat:seats!seat_id (id, label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `)
      .limit(3)

    if (fullKdsError) {
      console.error('❌ Full KDS Query Error:', fullKdsError)
    } else {
      console.log(`✅ Found ${fullKdsData?.length || 0} full KDS entries`)
      if (fullKdsData && fullKdsData.length > 0) {
        console.log('\n📋 Full KDS Query Result:')
        console.log(JSON.stringify(fullKdsData[0], null, 2))
      }
    }

    // Test table structure
    console.log('\n4. Testing tables structure:')
    const { data: tablesData, error: tablesError } = await supabase
      .from('tables')
      .select('*')
      .limit(5)

    if (tablesError) {
      console.error('❌ Tables Error:', tablesError)
    } else {
      console.log(`✅ Found ${tablesData?.length || 0} tables`)
      if (tablesData && tablesData.length > 0) {
        console.log('\n🏓 Tables:')
        tablesData.forEach(table => {
          console.log(`- ID: ${table.id}, Label: ${table.label}`)
        })
      }
    }

    // Test seats structure
    console.log('\n5. Testing seats structure:')
    const { data: seatsData, error: seatsError } = await supabase
      .from('seats')
      .select('*')
      .limit(10)

    if (seatsError) {
      console.error('❌ Seats Error:', seatsError)
    } else {
      console.log(`✅ Found ${seatsData?.length || 0} seats`)
      if (seatsData && seatsData.length > 0) {
        console.log('\n💺 Sample Seats:')
        seatsData.slice(0, 5).forEach(seat => {
          console.log(`- ID: ${seat.id}, Label: ${seat.label}, Table: ${seat.table_id}`)
        })
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testDatabaseSchema()