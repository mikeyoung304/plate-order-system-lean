const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCompleteKDSQuery() {
  console.log('🔍 Testing Complete KDS Query with All Data...\n')
  
  try {
    console.log('Testing complete fetchAllActiveOrders query:')
    const { data: kdsData, error: kdsError } = await supabase
      .from('kds_order_routing')
      .select(`
        *,
        order:orders!inner (
          id, items, status, type, created_at, transcript, seat_id,
          table:tables!table_id (id, label),
          seat:seats!seat_id (id, label),
          resident:profiles!resident_id (name)
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
        console.log(`\n🎯 COMPLETE KDS Entry ${idx + 1}:`)
        console.log(`- Display: "T${entry.order?.table?.label}-S${entry.order?.seat?.label}"`)
        console.log(`- Customer: ${entry.order?.resident?.name || 'No name'}`)
        console.log(`- Station: ${entry.station?.name} (${entry.station?.type})`)
        console.log(`- Items: ${JSON.stringify(entry.order?.items)}`)
        console.log(`- Status: ${entry.order?.status}`)
        
        // Calculate timing like the KDS would
        const createdTime = new Date(entry.order?.created_at)
        const now = new Date()
        const elapsedMs = now.getTime() - createdTime.getTime()
        const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))
        const elapsedSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)
        
        const colorStatus = elapsedMinutes <= 5 ? 'green' : elapsedMinutes <= 10 ? 'yellow' : 'red'
        
        console.log(`- Timing: ${elapsedMinutes}m ${elapsedSeconds}s (${colorStatus})`)
        console.log(`- Created: ${entry.order?.created_at}`)
        console.log(`- Routed: ${entry.routed_at}`)
      })
      
      console.log('\n✨ This data should now display perfectly in the KDS interface!')
      console.log('🔥 Professional format: "T1-S1" with timing colors and customer names')
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testCompleteKDSQuery()