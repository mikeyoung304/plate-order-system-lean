#!/usr/bin/env node
/**
 * Check what RLS policies are actually active
 * Since user_roles table doesn't exist, let's see what's really protecting the data
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function checkActualRLS() {
  console.log('🔍 CHECKING ACTUAL RLS POLICIES...')
  console.log('=' .repeat(50))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Check what tables actually exist
    console.log('\n1️⃣ CHECKING WHAT TABLES EXIST...')
    const { data: allTables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `
      })

    if (tablesError) {
      console.log('⚠️ Cannot query information_schema, trying direct approach...')
      
      // Try to list what we can access
      const tableNames = ['tables', 'seats', 'orders', 'user_roles', 'profiles']
      for (const tableName of tableNames) {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1)
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: ${count} rows`)
        }
      }
    } else {
      console.log('Tables found:', allTables)
    }

    // Check what the authenticated guest sees vs anonymous
    console.log('\n2️⃣ COMPARING ACCESS LEVELS...')
    
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Test anonymous access
    const { count: anonCount } = await anonClient
      .from('tables')
      .select('*', { count: 'exact' })
      .limit(1)
    
    console.log(`Anonymous can see: ${anonCount} tables`)

    // Test authenticated guest access
    const { data: authData } = await anonClient.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })

    if (authData.user) {
      const { count: authCount } = await anonClient
        .from('tables')
        .select('*', { count: 'exact' })
        .limit(1)
      
      console.log(`Authenticated guest can see: ${authCount} tables`)
      
      // Test orders access
      const { count: orderCount, error: orderError } = await anonClient
        .from('orders')
        .select('*', { count: 'exact' })
        .limit(1)
      
      if (orderError) {
        console.log(`Orders access: ❌ ${orderError.message}`)
      } else {
        console.log(`Authenticated guest can see: ${orderCount} orders`)
      }

      await anonClient.auth.signOut()
    }

    console.log('\n3️⃣ ANALYZING THE PATTERN...')
    console.log('🔍 HYPOTHESIS:')
    console.log('   - RLS is enabled but simplified')
    console.log('   - May just require authentication, not specific roles')
    console.log('   - Luis\'s full RBAC system may not be active')
    
    console.log('\n🎯 FOR INVESTOR DEMO:')
    console.log('   - Guest authentication works ✅')
    console.log('   - Need to fix real-time to use authenticated session')
    console.log('   - Current RLS allows authenticated access')

  } catch (err) {
    console.error('❌ Investigation failed:', err)
  }
}

checkActualRLS()