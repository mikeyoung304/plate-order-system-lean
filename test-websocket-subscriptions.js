// WebSocket Subscription Test - Browser Console Script
// Run this in browser console while on /kitchen/kds page

console.log('🔍 KDS WebSocket Subscription Analysis Started...');

let subscriptionCount = 0;
let channelNames = new Set();
let errors = [];

// Monitor Supabase channel creation
const originalSupabase = window.supabase || {};
if (typeof window !== 'undefined' && window.supabase) {
  // Intercept channel creation
  const originalChannel = window.supabase.channel;
  
  if (originalChannel) {
    window.supabase.channel = function(name) {
      subscriptionCount++;
      channelNames.add(name);
      
      console.log(`📡 Channel created: "${name}" (Total: ${subscriptionCount})`);
      
      if (channelNames.size < subscriptionCount) {
        console.warn(`⚠️ Duplicate subscription detected! Channel "${name}" created multiple times`);
        errors.push(`Duplicate subscription: ${name}`);
      }
      
      const channel = originalChannel.call(this, name);
      
      // Intercept subscribe calls
      const originalSubscribe = channel.subscribe;
      channel.subscribe = function() {
        console.log(`🔔 Subscribing to channel: "${name}"`);
        
        try {
          return originalSubscribe.call(this);
        } catch (error) {
          console.error(`❌ Subscription error for "${name}":`, error);
          errors.push(`Subscription error: ${error.message}`);
          throw error;
        }
      };
      
      return channel;
    };
  }
}

// Monitor console errors
const originalError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  
  if (message.includes('subscribe') || message.includes('channel') || message.includes('WebSocket')) {
    errors.push(message);
    console.log(`🚨 WebSocket/Subscription Error: ${message}`);
  }
  
  return originalError.apply(console, args);
};

// Report results after 10 seconds
setTimeout(() => {
  console.log('\n📊 KDS WebSocket Subscription Analysis Results:');
  console.log('================================================');
  console.log(`📡 Total Channels Created: ${subscriptionCount}`);
  console.log(`🏷️ Unique Channel Names: ${channelNames.size}`);
  console.log(`❌ Errors Detected: ${errors.length}`);
  
  if (channelNames.size > 0) {
    console.log('\n📋 Channel Names:');
    channelNames.forEach(name => console.log(`  - ${name}`));
  }
  
  if (errors.length > 0) {
    console.log('\n🚨 Errors:');
    errors.forEach(error => console.log(`  - ${error}`));
  }
  
  // Health check
  const isDuplicateSubscriptions = subscriptionCount > channelNames.size;
  const hasErrors = errors.length > 0;
  
  console.log('\n🏥 Health Status:');
  console.log(`Duplicate Subscriptions: ${isDuplicateSubscriptions ? '❌ YES' : '✅ NO'}`);
  console.log(`Subscription Errors: ${hasErrors ? '❌ YES' : '✅ NO'}`);
  
  if (!isDuplicateSubscriptions && !hasErrors) {
    console.log('\n🎉 SUCCESS: No WebSocket subscription issues detected!');
  } else {
    console.log('\n⚠️ WARNING: WebSocket subscription issues detected - see errors above');
  }
  
}, 10000);

console.log('⏱️ Analysis running... Results in 10 seconds');
console.log('Navigate to /kitchen/kds if not already there');