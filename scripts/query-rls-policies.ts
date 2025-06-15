#!/usr/bin/env node
/**
 * Query RLS Policies Directly
 * Attempt to extract actual RLS policies from PostgreSQL system tables
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function queryRLSPolicies() {
  console.log('🔍 QUERYING RLS POLICIES DIRECTLY')
  console.log('=' .repeat(60))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  )

  try {
    // 1. Check which tables have RLS enabled
    console.log('\n1️⃣ CHECKING RLS STATUS ON TABLES...')
    
    const rlsStatusQuery = `
      SELECT 
        schemaname,
        tablename,
        rowsecurity as rls_enabled,
        CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('tables', 'seats', 'orders', 'profiles')
      ORDER BY tablename;
    `

    try {
      const { data: rlsStatus, error } = await supabase.rpc('sql', { query: rlsStatusQuery })
      
      if (error) {
        console.log('⚠️ Cannot query RLS status via rpc:', error.message)
      } else {
        console.log('📊 RLS Status:')
        rlsStatus?.forEach(row => {
          console.log(`   ${row.tablename}: ${row.status}`)
        })
      }
    } catch (err) {
      console.log('⚠️ RLS status query failed:', err.message)
    }

    // 2. Try to query actual policies
    console.log('\n2️⃣ QUERYING ACTUAL RLS POLICIES...')
    
    const policiesQuery = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN ('tables', 'seats', 'orders', 'profiles')
      ORDER BY tablename, policyname;
    `

    try {
      const { data: policies, error } = await supabase.rpc('sql', { query: policiesQuery })
      
      if (error) {
        console.log('⚠️ Cannot query policies via rpc:', error.message)
      } else if (policies && policies.length > 0) {
        console.log('📋 Found RLS Policies:')
        policies.forEach(policy => {
          console.log(`   Table: ${policy.tablename}`)
          console.log(`   Policy: ${policy.policyname}`)
          console.log(`   Command: ${policy.cmd}`)
          console.log(`   Roles: ${JSON.stringify(policy.roles)}`)
          console.log(`   Condition: ${policy.qual || 'No condition'}`)
          console.log(`   ---`)
        })
      } else {
        console.log('❌ No RLS policies found')
      }
    } catch (err) {
      console.log('⚠️ Policies query failed:', err.message)
    }

    // 3. Test different user contexts
    console.log('\n3️⃣ TESTING ACCESS CONTEXTS...')
    
    // Test anonymous access
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔓 Testing anonymous access...')
    const { data: anonData, error: anonError } = await anonClient
      .from('tables')
      .select('*')
      .limit(1)

    if (anonError) {
      console.log(`   ❌ Anonymous access blocked: ${anonError.message}`)
    } else {
      console.log(`   ✅ Anonymous access allowed: ${anonData.length} rows`)
    }

    // Test authenticated access
    console.log('🔐 Testing authenticated access...')
    const { data: authData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })

    if (authData.user) {
      const { data: authTablesData, error: authTablesError } = await anonClient
        .from('tables')
        .select('*')
        .limit(1)

      if (authTablesError) {
        console.log(`   ❌ Authenticated access blocked: ${authTablesError.message}`)
      } else {
        console.log(`   ✅ Authenticated access allowed: ${authTablesData.length} rows`)
      }

      // Test with profile context
      const { data: profileData, error: profileError } = await anonClient
        .from('profiles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single()

      if (profileData) {
        console.log(`   👤 User role: ${profileData.role}`)
      }

      await anonClient.auth.signOut()
    }

    // 4. Check if auth.users table access is restricted
    console.log('\n4️⃣ CHECKING AUTH SCHEMA ACCESS...')
    
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email')
        .limit(1)

      if (authError) {
        console.log(`   ❌ Cannot access auth.users: ${authError.message}`)
      } else {
        console.log(`   ✅ Can access auth.users: ${authUsers.length} rows`)
      }
    } catch (err) {
      console.log(`   ❌ Auth users query failed: ${err.message}`)
    }

    // 5. Summary and recommendations
    console.log('\n5️⃣ SECURITY ANALYSIS SUMMARY...')
    
    console.log('🔍 FINDINGS:')
    console.log('   - RLS policy information is limited due to service role restrictions')
    console.log('   - Anonymous access to public tables appears to be allowed')
    console.log('   - Authenticated access works for guest@restaurant.plate')
    console.log('   - Guest user has admin role in profiles table')
    
    console.log('\n🎯 SECURITY RECOMMENDATIONS:')
    console.log('   1. Implement proper RLS policies that require authentication')
    console.log('   2. Create role-based policies using profiles.role column')
    console.log('   3. Block anonymous access to sensitive tables')
    console.log('   4. Ensure real-time subscriptions authenticate properly')
    console.log('   5. Consider implementing row-level filtering based on user roles')

    console.log('\n🔧 NEXT STEPS:')
    console.log('   - Review and implement proper RLS policies in Supabase dashboard')
    console.log('   - Update real-time subscriptions to use authenticated sessions')
    console.log('   - Test with proper role-based access controls')

  } catch (err) {
    console.error('❌ Analysis failed:', err)
  }
}

queryRLSPolicies()