#!/usr/bin/env npx tsx

/**
 * SURGICAL FIX: Ensure guest user has profile
 * Quick script to fix the "user: loading" issue
 */

import { createClient } from '@supabase/supabase-js'
import { DEMO_UTILS } from '../lib/demo/config'

// Load environment variables
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Make sure .env.local contains:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function fixGuestProfile() {
  console.log('🔍 SURGICAL FIX: Checking guest user profile...')
  
  try {
    const credentials = DEMO_UTILS.getCredentials()
    console.log(`👤 Guest email: ${credentials.email}`)
    
    // Find the guest user in auth
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const guestUser = authUsers?.users?.find(u => u.email === credentials.email)
    
    if (!guestUser) {
      console.log('❌ Guest user not found in auth. Creating...')
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: credentials.email,
        password: credentials.password,
        email_confirm: true,
        user_metadata: {
          name: credentials.profile.name,
          role: credentials.profile.role,
        }
      })
      
      if (createError || !newUser.user) {
        console.error('❌ Failed to create guest user:', createError)
        process.exit(1)
      }
      
      console.log('✅ Guest user created:', newUser.user.id)
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: newUser.user.id,
          name: credentials.profile.name,
          role: credentials.profile.role,
        })
      
      if (profileError) {
        console.error('❌ Failed to create profile:', profileError)
        process.exit(1)
      }
      
      console.log('✅ Guest profile created')
      return
    }
    
    console.log(`✅ Guest user found: ${guestUser.id}`)
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, role, name')
      .eq('user_id', guestUser.id)
      .single()
    
    if (profileError || !profile) {
      console.log('❌ Profile missing. Creating...')
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: guestUser.id,
          name: credentials.profile.name,
          role: credentials.profile.role,
        })
      
      if (insertError) {
        console.error('❌ Failed to create profile:', insertError)
        process.exit(1)
      }
      
      console.log('✅ Guest profile created')
    } else {
      console.log('✅ Guest profile exists:', profile)
      
      // Update profile to ensure correct data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: credentials.profile.name,
          role: credentials.profile.role,
        })
        .eq('user_id', guestUser.id)
      
      if (updateError) {
        console.error('❌ Failed to update profile:', updateError)
      } else {
        console.log('✅ Guest profile updated')
      }
    }
    
    console.log('')
    console.log('🎯 SURGICAL FIX COMPLETE')
    console.log('Guest user should now log in properly!')
    console.log('')
    console.log('Test with:')
    console.log(`Email: ${credentials.email}`)
    console.log(`Password: ${credentials.password}`)
    
  } catch (error) {
    console.error('❌ Surgical fix failed:', error)
    process.exit(1)
  }
}

fixGuestProfile()