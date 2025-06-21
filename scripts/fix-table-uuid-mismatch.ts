import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixTableUuidMismatch() {
  console.log('🔧 Investigating table UUID mismatch...')
  
  // First, check actual table structure in database  
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('id, label, type, status')
    .order('label')
    
  if (tablesError) {
    console.error('❌ Error fetching tables:', tablesError)
    return
  }
  
  console.log('✅ Real tables in database:')
  tables?.forEach((table, index) => {
    console.log(`   ${index + 1}. Label: ${table.label}, ID: ${table.id} (${typeof table.id})`)
  })
  
  // Check seats for each table
  console.log('\n🪑 Checking seats per table:')
  for (const table of tables || []) {
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('id, label, status')
      .eq('table_id', table.id)
      
    if (seatsError) {
      console.error(`❌ Error fetching seats for table ${table.label}:`, seatsError)
    } else {
      console.log(`   Table ${table.label} (${table.id}):`)
      if (seats && seats.length > 0) {
        seats.forEach(seat => {
          console.log(`     - Seat ${seat.label}: ${seat.id} (${seat.status})`)
        })
      } else {
        console.log(`     - No seats found`)
      }
    }
  }
  
  // Check if there are any order creation issues
  console.log('\n📋 Checking recent orders:')
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, table_id, seat_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
    
  if (ordersError) {
    console.error('❌ Error fetching orders:', ordersError)
  } else {
    console.log('✅ Recent orders:')
    orders?.forEach(order => {
      console.log(`   Order ${order.id}: table_id=${order.table_id}, seat_id=${order.seat_id}`)
    })
  }
  
  console.log('\n🔍 Analysis Complete. Issue found:')
  console.log('   - Frontend uses mock table IDs like "mock-table-1" or integer strings')
  console.log('   - Database expects UUID strings for table_id/seat_id relationships')
  console.log('   - Need to use real table UUIDs from database in frontend components')
}

fixTableUuidMismatch().catch(console.error)