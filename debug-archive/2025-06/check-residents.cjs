const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkResidents() {
  console.log('🔍 Checking for residents...\n')
  
  try {
    // Try different possible names for resident tables
    const possibleTables = ['residents', 'profiles', 'users']
    
    for (const tableName of possibleTables) {
      console.log(`Checking table: ${tableName}`)
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(3)
          
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ Found ${data?.length || 0} records in ${tableName}`)
          data?.forEach((record, idx) => {
            console.log(`  ${idx + 1}. ${record.id}: ${record.name || record.email || 'No name'}`)
          })
        }
      } catch (e) {
        console.log(`❌ ${tableName}: ${e.message}`)
      }
    }
    
    // Check the orders table structure to see what the constraint is
    console.log('\nChecking orders table structure...')
    const { data: orderSample, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .limit(1)
      
    if (!orderError && orderSample && orderSample.length > 0) {
      console.log('\nSample order structure:')
      console.log(Object.keys(orderSample[0]))
      console.log('\nSample order data:')
      console.log(orderSample[0])
    }

  } catch (error) {
    console.error('💥 Check failed:', error)
  }
}

checkResidents()