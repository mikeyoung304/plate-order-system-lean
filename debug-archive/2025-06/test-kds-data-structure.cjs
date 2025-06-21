const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testKDSDataStructure() {
  console.log('🔍 Testing KDS Data Structure...\n')
  
  try {
    console.log('1. Testing fetchAllActiveOrders query structure:')
    const { data: kdsOrders, error: kdsError } = await supabase
      .from('kds_order_routing')
      .select(`
        *,
        order:orders!inner (
          id, items, status, type, created_at, transcript,
          table:tables!table_id (label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `)
      .is('completed_at', null)
      .order('routed_at', { ascending: true })
      .limit(3)

    if (kdsError) {
      console.error('❌ KDS Order Error:', kdsError)
    } else {
      console.log(`✅ Found ${kdsOrders?.length || 0} KDS orders`)
      if (kdsOrders && kdsOrders.length > 0) {
        console.log('\n📋 Sample KDS Order Structure:')
        console.log(JSON.stringify(kdsOrders[0], null, 2))
        
        console.log('\n🔍 Order Items Analysis:')
        kdsOrders.forEach((order, idx) => {
          console.log(`Order ${idx + 1}:`)
          console.log(`- ID: ${order.id}`)
          console.log(`- Order ID: ${order.order?.id}`)
          console.log(`- Items type: ${typeof order.order?.items}`)
          console.log(`- Items: ${JSON.stringify(order.order?.items)}`)
          console.log(`- Table: ${order.order?.table?.label}`)
          console.log(`- Station: ${order.station?.name}`)
          console.log('')
        })
      }
    }

    console.log('\n2. Testing raw orders table:')
    const { data: rawOrders, error: rawError } = await supabase
      .from('orders')
      .select('*')
      .limit(3)
      
    if (rawError) {
      console.error('❌ Raw Orders Error:', rawError)
    } else {
      console.log(`✅ Found ${rawOrders?.length || 0} raw orders`)
      if (rawOrders && rawOrders.length > 0) {
        console.log('\n📋 Sample Raw Order:')
        console.log(JSON.stringify(rawOrders[0], null, 2))
      }
    }

    console.log('\n3. Testing tables structure:')
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('*')
      .limit(5)
      
    if (tablesError) {
      console.error('❌ Tables Error:', tablesError)
    } else {
      console.log(`✅ Found ${tables?.length || 0} tables`)
      if (tables && tables.length > 0) {
        console.log('\n🏓 Sample Table Structure:')
        tables.forEach(table => {
          console.log(`- ${table.id}: ${table.label}`)
        })
      }
    }

    console.log('\n4. Testing KDS stations:')
    const { data: stations, error: stationsError } = await supabase
      .from('kds_stations')
      .select('*')
      
    if (stationsError) {
      console.error('❌ Stations Error:', stationsError)
    } else {
      console.log(`✅ Found ${stations?.length || 0} stations`)
      if (stations && stations.length > 0) {
        console.log('\n🏭 Stations:')
        stations.forEach(station => {
          console.log(`- ${station.name} (${station.type}) - Active: ${station.is_active}`)
        })
      }
    }

    console.log('\n5. Testing order items structure in detail:')
    const { data: detailedOrders, error: detailedError } = await supabase
      .from('orders')
      .select(`
        id, items, status, created_at,
        table:tables!table_id (id, label),
        resident:residents!resident_id (id, name)
      `)
      .not('items', 'is', null)
      .limit(5)
      
    if (detailedError) {
      console.error('❌ Detailed Orders Error:', detailedError)
    } else {
      console.log(`✅ Found ${detailedOrders?.length || 0} orders with items`)
      if (detailedOrders && detailedOrders.length > 0) {
        detailedOrders.forEach((order, idx) => {
          console.log(`\nOrder ${idx + 1} (${order.id.slice(-6)}):`)
          console.log(`- Status: ${order.status}`)
          console.log(`- Table: ${order.table?.label || 'No table'}`)
          console.log(`- Resident: ${order.resident?.name || 'No resident'}`)
          console.log(`- Items type: ${typeof order.items}`)
          console.log(`- Items content: ${JSON.stringify(order.items)}`)
          
          if (Array.isArray(order.items)) {
            console.log(`- Items array length: ${order.items.length}`)
            order.items.forEach((item, itemIdx) => {
              console.log(`  Item ${itemIdx + 1}: ${typeof item} - ${JSON.stringify(item)}`)
            })
          }
        })
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testKDSDataStructure()