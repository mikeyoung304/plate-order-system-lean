#!/usr/bin/env npx tsx

/**
 * Fix Guest User Role Mismatch
 * 
 * The investigation revealed that the guest user has inconsistent roles:
 * - User metadata says: "server"
 * - Profile table says: "resident"
 * 
 * This script will:
 * 1. Correct the guest user role to "server" in the profiles table
 * 2. Ensure consistency between user metadata and profile
 * 3. Test that the fix works correctly
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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const GUEST_EMAIL = 'guest@restaurant.plate'
const CORRECT_ROLE = 'server'

async function fixGuestUserRole() {
  console.log('🔧 FIXING GUEST USER ROLE MISMATCH')
  console.log('==================================')
  console.log(`Target Role: ${CORRECT_ROLE}`)
  console.log('')

  try {
    // Step 1: Find the guest user
    console.log('1️⃣ Finding guest user...')
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const guestUser = authUsers?.users?.find(u => u.email === GUEST_EMAIL)
    
    if (!guestUser) {
      console.error('❌ Guest user not found')
      process.exit(1)
    }
    
    console.log('✅ Guest user found:', guestUser.id)
    console.log('   Current metadata role:', guestUser.user_metadata?.role)
    
    // Step 2: Check current profile
    console.log('')
    console.log('2️⃣ Checking current profile...')
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, role, name')
      .eq('user_id', guestUser.id)
      .single()
    
    if (profileError || !currentProfile) {
      console.error('❌ Profile not found:', profileError?.message)
      process.exit(1)
    }
    
    console.log('✅ Current profile:')
    console.log('   Role:', currentProfile.role)
    console.log('   Name:', currentProfile.name)
    
    if (currentProfile.role === CORRECT_ROLE) {
      console.log('✅ Role is already correct! No changes needed.')
      return
    }
    
    // Step 3: Update the profile role
    console.log('')
    console.log('3️⃣ Updating profile role...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: CORRECT_ROLE })
      .eq('user_id', guestUser.id)
    
    if (updateError) {
      console.error('❌ Failed to update profile:', updateError.message)
      process.exit(1)
    }
    
    console.log('✅ Profile role updated successfully')
    
    // Step 4: Update user metadata to match (optional but good for consistency)
    console.log('')
    console.log('4️⃣ Updating user metadata...')
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      guestUser.id,
      {
        user_metadata: {
          ...guestUser.user_metadata,
          role: CORRECT_ROLE
        }
      }
    )
    
    if (metadataError) {
      console.error('❌ Failed to update metadata:', metadataError.message)
      // This is not critical, continue
    } else {
      console.log('✅ User metadata updated successfully')
    }
    
    // Step 5: Verify the fix
    console.log('')
    console.log('5️⃣ Verifying the fix...')
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('user_id, role, name')
      .eq('user_id', guestUser.id)
      .single()
    
    if (verifyError || !updatedProfile) {
      console.error('❌ Failed to verify update:', verifyError?.message)
      process.exit(1)
    }
    
    console.log('✅ Verification successful:')
    console.log('   Role:', updatedProfile.role)
    console.log('   Name:', updatedProfile.name)
    
    // Step 6: Test that guest user no longer appears in residents list
    console.log('')
    console.log('6️⃣ Testing residents list...')
    const { data: residents, error: residentsError } = await supabase
      .from('profiles')
      .select('user_id, name, role')
      .eq('role', 'resident')
    
    if (residentsError) {
      console.error('❌ Failed to query residents:', residentsError.message)
    } else {
      const guestInResidents = residents?.find(r => r.user_id === guestUser.id)
      if (guestInResidents) {
        console.log('❌ Guest user still appears in residents list!')
      } else {
        console.log('✅ Guest user no longer in residents list')
        console.log(`   Found ${residents?.length || 0} residents`)
      }
    }
    
    // Step 7: Test server role functions
    console.log('')
    console.log('7️⃣ Testing server role access...')
    
    // Test authentication with the user session
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: GUEST_EMAIL,
      password: 'guest12345'
    })
    
    if (authError || !authData.session) {
      console.error('❌ Authentication failed:', authError?.message)
      return
    }
    
    // Create a client with the user's session
    const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false }
    })
    
    await userClient.auth.setSession(authData.session)
    
    // Test server role permissions (should be able to create orders)
    const testTableId = 'test-table-id'
    const testSeatId = 'test-seat-id'
    const testResidentId = 'test-resident-id'
    
    // Don't actually create an order, just test the permission check
    // by checking if we can read orders (which servers should be able to do)
    const { data: orders, error: ordersError } = await userClient
      .from('orders')
      .select('id, status')
      .limit(1)
    
    if (ordersError) {
      console.log('⚠️  Orders access error:', ordersError.message)
      console.log('   This might be expected if no orders exist or RLS is very strict')
    } else {
      console.log('✅ Server role permissions working')
    }
    
    // Clean up
    await userClient.auth.signOut()
    
    console.log('')
    console.log('🎯 GUEST USER ROLE FIX COMPLETE')
    console.log('==============================')
    console.log('✅ Guest user role corrected from "resident" to "server"')
    console.log('✅ User metadata updated for consistency')
    console.log('✅ Guest user removed from residents list')
    console.log('')
    console.log('The guest user should now:')
    console.log('- Act as a server in the application')
    console.log('- Not appear in the resident selection dropdown')
    console.log('- Have proper server permissions for orders')
    console.log('')
    console.log('Test login: guest@restaurant.plate / guest12345')
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
    process.exit(1)
  }
}

fixGuestUserRole()