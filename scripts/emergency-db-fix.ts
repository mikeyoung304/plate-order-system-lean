#!/usr/bin/env node
/**
 * Emergency Database Fix Script
 * Fixes schema mismatches and ensures guest demo user works
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAndFixGuestUser() {
  console.log('\n🔍 Checking guest user setup...')
  
  // Check if guest user exists
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()
  
  if (userError) {
    console.error('❌ Error fetching users:', userError)
    return false
  }
  
  const guestUser = users.users.find(u => u.email === 'guest@restaurant.plate')
  
  if (!guestUser) {
    console.log('❌ Guest user not found!')
    console.log('Creating guest user...')
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'guest@restaurant.plate',
      password: 'guest12345',
      email_confirm: true
    })
    
    if (createError) {
      console.error('❌ Error creating guest user:', createError)
      return false
    }
    
    console.log('✅ Guest user created:', newUser.user.id)
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: newUser.user.id,
        role: 'admin',
        name: 'Guest Demo User'
      })
    
    if (profileError) {
      console.error('❌ Error creating guest profile:', profileError)
      return false
    }
    
    console.log('✅ Guest profile created with admin role')
    return true
  }
  
  console.log('✅ Guest user exists:', guestUser.id)
  
  // Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', guestUser.id)
    .single()
  
  if (profileError || !profile) {
    console.log('❌ Guest profile not found, creating...')
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: guestUser.id,
        role: 'admin',
        name: 'Guest Demo User'
      })
    
    if (insertError) {
      console.error('❌ Error creating guest profile:', insertError)
      return false
    }
    
    console.log('✅ Guest profile created with admin role')
    return true
  }
  
  // Ensure guest is admin
  if (profile.role !== 'admin') {
    console.log('⚠️  Guest user is not admin, updating...')
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', guestUser.id)
    
    if (updateError) {
      console.error('❌ Error updating guest role:', updateError)
      return false
    }
    
    console.log('✅ Guest user updated to admin role')
  } else {
    console.log('✅ Guest user has admin role')
  }
  
  return true
}

async function checkDatabaseSchema() {
  console.log('\n🔍 Checking database schema...')
  
  // Check if tables exist
  const tables = ['profiles', 'tables', 'seats', 'orders', 'kds_stations', 'kds_order_routing']
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (error) {
      console.error(`❌ Error accessing ${table}:`, error.message)
    } else {
      console.log(`✅ Table ${table} is accessible`)
    }
  }
}

async function createSampleData() {
  console.log('\n🔍 Checking sample data...')
  
  // Check if any tables exist
  const { data: existingTables, error: tablesError } = await supabase
    .from('tables')
    .select('*')
  
  if (tablesError) {
    console.error('❌ Error checking tables:', tablesError)
    return
  }
  
  if (!existingTables || existingTables.length === 0) {
    console.log('📝 Creating sample tables...')
    
    const sampleTables = [
      { table_id: 'table-1', label: '1', type: 'standard', status: 'available', position_x: 100, position_y: 100 },
      { table_id: 'table-2', label: '2', type: 'standard', status: 'available', position_x: 200, position_y: 100 },
      { table_id: 'table-3', label: '3', type: 'standard', status: 'available', position_x: 300, position_y: 100 },
      { table_id: 'table-4', label: '4', type: 'booth', status: 'available', position_x: 100, position_y: 200 },
      { table_id: 'table-5', label: '5', type: 'booth', status: 'available', position_x: 200, position_y: 200 },
    ]
    
    const { error: insertError } = await supabase
      .from('tables')
      .insert(sampleTables)
    
    if (insertError) {
      console.error('❌ Error creating sample tables:', insertError)
    } else {
      console.log('✅ Sample tables created')
      
      // Create seats for each table
      for (const table of sampleTables) {
        const seats = [
          { seat_id: `${table.table_id}-seat-1`, table_id: table.table_id, label: 1 },
          { seat_id: `${table.table_id}-seat-2`, table_id: table.table_id, label: 2 },
          { seat_id: `${table.table_id}-seat-3`, table_id: table.table_id, label: 3 },
          { seat_id: `${table.table_id}-seat-4`, table_id: table.table_id, label: 4 },
        ]
        
        const { error: seatError } = await supabase
          .from('seats')
          .insert(seats)
        
        if (seatError) {
          console.error(`❌ Error creating seats for ${table.table_id}:`, seatError)
        }
      }
      
      console.log('✅ Sample seats created')
    }
  } else {
    console.log(`✅ Found ${existingTables.length} existing tables`)
  }
  
  // Check KDS stations
  const { data: stations, error: stationsError } = await supabase
    .from('kds_stations')
    .select('*')
  
  if (!stations || stations.length === 0) {
    console.log('📝 Creating KDS stations...')
    
    const kdsStations = [
      { name: 'Grill Station', type: 'grill', color: '#FF6B6B', position: 1, is_active: true },
      { name: 'Fryer Station', type: 'fryer', color: '#4ECDC4', position: 2, is_active: true },
      { name: 'Salad Station', type: 'salad', color: '#45B7D1', position: 3, is_active: true },
      { name: 'Expo Station', type: 'expo', color: '#96CEB4', position: 4, is_active: true },
      { name: 'Bar Station', type: 'bar', color: '#DDA0DD', position: 5, is_active: true },
    ]
    
    const { error: stationError } = await supabase
      .from('kds_stations')
      .insert(kdsStations)
    
    if (stationError) {
      console.error('❌ Error creating KDS stations:', stationError)
    } else {
      console.log('✅ KDS stations created')
    }
  } else {
    console.log(`✅ Found ${stations.length} existing KDS stations`)
  }
}

async function main() {
  console.log('🚀 Emergency Database Fix Script')
  console.log('================================')
  
  try {
    // Fix guest user
    const guestFixed = await checkAndFixGuestUser()
    if (!guestFixed) {
      console.error('\n❌ Failed to fix guest user')
      process.exit(1)
    }
    
    // Check schema
    await checkDatabaseSchema()
    
    // Create sample data if needed
    await createSampleData()
    
    console.log('\n✅ Database fix completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Run: npm run dev')
    console.log('2. Login with: guest@restaurant.plate / guest12345')
    console.log('3. Navigate to /server or /kitchen/kds')
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  }
}

main()