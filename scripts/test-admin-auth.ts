// Test admin authentication to debug role checking
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

async function testAdminAuth() {
  console.log('🔍 Testing admin authentication...')
  console.log('')

  try {
    // Test login with admin credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'lisa@platestaff.com',
      password: 'demo123!',
    })

    if (authError) {
      console.error('❌ Failed to authenticate:', authError)
      return
    }

    if (!authData.user) {
      console.error('❌ No user data returned')
      return
    }

    console.log('✅ Authentication successful')
    console.log('User ID:', authData.user.id)
    console.log('Email:', authData.user.email)
    console.log('')

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, role, name')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError) {
      console.error('❌ Failed to fetch profile:', profileError)
      return
    }

    if (!profile) {
      console.error('❌ No profile found')
      return
    }

    console.log('✅ Profile found:')
    console.log('Name:', profile.name)
    console.log('Role:', profile.role)
    console.log('User ID:', profile.user_id)
    console.log('')

    if (profile.role === 'admin') {
      console.log('🎯 ✅ Admin role confirmed!')
    } else {
      console.log('⚠️  Role is not admin:', profile.role)
    }

    // Test role checking logic
    const userRole = profile.role
    const requiredRole = 'admin'
    const hasRole = userRole === requiredRole

    console.log('')
    console.log('🧪 Role check test:')
    console.log('User role:', userRole)
    console.log('Required role:', requiredRole)
    console.log('Has role:', hasRole)

    if (hasRole) {
      console.log('✅ Role check PASSED')
    } else {
      console.log('❌ Role check FAILED')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAdminAuth()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })