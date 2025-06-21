const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUpdatedKDSQuery() {
  console.log('🔍 Testing Updated KDS Query...\n')
  
  try {
    console.log('Testing fetchAllActiveOrders with seat information:')
    const { data: kdsData, error: kdsError } = await supabase
      .from('kds_order_routing')
      .select(`
        *,
        order:orders!inner (
          id, items, status, type, created_at, transcript, seat_id,
          table:tables!table_id (id, label),
          seat:seats!seat_id (id, label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `)
      .is('completed_at', null)
      .order('routed_at', { ascending: true })
      .limit(3)

    if (kdsError) {
      console.error('❌ Updated KDS Error:', kdsError)
    } else {
      console.log(`✅ Found ${kdsData?.length || 0} KDS entries with seat data`)
      
      kdsData?.forEach((entry, idx) => {
        console.log(`\n📋 KDS Entry ${idx + 1} (FIXED FORMAT):`)
        console.log(`- Routing ID: ${entry.id.slice(-6)}`)
        console.log(`- Order ID: ${entry.order?.id.slice(-6)}`)
        console.log(`- Items: ${JSON.stringify(entry.order?.items)}`)
        console.log(`- Table: ${entry.order?.table?.label} (ID: ${entry.order?.table?.id.slice(-6)})`)
        console.log(`- Seat: ${entry.order?.seat?.label} (ID: ${entry.order?.seat?.id.slice(-6)})`)
        console.log(`- Station: ${entry.station?.name} (${entry.station?.type})`)
        console.log(`- Status: ${entry.order?.status}`)
        console.log(`- Created: ${entry.order?.created_at}`)
        console.log(`- Routed: ${entry.routed_at}`)
        
        // Calculate timing like the KDS would
        const createdTime = new Date(entry.order?.created_at)
        const now = new Date()
        const elapsedMs = now.getTime() - createdTime.getTime()
        const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))
        const elapsedSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)
        
        console.log(`- Elapsed Time: ${elapsedMinutes}m ${elapsedSeconds}s`)
        console.log(`- Professional Display Format: "T${entry.order?.table?.label}-S${entry.order?.seat?.label}"`)
      })
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testUpdatedKDSQuery()