#!/usr/bin/env node
/**
 * Apply comprehensive fix for RLS policies and schema issues
 * This script will apply the fix_rls_and_schema.sql file to the database
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function applyComprehensiveFix() {
  console.log('🔧 APPLYING COMPREHENSIVE DATABASE FIX')
  console.log('=' .repeat(50))

  // Use service role for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Read the SQL fix file
    const sqlFile = join(__dirname, '..', 'fix_rls_and_schema.sql')
    const sqlContent = readFileSync(sqlFile, 'utf8')
    
    console.log('📁 SQL fix file loaded successfully')
    console.log(`   File size: ${sqlContent.length} characters`)

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📋 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim() === '') continue

      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`)
      console.log(`   ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`)

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        })

        if (error) {
          console.log(`❌ Error: ${error.message}`)
          errorCount++
        } else {
          console.log('✅ Success')
          successCount++
        }
      } catch (err) {
        console.log(`❌ Exception: ${err.message}`)
        errorCount++
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('\n📊 EXECUTION SUMMARY')
    console.log('=' .repeat(30))
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${errorCount}`)
    console.log(`📋 Total: ${statements.length}`)

    if (errorCount === 0) {
      console.log('\n🎉 ALL FIXES APPLIED SUCCESSFULLY!')
    } else {
      console.log('\n⚠️ Some statements failed. Check errors above.')
    }

    // Test the fix
    console.log('\n🧪 TESTING THE FIX...')
    await testFix(supabase)

  } catch (err) {
    console.error('❌ Failed to apply fix:', err)
  }
}

async function testFix(supabase) {
  try {
    // Test 1: Check if total column exists in orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, total')
      .limit(1)

    if (ordersError) {
      console.log(`❌ Orders total column test failed: ${ordersError.message}`)
    } else {
      console.log('✅ Orders total column exists and accessible')
    }

    // Test 2: Create anonymous client and verify access is blocked
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: anonTablesData, error: anonTablesError } = await anonClient
      .from('tables')
      .select('*')
      .limit(1)

    if (anonTablesError) {
      console.log('✅ Anonymous access properly blocked')
    } else {
      console.log('⚠️ Anonymous access still allowed - RLS policies may need adjustment')
    }

    // Test 3: Test authenticated access
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })

    if (authError) {
      console.log(`❌ Guest authentication failed: ${authError.message}`)
      return
    }

    const { data: authTablesData, error: authTablesError } = await anonClient
      .from('tables')
      .select('*')
      .limit(1)

    if (authTablesError) {
      console.log(`❌ Authenticated access failed: ${authTablesError.message}`)
    } else {
      console.log('✅ Authenticated access works correctly')
    }

    await anonClient.auth.signOut()

  } catch (err) {
    console.log(`❌ Test failed: ${err.message}`)
  }
}

applyComprehensiveFix()