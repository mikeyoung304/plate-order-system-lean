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
    // First, let's see what columns exist in profiles table
    const { data: profilesSchema, error: schemaError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (schemaError) {
      console.error('❌ Error checking profiles schema:', schemaError.message)
    } else {
      console.log('📋 Profiles table structure (sample record):')
      if (profilesSchema && profilesSchema.length > 0) {
        console.log('Available columns:', Object.keys(profilesSchema[0]))
        console.log('Sample record:', JSON.stringify(profilesSchema[0], null, 2))
      }
    }
    
    // Get all profiles to find our demo user
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('*')
    
    if (allError) {
      console.error('❌ Error getting all profiles:', allError.message)
      return
    }
    
    console.log(`\n📊 Found ${allProfiles?.length || 0} profiles total`)
    
    // Look for demo user by different possible identifiers
    const demoProfile = allProfiles?.find(p => 
      p.id?.includes('demo') || 
      p.name?.toLowerCase().includes('demo') ||
      p.name?.toLowerCase().includes('guest')
    )
    
    if (demoProfile) {
      console.log('✅ Found potential demo user profile:')
      console.log(JSON.stringify(demoProfile, null, 2))
    } else {
      console.log('❌ No demo user profile found. All profiles:')
      allProfiles?.forEach((profile, index) => {
        console.log(`Profile ${index + 1}:`, JSON.stringify(profile, null, 2))
      })
    }
    
    // Check auth.users to find the demo user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error listing users:', usersError.message)
      return
    }
    
    console.log(`\n👥 Found ${users.users.length} auth users`)
    
    const demoUser = users.users.find(u => 
      u.email === 'demo@guest.com' || 
      u.email?.includes('demo') ||
      u.email?.includes('guest')
    )
    
    if (demoUser) {
      console.log('✅ Found demo user in auth:')
      console.log(`  ID: ${demoUser.id}`)
      console.log(`  Email: ${demoUser.email}`)
      console.log(`  Created: ${demoUser.created_at}`)
      console.log(`  Last sign in: ${demoUser.last_sign_in_at}`)
      console.log(`  User metadata:`, JSON.stringify(demoUser.user_metadata, null, 2))
      console.log(`  App metadata:`, JSON.stringify(demoUser.app_metadata, null, 2))
      
      // Now find the matching profile
      const matchingProfile = allProfiles?.find(p => p.id === demoUser.id)
      if (matchingProfile) {
        console.log('\n🔗 Matching profile:')
        console.log(JSON.stringify(matchingProfile, null, 2))
      }
    } else {
      console.log('❌ No demo user found in auth. All users:')
      users.users.forEach((user, index) => {
        console.log(`User ${index + 1}: ${user.email} (${user.id})`)
      })
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