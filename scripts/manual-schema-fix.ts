#!/usr/bin/env node
/**
 * Manual Schema Fix - Apply fixes one by one using Supabase client
 * This works around the lack of exec_sql function by using direct DDL operations
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function manualSchemaFix() {
  console.log('🔧 MANUAL SCHEMA FIX - STEP BY STEP')
  console.log('=' .repeat(50))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Step 1: Add missing columns to orders table
    console.log('\n1️⃣ ADDING MISSING COLUMNS TO ORDERS TABLE...')
    
    // Check if total column exists first
    const { data: checkData, error: checkError } = await supabase
      .from('orders')
      .select('total')
      .limit(1)

    if (checkError && checkError.message.includes('does not exist')) {
      console.log('   ⚠️ Total column missing - need to add it via dashboard')
      console.log('   🎯 ACTION REQUIRED: Add total column manually in Supabase dashboard')
      console.log('   📋 Column: total, Type: decimal(10,2), Default: 0.00')
    } else {
      console.log('   ✅ Total column already exists')
    }

    // Step 2: Test current RLS state
    console.log('\n2️⃣ TESTING CURRENT RLS STATE...')
    
    // Test anonymous access
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: anonData, error: anonError } = await anonClient
      .from('tables')
      .select('*')
      .limit(1)

    if (anonError) {
      console.log('   ✅ Anonymous access is blocked')
    } else {
      console.log('   ⚠️ Anonymous access is allowed - RLS policies need fixing')
    }

    // Test authenticated access
    const { data: authData } = await anonClient.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })

    if (authData.user) {
      const { data: userTablesData, error: userTablesError, count } = await anonClient
        .from('tables')
        .select('*', { count: 'exact' })
        .limit(1)

      if (userTablesError) {
        console.log(`   ❌ Authenticated access failed: ${userTablesError.message}`)
      } else {
        console.log(`   ✅ Authenticated access works: ${count} tables visible`)
      }

      await anonClient.auth.signOut()
    }

    // Step 3: Check if profiles table is being used correctly
    console.log('\n3️⃣ CHECKING PROFILES TABLE ACCESS...')
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, role')
      .eq('user_id', 'b0055f8c-d2c3-425f-add2-e4ee6572829e')
      .single()

    if (profilesError) {
      console.log(`   ❌ Guest profile not found: ${profilesError.message}`)
    } else {
      console.log(`   ✅ Guest profile found: ${profilesData.role}`)
    }

    // Step 4: Test order creation with proper fields
    console.log('\n4️⃣ TESTING ORDER CREATION WITH CURRENT SCHEMA...')
    
    const { data: authResult } = await anonClient.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })

    if (authResult.user) {
      // Get a table and seat for the order
      const { data: tablesData } = await anonClient
        .from('tables')
        .select('id')
        .limit(1)
        .single()

      const { data: seatsData } = await anonClient
        .from('seats')
        .select('id')
        .limit(1)
        .single()

      if (tablesData && seatsData) {
        const testOrder = {
          table_id: tablesData.id,
          seat_id: seatsData.id,
          resident_id: authResult.user.id,
          server_id: authResult.user.id,
          items: JSON.stringify([{ name: 'Test Item', quantity: 1 }]),
          status: 'pending',
          type: 'dine-in'
        }

        const { data: newOrder, error: createError } = await anonClient
          .from('orders')
          .insert([testOrder])
          .select()
          .single()

        if (createError) {
          console.log(`   ❌ Order creation failed: ${createError.message}`)
          console.log(`   Code: ${createError.code}`)
        } else {
          console.log(`   ✅ Order created successfully: ${newOrder.id}`)
          
          // Clean up
          await anonClient.from('orders').delete().eq('id', newOrder.id)
          console.log('   🧹 Test order cleaned up')
        }
      } else {
        console.log('   ⚠️ Cannot find table/seat for test order')
      }

      await anonClient.auth.signOut()
    }

    // Step 5: Generate fix summary
    console.log('\n5️⃣ DIAGNOSIS SUMMARY...')
    console.log('🔍 FINDINGS:')
    
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('   ❌ Orders table missing total column')
      console.log('   🎯 SOLUTION: Add via Supabase dashboard or SQL migration')
    }
    
    if (anonData && !anonError) {
      console.log('   ❌ Anonymous access allowed (should be blocked)')
      console.log('   🎯 SOLUTION: Update RLS policies to require authentication')
    }

    console.log('\n6️⃣ RECOMMENDED ACTIONS...')
    console.log('🎯 IMMEDIATE FIXES NEEDED:')
    console.log('   1. Add total column to orders table via Supabase dashboard')
    console.log('   2. Update RLS policies to reference profiles instead of user_roles')
    console.log('   3. Block anonymous access to all tables')
    console.log('   4. Test order creation after fixes')

    console.log('\n📋 SQL COMMANDS FOR MANUAL EXECUTION:')
    console.log('   ALTER TABLE public.orders ADD COLUMN total DECIMAL(10,2) DEFAULT 0.00;')
    console.log('   -- Then update RLS policies via dashboard or direct SQL')

  } catch (err) {
    console.error('❌ Manual fix failed:', err)
  }
}

manualSchemaFix()