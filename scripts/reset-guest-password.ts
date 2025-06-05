#!/usr/bin/env node
/**
 * Reset Guest User Password
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetGuestPassword() {
  console.log('🔐 Resetting guest user password...')
  
  // Find guest user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()
  
  if (userError) {
    console.error('❌ Error fetching users:', userError)
    return false
  }
  
  const guestUser = users.users.find(u => u.email === 'guest@restaurant.plate')
  
  if (!guestUser) {
    console.error('❌ Guest user not found!')
    return false
  }
  
  console.log('✅ Found guest user:', guestUser.id)
  
  // Update password
  const { data, error } = await supabase.auth.admin.updateUserById(guestUser.id, {
    password: 'guest12345'
  })
  
  if (error) {
    console.error('❌ Error updating password:', error)
    return false
  }
  
  console.log('✅ Guest password updated successfully')
  
  // Test login
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'guest@restaurant.plate',
    password: 'guest12345'
  })
  
  if (loginError) {
    console.error('❌ Login test failed:', loginError.message)
    return false
  }
  
  console.log('✅ Login test successful!')
  return true
}

resetGuestPassword().then(success => {
  process.exit(success ? 0 : 1)
})