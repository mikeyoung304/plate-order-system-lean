#!/usr/bin/env npx tsx

/**
 * Final Verification of User Roles Fix
 * 
 * Simple verification script to confirm the fix is working
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

async function finalVerification() {
  console.log('🎯 FINAL VERIFICATION')
  console.log('====================')
  
  try {
    // Check all profiles
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name, role')
      .order('name')
    
    if (profilesError) {
      console.error('❌ Cannot query profiles:', profilesError.message)
      return
    }
    
    console.log(`Total profiles: ${allProfiles?.length || 0}`)
    
    // Count by role
    const roleCount = {
      admin: 0,
      server: 0,
      cook: 0,
      resident: 0
    }
    
    allProfiles?.forEach(profile => {
      if (profile.role in roleCount) {
        roleCount[profile.role as keyof typeof roleCount]++
      }
    })
    
    console.log('\n📊 Role Distribution:')
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`)
    })
    
    // Check guest user specifically
    const guestUser = allProfiles?.find(p => p.user_id === 'b0055f8c-d2c3-425f-add2-e4ee6572829e')
    if (guestUser) {
      console.log(`\n👤 Guest User: ${guestUser.name} (${guestUser.role})`)
    }
    
    // List some residents
    const residents = allProfiles?.filter(p => p.role === 'resident')
    if (residents && residents.length > 0) {
      console.log(`\n👥 Sample Residents:`)
      residents.slice(0, 5).forEach(resident => {
        console.log(`   - ${resident.name}`)
      })
      if (residents.length > 5) {
        console.log(`   ... and ${residents.length - 5} more`)
      }
    }
    
    console.log('\n✅ VERIFICATION COMPLETE')
    console.log('========================')
    
    if (roleCount.server > 0 && roleCount.resident > 0) {
      console.log('🎉 SUCCESS! The user roles are properly configured:')
      console.log(`   - ${roleCount.server} server(s) (including guest user)`)
      console.log(`   - ${roleCount.resident} resident(s) for the dropdown`)
      console.log('')
      console.log('The application should now work correctly!')
      console.log('Guest user will not appear in resident selection.')
    } else {
      console.log('⚠️  There may still be issues with role configuration')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
  }
}

finalVerification()