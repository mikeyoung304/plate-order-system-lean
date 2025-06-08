// Fix admin demo user authentication
// Ensures admin demo user has proper profile record with admin role

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env file
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value && !process.env[key]) {
      process.env[key] = value.trim()
    }
  })
}

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('Make sure your .env.local file contains these variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Potential admin demo user emails to check/create
const ADMIN_DEMO_USERS = [
  {
    email: 'lisa@platestaff.com',
    name: 'Administrator Lisa Chen',
    role: 'admin' as const,
  },
  {
    email: 'admin@restaurant.plate',
    name: 'Admin User',
    role: 'admin' as const,
  },
  {
    email: 'admin@demo.plate',
    name: 'Demo Administrator',
    role: 'admin' as const,
  }
]

async function fixAdminDemoUser() {
  console.log('🔧 Fixing admin demo user authentication...')
  console.log('')

  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Failed to list auth users:', authError)
      throw authError
    }

    if (!authUsers?.users || authUsers.users.length === 0) {
      console.log('📝 No auth users found. Creating admin demo user...')
      await createAdminDemoUser()
      return
    }

    console.log(`📋 Found ${authUsers.users.length} auth users`)
    console.log('')

    let adminFixed = false

    // Check each potential admin email
    for (const adminConfig of ADMIN_DEMO_USERS) {
      const authUser = authUsers.users.find(u => u.email === adminConfig.email)
      
      if (authUser) {
        console.log(`👤 Found auth user: ${adminConfig.email}`)
        
        // Check if profile exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, role, name')
          .eq('user_id', authUser.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error(`❌ Error checking profile for ${adminConfig.email}:`, profileError)
          continue
        }

        if (existingProfile) {
          if (existingProfile.role === 'admin') {
            console.log(`✅ Profile exists with admin role: ${adminConfig.email}`)
            adminFixed = true
          } else {
            console.log(`🔄 Updating role to admin for: ${adminConfig.email}`)
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                role: 'admin',
                name: adminConfig.name,
              })
              .eq('user_id', authUser.id)

            if (updateError) {
              console.error(`❌ Failed to update profile role:`, updateError)
            } else {
              console.log(`✅ Successfully updated role to admin: ${adminConfig.email}`)
              adminFixed = true
            }
          }
        } else {
          console.log(`📝 Creating admin profile for: ${adminConfig.email}`)
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: authUser.id,
              name: adminConfig.name,
              role: 'admin',
            })

          if (createError) {
            console.error(`❌ Failed to create profile:`, createError)
          } else {
            console.log(`✅ Successfully created admin profile: ${adminConfig.email}`)
            adminFixed = true
          }
        }
        break // Found and processed an admin user
      }
    }

    if (!adminFixed) {
      console.log('🆕 No existing admin users found. Creating new admin demo user...')
      await createAdminDemoUser()
    }

    console.log('')
    console.log('🎯 Admin Demo Login Credentials:')
    console.log('   Email: lisa@platestaff.com')
    console.log('   Password: demo123!')
    console.log('')
    console.log('✅ Admin demo user authentication fixed!')

  } catch (error) {
    console.error('❌ Failed to fix admin demo user:', error)
    process.exit(1)
  }
}

async function createAdminDemoUser() {
  console.log('👤 Creating new admin demo user...')
  
  const adminConfig = ADMIN_DEMO_USERS[0] // lisa@platestaff.com
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminConfig.email,
    password: 'demo123!',
    email_confirm: true,
    user_metadata: {
      name: adminConfig.name,
      role: 'admin',
    },
  })

  if (authError) {
    console.error('❌ Failed to create auth user:', authError)
    throw authError
  }

  if (!authData.user) {
    throw new Error('No user data returned from auth creation')
  }

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: authData.user.id,
    name: adminConfig.name,
    role: 'admin',
  })

  if (profileError) {
    console.error('❌ Failed to create profile:', profileError)
    throw profileError
  }

  console.log(`✅ Created admin demo user: ${adminConfig.email}`)
}

async function verifyAdminAccess() {
  console.log('🔍 Verifying admin access...')
  
  // Check if we have any admin profiles
  const { data: adminProfiles, error } = await supabase
    .from('profiles')
    .select('user_id, name, role')
    .eq('role', 'admin')

  if (error) {
    console.error('❌ Failed to verify admin access:', error)
    return
  }

  if (!adminProfiles || adminProfiles.length === 0) {
    console.log('⚠️  No admin profiles found!')
    return
  }

  console.log(`✅ Found ${adminProfiles.length} admin profile(s):`)
  adminProfiles.forEach((profile, index) => {
    console.log(`   ${index + 1}. ${profile.name} (${profile.user_id})`)
  })
}

async function main() {
  await fixAdminDemoUser()
  await verifyAdminAccess()
}

// Run if called directly
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })