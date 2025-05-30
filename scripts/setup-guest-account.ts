// Setup guest demo account for Plate Order System
// Creates guest@demo.plate with Username: Guest, Password: Temp1

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function setupGuestAccount() {
  console.log('🎯 Setting up guest demo account...')
  
  try {
    // Check for existing guest user
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'guest@demo.plate')
      .single()
    
    if (existingUser) {
      console.log('🧹 Removing existing guest account...')
      await supabase.auth.admin.deleteUser(existingUser.id)
    }
    
    // Create fresh guest user
    console.log('👤 Creating guest user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'guest@demo.plate',
      password: 'Temp1',
      email_confirm: true,
      user_metadata: {
        name: 'Guest Demo User',
        role: 'server'
      }
    })
    
    if (authError) {
      console.error('❌ Failed to create auth user:', authError)
      throw authError
    }
    
    if (!authData.user) {
      throw new Error('No user data returned from auth creation')
    }
    
    // Create profile
    console.log('📝 Creating guest profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: 'Guest Demo User',
        email: 'guest@demo.plate',
        role: 'server',
        metadata: {
          is_guest: true,
          created_for_demo: true,
          personality: 'Demo user exploring Plate features'
        }
      })
    
    if (profileError) {
      console.error('❌ Failed to create profile:', profileError)
      throw profileError
    }
    
    // Assign server role
    console.log('🔑 Assigning server role...')
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'server'
      })
    
    if (roleError && !roleError.message.includes('duplicate')) {
      console.error('❌ Failed to assign role:', roleError)
      throw roleError
    }
    
    console.log('')
    console.log('✅ Guest account successfully created!')
    console.log('')
    console.log('🎯 Demo Login Credentials:')
    console.log('   Username: Guest')
    console.log('   Password: Temp1')
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
    
    const { data: guestProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'guest@demo.plate')
      .single()
    
    if (guestProfile) {
      await supabase
        .from('orders')
        .delete()
        .eq('server_id', guestProfile.id)
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

if (require.main === module) {
  main().then(() => process.exit(0))
}