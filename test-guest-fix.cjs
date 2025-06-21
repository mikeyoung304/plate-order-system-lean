#!/usr/bin/env node

/**
 * Test Guest User Profile Fix
 * Verifies that the guest user has proper profile entry for RLS access
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function testGuestUserProfile() {
  console.log('🔍 Testing Guest User Profile Setup...\n')
  
  // Create service role client for admin access
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    // Test 1: Check if guest user exists in auth.users
    console.log('1️⃣ Checking guest user in auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('❌ Failed to list auth users:', authError.message)
      return false
    }
    
    const guestUser = authUsers.users.find(user => user.email === 'guest@restaurant.plate')
    
    if (!guestUser) {
      console.log('❌ Guest user not found in auth.users')
      console.log('💡 You need to create the guest user first')
      return false
    }
    
    console.log('✅ Guest user exists in auth.users')
    console.log(`   User ID: ${guestUser.id}`)
    console.log(`   Email: ${guestUser.email}`)
    console.log(`   Created: ${guestUser.created_at}`)
    
    // Test 2: Check if guest user has profile entry
    console.log('\n2️⃣ Checking guest user profile...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', guestUser.id)
    
    if (profileError) {
      console.log('❌ Failed to query profiles:', profileError.message)
      return false
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ Guest user has NO profile entry')
      console.log('💡 Run the SQL fix: fix-guest-user-profile.sql')
      return false
    }
    
    const profile = profiles[0]
    console.log('✅ Guest user profile exists')
    console.log(`   Role: ${profile.role}`)
    console.log(`   Name: ${profile.name}`)
    console.log(`   Created: ${profile.created_at}`)
    
    // Test 3: Verify profile has admin role
    console.log('\n3️⃣ Verifying admin permissions...')
    if (profile.role !== 'admin') {
      console.log(`❌ Guest user has role '${profile.role}' instead of 'admin'`)
      console.log('💡 Update role to admin for full demo access')
      return false
    }
    
    console.log('✅ Guest user has admin role')
    
    // Test 4: Test RLS access with guest user credentials
    console.log('\n4️⃣ Testing RLS access as guest user...')
    
    // Create client with guest user context
    const guestClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
    
    // Sign in as guest user
    const { data: signInData, error: signInError } = await guestClient.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })
    
    if (signInError) {
      console.log('❌ Failed to sign in as guest user:', signInError.message)
      return false
    }
    
    console.log('✅ Guest user can authenticate')
    
    // Test profile access
    const { data: ownProfile, error: ownProfileError } = await guestClient
      .from('profiles')
      .select('*')
      .eq('user_id', guestUser.id)
      .single()
    
    if (ownProfileError) {
      console.log('❌ Guest user cannot access own profile:', ownProfileError.message)
      console.log('💡 Check RLS policies for profiles table')
      return false
    }
    
    console.log('✅ Guest user can access own profile')
    
    // Test orders access
    const { data: orders, error: ordersError } = await guestClient
      .from('orders')
      .select('*')
      .limit(1)
    
    if (ordersError) {
      console.log('❌ Guest user cannot access orders:', ordersError.message)
      console.log('💡 Check RLS policies for orders table')
      return false
    }
    
    console.log('✅ Guest user can access orders')
    
    // Clean up session
    await guestClient.auth.signOut()
    
    return true
    
  } catch (error) {
    console.error('💥 Test error:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 GUEST USER PROFILE TEST\n')
  
  const success = await testGuestUserProfile()
  
  console.log('\n' + '='.repeat(50))
  
  if (success) {
    console.log('🎉 GUEST USER SETUP COMPLETE!')
    console.log('✅ Guest authentication should now work')
    console.log('✅ RLS policies allow proper access')
    console.log('✅ Ready for demo usage')
    console.log('\n📋 TEST LOGIN:')
    console.log('Email: guest@restaurant.plate')
    console.log('Password: guest12345')
  } else {
    console.log('❌ GUEST USER SETUP FAILED!')
    console.log('💡 Follow the instructions above to fix')
    console.log('\n📋 NEXT STEPS:')
    console.log('1. Run fix-guest-user-profile.sql in Supabase SQL Editor')
    console.log('2. Run this test again to verify')
  }
  
  console.log('='.repeat(50))
  
  process.exit(success ? 0 : 1)
}

main().catch(console.error)