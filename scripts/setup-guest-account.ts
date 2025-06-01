// Setup guest demo account for Plate Order System
// Creates guest@demo.plate with Username: Guest, Password: Temp1

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env file
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value && !process.env[key]) {
      process.env[key] = value.trim()
    }
  })
}

// Use environment variables from .env file
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

async function setupGuestAccount() {
  console.log('🎯 Setting up guest demo account...')

  try {
    // Check for existing guest user by looking up the auth user first
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingGuestAuth = authUsers?.users?.find(
      u => u.email === 'guest@restaurant.plate'
    )

    if (existingGuestAuth) {
      console.log('🧹 Removing existing guest account...')
      await supabase.auth.admin.deleteUser(existingGuestAuth.id)
    }

    // Create fresh guest user
    console.log('👤 Creating guest user...')
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: 'guest@restaurant.plate',
        password: 'guest123',
        email_confirm: true,
        user_metadata: {
          name: 'Guest User',
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

    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', authData.user.id)
      .single()

    if (existingProfile) {
      console.log('👤 Profile already exists, updating...')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: 'Guest User',
          role: 'admin',
        })
        .eq('user_id', authData.user.id)

      if (updateError) {
        console.error('❌ Failed to update profile:', updateError)
        throw updateError
      }
    } else {
      console.log('📝 Creating guest profile...')
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        name: 'Guest User',
        role: 'admin',
      })

      if (profileError) {
        console.error('❌ Failed to create profile:', profileError)
        throw profileError
      }
    }

    // Role is already assigned via the profile creation

    console.log('')
    console.log('✅ Guest account successfully created!')
    console.log('')
    console.log('🎯 Demo Login Credentials:')
    console.log('   Email: guest@restaurant.plate')
    console.log('   Password: guest123')
    console.log('')
    console.log('🚀 Ready for professional demos!')
  } catch (error) {
    console.error('❌ Failed to setup guest account:', error)
    process.exit(1)
  }
}

async function cleanupOldGuestData() {
  console.log('🧹 Cleaning up old demo data...')

  try {
    // Clean orders older than 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

    // Find guest user by auth email first
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const guestAuth = authUsers?.users?.find(
      u => u.email === 'guest@restaurant.plate'
    )

    const { data: guestProfile } = guestAuth
      ? await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', guestAuth.id)
          .single()
      : { data: null }

    if (guestProfile) {
      await supabase
        .from('orders')
        .delete()
        .eq('server_id', guestProfile.user_id)
        .lt('created_at', fourHoursAgo)

      console.log('✅ Cleaned up old guest orders')
    }
  } catch (error) {
    console.log('⚠️  Could not clean old data:', error)
  }
}

async function main() {
  await cleanupOldGuestData()
  await setupGuestAccount()
}

// Run if called directly
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })
