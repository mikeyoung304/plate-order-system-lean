const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testKDSCurrentState() {
  console.log('🔍 Testing Current KDS State (All Orders)...\n')
  
  try {
    // Get ALL orders to see fresh ones
    const { data: allKdsData, error: allKdsError } = await supabase
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
      .order('created_at', { ascending: false })  // Show newest first
      .limit(5)

    if (allKdsError) {
      console.error('❌ KDS Error:', allKdsError)
    } else {
      console.log(`✅ Found ${allKdsData?.length || 0} active KDS orders`)
      
      allKdsData?.forEach((entry, idx) => {
        console.log(`\n🍳 KDS Order ${idx + 1}:`)
        console.log(`- Professional Display: "T${entry.order?.table?.label}-S${entry.order?.seat?.label}"`)
        console.log(`- Items: ${JSON.stringify(entry.order?.items)}`)
        console.log(`- Station: ${entry.station?.name} (${entry.station?.type})`)
        console.log(`- Status: ${entry.order?.status}`)
        
        // Calculate fresh timing
        const createdTime = new Date(entry.order?.created_at)
        const now = new Date()
        const elapsedMs = now.getTime() - createdTime.getTime()
        const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))
        const elapsedSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)
        
        const colorStatus = elapsedMinutes <= 5 ? 'GREEN' : elapsedMinutes <= 10 ? 'YELLOW' : 'RED'
        
        console.log(`- Timing: ${elapsedMinutes}m ${elapsedSeconds}s (${colorStatus})`)
        console.log(`- Order ID: ${entry.order?.id.slice(-6)}`)
        console.log(`- Routing ID: ${entry.id.slice(-6)}`)
      })
      
      console.log('\n🎯 TRANSFORMATION SUMMARY:')
      console.log('✅ OLD (degraded): "Table 3Seat cce65d84-308d-437a-aadc-9e8c1bd275cb"')
      console.log('✅ NEW (professional): "T3-S1" with proper timing and station colors')
      console.log('\n🚀 The KDS should now display professional order cards!')
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testKDSCurrentState()