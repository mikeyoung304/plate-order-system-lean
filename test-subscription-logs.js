#!/usr/bin/env node

/**
 * Simple script to check for WebSocket subscription issues
 * 
 * Usage: Open browser console on KDS page and run this:
 * ```
 * // Check for subscription errors in the console
 * const logs = [];
 * const originalLog = console.log;
 * const originalError = console.error;
 * 
 * console.log = (...args) => {
 *   logs.push({type: 'log', message: args.join(' ')});
 *   originalLog.apply(console, args);
 * };
 * 
 * console.error = (...args) => {
 *   logs.push({type: 'error', message: args.join(' ')});
 *   originalError.apply(console, args);
 * };
 * 
 * // After 10 seconds, check results
 * setTimeout(() => {
 *   const duplicateErrors = logs.filter(l => 
 *     l.message.includes('tried to subscribe multiple times') ||
 *     l.message.includes('subscribe can only be called a single time')
 *   );
 *   
 *   console.log('=== SUBSCRIPTION TEST RESULTS ===');
 *   if (duplicateErrors.length === 0) {
 *     console.log('✅ No duplicate subscription errors detected');
 *   } else {
 *     console.log(`❌ Found ${duplicateErrors.length} duplicate subscription errors:`);
 *     duplicateErrors.forEach(err => console.log(`   - ${err.message}`));
 *   }
 * }, 10000);
 * ```
 */

console.log(`
🧪 WEBSOCKET SUBSCRIPTION TEST SCRIPT
=====================================

To test the WebSocket subscription fixes:

1. Open the KDS page in your browser: http://localhost:3000/kitchen/kds
2. Open the browser developer console (F12)
3. Copy and paste this code into the console:

// === COPY BELOW THIS LINE ===

(function() {
  console.log('🧪 Starting WebSocket subscription test...');
  
  const logs = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Capture console messages
  console.log = (...args) => {
    const message = args.join(' ');
    logs.push({type: 'log', message, timestamp: Date.now()});
    originalLog.apply(console, args);
  };
  
  console.error = (...args) => {
    const message = args.join(' ');
    logs.push({type: 'error', message, timestamp: Date.now()});
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    const message = args.join(' ');
    logs.push({type: 'warn', message, timestamp: Date.now()});
    originalWarn.apply(console, args);
  };
  
  // Test subscription behavior after 5 seconds
  setTimeout(() => {
    console.log('🔍 Analyzing WebSocket subscription behavior...');
    
    const duplicateErrors = logs.filter(l => 
      l.message.includes('tried to subscribe multiple times') ||
      l.message.includes('subscribe can only be called a single time') ||
      l.message.includes('CHANNEL_ERROR')
    );
    
    const kdsLogs = logs.filter(l => 
      l.message.includes('[KDS]') || 
      l.message.includes('Channel') ||
      l.message.includes('subscription')
    );
    
    const websocketErrors = logs.filter(l => 
      l.type === 'error' && (
        l.message.includes('WebSocket') ||
        l.message.includes('realtime') ||
        l.message.includes('subscription')
      )
    );
    
    console.log('\\n📊 === WEBSOCKET TEST RESULTS ===');
    
    if (duplicateErrors.length === 0) {
      console.log('✅ No duplicate subscription errors detected');
    } else {
      console.log(\`❌ Found \${duplicateErrors.length} duplicate subscription errors:\`);
      duplicateErrors.forEach(err => console.log(\`   - \${err.message}\`));
    }
    
    if (websocketErrors.length === 0) {
      console.log('✅ No WebSocket errors detected');
    } else {
      console.log(\`❌ Found \${websocketErrors.length} WebSocket errors:\`);
      websocketErrors.forEach(err => console.log(\`   - \${err.message}\`));
    }
    
    console.log(\`📡 Total KDS-related logs: \${kdsLogs.length}\`);
    if (kdsLogs.length > 0) {
      console.log('   KDS Activity:');
      kdsLogs.slice(-5).forEach(log => console.log(\`   - \${log.message}\`));
    }
    
    const success = duplicateErrors.length === 0 && websocketErrors.length === 0;
    
    console.log('\\n🏁 OVERALL RESULT:');
    if (success) {
      console.log('✅ WebSocket subscription fixes are working correctly!');
    } else {
      console.log('❌ Issues detected - subscription fixes may need additional work');
    }
    
    // Restore original console methods
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    
  }, 10000); // Wait 10 seconds to capture subscription activity
  
  console.log('⏱️  Test will complete in 10 seconds...');
})();

// === COPY ABOVE THIS LINE ===

4. Wait for the test to complete (10 seconds)
5. Review the results in the console

The test will check for:
- Duplicate subscription errors
- WebSocket connection errors  
- Proper subscription management

Expected result: ✅ All checks should pass with the new fixes!
`)

module.exports = {
  testInstructions: `
Open KDS page and run the console test script to verify:
1. No "tried to subscribe multiple times" errors
2. No WebSocket connection errors
3. Proper subscription cleanup
`
}