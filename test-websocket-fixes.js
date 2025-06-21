#!/usr/bin/env node

/**
 * Test script to verify WebSocket subscription fixes
 * 
 * This script verifies that:
 * 1. No duplicate subscriptions are created
 * 2. Subscriptions are properly cleaned up
 * 3. Connection management works correctly
 */

const puppeteer = require('puppeteer')

async function testWebSocketFixes() {
  console.log('🧪 Testing WebSocket subscription fixes...\n')
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for CI
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  // Capture console messages
  const consoleLogs = []
  const consoleErrors = []
  
  page.on('console', msg => {
    const text = msg.text()
    consoleLogs.push(text)
    
    if (msg.type() === 'error') {
      consoleErrors.push(text)
    }
    
    // Check for specific subscription issues
    if (text.includes('tried to subscribe multiple times')) {
      console.error('❌ FOUND DUPLICATE SUBSCRIPTION ERROR:', text)
    }
    
    if (text.includes('[KDS]')) {
      console.log('📡 KDS Log:', text)
    }
  })
  
  // Capture network errors
  page.on('pageerror', error => {
    console.error('❌ Page Error:', error.message)
    consoleErrors.push(error.message)
  })
  
  try {
    console.log('1️⃣ Navigating to KDS page...')
    await page.goto('http://localhost:3000/kitchen/kds', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    })
    
    console.log('2️⃣ Waiting for authentication...')
    
    // Check if we need to authenticate
    const currentUrl = page.url()
    if (currentUrl.includes('/auth') || currentUrl.includes('login')) {
      console.log('3️⃣ Logging in with demo credentials...')
      
      await page.waitForSelector('input[type="email"]', { timeout: 10000 })
      await page.type('input[type="email"]', 'guest@restaurant.plate')
      await page.type('input[type="password"]', 'guest12345')
      
      await page.click('button[type="submit"]')
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 })
    }
    
    console.log('4️⃣ Waiting for KDS to load...')
    await page.waitForSelector('[data-testid="kds-main-content"], .kds-orders, .order-card', { 
      timeout: 15000 
    })
    
    console.log('5️⃣ Testing subscription behavior...')
    
    // Wait for subscriptions to be established
    await page.waitForTimeout(3000)
    
    // Test navigation between different views to trigger re-subscriptions
    console.log('6️⃣ Testing view mode changes...')
    
    // Click on station filters if available
    const stationButtons = await page.$$('button:has-text("Grill"), button:has-text("All Stations")')
    if (stationButtons.length > 0) {
      console.log('   - Switching between stations...')
      for (let i = 0; i < Math.min(3, stationButtons.length); i++) {
        await stationButtons[i].click()
        await page.waitForTimeout(1000)
      }
    }
    
    // Test view mode toggles if available
    const viewButtons = await page.$$('button[data-testid*="view"], .view-toggle button')
    if (viewButtons.length > 0) {
      console.log('   - Switching between view modes...')
      for (let i = 0; i < Math.min(3, viewButtons.length); i++) {
        await viewButtons[i].click()
        await page.waitForTimeout(1000)
      }
    }
    
    console.log('7️⃣ Analyzing console logs...')
    
    // Analysis
    const duplicateSubscriptionErrors = consoleLogs.filter(log => 
      log.includes('tried to subscribe multiple times') ||
      log.includes('subscribe can only be called a single time')
    )
    
    const kdsSubscriptionLogs = consoleLogs.filter(log => 
      log.includes('[KDS]') && (log.includes('connected') || log.includes('Cleaned up'))
    )
    
    const websocketErrors = consoleErrors.filter(error =>
      error.includes('WebSocket') || 
      error.includes('realtime') ||
      error.includes('subscription')
    )
    
    console.log('\n📊 TEST RESULTS:')
    console.log('================')
    
    if (duplicateSubscriptionErrors.length === 0) {
      console.log('✅ No duplicate subscription errors detected')
    } else {
      console.log(`❌ Found ${duplicateSubscriptionErrors.length} duplicate subscription errors:`)
      duplicateSubscriptionErrors.forEach(err => console.log(`   - ${err}`))
    }
    
    console.log(`📡 KDS subscription events: ${kdsSubscriptionLogs.length}`)
    kdsSubscriptionLogs.forEach(log => console.log(`   - ${log}`))
    
    if (websocketErrors.length === 0) {
      console.log('✅ No WebSocket errors detected')
    } else {
      console.log(`❌ Found ${websocketErrors.length} WebSocket errors:`)
      websocketErrors.forEach(err => console.log(`   - ${err}`))
    }
    
    const success = duplicateSubscriptionErrors.length === 0 && websocketErrors.length === 0
    
    console.log('\n🏁 OVERALL RESULT:')
    if (success) {
      console.log('✅ WebSocket subscription fixes are working correctly!')
    } else {
      console.log('❌ Issues detected - fixes may need additional work')
    }
    
    return success
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  } finally {
    await browser.close()
  }
}

// Run the test
if (require.main === module) {
  testWebSocketFixes()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Test execution failed:', error)
      process.exit(1)
    })
}

module.exports = { testWebSocketFixes }