#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function simulateBrowserConditions() {
  console.log('🌐 Simulating exact browser conditions...')
  
  // Create client exactly like the browser does
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // First, authenticate as the demo user
    console.log('🔐 Signing in as demo user...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'password' // Assuming this is the password
    })
    
    if (authError) {
      console.error('❌ Auth failed:', authError.message)
      console.log('🔄 Trying without authentication (anonymous)...')
    } else {
      console.log('✅ Authentication successful')
      console.log('User ID:', authData.user?.id)
      console.log('User email:', authData.user?.email)
    }
    
    // Now test the exact loadTables query with authentication context
    console.log('\n🧪 Testing loadTables query with auth context...')
    
    const { data: tablesData, error: tablesError } = await supabase
      .from('tables')
      .select(`
        id,
        label,
        status,
        orders:orders!table_id (
          id,
          items,
          status,
          type,
          created_at,
          seat:seats!seat_id (label)
        )
      `)
      .order('label', { ascending: true })

    if (tablesError) {
      console.error('❌ loadTables query failed:', tablesError)
      console.error('Error code:', tablesError.code)
      console.error('Error message:', tablesError.message)
      
      // Check the specific conditions that server-client.tsx checks for
      if (tablesError.code === 'PGRST116' || tablesError.message.includes('policy')) {
        console.log('🚫 This matches the RLS check in server-client.tsx - would trigger mock data!')
      }
      
      return
    }

    console.log('✅ loadTables query succeeded with authentication!')
    console.log(`📊 Retrieved ${tablesData?.length || 0} tables`)
    
    // Check if any tables have mock IDs (which would indicate something's wrong)
    const hasMockIds = tablesData?.some(table => table.id.startsWith('mock-'))
    if (hasMockIds) {
      console.log('⚠️  Warning: Found tables with mock IDs!')
    } else {
      console.log('✅ All table IDs are proper UUIDs')
    }
    
    if (tablesData && tablesData.length > 0) {
      console.log('\n📋 Sample table data:')
      console.log(JSON.stringify(tablesData[0], null, 2))
    }
    
    // Test the user's profile access
    console.log('\n👤 Checking user profile access...')
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (profileError) {
        console.error('❌ Profile access failed:', profileError.message)
      } else {
        console.log('✅ Profile access successful:')
        console.log(`  Name: ${profile.name}`)
        console.log(`  Role: ${profile.role}`)
      }
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err)
  }
}

async function main() {
  console.log('🚀 Starting browser simulation test...')
  await simulateBrowserConditions()
}

main().catch(console.error)