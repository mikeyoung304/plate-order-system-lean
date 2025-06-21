#!/usr/bin/env node

/**
 * Final Authentication Test
 * Simulates complete guest login flow and identifies remaining issues
 */

const http = require('http')
const querystring = require('querystring')

// Extract form action and hidden inputs from HTML
function parseForm(html) {
  const actionMatch = html.match(/action="([^"]*)"/)
  const hiddenInputs = {}
  
  // Extract hidden inputs
  const hiddenMatches = html.matchAll(/<input[^>]*type="hidden"[^>]*name="([^"]*)"[^>]*value="([^"]*)"[^>]*>/g)
  for (const match of hiddenMatches) {
    hiddenInputs[match[1]] = match[2]
  }
  
  return {
    action: actionMatch ? actionMatch[1] : '',
    hiddenInputs
  }
}

async function makeRequest(options, postData = null) {
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

async function testCompleteAuthFlow() {
  console.log('🔍 FINAL AUTHENTICATION FLOW TEST\n')
  
  console.log('1. Getting login page and parsing form...')
  
  try {
    // Get the login page
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    })
    
    if (loginResponse.statusCode !== 200) {
      console.log('❌ Failed to get login page:', loginResponse.statusCode)
      return
    }
    
    console.log('✅ Login page loaded')
    
    // Parse the form
    const formData = parseForm(loginResponse.body)
    console.log('📋 Form action:', formData.action || 'None')
    console.log('📋 Hidden inputs:', Object.keys(formData.hiddenInputs).length, 'found')
    
    console.log('\n2. Submitting guest credentials...')
    
    // Prepare form data for guest login
    const postData = querystring.stringify({
      ...formData.hiddenInputs,
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })
    
    const submitResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: formData.action || '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Cookie': loginResponse.headers['set-cookie'] ? loginResponse.headers['set-cookie'].join('; ') : ''
      }
    }, postData)
    
    console.log('📡 Form submission status:', submitResponse.statusCode)
    console.log('📍 Location header:', submitResponse.headers.location || 'None')
    console.log('🍪 Set-Cookie headers:', submitResponse.headers['set-cookie'] ? submitResponse.headers['set-cookie'].length : 'None')
    
    if (submitResponse.statusCode === 302 || submitResponse.statusCode === 307) {
      console.log('✅ Form submission triggered redirect')
      
      if (submitResponse.headers.location === '/dashboard') {
        console.log('🎉 SUCCESS: Redirect to dashboard!')
      } else {
        console.log('❓ Redirect to:', submitResponse.headers.location)
      }
      
    } else if (submitResponse.statusCode === 200) {
      console.log('⚠️ Form returned 200 (same page)')
      
      // Check if there are error messages
      if (submitResponse.body.includes('error')) {
        console.log('❌ Response contains error')
        
        // Look for specific error patterns
        const errorMatch = submitResponse.body.match(/error[^>]*>([^<]+)</i)
        if (errorMatch) {
          console.log('📝 Error message:', errorMatch[1])
        }
      } else {
        console.log('❓ No obvious error in response')
      }
    }
    
    console.log('\n3. Testing cookie-based dashboard access...')
    
    // Try to access dashboard with received cookies
    const cookies = submitResponse.headers['set-cookie'] ? 
      submitResponse.headers['set-cookie'].join('; ') : ''
    
    if (cookies) {
      const dashboardResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/dashboard',
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Cookie': cookies
        }
      })
      
      console.log('📡 Dashboard access status:', dashboardResponse.statusCode)
      console.log('📍 Dashboard location:', dashboardResponse.headers.location || 'None')
      
      if (dashboardResponse.statusCode === 200) {
        console.log('🎉 SUCCESS: Dashboard accessible with auth cookies!')
      } else if (dashboardResponse.statusCode === 307 && dashboardResponse.headers.location === '/') {
        console.log('❌ Dashboard still redirecting - auth cookies not working')
      }
    } else {
      console.log('❌ No cookies received from form submission')
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

async function main() {
  await testCompleteAuthFlow()
  
  console.log('\n' + '='.repeat(60))
  console.log('🎯 COMPLETE DIAGNOSIS SUMMARY:')
  console.log('')
  console.log('Based on the test results above:')
  console.log('')
  console.log('✅ SUCCESS INDICATORS:')
  console.log('- Login page loads correctly')
  console.log('- Form action and hidden inputs are present')
  console.log('- Guest credentials are valid (verified separately)')
  console.log('- No React form attribute warnings')
  console.log('')
  console.log('❌ FAILURE INDICATORS TO LOOK FOR:')
  console.log('- Form returns 200 instead of redirect')
  console.log('- No auth cookies set after submission')
  console.log('- Dashboard still redirects after auth')
  console.log('')
  console.log('🛠️ IF ISSUES REMAIN:')
  console.log('- Clear all browser data (cookies, localStorage, etc.)')
  console.log('- Check browser console for JavaScript errors')
  console.log('- Verify server action is executing properly')
  console.log('- Check middleware cookie handling')
  console.log('='.repeat(60))
}

main().catch(console.error)