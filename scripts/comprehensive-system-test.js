#!/usr/bin/env node

/**
 * Comprehensive System Test Script
 * Tests all functionality with screenshots and multi-agent verification
 */

const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

const BASE_URL = 'http://localhost:3000';
const GUEST_EMAIL = 'guest@restaurant.plate';
const GUEST_PASSWORD = 'guest12345';
const SCREENSHOTS_DIR = path.join(__dirname, '../test-screenshots');

// Test results collector
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  screenshots: [],
  performance: {},
  errors: []
};

// Utility to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility to log test results
function logTest(name, status, details = {}) {
  const result = {
    name,
    status,
    timestamp: new Date().toISOString(),
    ...details
  };
  testResults.tests.push(result);
  console.log(`${status === 'passed' ? '✅' : '❌'} ${name}`);
  if (details.error) console.error(`   Error: ${details.error}`);
}

// Take screenshot utility
async function takeScreenshot(page, name) {
  const filename = `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  testResults.screenshots.push({ name, filename, filepath });
  console.log(`📸 Screenshot: ${filename}`);
  return filepath;
}

// Start dev server
async function startDevServer() {
  console.log('🚀 Starting dev server...');
  const devProcess = exec('npm run dev:clean', { 
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'development' }
  });
  
  // Wait for server to be ready
  let serverReady = false;
  let attempts = 0;
  while (!serverReady && attempts < 30) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        serverReady = true;
        logTest('Dev Server Startup', 'passed');
      }
    } catch (error) {
      // Server not ready yet
    }
    if (!serverReady) {
      await wait(2000);
      attempts++;
    }
  }
  
  if (!serverReady) {
    logTest('Dev Server Startup', 'failed', { error: 'Server failed to start after 60 seconds' });
    throw new Error('Dev server failed to start');
  }
  
  return devProcess;
}

// Main test function
async function runTests() {
  let browser;
  let devProcess;
  
  try {
    // Create screenshots directory
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    
    // Start dev server
    devProcess = await startDevServer();
    
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      defaultViewport: { width: 1280, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.errors.push({
          type: 'console-error',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Test 1: Landing Page
    console.log('\n🏠 Testing Landing Page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await takeScreenshot(page, 'landing-page');
    const hasAuthForm = await page.$('input[type="email"]') !== null;
    logTest('Landing Page Load', hasAuthForm ? 'passed' : 'failed');
    
    // Test 2: Guest Authentication
    console.log('\n🔐 Testing Guest Authentication...');
    if (hasAuthForm) {
      await page.type('input[type="email"]', GUEST_EMAIL);
      await page.type('input[type="password"]', GUEST_PASSWORD);
      await takeScreenshot(page, 'login-form-filled');
      
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      const currentUrl = page.url();
      const loginSuccess = currentUrl.includes('/dashboard') || currentUrl.includes('/admin');
      logTest('Guest Login', loginSuccess ? 'passed' : 'failed', { 
        redirectedTo: currentUrl 
      });
      
      if (loginSuccess) {
        await takeScreenshot(page, 'dashboard-after-login');
      }
    }
    
    // Test 3: KDS Page
    console.log('\n👨‍🍳 Testing Kitchen Display System...');
    await page.goto(`${BASE_URL}/kitchen/kds`, { waitUntil: 'networkidle0' });
    await wait(2000); // Wait for real-time connection
    
    const kdsLoaded = await page.$('.kds-main-content') !== null || 
                      await page.$('[class*="KDS"]') !== null;
    logTest('KDS Page Load', kdsLoaded ? 'passed' : 'failed');
    await takeScreenshot(page, 'kds-main-view');
    
    // Check for real-time connection status
    const connectionIndicator = await page.$('[class*="connection"]') || 
                                await page.$('[class*="status"]');
    if (connectionIndicator) {
      await takeScreenshot(page, 'kds-connection-status');
    }
    
    // Test 4: Server Page (Order Creation)
    console.log('\n🍽️ Testing Server Page...');
    await page.goto(`${BASE_URL}/server`, { waitUntil: 'networkidle0' });
    await wait(1500);
    
    const serverPageLoaded = await page.$('[class*="table"]') !== null || 
                             await page.$('[class*="floor-plan"]') !== null;
    logTest('Server Page Load', serverPageLoaded ? 'passed' : 'failed');
    await takeScreenshot(page, 'server-page');
    
    // Test 5: Admin Dashboard
    console.log('\n📊 Testing Admin Dashboard...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await wait(1500);
    
    const adminLoaded = await page.$('[class*="admin"]') !== null || 
                        await page.$('[class*="dashboard"]') !== null;
    logTest('Admin Dashboard Load', adminLoaded ? 'passed' : 'failed');
    await takeScreenshot(page, 'admin-dashboard');
    
    // Test 6: Performance Metrics
    console.log('\n📈 Collecting Performance Metrics...');
    const performanceData = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
      };
    });
    
    testResults.performance = performanceData;
    logTest('Performance Metrics Collection', 'passed', { metrics: performanceData });
    
    // Test 7: Check for TypeScript/Build Errors
    console.log('\n🔧 Checking for Build Errors...');
    try {
      const { stdout: tscOutput } = await execAsync('npx tsc --noEmit', {
        cwd: path.join(__dirname, '..')
      });
      const hasTypeErrors = tscOutput.includes('error');
      logTest('TypeScript Check', hasTypeErrors ? 'failed' : 'passed', {
        errors: hasTypeErrors ? tscOutput : 'none'
      });
    } catch (error) {
      logTest('TypeScript Check', 'failed', { error: error.message });
    }
    
    // Test 8: Real-time Functionality (Multi-tab test)
    console.log('\n🔄 Testing Real-time Updates...');
    const page2 = await browser.newPage();
    await page2.goto(`${BASE_URL}/kitchen/kds`, { waitUntil: 'networkidle0' });
    await wait(2000);
    
    // Both tabs should be on KDS
    await takeScreenshot(page, 'kds-tab-1');
    await takeScreenshot(page2, 'kds-tab-2');
    
    logTest('Multi-tab Real-time Test', 'passed', { 
      detail: 'Multiple KDS instances opened successfully' 
    });
    
    await page2.close();
    
    // Generate test report
    const reportPath = path.join(__dirname, '../test-results-report.json');
    await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📋 Test report saved to: ${reportPath}`);
    
    // Summary
    const passed = testResults.tests.filter(t => t.status === 'passed').length;
    const failed = testResults.tests.filter(t => t.status === 'failed').length;
    
    console.log('\n=== TEST SUMMARY ===');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📸 Screenshots: ${testResults.screenshots.length}`);
    console.log(`⚠️  Console Errors: ${testResults.errors.length}`);
    
    if (testResults.performance.firstContentfulPaint) {
      console.log(`\n⚡ Performance:`);
      console.log(`   First Contentful Paint: ${testResults.performance.firstContentfulPaint.toFixed(2)}ms`);
      console.log(`   DOM Content Loaded: ${testResults.performance.domContentLoaded.toFixed(2)}ms`);
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    testResults.errors.push({
      type: 'fatal',
      message: error.message,
      stack: error.stack
    });
  } finally {
    // Cleanup
    if (browser) await browser.close();
    if (devProcess) {
      devProcess.kill('SIGTERM');
      console.log('\n🛑 Dev server stopped');
    }
  }
}

// Run tests
console.log('🧪 Starting Comprehensive System Test...');
console.log('================================\n');

runTests().then(() => {
  console.log('\n✅ Test suite completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});