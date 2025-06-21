const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSeatsSchema() {
  console.log('🔍 Checking Seats Schema...\n')
  
  try {
    console.log('1. Check if seats table exists:')
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('*')
      .limit(5)
      
    if (seatsError) {
      console.error('❌ Seats Table Error:', seatsError)
    } else {
      console.log(`✅ Found ${seats?.length || 0} seats`)
      seats?.forEach(seat => {
        console.log(`- Seat ${seat.id}: ${seat.label || seat.number || 'No label'}`)
      })
    }

    console.log('\n2. Check seat_id in orders vs actual seats:')
    const { data: orderSeats, error: orderSeatsError } = await supabase
      .from('orders')
      .select('id, seat_id')
      .limit(3)
      
    if (!orderSeatsError && orderSeats) {
      for (const order of orderSeats) {
        console.log(`Order ${order.id.slice(-6)}: seat_id = ${order.seat_id}`)
        
        // Try to find matching seat
        const { data: matchingSeat } = await supabase
          .from('seats')
          .select('*')
          .eq('id', order.seat_id)
          .single()
          
        if (matchingSeat) {
          console.log(`  → Found seat: ${matchingSeat.label || matchingSeat.number}`)
        } else {
          console.log(`  → No matching seat found`)
        }
      }
    }

    console.log('\n3. Check residents table structure:')
    const { data: residents, error: residentsError } = await supabase
      .from('residents')
      .select('*')
      .limit(3)
      
    if (residentsError) {
      console.error('❌ Residents Error:', residentsError)
    } else {
      console.log(`✅ Found ${residents?.length || 0} residents`)
      residents?.forEach(resident => {
        console.log(`- ${resident.id}: ${resident.name}`)
      })
    }

  } catch (error) {
    console.error('💥 Schema check failed:', error)
  }
}

checkSeatsSchema()