#!/usr/bin/env node

/**
 * Quick Test: Verify Guest User Fix
 * Run this after applying fix-guest-user-profile.sql
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const guestEmail = 'guest@restaurant.plate'
const guestPassword = 'guest12345'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

async function testGuestFix() {
  console.log('🧪 Testing Guest User Fix...\n')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Test 1: Authentication
    console.log('1️⃣ Testing authentication...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: guestEmail,
      password: guestPassword
    })

    if (authError) {
      console.log('❌ Authentication failed:', authError.message)
      return
    }
    console.log('✅ Authentication successful')

    // Test 2: Profile access
    console.log('\n2️⃣ Testing profile access...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, name')
      .single()

    if (profileError) {
      console.log('❌ Profile access failed:', profileError.message)
    } else {
      console.log('✅ Profile access successful')
      console.log(`   Role: ${profile.role}`)
      console.log(`   Name: ${profile.name}`)
    }

    // Test 3: Table access
    console.log('\n3️⃣ Testing table access...')
    const startTime = Date.now()
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('id, label, status')
      .limit(5)
    const queryTime = Date.now() - startTime

    if (tableError) {
      console.log('❌ Table access failed:', tableError.message)
    } else {
      console.log('✅ Table access successful')
      console.log(`   Query time: ${queryTime}ms`)
      console.log(`   Tables found: ${tables?.length || 0}`)
    }

    // Test 4: Order access
    console.log('\n4️⃣ Testing order access...')
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, status, type')
      .limit(3)

    if (orderError) {
      console.log('❌ Order access failed:', orderError.message)
    } else {
      console.log('✅ Order access successful')
      console.log(`   Orders found: ${orders?.length || 0}`)
    }

    // Test 5: KDS access (the critical one)
    console.log('\n5️⃣ Testing KDS access...')
    const { data: kdsData, error: kdsError } = await supabase
      .from('kds_order_routing')
      .select(`
        id,
        order:orders!inner (id, items, status),
        station:kds_stations!station_id (name, type)
      `)
      .limit(3)

    if (kdsError) {
      console.log('❌ KDS access failed:', kdsError.message)
    } else {
      console.log('✅ KDS access successful')
      console.log(`   KDS entries found: ${kdsData?.length || 0}`)
    }

    // Sign out
    await supabase.auth.signOut()

    console.log('\n🎉 Guest fix verification complete!')
    console.log('   If all tests passed, the guest user is ready for demos.')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testGuestFix()