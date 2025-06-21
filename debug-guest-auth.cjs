#!/usr/bin/env node

/**
 * Debug Guest Authentication
 * Checks if guest user exists and can authenticate
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('🔍 DEBUGGING GUEST AUTHENTICATION\n')

async function testGuestAuth() {
  console.log('1. Testing Supabase connection...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1).single()
    console.log('✅ Supabase connection successful')
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message)
    return false
  }
  
  console.log('\n2. Testing guest user authentication...')
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })
    
    if (authError) {
      console.log('❌ Guest authentication failed:', authError.message)
      
      // Check if user exists using service role
      if (serviceKey) {
        console.log('\n3. Checking if guest user exists in database...')
        const adminSupabase = createClient(supabaseUrl, serviceKey)
        
        const { data: users, error: userError } = await adminSupabase.auth.admin.listUsers()
        
        if (userError) {
          console.log('❌ Could not list users:', userError.message)
        } else {
          const guestUser = users.users.find(u => u.email === 'guest@restaurant.plate')
          if (guestUser) {
            console.log('✅ Guest user exists in database')
            console.log('📊 User details:', {
              id: guestUser.id,
              email: guestUser.email,
              email_confirmed: guestUser.email_confirmed_at ? 'Yes' : 'No',
              created_at: guestUser.created_at,
              last_sign_in: guestUser.last_sign_in_at
            })
          } else {
            console.log('❌ Guest user does not exist in database')
          }
        }
      }
      
      return false
    }
    
    console.log('✅ Guest authentication successful!')
    console.log('📊 Auth data:', {
      user_id: authData.user?.id,
      email: authData.user?.email,
      session_exists: !!authData.session
    })
    
    // Test session validity
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message)
    } else {
      console.log('✅ Session is valid')
    }
    
    return true
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message)
    return false
  }
}

async function main() {
  const success = await testGuestAuth()
  
  console.log('\n' + '='.repeat(50))
  
  if (success) {
    console.log('🎉 GUEST AUTHENTICATION WORKING!')
    console.log('The issue might be in the frontend or middleware.')
  } else {
    console.log('❌ GUEST AUTHENTICATION FAILED')
    console.log('Check Supabase Auth settings and RLS policies.')
  }
  
  console.log('='.repeat(50))
}

main().catch(console.error)