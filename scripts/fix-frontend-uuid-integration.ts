import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixFrontendUuidIntegration() {
  console.log('🔧 Fixing frontend UUID integration...')
  
  // Get the unique tables (handle duplicates by grouping by label)
  const { data: allTables, error: tablesError } = await supabase
    .from('tables')
    .select('id, label, type, status')
    .order('label')
    
  if (tablesError) {
    console.error('❌ Error fetching tables:', tablesError)
    return
  }
  
  // Group by label and take first occurrence to handle duplicates
  const uniqueTablesMap = new Map()
  allTables?.forEach(table => {
    const label = table.label
    if (!uniqueTablesMap.has(label)) {
      uniqueTablesMap.set(label, table)
    }
  })
  
  const uniqueTables = Array.from(uniqueTablesMap.values())
  console.log('✅ Unique tables for frontend:')
  uniqueTables.forEach(table => {
    console.log(`   Table ${table.label}: ${table.id}`)
  })
  
  // Get seats for each unique table
  console.log('\n🪑 Seat mapping for frontend:')
  const tableSeatMapping = new Map()
  
  for (const table of uniqueTables) {
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('id, label, status')
      .eq('table_id', table.id)
      .order('label')
      
    if (seatsError) {
      console.error(`❌ Error fetching seats for table ${table.label}:`, seatsError)
    } else {
      tableSeatMapping.set(table.id, seats || [])
      console.log(`   Table ${table.label} (${table.id}):`)
      seats?.forEach(seat => {
        console.log(`     - Seat ${seat.label}: ${seat.id}`)
      })
    }
  }
  
  console.log('\n📝 Frontend integration code:')
  console.log('// Use these real table UUIDs in frontend instead of mock data:')
  console.log('const realTables = [')
  uniqueTables.forEach((table, index) => {
    const seats = tableSeatMapping.get(table.id) || []
    console.log(`  {`)
    console.log(`    id: "${table.id}", // Real UUID`)
    console.log(`    label: "${table.label}",`)
    console.log(`    status: "${table.status}",`)
    console.log(`    seat_count: ${seats.length},`)
    console.log(`    seats: [`)
    seats.forEach(seat => {
      console.log(`      { id: "${seat.id}", label: ${seat.label}, status: "${seat.status}" },`)
    })
    console.log(`    ]`)
    console.log(`  }${index < uniqueTables.length - 1 ? ',' : ''}`)
  })
  console.log(']')
  
  console.log('\n🎯 Critical fix needed in server-client.tsx:')
  console.log('1. Replace mock table creation with real database query')
  console.log('2. Use real UUIDs for table.id values')
  console.log('3. Update seat lookup to use real seat UUIDs')
  console.log('4. Remove mock data fallback for order creation')
}

fixFrontendUuidIntegration().catch(console.error)