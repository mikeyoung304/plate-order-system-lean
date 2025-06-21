#!/usr/bin/env node

/**
 * Simple Authentication Test
 * Tests basic connectivity and auth setup
 */

const https = require('https')

function testUrl(url, description) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      let data = ''
      response.on('data', (chunk) => {
        data += chunk
      })
      response.on('end', () => {
        const status = response.statusCode
        const isSuccess = status >= 200 && status < 400
        console.log(`${isSuccess ? '✅' : '❌'} ${description}: HTTP ${status}`)
        resolve({ success: isSuccess, status, data })
      })
    })
    
    request.on('error', (error) => {
      console.log(`❌ ${description}: ${error.message}`)
      resolve({ success: false, error: error.message })
    })
    
    request.setTimeout(5000, () => {
      console.log(`⏰ ${description}: Timeout`)
      request.destroy()
      resolve({ success: false, error: 'Timeout' })
    })
  })
}

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...')
  
  // Test Supabase connectivity
  const supabaseUrl = 'https://eiipozoogrrfudhjoqms.supabase.co/rest/v1/'
  const result = await testUrl(supabaseUrl, 'Supabase API')
  
  if (result.success) {
    console.log('✅ Supabase is reachable')
    return true
  } else {
    console.log('❌ Supabase connection failed')
    return false
  }
}

async function testLocalServer() {
  console.log('🔍 Testing Local Development Server...')
  
  try {
    const response = await fetch('http://localhost:3000/api/health')
    if (response.ok) {
      console.log('✅ Local server is running and healthy')
      return true
    } else {
      console.log(`❌ Local server unhealthy: HTTP ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('❌ Local server not reachable - make sure to run: npm run dev')
    return false
  }
}

async function main() {
  console.log('🚀 AUTHENTICATION SYSTEM TEST\n')
  
  // Test Supabase connectivity
  const supabaseOk = await testSupabaseConnection()
  
  // Test local server
  const localOk = await testLocalServer()
  
  console.log('\n' + '='.repeat(50))
  
  if (supabaseOk && localOk) {
    console.log('🎉 SYSTEM READY FOR AUTHENTICATION TEST!')
    console.log('')
    console.log('📋 MANUAL TEST STEPS:')
    console.log('1. Open: http://localhost:3000')
    console.log('2. Enter email: guest@restaurant.plate')
    console.log('3. Enter password: guest12345')
    console.log('4. Click: Sign In')
    console.log('5. Expected: Redirect to dashboard (no refresh token errors)')
    console.log('')
    console.log('💡 If you see refresh token errors, clear browser data and try again')
  } else {
    console.log('❌ SYSTEM NOT READY')
    if (!supabaseOk) {
      console.log('- Check internet connection and Supabase status')
    }
    if (!localOk) {
      console.log('- Run: npm run dev')
    }
  }
  
  console.log('='.repeat(50))
}

main().catch(console.error)