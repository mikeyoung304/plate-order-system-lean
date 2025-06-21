#!/usr/bin/env node

/**
 * Debug Server Action Response
 * Check what the server action is actually returning
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function debugServerAction() {
  console.log('🔍 DEBUGGING SERVER ACTION RESPONSE\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('1. Testing Supabase signInWithPassword directly...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })
    
    if (error) {
      console.log('❌ Direct signInWithPassword failed:', error.message)
      console.log('📊 Error details:', {
        name: error.name,
        status: error.status,
        message: error.message
      })
      
      // Common auth issues
      if (error.message.includes('Invalid login credentials')) {
        console.log('💡 Issue: User credentials invalid or user doesn\'t exist')
      } else if (error.message.includes('Email not confirmed')) {
        console.log('💡 Issue: Email needs to be confirmed')
      } else if (error.message.includes('signups not allowed')) {
        console.log('💡 Issue: Email signups are disabled in Supabase')
      }
      
      return false
    }
    
    console.log('✅ Direct signInWithPassword successful!')
    console.log('📊 Auth data:', {
      user_id: data.user?.id,
      email: data.user?.email,
      session_exists: !!data.session,
      access_token_length: data.session?.access_token?.length,
      refresh_token_length: data.session?.refresh_token?.length
    })
    
    // Test session retrieval
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Session retrieval failed:', sessionError.message)
    } else {
      console.log('✅ Session retrieval successful')
      console.log('📊 Session data:', {
        session_exists: !!sessionData.session,
        expires_at: sessionData.session?.expires_at,
        user_id: sessionData.session?.user?.id
      })
    }
    
    return true
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message)
    return false
  }
}

async function simulateServerAction() {
  console.log('\n2. Simulating server action flow...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // This mimics what the server action does
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const data = {
    email: 'guest@restaurant.plate',
    password: 'guest12345'
  }
  
  try {
    const { error } = await supabase.auth.signInWithPassword(data)
    
    if (error) {
      console.log('❌ Server action would return error:', error.message)
      return { error: error.message }
    }
    
    console.log('✅ Server action would return success')
    return { success: true }
    
  } catch (error) {
    console.log('❌ Server action would throw:', error.message)
    return { error: error.message }
  }
}

async function main() {
  const directAuthSuccess = await debugServerAction()
  const serverActionResult = await simulateServerAction()
  
  console.log('\n' + '='.repeat(50))
  console.log('🎯 DIAGNOSIS:')
  
  if (directAuthSuccess && serverActionResult.success) {
    console.log('✅ Authentication is working correctly')
    console.log('🔍 Issue is likely in:')
    console.log('  - Client-side form handling')
    console.log('  - Browser cookie/session management')
    console.log('  - Next.js server-side rendering')
    console.log('')
    console.log('🛠️ RECOMMENDED FIXES:')
    console.log('1. Clear browser cookies and localStorage')
    console.log('2. Check browser console for JavaScript errors')
    console.log('3. Verify Next.js middleware is properly setting cookies')
  } else {
    console.log('❌ Authentication system has issues')
    
    if (!directAuthSuccess) {
      console.log('  - Direct Supabase auth is failing')
    }
    
    if (serverActionResult.error) {
      console.log(`  - Server action would fail: ${serverActionResult.error}`)
    }
  }
  
  console.log('='.repeat(50))
}

main().catch(console.error)