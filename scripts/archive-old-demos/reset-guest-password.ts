#!/usr/bin/env node
/**
 * Reset Guest User Password
 */

import dotenv from 'dotenv'
import { resolve } from 'path'
import { createDemoUserManager } from '../lib/demo'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const demoManager = createDemoUserManager(supabaseUrl, supabaseServiceKey)

async function resetGuestPassword() {
  console.log('🔐 Resetting guest user password...')
  
  // Reset password
  const resetResult = await demoManager.resetDemoPassword()
  
  if (!resetResult.success) {
    console.error('❌ Error updating password:', resetResult.error)
    return false
  }
  
  console.log('✅ Guest password updated successfully')
  
  // Test login
  const loginResult = await demoManager.validateDemoLogin()
  
  if (!loginResult.success) {
    console.error('❌ Login test failed:', loginResult.error)
    return false
  }
  
  console.log('✅ Login test successful!')
  return true
}

resetGuestPassword().then(success => {
  process.exit(success ? 0 : 1)
})