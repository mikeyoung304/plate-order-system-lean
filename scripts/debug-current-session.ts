// Debug current browser session to understand auth issues
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function debugCurrentSessions() {
  console.log('🔍 Debugging current sessions...')
  console.log('')

  try {
    // List all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Failed to list auth users:', authError)
      return
    }

    console.log(`📋 Found ${authUsers?.users?.length || 0} auth users:`)
    console.log('')

    if (authUsers?.users) {
      for (const user of authUsers.users) {
        console.log(`👤 User: ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Created: ${user.created_at}`)
        console.log(`   Last sign in: ${user.last_sign_in_at}`)
        
        // Check profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, role, name')
          .eq('user_id', user.id)
          .single()

        if (profileError) {
          console.log(`   ❌ Profile error: ${profileError.message}`)
        } else if (profile) {
          console.log(`   ✅ Profile: ${profile.name} (${profile.role})`)
        } else {
          console.log(`   ⚠️  No profile found`)
        }
        
        console.log('')
      }
    }

    // Check for admin profiles specifically
    const { data: adminProfiles, error: adminError } = await supabase
      .from('profiles')
      .select('user_id, role, name')
      .eq('role', 'admin')

    if (adminError) {
      console.error('❌ Failed to fetch admin profiles:', adminError)
    } else {
      console.log(`🎯 Admin profiles found: ${adminProfiles?.length || 0}`)
      adminProfiles?.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.name} (${profile.user_id})`)
      })
    }

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugCurrentSessions()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })