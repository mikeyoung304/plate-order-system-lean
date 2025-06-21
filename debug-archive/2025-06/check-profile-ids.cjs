const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProfileIds() {
  console.log('🔍 Checking Profile ID Structure...\n')
  
  try {
    console.log('Profile table structure:')
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .limit(3)
      
    if (profiles) {
      profiles.forEach(profile => {
        console.log(`- ID: ${profile.id} (type: ${typeof profile.id})`)
        console.log(`- User ID: ${profile.user_id} (type: ${typeof profile.user_id})`)
        console.log(`- Name: ${profile.name}`)
        console.log('')
      })
    }
    
    console.log('Checking existing orders to see which field is used:')
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('resident_id, server_id')
      .limit(1)
      .single()
      
    if (existingOrder) {
      console.log(`Existing order resident_id: ${existingOrder.resident_id} (type: ${typeof existingOrder.resident_id})`)
      console.log(`Existing order server_id: ${existingOrder.server_id} (type: ${typeof existingOrder.server_id})`)
    }

  } catch (error) {
    console.error('💥 Check failed:', error)
  }
}

checkProfileIds()