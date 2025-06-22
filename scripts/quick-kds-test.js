#!/usr/bin/env node

/**
 * 🚀 QUICK KDS AUTHENTICATION TEST
 * 
 * Simple test to check if KDS authentication is working
 */

const puppeteer = require('puppeteer')

async function quickTest() {
  console.log('🧪 Quick KDS Authentication Test')
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  // Monitor console logs
  const errors = []
  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('42501') || 
        text.includes('No session') || 
        text.includes('Authentication required') ||
        text.includes('Failed to fetch')) {
      errors.push(text)
    }
  })

  try {
    console.log('📍 Navigating to KDS page directly...')
    await page.goto('http://localhost:3000/kitchen/kds')
    
    // Wait for page to load
    await page.waitForSelector('body', { timeout: 10000 })
    
    // Wait a bit for JavaScript to run
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    const url = page.url()
    console.log(`Current URL: ${url}`)
    
    // Check for authentication redirect
    if (url.includes('/auth') || url.includes('/login')) {
      console.log('❌ Redirected to login - not authenticated')
    } else if (url.includes('/kitchen/kds')) {
      console.log('✅ Successfully accessed KDS page')
      
      // Check for errors
      if (errors.length === 0) {
        console.log('✅ No authentication errors detected!')
        console.log('🎉 KDS authentication is working!')
      } else {
        console.log('❌ Authentication errors detected:')
        errors.slice(0, 3).forEach(error => {
          console.log(`  • ${error}`)
        })
      }
    } else {
      console.log(`⚠️  Unexpected redirect to: ${url}`)
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'kds-test-screenshot.png' })
    console.log('📸 Screenshot saved as kds-test-screenshot.png')
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`)
  } finally {
    await browser.close()
  }
}

// Check if server is running
fetch('http://localhost:3000')
  .then(() => {
    console.log('✅ Server is running')
    quickTest()
  })
  .catch(() => {
    console.log('❌ Server not running. Start it with: npm run dev')
  })