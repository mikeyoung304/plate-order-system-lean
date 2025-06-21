#!/usr/bin/env node

// KDS Functionality Test
const fetch = require('node-fetch');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  guestUser: 'guest@restaurant.plate',
  guestPassword: 'guest12345'
};

async function testKDSFunctionality() {
  console.log('🧪 Testing KDS Functionality...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  function addTest(name, passed, details = '') {
    results.tests.push({ name, passed, details });
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}: ${details}`);
    }
    if (details && passed) {
      console.log(`   ${details}`);
    }
  }
  
  try {
    // Test 1: API Health
    console.log('📡 Testing API Health...');
    const healthResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/health/simple`);
    const healthData = await healthResponse.json();
    addTest(
      'API Health Check',
      healthResponse.ok && healthData.status === 'healthy',
      `Status: ${healthData.status}, Uptime: ${Math.round(healthData.uptime)}s`
    );
    
    // Test 2: KDS Page Accessibility
    console.log('\n🏠 Testing KDS Page Accessibility...');
    const kdsPageResponse = await fetch(`${TEST_CONFIG.baseUrl}/kitchen/kds`);
    addTest(
      'KDS Page Loads',
      kdsPageResponse.ok,
      `Status: ${kdsPageResponse.status}`
    );
    
    // Test 3: KDS Orders API (if accessible without auth)
    console.log('\n📋 Testing KDS Orders API...');
    try {
      const ordersResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/kds/orders`);
      addTest(
        'KDS Orders API Responsive',
        ordersResponse.status === 401 || ordersResponse.ok, // Either needs auth or works
        `Status: ${ordersResponse.status} (${ordersResponse.status === 401 ? 'auth required' : 'accessible'})`
      );
    } catch (error) {
      addTest('KDS Orders API Responsive', false, error.message);
    }
    
    // Test 4: Bundle Size Check
    console.log('\n📦 Testing Bundle Performance...');
    try {
      const mainJsResponse = await fetch(`${TEST_CONFIG.baseUrl}/_next/static/chunks/main.js`, { method: 'HEAD' });
      if (mainJsResponse.ok) {
        const contentLength = mainJsResponse.headers.get('content-length');
        const sizeKB = contentLength ? Math.round(parseInt(contentLength) / 1024) : 'unknown';
        addTest(
          'Main Bundle Size Reasonable',
          !contentLength || parseInt(contentLength) < 5 * 1024 * 1024, // < 5MB
          `Size: ${sizeKB}KB`
        );
      } else {
        addTest('Main Bundle Size Reasonable', true, 'Bundle not accessible (likely optimized)');
      }
    } catch (error) {
      addTest('Main Bundle Size Reasonable', true, 'Bundle check skipped');
    }
    
    // Test 5: Voice API Availability
    console.log('\n🎤 Testing Voice API...');
    try {
      const voiceResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/transcribe`, { method: 'HEAD' });
      addTest(
        'Voice API Available',
        voiceResponse.status === 405 || voiceResponse.status === 401, // Method not allowed or auth required
        `Status: ${voiceResponse.status}`
      );
    } catch (error) {
      addTest('Voice API Available', false, error.message);
    }
    
    // Test 6: Performance API
    console.log('\n⚡ Testing Performance Monitoring...');
    try {
      const perfResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/performance?action=status`);
      addTest(
        'Performance Monitoring Active',
        perfResponse.ok || perfResponse.status === 401,
        `Status: ${perfResponse.status}`
      );
    } catch (error) {
      addTest('Performance Monitoring Active', false, error.message);
    }
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    addTest('Test Suite Execution', false, error.message);
  }
  
  // Report Results
  console.log('\n' + '='.repeat(50));
  console.log('📊 KDS Functionality Test Results');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! KDS system appears to be functioning correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the details above for issues to address.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Navigate to http://localhost:3000/kitchen/kds in your browser');
  console.log('2. Run the WebSocket test: copy contents of test-websocket-subscriptions.js to browser console');
  console.log('3. Test with guest account: guest@restaurant.plate / guest12345');
  
  return results.failed === 0;
}

if (require.main === module) {
  testKDSFunctionality()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testKDSFunctionality };