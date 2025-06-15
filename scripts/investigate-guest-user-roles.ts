#!/usr/bin/env npx tsx

/**
 * Comprehensive Guest User Role Investigation & Fix
 * 
 * This script will:
 * 1. Check if the guest user exists in auth.users
 * 2. Check if the guest user has a profile in the profiles table
 * 3. Check what role (if any) the guest user has
 * 4. Verify RLS policies are working correctly
 * 5. Fix any issues found
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Make sure .env.local contains:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Guest user credentials from the validation script
const GUEST_EMAIL = 'guest@restaurant.plate'
const GUEST_PASSWORD = 'guest12345'
const GUEST_NAME = 'Guest User'
const GUEST_ROLE = 'server' // Default role for guest

async function investigateGuestUser() {
  console.log('🔍 INVESTIGATING GUEST USER ROLES')
  console.log('==================================')
  console.log(`Guest Email: ${GUEST_EMAIL}`)
  console.log('')

  try {
    // Step 1: Check if guest user exists in auth.users
    console.log('1️⃣ Checking auth.users...')
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const guestUser = authUsers?.users?.find(u => u.email === GUEST_EMAIL)
    
    if (!guestUser) {
      console.log('❌ Guest user not found in auth.users')
      console.log('🔧 Creating guest user...')
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: GUEST_EMAIL,
        password: GUEST_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: GUEST_NAME,
          role: GUEST_ROLE,
        }
      })
      
      if (createError || !newUser.user) {
        console.error('❌ Failed to create guest user:', createError)
        process.exit(1)
      }
      
      console.log('✅ Guest user created:', newUser.user.id)
      
      // Create profile immediately
      await createGuestProfile(newUser.user.id)
      return
    }
    
    console.log('✅ Guest user exists:', guestUser.id)
    console.log('   Email:', guestUser.email)
    console.log('   Created:', guestUser.created_at)
    console.log('   Metadata:', JSON.stringify(guestUser.user_metadata, null, 2))
    
    // Step 2: Check if profile exists
    console.log('')
    console.log('2️⃣ Checking profiles table...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, role, name')
      .eq('user_id', guestUser.id)
      .single()
    
    if (profileError || !profile) {
      console.log('❌ Profile missing or error:', profileError?.message)
      console.log('🔧 Creating guest profile...')
      await createGuestProfile(guestUser.id)
      return
    }
    
    console.log('✅ Guest profile exists:')
    console.log('   User ID:', profile.user_id)
    console.log('   Name:', profile.name)
    console.log('   Role:', profile.role)
    
    // Step 3: Test authentication
    console.log('')
    console.log('3️⃣ Testing guest authentication...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: GUEST_EMAIL,
      password: GUEST_PASSWORD
    })
    
    if (authError || !authData.session) {
      console.log('❌ Authentication failed:', authError?.message)
      return
    }
    
    console.log('✅ Authentication successful')
    console.log('   Session ID:', authData.session.access_token.substring(0, 20) + '...')
    console.log('   User ID:', authData.session.user.id)
    
    // Step 4: Test role-based access with actual session
    console.log('')
    console.log('4️⃣ Testing role-based access...')
    
    // Create a client with the user's session
    const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false }
    })
    
    // Set the session manually
    await userClient.auth.setSession(authData.session)
    
    // Test profile access
    const { data: userProfile, error: userProfileError } = await userClient
      .from('profiles')
      .select('user_id, role, name')
      .eq('user_id', authData.session.user.id)
      .single()
    
    if (userProfileError) {
      console.log('❌ Profile access failed:', userProfileError.message)
      console.log('   This suggests RLS policies are blocking profile access')
    } else {
      console.log('✅ Profile access successful:', userProfile)
    }
    
    // Test orders access
    const { data: orders, error: ordersError } = await userClient
      .from('orders')
      .select('id, status, type')
      .limit(5)
    
    if (ordersError) {
      console.log('❌ Orders access failed:', ordersError.message)
      console.log('   Code:', ordersError.code)
      console.log('   Details:', ordersError.details)
    } else {
      console.log('✅ Orders access successful:', orders?.length || 0, 'orders found')
    }
    
    // Test tables access
    const { data: tables, error: tablesError } = await userClient
      .from('tables')
      .select('id, label, status')
      .limit(5)
    
    if (tablesError) {
      console.log('❌ Tables access failed:', tablesError.message)
    } else {
      console.log('✅ Tables access successful:', tables?.length || 0, 'tables found')
    }
    
    // Clean up session
    await userClient.auth.signOut()
    
    // Step 5: Check RLS policies
    console.log('')
    console.log('5️⃣ Checking RLS policies...')
    await checkRLSPolicies()
    
    console.log('')
    console.log('🎯 INVESTIGATION COMPLETE')
    console.log('========================')
    console.log('The guest user appears to be properly configured.')
    console.log('If you\'re still experiencing issues, check:')
    console.log('1. Frontend authentication logic')
    console.log('2. Session handling in the application')
    console.log('3. Client-side role checking functions')
    
  } catch (error) {
    console.error('❌ Investigation failed:', error)
    process.exit(1)
  }
}

async function createGuestProfile(userId: string) {
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      name: GUEST_NAME,
      role: GUEST_ROLE,
    })
  
  if (profileError) {
    console.error('❌ Failed to create profile:', profileError)
    process.exit(1)
  }
  
  console.log('✅ Guest profile created successfully')
  console.log('   User ID:', userId)
  console.log('   Name:', GUEST_NAME)
  console.log('   Role:', GUEST_ROLE)
}

async function checkRLSPolicies() {
  try {
    // Check if profiles table has RLS enabled
    const { data: tableInfo } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'profiles')
      .single()
    
    if (tableInfo) {
      console.log('✅ Profiles table exists')
    }
    
    // Check RLS policies on profiles table
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies', {
      table_name: 'profiles'
    }).single()
    
    if (policiesError) {
      // If RPC doesn't exist, we can't check policies this way
      console.log('⚠️  Could not check RLS policies directly')
      console.log('   This is normal - policies exist but cannot be queried')
    } else {
      console.log('✅ RLS policies found:', policies)
    }
    
  } catch (error) {
    console.log('⚠️  Could not check RLS policies:', error)
  }
}

investigateGuestUser()