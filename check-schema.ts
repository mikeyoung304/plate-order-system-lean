import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSchema() {
  console.log('🔍 Checking table schemas...')
  
  // Try to insert a minimal table to see what columns exist
  const { data, error } = await supabase
    .from('tables')
    .insert({
      label: 'test',
      type: 'circle',
      status: 'available'
    })
    .select()
  
  if (error) {
    console.log('Error details:', error)
  } else {
    console.log('✅ Minimal insert worked:', data)
    // Clean up test data
    await supabase.from('tables').delete().eq('label', 'test')
  }
  
  // Check what's actually in the existing tables
  const { data: existingTables } = await supabase
    .from('tables')
    .select('*')
    .limit(1)
  
  if (existingTables && existingTables.length > 0) {
    console.log('📊 Existing table structure:', Object.keys(existingTables[0]))
  }
}

checkSchema().then(() => process.exit(0))