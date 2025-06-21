#!/usr/bin/env node
/**
 * Comprehensive Database Diagnosis
 * Investigates the exact state of the database to understand why authenticated queries fail
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function comprehensiveDiagnosis() {
  console.log('🔍 COMPREHENSIVE DATABASE DIAGNOSIS')
  console.log('=' .repeat(60))

  // Service role client for admin queries
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Anonymous client for testing
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    console.log('\n1️⃣ CHECKING PROFILES TABLE STRUCTURE...')
    const { data: profilesData, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')
      .limit(3)

    if (profilesError) {
      console.log(`❌ Profiles error: ${profilesError.message}`)
    } else {
      console.log(`✅ Profiles found: ${profilesData.length} rows`)
      if (profilesData.length > 0) {
        console.log('   Structure:', Object.keys(profilesData[0]))
        console.log('   Sample:', profilesData[0])
      }
    }

    console.log('\n2️⃣ CHECKING GUEST USER AUTHENTICATION...')
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })

    if (authError) {
      console.log(`❌ Auth error: ${authError.message}`)
      return
    }

    const user = authData.user
    console.log(`✅ Guest authenticated: ${user.id}`)
    console.log(`   Email: ${user.email}`)

    console.log('\n3️⃣ CHECKING GUEST USER PROFILE...')
    const { data: guestProfile, error: guestProfileError } = await anonClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (guestProfileError) {
      console.log(`❌ Guest profile error: ${guestProfileError.message}`)
    } else {
      console.log('✅ Guest profile found:')
      console.log('   ', guestProfile)
    }

    console.log('\n4️⃣ TESTING TABLE ACCESS WITH AUTHENTICATED SESSION...')
    const { data: tablesData, error: tablesError, count } = await anonClient
      .from('tables')
      .select('*', { count: 'exact' })
      .limit(3)

    if (tablesError) {
      console.log(`❌ Tables access error: ${tablesError.message}`)
      console.log('   Code:', tablesError.code)
      console.log('   Details:', tablesError.details)
    } else {
      console.log(`✅ Tables accessible: ${count} total rows`)
      if (tablesData.length > 0) {
        console.log('   Sample:', tablesData[0])
      }
    }

    console.log('\n5️⃣ TESTING SEATS ACCESS WITH AUTHENTICATED SESSION...')
    const { data: seatsData, error: seatsError, count: seatsCount } = await anonClient
      .from('seats')
      .select('*', { count: 'exact' })
      .limit(3)

    if (seatsError) {
      console.log(`❌ Seats access error: ${seatsError.message}`)
    } else {
      console.log(`✅ Seats accessible: ${seatsCount} total rows`)
    }

    console.log('\n6️⃣ TESTING ORDERS ACCESS WITH AUTHENTICATED SESSION...')
    const { data: ordersData, error: ordersError, count: ordersCount } = await anonClient
      .from('orders')
      .select('*', { count: 'exact' })
      .limit(3)

    if (ordersError) {
      console.log(`❌ Orders access error: ${ordersError.message}`)
      console.log('   Code:', ordersError.code)
    } else {
      console.log(`✅ Orders accessible: ${ordersCount} total rows`)
    }

    console.log('\n7️⃣ TESTING ORDER CREATION...')
    const testOrder = {
      resident_id: guestProfile?.user_id || user.id,
      status: 'pending',
      items: [{ name: 'Test Item', quantity: 1 }],
      total: 10.00
    }

    const { data: newOrder, error: createOrderError } = await anonClient
      .from('orders')
      .insert([testOrder])
      .select()
      .single()

    if (createOrderError) {
      console.log(`❌ Order creation error: ${createOrderError.message}`)
      console.log('   Code:', createOrderError.code)
      console.log('   Details:', createOrderError.details)
    } else {
      console.log('✅ Order created successfully:', newOrder.id)
      
      // Clean up test order
      await anonClient.from('orders').delete().eq('id', newOrder.id)
      console.log('   Test order cleaned up')
    }

    console.log('\n8️⃣ CHECKING ANONYMOUS ACCESS (Should Fail)...')
    await anonClient.auth.signOut()
    
    const { data: anonTablesData, error: anonTablesError } = await anonClient
      .from('tables')
      .select('*')
      .limit(1)

    if (anonTablesError) {
      console.log(`✅ Anonymous access properly blocked: ${anonTablesError.message}`)
    } else {
      console.log(`⚠️ Anonymous access allowed: ${anonTablesData.length} rows visible`)
    }

    console.log('\n9️⃣ DIAGNOSIS SUMMARY...')
    console.log('🔍 KEY FINDINGS:')
    
    if (!profilesError && profilesData.length > 0) {
      console.log('   ✅ Profiles table exists and has data')
    }
    
    if (!guestProfileError && guestProfile) {
      console.log(`   ✅ Guest user has profile with role: ${guestProfile.role}`)
    }
    
    if (!tablesError) {
      console.log('   ✅ Authenticated users can access tables')
    }
    
    if (!ordersError) {
      console.log('   ✅ Authenticated users can access orders')
    }
    
    if (!createOrderError) {
      console.log('   ✅ Authenticated users can create orders')
    } else {
      console.log('   ❌ Order creation fails - this is the main issue!')
    }

    console.log('\n🎯 CONCLUSION:')
    if (tablesError || ordersError || createOrderError) {
      console.log('   Database access is failing despite authentication')
      console.log('   Issue is likely in RLS policies or table structure')
    } else {
      console.log('   Database access is working correctly')
      console.log('   Issue might be in the frontend authentication state')
    }

  } catch (err) {
    console.error('❌ Diagnosis failed:', err)
  }
}

comprehensiveDiagnosis()