import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixDemoData() {
  console.log('🔧 Fixing demo data...')
  
  try {
    // 1. Clean existing data
    console.log('🧹 Cleaning existing data...')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('seats').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('tables').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // 2. Create tables (start simple, add positioning later if needed)
    console.log('📊 Creating tables...')
    const tableConfigs = [
      { label: 1, type: 'circle', seats: 4 },
      { label: 2, type: 'rectangle', seats: 6 },
      { label: 3, type: 'square', seats: 4 },
      { label: 4, type: 'circle', seats: 4 },
      { label: 5, type: 'rectangle', seats: 6 },
      { label: 6, type: 'circle', seats: 4 },
      { label: 7, type: 'square', seats: 4 },
      { label: 8, type: 'circle', seats: 4 },
    ]
    
    for (const config of tableConfigs) {
      // Try simple insert first
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .insert({
          label: config.label,
          type: config.type,
          status: 'available',
        })
        .select()
        .single()
      
      if (tableError) {
        console.error(`❌ Failed to create table ${config.label}:`, tableError)
        continue
      }
      
      // Create seats for this table
      const seats = []
      for (let i = 1; i <= config.seats; i++) {
        seats.push({
          table_id: tableData.id,
          label: i,
          status: 'available',
        })
      }
      
      const { error: seatsError } = await supabase.from('seats').insert(seats)
      
      if (seatsError) {
        console.error(`❌ Failed to create seats for table ${config.label}:`, seatsError)
      } else {
        console.log(`✅ Created Table ${config.label} with ${config.seats} seats`)
      }
    }
    
    // 3. Verify data
    const { data: tables } = await supabase.from('tables').select('*')
    const { data: seats } = await supabase.from('seats').select('*')
    
    console.log('')
    console.log('✅ Demo data fixed successfully!')
    console.log(`📊 Tables: ${tables?.length || 0}`)
    console.log(`🪑 Seats: ${seats?.length || 0}`)
    console.log('')
    console.log('🎯 Ready for demo!')
    
  } catch (error) {
    console.error('❌ Failed to fix demo data:', error)
    process.exit(1)
  }
}

fixDemoData().then(() => process.exit(0))