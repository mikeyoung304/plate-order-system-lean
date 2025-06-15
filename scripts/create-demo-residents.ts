#!/usr/bin/env npx tsx

/**
 * Create Demo Residents
 * 
 * Now that the guest user is correctly set as a server, we need actual
 * resident users for the application to work properly. This script will:
 * 
 * 1. Create several demo resident users
 * 2. Ensure they have the 'resident' role
 * 3. Test that the residents dropdown works correctly
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

// Demo residents from the setup script
const DEMO_RESIDENTS = [
  { name: 'Mable Meatballs', email: 'mable@restaurant.plate' },
  { name: 'Waffles Ohulahan', email: 'waffles@restaurant.plate' },
  { name: 'Bernie Bend', email: 'bernie@restaurant.plate' },
  { name: 'Alfonzo Fondu', email: 'alfonzo@restaurant.plate' },
  { name: 'Chuck Winstein', email: 'chuck@restaurant.plate' },
  { name: 'Larry Winstein', email: 'larry@restaurant.plate' },
  { name: 'Mary Choppins', email: 'mary@restaurant.plate' },
  { name: 'Theodore Theopson', email: 'theodore@restaurant.plate' },
  { name: 'Angry Sam', email: 'sam@restaurant.plate' },
  { name: 'Big Betty', email: 'betty@restaurant.plate' },
  { name: 'Salazar Salads', email: 'salazar@restaurant.plate' },
  { name: 'Frankie Buns', email: 'frankie@restaurant.plate' },
  { name: 'Amelia Torres', email: 'amelia@restaurant.plate' },
  { name: 'Mike Young', email: 'mike@restaurant.plate' },
  { name: 'Uncle Sal', email: 'sal@restaurant.plate' },
  { name: 'Diego Doplenutter', email: 'diego@restaurant.plate' },
  { name: 'Bill the 2nd', email: 'bill@restaurant.plate' }
]

async function createDemoResidents() {
  console.log('👥 CREATING DEMO RESIDENTS')
  console.log('=========================')
  console.log(`Creating ${DEMO_RESIDENTS.length} demo residents...`)
  console.log('')

  const createdResidents = []
  const existingResidents = []
  const errors = []

  for (const resident of DEMO_RESIDENTS) {
    try {
      console.log(`Creating: ${resident.name}...`)
      
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === resident.email)
      
      if (existingUser) {
        console.log(`  ⚠️  User already exists: ${existingUser.id}`)
        
        // Check if profile exists and is correct
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, role, name')
          .eq('user_id', existingUser.id)
          .single()
        
        if (!profile) {
          // Create missing profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: existingUser.id,
              name: resident.name,
              role: 'resident'
            })
          
          if (profileError) {
            console.log(`  ❌ Failed to create profile: ${profileError.message}`)
            errors.push({ resident: resident.name, error: profileError.message })
          } else {
            console.log(`  ✅ Profile created`)
            existingResidents.push({ ...resident, id: existingUser.id })
          }
        } else if (profile.role !== 'resident') {
          // Update role to resident
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'resident', name: resident.name })
            .eq('user_id', existingUser.id)
          
          if (updateError) {
            console.log(`  ❌ Failed to update role: ${updateError.message}`)
            errors.push({ resident: resident.name, error: updateError.message })
          } else {
            console.log(`  ✅ Role updated to resident`)
            existingResidents.push({ ...resident, id: existingUser.id })
          }
        } else {
          console.log(`  ✅ Already configured correctly`)
          existingResidents.push({ ...resident, id: existingUser.id })
        }
        continue
      }
      
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: resident.email,
        password: 'resident123', // Simple demo password
        email_confirm: true,
        user_metadata: {
          name: resident.name,
          role: 'resident'
        }
      })
      
      if (createError || !newUser.user) {
        console.log(`  ❌ Failed to create user: ${createError?.message}`)
        errors.push({ resident: resident.name, error: createError?.message || 'Unknown error' })
        continue
      }
      
      console.log(`  ✅ User created: ${newUser.user.id}`)
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: newUser.user.id,
          name: resident.name,
          role: 'resident'
        })
      
      if (profileError) {
        console.log(`  ❌ Failed to create profile: ${profileError.message}`)
        errors.push({ resident: resident.name, error: profileError.message })
        continue
      }
      
      console.log(`  ✅ Profile created`)
      createdResidents.push({ ...resident, id: newUser.user.id })
      
    } catch (error) {
      console.log(`  ❌ Unexpected error: ${error}`)
      errors.push({ resident: resident.name, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
  
  console.log('')
  console.log('📊 CREATION SUMMARY')
  console.log('==================')
  console.log(`✅ New residents created: ${createdResidents.length}`)
  console.log(`✅ Existing residents found: ${existingResidents.length}`)
  console.log(`❌ Errors: ${errors.length}`)
  
  if (errors.length > 0) {
    console.log('')
    console.log('❌ Errors encountered:')
    errors.forEach(err => {
      console.log(`   - ${err.resident}: ${err.error}`)
    })
  }
  
  // Test residents query
  console.log('')
  console.log('🧪 Testing residents query...')
  const { data: allResidents, error: queryError } = await supabase
    .from('profiles')
    .select('user_id, name, role')
    .eq('role', 'resident')
    .order('name')
  
  if (queryError) {
    console.log('❌ Failed to query residents:', queryError.message)
  } else {
    console.log(`✅ Found ${allResidents?.length || 0} residents in database:`)
    allResidents?.forEach(resident => {
      console.log(`   - ${resident.name}`)
    })
  }
  
  console.log('')
  console.log('🎯 DEMO RESIDENTS SETUP COMPLETE')
  console.log('================================')
  console.log('The application should now have:')
  console.log('- A server user (guest@restaurant.plate)')
  console.log(`- ${allResidents?.length || 0} resident users`)
  console.log('- Proper role separation')
  console.log('')
  console.log('Login credentials:')
  console.log('- Server: guest@restaurant.plate / guest12345')
  console.log('- Residents: [name]@restaurant.plate / resident123')
}

createDemoResidents()