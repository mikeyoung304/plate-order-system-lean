#!/usr/bin/env node

/**
 * Debug Authentication Flow
 * Tests the full auth flow from form submission to redirect
 */

const http = require('http')
const querystring = require('querystring')

async function testSignInAction() {
  console.log('🔍 DEBUGGING AUTHENTICATION FLOW\n')
  
  // Test 1: Direct form submission to signin action
  console.log('1. Testing direct form submission...')
  
  const formData = querystring.stringify({
    email: 'guest@restaurant.plate',
    password: 'guest12345'
  })
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(formData),
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  }
  
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        console.log(`📡 Response status: ${res.statusCode}`)
        console.log(`📍 Location header: ${res.headers.location || 'None'}`)
        console.log(`🍪 Set-Cookie headers:`, res.headers['set-cookie'] || 'None')
        
        if (res.statusCode === 302 || res.statusCode === 301) {
          console.log('✅ Form submission triggered redirect')
        } else if (res.statusCode === 200) {
          console.log('❓ Form returned 200 - checking for errors in response')
          
          // Look for common error patterns
          if (data.includes('error') || data.includes('Error')) {
            console.log('❌ Response contains error content')
          } else {
            console.log('✅ Response appears clean')
          }
        } else {
          console.log('❌ Unexpected response status')
        }
        
        resolve({ status: res.statusCode, headers: res.headers, data })
      })
    })
    
    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message)
      resolve({ error: error.message })
    })
    
    req.write(formData)
    req.end()
  })
}

async function testMiddlewareRedirect() {
  console.log('\n2. Testing middleware auth check...')
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/dashboard',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  }
  
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      console.log(`📡 Dashboard access status: ${res.statusCode}`)
      console.log(`📍 Location header: ${res.headers.location || 'None'}`)
      
      if (res.statusCode === 302 && res.headers.location === '/') {
        console.log('✅ Middleware correctly redirecting unauthenticated users')
      } else if (res.statusCode === 200) {
        console.log('❌ Dashboard accessible without auth - middleware issue')
      } else {
        console.log('❓ Unexpected middleware behavior')
      }
      
      resolve({ status: res.statusCode, headers: res.headers })
    })
    
    req.on('error', (error) => {
      console.log('❌ Middleware test failed:', error.message)
      resolve({ error: error.message })
    })
    
    req.end()
  })
}

async function main() {
  try {
    // Test form submission
    const signInResult = await testSignInAction()
    
    // Test middleware
    const middlewareResult = await testMiddlewareRedirect()
    
    console.log('\n' + '='.repeat(50))
    
    if (signInResult.status === 302 || signInResult.status === 200) {
      console.log('🔍 ANALYSIS:')
      console.log('- Form submission is working')
      console.log('- Check browser network tab for actual behavior')
      console.log('- Issue might be client-side JavaScript handling')
      
      console.log('\n💡 NEXT STEPS:')
      console.log('1. Open browser dev tools')
      console.log('2. Go to Network tab')
      console.log('3. Try guest login')
      console.log('4. Look for failed requests or JavaScript errors')
    } else {
      console.log('❌ FORM SUBMISSION ISSUE DETECTED')
    }
    
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

main().catch(console.error)