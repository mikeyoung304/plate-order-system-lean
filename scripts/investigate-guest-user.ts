#!/usr/bin/env node
/**
 * Deep Investigation: Guest User Authentication & Roles
 * Understanding Luis's RBAC system for investor demo access
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function investigateGuestUser() {
  console.log('🔍 DEEP INVESTIGATION: Guest User & RBAC System')
  console.log('=' .repeat(60))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  )

  try {
    // 1. Check if guest user exists in auth.users
    console.log('\n1️⃣ CHECKING AUTH.USERS TABLE...')
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_auth_users', {}) // This might not exist, let's try another way

    if (authError) {
      console.log('⚠️ Cannot directly query auth.users (expected), checking user_roles instead...')
      
      // Check user_roles table for guest user
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
      
      if (roleError) {
        console.error('❌ Error querying user_roles:', roleError)
      } else {
        console.log(`📊 Found ${userRoles.length} users with roles:`)
        userRoles.forEach(role => {
          console.log(`   - User: ${role.user_id} | Role: ${role.role}`)
        })
      }
    }

    // 2. Test guest authentication
    console.log('\n2️⃣ TESTING GUEST AUTHENTICATION...')
    
    // Create a client to test guest login
    const testClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: authData, error: loginError } = await testClient.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })

    if (loginError) {
      console.error('❌ Guest login failed:', loginError.message)
      console.log('🔧 Guest user may not exist or password is wrong')
    } else {
      console.log('✅ Guest login successful!')
      console.log(`   User ID: ${authData.user?.id}`)
      console.log(`   Email: ${authData.user?.email}`)
      
      // Check if this user has a role
      const { data: guestRole, error: guestRoleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', authData.user?.id)
        .single()
      
      if (guestRoleError) {
        console.log('⚠️ Guest user has no role assigned:', guestRoleError.message)
        console.log('🔧 This explains why they cannot access tables!')
      } else {
        console.log(`✅ Guest user role: ${guestRole.role}`)
      }

      // Test data access with authenticated guest
      console.log('\n3️⃣ TESTING DATA ACCESS WITH AUTHENTICATED GUEST...')
      const { data: tables, error: tableError, count } = await testClient
        .from('tables')
        .select('*', { count: 'exact' })
        .limit(1)
      
      if (tableError) {
        console.error('❌ Authenticated guest cannot access tables:', tableError.message)
        console.log('🔧 Need to assign proper role to guest user')
      } else {
        console.log(`✅ Authenticated guest can see ${count} tables`)
      }

      // Sign out
      await testClient.auth.signOut()
    }

    // 3. Analyze RLS Policies
    console.log('\n4️⃣ ANALYZING BEST PRACTICE APPROACH...')
    console.log('🎯 LUIS\'S RBAC DESIGN:')
    console.log('   - All tables require authentication + specific roles')
    console.log('   - Roles: admin, server, cook, resident')
    console.log('   - Zero anonymous access (professional security)')
    
    console.log('\n🎯 INVESTOR DEMO NEEDS:')
    console.log('   - Guest user should be authenticated (not anonymous)')
    console.log('   - Guest needs appropriate role for full access')
    console.log('   - Real-time should use authenticated session')
    
    console.log('\n🎯 BEST PRACTICE SOLUTION:')
    console.log('   1. Ensure guest user exists with proper role')
    console.log('   2. Update real-time to use authenticated sessions')
    console.log('   3. Keep Luis\'s security model intact')
    console.log('   4. Consider adding "demo" role for controlled investor access')

  } catch (err) {
    console.error('❌ Investigation failed:', err)
  }
}

investigateGuestUser()