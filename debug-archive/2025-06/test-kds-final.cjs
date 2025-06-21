const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key
const supabaseUrl = 'https://eiipozoogrrfudhjoqms.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaXBvem9vZ3JyZnVkaGpvcW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDIwNzI3OSwiZXhwIjoyMDU5NzgzMjc5fQ.p7DodpQaPooDVFQTAkXKWRdp0ZGMzzXib9cfxGauLko'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testKDSFinalDisplay() {
  console.log('🎯 Testing Final KDS Display Format...\n')
  
  try {
    // Test the exact query that the KDS app uses
    const { data: kdsData, error: kdsError } = await supabase
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
      .is('completed_at', null)
      .order('routed_at', { ascending: true })

    if (kdsError) {
      console.error('❌ KDS Query Error:', kdsError)
      return
    }

    console.log(`✅ Found ${kdsData?.length || 0} active KDS orders\n`)

    if (kdsData && kdsData.length > 0) {
      console.log('📋 KDS Display Analysis:\n')
      
      kdsData.forEach((order, idx) => {
        console.log(`Order ${idx + 1}:`)
        
        // Show how the order card would display this
        const tableLabel = order.order?.table?.label || '?'
        const seatLabel = order.order?.seat?.label || '?'
        const orderDisplay = `T${tableLabel}-S${seatLabel}`
        
        console.log(`  Display ID: ${orderDisplay}`)
        console.log(`  Station: ${order.station?.name} (${order.station?.type})`)
        console.log(`  Table: Table ${tableLabel}`)
        console.log(`  Seat: Seat ${seatLabel}`)
        console.log(`  Status: ${order.order?.status}`)
        console.log(`  Items:`)
        
        if (order.order?.items && Array.isArray(order.order.items)) {
          order.order.items.forEach((item, itemIdx) => {
            if (typeof item === 'object' && item.name) {
              console.log(`    • ${item.name} ($${item.price?.toFixed(2) || '?.??'}) [${item.category}]`)
            } else {
              console.log(`    • ${item}`)
            }
          })
        }
        
        console.log(`  Routed: ${new Date(order.routed_at).toLocaleTimeString()}`)
        if (order.started_at) {
          console.log(`  Started: ${new Date(order.started_at).toLocaleTimeString()}`)
        }
        console.log('')
      })

      // Test table grouping
      console.log('🏓 Table Grouping Analysis:\n')
      
      const tableGroups = new Map()
      
      kdsData.forEach(order => {
        const tableId = order.order?.table_id
        if (!tableId) return
        
        if (!tableGroups.has(tableId)) {
          tableGroups.set(tableId, [])
        }
        tableGroups.get(tableId).push(order)
      })
      
      for (const [tableId, orders] of tableGroups.entries()) {
        const tableLabel = orders[0].order?.table?.label || '?'
        console.log(`Table ${tableLabel} (${orders.length} orders):`)
        
        orders.forEach(order => {
          const seatLabel = order.order?.seat?.label || '?'
          const itemCount = order.order?.items?.length || 0
          console.log(`  Seat ${seatLabel}: ${itemCount} items - ${order.order?.status}`)
        })
        console.log('')
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testKDSFinalDisplay()