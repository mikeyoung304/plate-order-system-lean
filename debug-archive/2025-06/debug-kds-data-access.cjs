const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugKDSDataAccess() {
  console.log('🔍 Debugging KDS Data Access with Service Role...\n')
  
  try {
    console.log('1. Check KDS Stations:')
    const { data: stations, error: stationsError } = await supabase
      .from('kds_stations')
      .select('*')
      
    if (stationsError) {
      console.error('❌ Stations Error:', stationsError)
    } else {
      console.log(`✅ Found ${stations?.length || 0} stations`)
      stations?.forEach(station => {
        console.log(`- ${station.name} (${station.type}) - Active: ${station.is_active}`)
      })
    }

    console.log('\n2. Check Orders Table:')
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, items, status, type, created_at, table_id, seat_id')
      .limit(3)
      
    if (ordersError) {
      console.error('❌ Orders Error:', ordersError)
    } else {
      console.log(`✅ Found ${orders?.length || 0} orders`)
      orders?.forEach((order, idx) => {
        console.log(`Order ${idx + 1}:`)
        console.log(`- ID: ${order.id}`)
        console.log(`- Items: ${JSON.stringify(order.items)}`)
        console.log(`- Table ID: ${order.table_id}`)
        console.log(`- Seat ID: ${order.seat_id}`)
        console.log(`- Status: ${order.status}`)
        console.log('')
      })
    }

    console.log('\n3. Check Tables:')
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('*')
      .limit(5)
      
    if (tablesError) {
      console.error('❌ Tables Error:', tablesError)
    } else {
      console.log(`✅ Found ${tables?.length || 0} tables`)
      tables?.forEach(table => {
        console.log(`- ${table.id}: ${table.label}`)
      })
    }

    console.log('\n4. Check KDS Order Routing:')
    const { data: routing, error: routingError } = await supabase
      .from('kds_order_routing')
      .select('*')
      .limit(3)
      
    if (routingError) {
      console.error('❌ Routing Error:', routingError)
    } else {
      console.log(`✅ Found ${routing?.length || 0} routing entries`)
      routing?.forEach((route, idx) => {
        console.log(`Route ${idx + 1}:`)
        console.log(`- ID: ${route.id}`)
        console.log(`- Order ID: ${route.order_id}`)
        console.log(`- Station ID: ${route.station_id}`)
        console.log(`- Routed At: ${route.routed_at}`)
        console.log(`- Completed At: ${route.completed_at}`)
        console.log('')
      })
    }

    console.log('\n5. Check Complete KDS Query:')
    const { data: kdsData, error: kdsError } = await supabase
      .from('kds_order_routing')
      .select(`
        *,
        order:orders!inner (
          id, items, status, type, created_at, seat_id,
          table:tables!table_id (id, label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `)
      .is('completed_at', null)
      .order('routed_at', { ascending: true })
      .limit(3)

    if (kdsError) {
      console.error('❌ Complete KDS Error:', kdsError)
    } else {
      console.log(`✅ Found ${kdsData?.length || 0} complete KDS entries`)
      kdsData?.forEach((entry, idx) => {
        console.log(`\nKDS Entry ${idx + 1}:`)
        console.log(`- Routing ID: ${entry.id}`)
        console.log(`- Order ID: ${entry.order?.id}`)
        console.log(`- Items: ${JSON.stringify(entry.order?.items)}`)
        console.log(`- Table: ${entry.order?.table?.label}`)
        console.log(`- Seat: ${entry.order?.seat_id}`)
        console.log(`- Station: ${entry.station?.name}`)
        console.log(`- Status: ${entry.order?.status}`)
        console.log(`- Routed: ${entry.routed_at}`)
      })
    }

  } catch (error) {
    console.error('💥 Debug failed:', error)
  }
}

debugKDSDataAccess()