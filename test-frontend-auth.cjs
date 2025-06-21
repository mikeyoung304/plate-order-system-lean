#!/usr/bin/env node

/**
 * Test Frontend Authentication
 * Uses browser automation to test the actual frontend flow
 */

const http = require('http')

// Simple function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        })
      })
    })
    
    req.on('error', reject)
    
    if (postData) {
      req.write(postData)
    }
    
    req.end()
  })
}

async function testAuthPages() {
  console.log('🔍 TESTING FRONTEND AUTHENTICATION FLOW\n')
  
  console.log('1. Testing root page access...')
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (test-browser)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
    
    console.log(`📡 Root page status: ${response.statusCode}`)
    
    if (response.statusCode === 200) {
      // Check if the auth form is present
      if (response.body.includes('AuthForm') || response.body.includes('Continue as Guest')) {
        console.log('✅ Root page loaded with auth form')
      } else {
        console.log('❌ Root page missing auth form')
      }
    } else {
      console.log('❌ Root page failed to load')
    }
    
  } catch (error) {
    console.log('❌ Root page test failed:', error.message)
  }
  
  console.log('\n2. Testing dashboard access (should redirect)...')
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/dashboard',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (test-browser)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
    
    console.log(`📡 Dashboard status: ${response.statusCode}`)
    console.log(`📍 Location: ${response.headers.location || 'None'}`)
    
    if (response.statusCode === 307 && response.headers.location === '/') {
      console.log('✅ Dashboard correctly redirects unauthenticated users')
    } else if (response.statusCode === 200) {
      console.log('❌ Dashboard accessible without auth - security issue!')
    } else {
      console.log('❓ Unexpected dashboard behavior')
    }
    
  } catch (error) {
    console.log('❌ Dashboard test failed:', error.message)
  }
  
  console.log('\n3. Testing Next.js API routes...')
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (test-browser)'
      }
    })
    
    console.log(`📡 Health API status: ${response.statusCode}`)
    
    if (response.statusCode === 200) {
      console.log('✅ Next.js API routes working')
    } else {
      console.log('❌ Next.js API routes failed')
    }
    
  } catch (error) {
    console.log('❌ API test failed:', error.message)
  }
}

async function main() {
  await testAuthPages()
  
  console.log('\n' + '='.repeat(50))
  console.log('🎯 FRONTEND TEST SUMMARY:')
  console.log('')
  console.log('If all tests pass, the issue is likely:')
  console.log('1. JavaScript execution in the browser')
  console.log('2. React component state management')
  console.log('3. Form submission handling')
  console.log('4. Browser cookie/session storage')
  console.log('')
  console.log('🛠️ NEXT DEBUGGING STEPS:')
  console.log('1. Open browser dev tools (F12)')
  console.log('2. Go to Console tab')
  console.log('3. Navigate to http://localhost:3000')
  console.log('4. Try guest login and watch for errors')
  console.log('5. Check Network tab for failed requests')
  console.log('='.repeat(50))
}

main().catch(console.error)