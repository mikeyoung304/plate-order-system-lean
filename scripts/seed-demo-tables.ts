// Seed demo tables for restaurant floor plan
// Creates tables and seats for guest demo experience

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env file
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value && !process.env[key]) {
      process.env[key] = value.trim()
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function seedDemoTables() {
  console.log('🍽️ Setting up demo restaurant tables...')
  
  try {
    // Check if tables already exist
    const { data: existingTables } = await supabase
      .from('tables')
      .select('id, label')
      .limit(1)
    
    if (existingTables && existingTables.length > 0) {
      console.log('✅ Tables already exist, skipping setup')
      
      // Show current table count
      const { data: allTables } = await supabase
        .from('tables')
        .select('id, label')
      
      console.log(`📊 Current tables: ${allTables?.length || 0}`)
      return
    }
    
    // Create demo tables
    console.log('🏗️ Creating demo tables...')
    
    const tablesData = [
      { label: '1', type: 'circle', status: 'available', seats: 4, x: 100, y: 100 },
      { label: '2', type: 'circle', status: 'available', seats: 4, x: 300, y: 100 },
      { label: '3', type: 'circle', status: 'available', seats: 4, x: 500, y: 100 },
      { label: '4', type: 'rectangle', status: 'available', seats: 6, x: 100, y: 300 },
      { label: '5', type: 'rectangle', status: 'available', seats: 6, x: 350, y: 300 },
      { label: '6', type: 'rectangle', status: 'available', seats: 8, x: 600, y: 300 },
      { label: '7', type: 'circle', status: 'available', seats: 2, x: 150, y: 500 },
      { label: '8', type: 'circle', status: 'available', seats: 2, x: 400, y: 500 }
    ]
    
    for (const tableData of tablesData) {
      console.log(`📋 Creating Table ${tableData.label}...`)
      
      // Insert table
      const { data: table, error: tableError } = await supabase
        .from('tables')
        .insert({
          label: tableData.label,
          type: tableData.type,
          status: tableData.status,
          x: tableData.x,
          y: tableData.y
        })
        .select()
        .single()
      
      if (tableError) {
        console.error(`❌ Failed to create table ${tableData.label}:`, tableError)
        throw tableError
      }
      
      // Insert seats for this table
      console.log(`🪑 Adding ${tableData.seats} seats to Table ${tableData.label}...`)
      
      const seatsData = Array.from({ length: tableData.seats }, (_, i) => ({
        table_id: table.id,
        label: i + 1,
        status: 'available'
      }))
      
      const { error: seatsError } = await supabase
        .from('seats')
        .insert(seatsData)
      
      if (seatsError) {
        console.error(`❌ Failed to create seats for table ${tableData.label}:`, seatsError)
        throw seatsError
      }
    }
    
    console.log('')
    console.log('✅ Demo restaurant setup complete!')
    console.log('')
    console.log('🍽️ Tables created:')
    console.log('   • Tables 1-3: 4-seat circles (quick service)')
    console.log('   • Tables 4-6: 6-8 seat rectangles (family dining)')
    console.log('   • Tables 7-8: 2-seat circles (intimate dining)')
    console.log('')
    console.log('🚀 Ready for demo ordering!')
    
  } catch (error) {
    console.error('❌ Failed to setup demo tables:', error)
    process.exit(1)
  }
}

async function seedDemoResidents() {
  console.log('👥 Setting up demo residents...')
  
  try {
    // Check if residents already exist
    const { data: existingResidents } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'resident')
      .limit(1)
    
    if (existingResidents && existingResidents.length > 0) {
      console.log('✅ Residents already exist, skipping setup')
      return
    }
    
    // Create demo residents
    const residentsData = [
      { name: 'Alice Thompson', role: 'resident' },
      { name: 'Bob Johnson', role: 'resident' },
      { name: 'Carol Martinez', role: 'resident' },
      { name: 'David Chen', role: 'resident' },
      { name: 'Emma Wilson', role: 'resident' },
      { name: 'Frank Miller', role: 'resident' },
      { name: 'Grace Lee', role: 'resident' },
      { name: 'Henry Davis', role: 'resident' }
    ]
    
    for (const resident of residentsData) {
      console.log(`👤 Creating resident: ${resident.name}`)
      
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: null, // Demo residents don't need auth accounts
          name: resident.name,
          role: resident.role
        })
      
      if (error) {
        console.error(`❌ Failed to create resident ${resident.name}:`, error)
        // Continue with other residents
      }
    }
    
    console.log('✅ Demo residents created!')
    
  } catch (error) {
    console.error('❌ Failed to setup demo residents:', error)
    // Don't exit - tables are more important than residents
  }
}

async function main() {
  await seedDemoTables()
  await seedDemoResidents()
}

// Run if called directly
main().then(() => process.exit(0)).catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
})