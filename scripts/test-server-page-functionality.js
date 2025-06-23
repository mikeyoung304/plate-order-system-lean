#!/usr/bin/env node

/**
 * Server Page Functionality Test
 * Deep dive into server page features with debugging
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = 'http://localhost:3000';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results
const testResults = {
  timestamp: new Date().toISOString(),
  serverPageTests: [],
  databaseTests: [],
  orderCreationTests: [],
  screenshots: []
};

// Utility
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function takeScreenshot(name) {
  const filename = `server-page-${name}-${Date.now()}.png`;
  const filepath = path.join(__dirname, '../test-screenshots', filename);
  
  await execAsync(`screencapture -x "${filepath}"`);
  testResults.screenshots.push({ name, filename });
  console.log(`📸 Screenshot: ${filename}`);
}

// Test 1: Database Structure Tests
async function testDatabaseStructure() {
  console.log('\n🗄️  TESTING DATABASE STRUCTURE');
  console.log('==============================');
  
  try {
    // Check tables
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('*')
      .order('label');
    
    testResults.databaseTests.push({
      test: 'Tables Query',
      status: tablesError ? 'failed' : 'passed',
      error: tablesError?.message,
      count: tables?.length || 0,
      details: tables ? `Found ${tables.length} tables` : 'No tables found'
    });
    
    if (tables && tables.length > 0) {
      console.log(`✅ Found ${tables.length} tables`);
      tables.forEach(t => console.log(`   - ${t.label}: ${t.shape} at (${t.x}, ${t.y})`));
    }
    
    // Check seats
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('*')
      .limit(10);
    
    testResults.databaseTests.push({
      test: 'Seats Query',
      status: seatsError ? 'failed' : 'passed',
      error: seatsError?.message,
      count: seats?.length || 0
    });
    
    // Check residents
    const { data: residents, error: residentsError } = await supabase
      .from('residents')
      .select('*')
      .limit(5);
    
    testResults.databaseTests.push({
      test: 'Residents Query',
      status: residentsError ? 'failed' : 'passed',
      error: residentsError?.message,
      count: residents?.length || 0
    });
    
    // Check active orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*, table:tables(*), resident:residents(*)')
      .eq('status', 'active')
      .limit(5);
    
    testResults.databaseTests.push({
      test: 'Active Orders Query',
      status: ordersError ? 'failed' : 'passed',
      error: ordersError?.message,
      count: orders?.length || 0,
      details: orders ? orders.map(o => ({
        id: o.id,
        table: o.table?.label,
        resident: o.resident?.name,
        items: o.items
      })) : []
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    testResults.databaseTests.push({
      test: 'Database Connection',
      status: 'failed',
      error: error.message
    });
  }
}

// Test 2: Server Page API Tests
async function testServerPageAPIs() {
  console.log('\n🔌 TESTING SERVER PAGE APIS');
  console.log('============================');
  
  // Test with authentication
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'guest@restaurant.plate',
    password: 'guest12345'
  });
  
  if (!authData?.session) {
    console.error('❌ Failed to authenticate');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authData.session.access_token}`,
    'Content-Type': 'application/json'
  };
  
  // Test order creation endpoint
  try {
    const orderData = {
      table_id: 'mock-table-1', // Using mock ID to test error handling
      seat_id: 'mock-seat-1',
      resident_id: 'mock-resident-1',
      items: ['Grilled Chicken', 'Caesar Salad'],
      transcript: 'One grilled chicken with caesar salad',
      type: 'food'
    };
    
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    testResults.orderCreationTests.push({
      test: 'Order Creation API',
      status: response.ok ? 'passed' : 'failed',
      statusCode: response.status,
      response: result,
      details: result.error || 'Order created successfully'
    });
    
    console.log(`Order Creation Test: ${response.ok ? '✅' : '❌'} Status ${response.status}`);
    
  } catch (error) {
    console.error('❌ Order API test error:', error);
    testResults.orderCreationTests.push({
      test: 'Order Creation API',
      status: 'failed',
      error: error.message
    });
  }
}

// Test 3: Visual Server Page Test
async function testServerPageVisually() {
  console.log('\n🖼️  VISUAL SERVER PAGE TESTING');
  console.log('==============================');
  
  // Open server page
  console.log('Opening server page in browser...');
  await execAsync(`open "${BASE_URL}/server"`);
  await wait(3000);
  
  // Take initial screenshot
  await takeScreenshot('initial-load');
  
  console.log('\n📋 Manual Testing Steps:');
  console.log('1. Click on a table to select it');
  console.log('2. Click on a seat position');
  console.log('3. Select a resident');
  console.log('4. Try the voice recording feature');
  console.log('5. Create an order');
  console.log('\nWaiting 10 seconds for manual interaction...');
  
  await wait(10000);
  
  // Take after-interaction screenshot
  await takeScreenshot('after-interaction');
}

// Test 4: Real-time Order Flow
async function testRealTimeOrderFlow() {
  console.log('\n🔄 TESTING REAL-TIME ORDER FLOW');
  console.log('================================');
  
  try {
    // Set up real-time subscription
    const channel = supabase
      .channel('orders-test')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('📡 Real-time event:', payload.eventType);
          testResults.serverPageTests.push({
            test: 'Real-time Order Event',
            status: 'passed',
            event: payload.eventType,
            timestamp: new Date().toISOString()
          });
        }
      );
    
    const status = await channel.subscribe();
    console.log('Real-time subscription status:', status);
    
    // Wait for events
    await wait(5000);
    
    // Cleanup
    await channel.unsubscribe();
    
  } catch (error) {
    console.error('❌ Real-time test error:', error);
    testResults.serverPageTests.push({
      test: 'Real-time Subscription',
      status: 'failed',
      error: error.message
    });
  }
}

// Main execution
async function runServerPageTests() {
  console.log('🧪 COMPREHENSIVE SERVER PAGE TEST');
  console.log('=================================');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // Create screenshots directory
    await fs.mkdir(path.join(__dirname, '../test-screenshots'), { recursive: true });
    
    // Run all tests
    await testDatabaseStructure();
    await testServerPageAPIs();
    await testServerPageVisually();
    await testRealTimeOrderFlow();
    
    // Generate report
    const reportPath = path.join(__dirname, '../server-page-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    
    const dbPassed = testResults.databaseTests.filter(t => t.status === 'passed').length;
    const dbTotal = testResults.databaseTests.length;
    console.log(`Database Tests: ${dbPassed}/${dbTotal} passed`);
    
    const orderPassed = testResults.orderCreationTests.filter(t => t.status === 'passed').length;
    const orderTotal = testResults.orderCreationTests.length;
    console.log(`Order Creation Tests: ${orderPassed}/${orderTotal} passed`);
    
    console.log(`Screenshots Taken: ${testResults.screenshots.length}`);
    
    console.log(`\nFull report saved to: ${reportPath}`);
    
    // Print any errors found
    const errors = [
      ...testResults.databaseTests.filter(t => t.error),
      ...testResults.orderCreationTests.filter(t => t.error)
    ];
    
    if (errors.length > 0) {
      console.log('\n⚠️  ERRORS FOUND:');
      errors.forEach(e => {
        console.log(`   - ${e.test}: ${e.error}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Main
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Dev server is not running. Please run "npm run dev:clean" first.');
    process.exit(1);
  }
  
  await runServerPageTests();
  
  console.log('\n✅ Server page testing complete!');
  console.log('Check test-screenshots/ for visual results');
})();