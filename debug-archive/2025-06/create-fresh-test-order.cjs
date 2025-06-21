const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createFreshTestOrder() {
  console.log('🆕 Creating Fresh Test Order for KDS...\n')
  
  try {
    // Get available tables, seats, and profiles
    const { data: tables } = await supabase
      .from('tables')
      .select('*')
      .limit(1)
      
    const { data: seats } = await supabase
      .from('seats')
      .select('*')
      .limit(1)
      
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      
    if (!tables || !seats || !profiles || tables.length === 0 || seats.length === 0 || profiles.length === 0) {
      console.error('❌ Missing required data: tables, seats, or profiles')
      return
    }
    
    const table = tables[0]
    const seat = seats[0]
    const profile = profiles[0]
    
    console.log(`Using Table: ${table.label} (${table.id})`)
    console.log(`Using Seat: ${seat.label} (${seat.id})`)
    console.log(`Using Profile: ${profile.name} (${profile.user_id})`)
    
    // Create a fresh order
    const orderData = {
      table_id: table.id,
      seat_id: seat.id,
      resident_id: profile.user_id,
      server_id: profile.user_id, // Using same profile as server for simplicity
      items: [
        {
          name: "Gourmet Cheeseburger",
          price: 16.99,
          category: "grill"
        },
        {
          name: "Truffle Fries", 
          price: 8.99,
          category: "fryer"
        }
      ],
      status: 'confirmed',
      type: 'food',
      total: 25.98,
      created_at: new Date().toISOString()
    }
    
    console.log('\n📝 Creating order...')
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()
      
    if (orderError) {
      console.error('❌ Order creation error:', orderError)
      return
    }
    
    console.log(`✅ Created order: ${newOrder.id}`)
    
    // Get grill station for routing
    const { data: grillStation } = await supabase
      .from('kds_stations')
      .select('*')
      .eq('type', 'grill')
      .single()
      
    if (grillStation) {
      console.log('\n🎯 Routing to grill station...')
      const { error: routingError } = await supabase
        .from('kds_order_routing')
        .insert({
          order_id: newOrder.id,
          station_id: grillStation.id,
          sequence: 1,
          priority: 1,
          routed_at: new Date().toISOString()
        })
        
      if (routingError) {
        console.error('❌ Routing error:', routingError)
      } else {
        console.log('✅ Order routed to grill station')
      }
    }
    
    // Test the complete KDS query with the new order
    console.log('\n🔍 Testing KDS display with fresh order...')
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
      .eq('order_id', newOrder.id)
      .single()
      
    if (kdsError) {
      console.error('❌ KDS query error:', kdsError)
    } else {
      console.log('\n🎉 SUCCESS! Fresh KDS Entry:')
      console.log(`- Professional Display: "T${kdsData.order?.table?.label}-S${kdsData.order?.seat?.label}"`)
      console.log(`- Table: ${kdsData.order?.table?.label}`)
      console.log(`- Seat: ${kdsData.order?.seat?.label}`)
      console.log(`- Station: ${kdsData.station?.name}`)
      console.log(`- Items: ${JSON.stringify(kdsData.order?.items)}`)
      console.log(`- Status: ${kdsData.order?.status}`)
      console.log(`- Created: ${kdsData.order?.created_at}`)
      
      // Calculate fresh timing
      const createdTime = new Date(kdsData.order?.created_at)
      const now = new Date()
      const elapsedMs = now.getTime() - createdTime.getTime()
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))
      const elapsedSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)
      
      console.log(`- Fresh Timing: ${elapsedMinutes}m ${elapsedSeconds}s`)
      console.log(`\n✨ This order should now display correctly in the KDS interface!`)
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

createFreshTestOrder()