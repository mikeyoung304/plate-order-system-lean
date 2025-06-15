#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function checkUserRole() {
  console.log('👤 Checking demo guest user role...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    // Check the demo guest user profile
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'demo@guest.com')
    
    if (error) {
      console.error('❌ Error checking profiles:', error.message)
      return
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ No profile found for demo@guest.com')
      return
    }
    
    console.log('✅ Demo guest profile found:')
    profiles.forEach(profile => {
      console.log(`  ID: ${profile.id}`)
      console.log(`  Email: ${profile.email}`)
      console.log(`  Name: ${profile.name}`)
      console.log(`  Role: ${profile.role}`)
      console.log('  Full profile:', JSON.stringify(profile, null, 2))
    })
    
    // Also check auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error listing users:', usersError.message)
      return
    }
    
    const demoUser = users.users.find(u => u.email === 'demo@guest.com')
    if (demoUser) {
      console.log('\n👥 Auth user details:')
      console.log(`  ID: ${demoUser.id}`)
      console.log(`  Email: ${demoUser.email}`)
      console.log(`  Created: ${demoUser.created_at}`)
      console.log(`  Last sign in: ${demoUser.last_sign_in_at}`)
      console.log(`  User metadata:`, JSON.stringify(demoUser.user_metadata, null, 2))
      console.log(`  App metadata:`, JSON.stringify(demoUser.app_metadata, null, 2))
    } else {
      console.log('❌ No auth user found for demo@guest.com')
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err)
  }
}

async function main() {
  console.log('🚀 Starting user role check...')
  await checkUserRole()
}

main().catch(console.error)