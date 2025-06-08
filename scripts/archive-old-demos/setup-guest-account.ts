// Setup guest demo account for Plate Order System
// Uses centralized demo system for security and consistency

import * as fs from 'fs'
import * as path from 'path'
import { createDemoUserManager } from '../lib/demo'

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

const demoManager = createDemoUserManager(supabaseUrl, supabaseServiceRoleKey)

async function setupGuestAccount() {
  console.log('🎯 Setting up guest demo account...')

  try {
    const result = await demoManager.createDemoUser()
    
    if (!result.success) {
      console.error('❌ Failed to create demo user:', result.error)
      process.exit(1)
    }

    console.log('')
    console.log('✅ Guest account successfully created!')
    console.log('')
    console.log('🎯 Demo Login Credentials:')
    console.log('   Use centralized demo configuration')
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
    const result = await demoManager.cleanupDemoData(4) // 4 hours old
    
    if (result.success) {
      console.log(`✅ Cleaned up ${result.cleaned} old demo orders`)
    } else {
      console.log('⚠️  Could not clean old data:', result.error)
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
