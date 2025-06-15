#!/usr/bin/env node
/**
 * Comprehensive Security Analysis - RLS & Database Permissions
 * Deep dive into actual PostgreSQL policies and security setup
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function comprehensiveSecurityAnalysis() {
  console.log('🔍 COMPREHENSIVE SECURITY ANALYSIS')
  console.log('=' .repeat(60))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  )

  try {
    // 1. Check current database structure
    console.log('\n1️⃣ DATABASE STRUCTURE ANALYSIS...')
    
    const tableNames = ['tables', 'seats', 'orders', 'profiles', 'user_roles']
    const tableStatus = {}
    
    for (const tableName of tableNames) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1)
        
        if (error) {
          tableStatus[tableName] = { exists: false, error: error.message }
        } else {
          tableStatus[tableName] = { exists: true, count, sampleData: data?.[0] }
        }
      } catch (err) {
        tableStatus[tableName] = { exists: false, error: err.message }
      }
    }

    console.log('📊 Table Status:')
    Object.entries(tableStatus).forEach(([table, status]) => {
      if (status.exists) {
        console.log(`   ✅ ${table}: ${status.count} rows`)
      } else {
        console.log(`   ❌ ${table}: ${status.error}`)
      }
    })

    // 2. Test different access patterns
    console.log('\n2️⃣ ACCESS PATTERN TESTING...')
    
    // Test anonymous access
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { count: anonTablesCount, error: anonError } = await anonClient
      .from('tables')
      .select('*', { count: 'exact' })
      .limit(1)

    console.log(`🔓 Anonymous access to tables: ${anonTablesCount || 0} rows`)
    if (anonError) {
      console.log(`   Error: ${anonError.message}`)
    }

    // Test authenticated guest access
    const { data: authData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })

    if (authData.user) {
      console.log(`✅ Guest authentication successful: ${authData.user.id}`)
      
      const { count: authTablesCount } = await anonClient
        .from('tables')
        .select('*', { count: 'exact' })
        .limit(1)

      console.log(`🔐 Authenticated guest access to tables: ${authTablesCount || 0} rows`)

      // Test profile access
      const { data: profileData, error: profileError } = await anonClient
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      if (profileError) {
        console.log(`❌ Profile access failed: ${profileError.message}`)
      } else {
        console.log(`✅ Guest profile found: ${profileData.name} (${profileData.role})`)
      }

      await anonClient.auth.signOut()
    } else {
      console.log(`❌ Guest authentication failed: ${loginError?.message}`)
    }

    // 3. Analyze RLS configuration (via service role)
    console.log('\n3️⃣ RLS POLICY ANALYSIS...')
    
    // Check if RLS is enabled on tables
    try {
      const rlsQuery = `
        SELECT 
          schemaname,
          tablename,
          rowsecurity as rls_enabled,
          CASE 
            WHEN rowsecurity THEN 'RLS ON'
            ELSE 'RLS OFF'
          END as status
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('tables', 'seats', 'orders', 'profiles')
        ORDER BY tablename;
      `

      // Try to execute raw SQL via service role
      const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
        query: rlsQuery
      })

      if (rlsError) {
        console.log('⚠️ Cannot query RLS status directly (expected)')
        console.log('🔍 Using indirect analysis...')
        
        // Indirect analysis: check access patterns
        console.log('\n🧪 INDIRECT RLS ANALYSIS:')
        console.log(`   Service role access: ${tableStatus.tables?.count || 0} tables`)
        console.log(`   Anonymous access: ${anonTablesCount || 0} tables`)
        
        if (tableStatus.tables?.count > 0 && (anonTablesCount || 0) === 0) {
          console.log('   🔐 RLS is BLOCKING anonymous access')
        } else if (tableStatus.tables?.count === (anonTablesCount || 0)) {
          console.log('   🔓 RLS ALLOWS anonymous access OR is DISABLED')
        }
        
      } else {
        console.log('📋 RLS Status:', rlsData)
      }
    } catch (err) {
      console.log('⚠️ RLS analysis failed:', err.message)
    }

    // 4. Security recommendations
    console.log('\n4️⃣ SECURITY ANALYSIS SUMMARY...')
    
    const securityIssues = []
    const securityGood = []

    // Check if user_roles table exists (Luis's RBAC system)
    if (!tableStatus.user_roles?.exists) {
      securityIssues.push('user_roles table missing - RBAC system incomplete')
    } else {
      securityGood.push('user_roles table exists - RBAC system in place')
    }

    // Check if profiles table exists
    if (tableStatus.profiles?.exists) {
      securityGood.push('profiles table exists for user data')
    } else {
      securityIssues.push('profiles table missing - user management incomplete')
    }

    // Check guest user access
    if (authData.user) {
      securityGood.push('guest@restaurant.plate user exists and authenticates')
    } else {
      securityIssues.push('guest@restaurant.plate user missing or broken')
    }

    // Check RLS effectiveness
    if (tableStatus.tables?.count > 0 && anonTablesCount === 0) {
      securityGood.push('RLS effectively blocks anonymous access')
    } else if (anonTablesCount > 0) {
      securityIssues.push('Anonymous users can access table data')
    }

    console.log('\n✅ SECURITY STRENGTHS:')
    securityGood.forEach(item => console.log(`   + ${item}`))

    console.log('\n⚠️ SECURITY CONCERNS:')
    securityIssues.forEach(item => console.log(`   - ${item}`))

    // 5. Recommendations
    console.log('\n5️⃣ RECOMMENDATIONS...')
    console.log('🎯 FOR CURRENT STATE:')
    if (!tableStatus.user_roles?.exists) {
      console.log('   1. Create user_roles table for proper RBAC')
      console.log('   2. Assign guest@restaurant.plate appropriate role')
    }
    console.log('   3. Ensure real-time subscriptions use authenticated sessions')
    console.log('   4. Consider implementing row-level policies based on profiles.role')
    
    console.log('\n🎯 FOR INVESTOR DEMO:')
    console.log('   1. Current setup allows authenticated guest access ✅')
    console.log('   2. Focus on fixing real-time connection with auth')
    console.log('   3. Consider creating demo-specific role with limited permissions')

  } catch (err) {
    console.error('❌ Analysis failed:', err)
  }
}

comprehensiveSecurityAnalysis()