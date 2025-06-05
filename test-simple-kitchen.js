#!/usr/bin/env node
/**
 * Test Simple Kitchen Page Access
 */

const https = require('https')

async function testSimpleKitchen() {
  console.log('🧪 Testing Simple Kitchen Page...')
  
  return new Promise((resolve, reject) => {
    const req = https.get('http://localhost:3000/kitchen/page-simple', (res) => {
      console.log(`✅ Page accessible: ${res.statusCode}`)
      if (res.statusCode === 200) {
        console.log('✅ Simple kitchen page is working!')
      } else {
        console.log(`⚠️  Unexpected status: ${res.statusCode}`)
      }
      resolve(res.statusCode)
    })
    
    req.on('error', (err) => {
      console.error('❌ Connection failed:', err.message)
      reject(err)
    })
    
    req.setTimeout(5000, () => {
      console.log('⏰ Request timeout')
      req.destroy()
      reject(new Error('Timeout'))
    })
  })
}

testSimpleKitchen().catch(console.error)