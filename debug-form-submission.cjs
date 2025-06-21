#!/usr/bin/env node

// Debug script to test the auth form submission process
const puppeteer = require('puppeteer')

async function debugFormSubmission() {
  console.log('🔍 Debugging Form Submission Process...\n')
  
  let browser
  try {
    browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // Listen to console logs
    page.on('console', msg => {
      console.log(`🌐 Browser: ${msg.text()}`)
    })
    
    // Listen to network requests
    page.on('request', request => {
      console.log(`📡 Request: ${request.method()} ${request.url()}`)
    })
    
    page.on('response', response => {
      console.log(`📥 Response: ${response.status()} ${response.url()}`)
    })
    
    console.log('📖 Navigating to http://localhost:3000...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' })
    
    console.log('🔍 Looking for guest login button...')
    await page.waitForSelector('button:has-text("Continue as Guest")', { timeout: 5000 })
    
    console.log('🖱️ Clicking guest login button...')
    await page.click('button:has-text("Continue as Guest")')
    
    console.log('⏳ Waiting for 5 seconds to see what happens...')
    await page.waitForTimeout(5000)
    
    const currentUrl = page.url()
    console.log(`📍 Current URL: ${currentUrl}`)
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard!')
    } else {
      console.log('❌ Still on login page or unexpected redirect')
      
      // Check for any error messages
      const errorElement = await page.$('[data-testid="error"], .alert, .error')
      if (errorElement) {
        const errorText = await errorElement.textContent()
        console.log(`❌ Error message found: ${errorText}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

debugFormSubmission().catch(console.error)