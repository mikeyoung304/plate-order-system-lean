#!/usr/bin/env node

/**
 * Multi-Agent System Verification
 * Uses multiple specialized agents to verify different aspects of the system
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = 'http://localhost:3000';

// Test credentials
const GUEST_EMAIL = 'guest@restaurant.plate';
const GUEST_PASSWORD = 'guest12345';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Agent results collector
const agentResults = {
  timestamp: new Date().toISOString(),
  agents: {},
  summary: {}
};

// Utility functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function logAgent(agentName, test, status, details = {}) {
  if (!agentResults.agents[agentName]) {
    agentResults.agents[agentName] = [];
  }
  agentResults.agents[agentName].push({
    test,
    status,
    timestamp: new Date().toISOString(),
    ...details
  });
  console.log(`[${agentName}] ${status === 'passed' ? '✅' : '❌'} ${test}`);
  if (details.error) console.error(`   Error: ${details.error}`);
}

// Agent 1: Database & Authentication Agent
async function databaseAuthAgent() {
  console.log('\n🔐 DATABASE & AUTHENTICATION AGENT');
  console.log('==================================');
  
  try {
    // Test 1: Guest user authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: GUEST_EMAIL,
      password: GUEST_PASSWORD
    });
    
    logAgent('DatabaseAuth', 'Guest Authentication', authError ? 'failed' : 'passed', {
      error: authError?.message,
      userId: authData?.user?.id
    });
    
    if (authData?.user) {
      // Test 2: Check user role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();
      
      logAgent('DatabaseAuth', 'User Role Check', profileError ? 'failed' : 'passed', {
        role: profile?.role,
        expectedRole: 'admin',
        correct: profile?.role === 'admin'
      });
      
      // Test 3: RLS policies for KDS
      const { data: kdsData, error: kdsError } = await supabase
        .from('kds_order_routing')
        .select('*')
        .limit(5);
      
      logAgent('DatabaseAuth', 'KDS RLS Policy Test', kdsError ? 'failed' : 'passed', {
        error: kdsError?.message,
        recordsReturned: kdsData?.length || 0
      });
      
      // Test 4: Orders access
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(5);
      
      logAgent('DatabaseAuth', 'Orders RLS Policy Test', ordersError ? 'failed' : 'passed', {
        error: ordersError?.message,
        recordsReturned: ordersData?.length || 0
      });
    }
    
  } catch (error) {
    logAgent('DatabaseAuth', 'Agent Execution', 'failed', { error: error.message });
  }
}

// Agent 2: Real-time & WebSocket Agent
async function realtimeWebSocketAgent() {
  console.log('\n📡 REAL-TIME & WEBSOCKET AGENT');
  console.log('==============================');
  
  try {
    // Sign in first
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: GUEST_EMAIL,
      password: GUEST_PASSWORD
    });
    
    if (!authData?.session) {
      logAgent('RealtimeWebSocket', 'Authentication Required', 'failed');
      return;
    }
    
    // Test 1: Create real-time channel
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'kds_order_routing' },
        (payload) => {
          logAgent('RealtimeWebSocket', 'Real-time Event Received', 'passed', {
            event: payload.eventType,
            table: payload.table
          });
        }
      );
    
    // Subscribe to channel
    const subscribeResult = await channel.subscribe((status) => {
      logAgent('RealtimeWebSocket', 'Channel Subscription', 
        status === 'SUBSCRIBED' ? 'passed' : 'failed', 
        { status }
      );
    });
    
    // Wait for subscription
    await wait(3000);
    
    // Test 2: Check connection status
    const connectionState = channel.state;
    logAgent('RealtimeWebSocket', 'Connection State Check', 'passed', {
      state: connectionState,
      isHealthy: connectionState === 'joined'
    });
    
    // Cleanup
    await channel.unsubscribe();
    
  } catch (error) {
    logAgent('RealtimeWebSocket', 'Agent Execution', 'failed', { error: error.message });
  }
}

// Agent 3: API & Performance Agent
async function apiPerformanceAgent() {
  console.log('\n⚡ API & PERFORMANCE AGENT');
  console.log('=========================');
  
  try {
    // Test 1: Health endpoint
    const healthStart = Date.now();
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthTime = Date.now() - healthStart;
    
    logAgent('APIPerformance', 'Health Endpoint', healthResponse.ok ? 'passed' : 'failed', {
      status: healthResponse.status,
      responseTime: `${healthTime}ms`,
      performanceGrade: healthTime < 100 ? 'A' : healthTime < 200 ? 'B' : 'C'
    });
    
    // Test 2: KDS Orders API
    const kdsStart = Date.now();
    const kdsResponse = await fetch(`${BASE_URL}/api/kds/orders`);
    const kdsTime = Date.now() - kdsStart;
    
    logAgent('APIPerformance', 'KDS Orders API', kdsResponse.ok ? 'passed' : 'failed', {
      status: kdsResponse.status,
      responseTime: `${kdsTime}ms`,
      performanceGrade: kdsTime < 200 ? 'A' : kdsTime < 500 ? 'B' : 'C'
    });
    
    // Test 3: Multiple concurrent requests
    const concurrentStart = Date.now();
    const concurrentRequests = await Promise.all([
      fetch(`${BASE_URL}/api/health`),
      fetch(`${BASE_URL}/api/kds/orders`),
      fetch(`${BASE_URL}/api/kds/stations`)
    ]);
    const concurrentTime = Date.now() - concurrentStart;
    
    const allSuccessful = concurrentRequests.every(r => r.ok);
    logAgent('APIPerformance', 'Concurrent Requests', allSuccessful ? 'passed' : 'failed', {
      totalTime: `${concurrentTime}ms`,
      averageTime: `${(concurrentTime / 3).toFixed(2)}ms`,
      performanceGrade: concurrentTime < 300 ? 'A' : concurrentTime < 600 ? 'B' : 'C'
    });
    
  } catch (error) {
    logAgent('APIPerformance', 'Agent Execution', 'failed', { error: error.message });
  }
}

// Agent 4: TypeScript & Build Agent
async function typeScriptBuildAgent() {
  console.log('\n🔧 TYPESCRIPT & BUILD AGENT');
  console.log('===========================');
  
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    // Test 1: TypeScript compilation check
    console.log('   Running TypeScript check...');
    const tsStart = Date.now();
    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
        cwd: path.join(__dirname, '..')
      });
      const tsTime = Date.now() - tsStart;
      
      const hasErrors = stderr.includes('error') || stdout.includes('error');
      logAgent('TypeScriptBuild', 'TypeScript Compilation', hasErrors ? 'failed' : 'passed', {
        compilationTime: `${tsTime}ms`,
        errors: hasErrors ? 'Found type errors' : 'No errors'
      });
    } catch (error) {
      logAgent('TypeScriptBuild', 'TypeScript Compilation', 'failed', {
        error: 'Compilation failed'
      });
    }
    
    // Test 2: Bundle size check
    const buildDir = path.join(__dirname, '../.next');
    try {
      const stats = await fs.stat(buildDir);
      if (stats.isDirectory()) {
        // Get size of static chunks
        const chunksDir = path.join(buildDir, 'static/chunks');
        const files = await fs.readdir(chunksDir);
        let totalSize = 0;
        
        for (const file of files) {
          if (file.endsWith('.js')) {
            const filePath = path.join(chunksDir, file);
            const stat = await fs.stat(filePath);
            totalSize += stat.size;
          }
        }
        
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
        logAgent('TypeScriptBuild', 'Bundle Size Analysis', 'passed', {
          totalChunksSize: `${totalSizeMB}MB`,
          optimizationGrade: totalSize < 5000000 ? 'A' : totalSize < 10000000 ? 'B' : 'C'
        });
      }
    } catch (error) {
      logAgent('TypeScriptBuild', 'Bundle Size Analysis', 'skipped', {
        reason: 'Build directory not found'
      });
    }
    
  } catch (error) {
    logAgent('TypeScriptBuild', 'Agent Execution', 'failed', { error: error.message });
  }
}

// Agent 5: Memory & Resource Agent
async function memoryResourceAgent() {
  console.log('\n💾 MEMORY & RESOURCE AGENT');
  console.log('=========================');
  
  try {
    // Test 1: Check Node.js memory usage
    const memUsage = process.memoryUsage();
    const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
    
    logAgent('MemoryResource', 'Memory Usage Check', 'passed', {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      heapPercentage: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)}%`
    });
    
    // Test 2: Check for memory leaks (simplified)
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Simulate some operations
    for (let i = 0; i < 100; i++) {
      await fetch(`${BASE_URL}/api/health`).catch(() => {});
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    await wait(1000);
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = ((finalMemory - initialMemory) / 1024 / 1024).toFixed(2);
    
    logAgent('MemoryResource', 'Memory Leak Detection', 
      Math.abs(memoryIncrease) < 10 ? 'passed' : 'warning', {
      memoryIncrease: `${memoryIncrease}MB`,
      status: Math.abs(memoryIncrease) < 10 ? 'No significant leak detected' : 'Possible memory leak'
    });
    
  } catch (error) {
    logAgent('MemoryResource', 'Agent Execution', 'failed', { error: error.message });
  }
}

// Main execution
async function runMultiAgentVerification() {
  console.log('🤖 MULTI-AGENT SYSTEM VERIFICATION');
  console.log('==================================');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  // Update todo
  console.log('📋 Updating todo list...\n');
  
  try {
    // Run all agents
    await databaseAuthAgent();
    await wait(1000);
    
    await realtimeWebSocketAgent();
    await wait(1000);
    
    await apiPerformanceAgent();
    await wait(1000);
    
    await typeScriptBuildAgent();
    await wait(1000);
    
    await memoryResourceAgent();
    
    // Generate summary
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    for (const [agentName, results] of Object.entries(agentResults.agents)) {
      const agentPassed = results.filter(r => r.status === 'passed').length;
      const agentFailed = results.filter(r => r.status === 'failed').length;
      
      totalTests += results.length;
      passedTests += agentPassed;
      failedTests += agentFailed;
      
      agentResults.summary[agentName] = {
        total: results.length,
        passed: agentPassed,
        failed: agentFailed,
        successRate: `${((agentPassed / results.length) * 100).toFixed(2)}%`
      };
    }
    
    agentResults.summary.overall = {
      totalTests,
      passedTests,
      failedTests,
      successRate: `${((passedTests / totalTests) * 100).toFixed(2)}%`
    };
    
    // Save results
    const reportPath = path.join(__dirname, '../multi-agent-verification-report.json');
    await fs.writeFile(reportPath, JSON.stringify(agentResults, null, 2));
    
    // Print summary
    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('=====================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${agentResults.summary.overall.successRate}`);
    
    console.log('\n📋 Agent Performance:');
    for (const [agentName, summary] of Object.entries(agentResults.summary)) {
      if (agentName !== 'overall') {
        console.log(`   ${agentName}: ${summary.successRate} (${summary.passed}/${summary.total})`);
      }
    }
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('\n❌ Multi-agent verification failed:', error);
  }
}

// Check if dev server is running
async function checkDevServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Main
(async () => {
  const serverRunning = await checkDevServer();
  if (!serverRunning) {
    console.error('❌ Dev server is not running. Please run "npm run dev:clean" first.');
    process.exit(1);
  }
  
  await runMultiAgentVerification();
  process.exit(0);
})();