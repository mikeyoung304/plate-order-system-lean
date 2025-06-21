const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRelationships() {
  console.log('🔍 Checking Table Relationships...\n')
  
  try {
    // Check what resident_id in orders maps to
    console.log('1. Sample order with resident_id:')
    const { data: sampleOrder } = await supabase
      .from('orders')
      .select('id, resident_id, server_id')
      .limit(1)
      .single()
      
    if (sampleOrder) {
      console.log(`Order resident_id: ${sampleOrder.resident_id}`)
      console.log(`Order server_id: ${sampleOrder.server_id}`)
      
      // Try to find this in profiles by user_id
      const { data: profileByUserId } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sampleOrder.resident_id)
        .single()
        
      if (profileByUserId) {
        console.log(`✅ Found profile by user_id: ${profileByUserId.name}`)
      } else {
        console.log('❌ No profile found by user_id')
      }
      
      // Try to find in profiles by id
      const { data: profileById } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sampleOrder.resident_id)
        .single()
        
      if (profileById) {
        console.log(`✅ Found profile by id: ${profileById.name}`)
      } else {
        console.log('❌ No profile found by id')
      }
    }
    
    // Check for other possible user tables
    console.log('\n2. Checking for auth.users table access:')
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email')
        .limit(1)
        
      if (authError) {
        console.log(`❌ auth.users: ${authError.message}`)
      } else {
        console.log(`✅ Found ${authUsers?.length} users in auth.users`)
      }
    } catch (e) {
      console.log(`❌ auth.users: Cannot access`)
    }
    
    // Test manual join instead of foreign key
    console.log('\n3. Testing manual join instead of FK:')
    const { data: manualJoin, error: manualError } = await supabase
      .from('orders')
      .select(`
        id, resident_id, 
        table:tables!table_id (label),
        seat:seats!seat_id (label)
      `)
      .limit(1)
      .single()
      
    if (manualError) {
      console.error('❌ Manual join error:', manualError)
    } else {
      console.log('✅ Manual join works:')
      console.log(`- Order: ${manualJoin.id}`)
      console.log(`- Table: ${manualJoin.table?.label}`)
      console.log(`- Seat: ${manualJoin.seat?.label}`)
      console.log(`- Resident ID: ${manualJoin.resident_id}`)
      
      // Now manually fetch the profile
      const { data: residentProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', manualJoin.resident_id)
        .single()
        
      if (residentProfile) {
        console.log(`- Resident Name: ${residentProfile.name}`)
      }
    }

  } catch (error) {
    console.error('💥 Check failed:', error)
  }
}

checkRelationships()