#!/usr/bin/env node

/**
 * Test RLS Security - Check what anonymous users can access
 */

require('dotenv').config({ path: '.env.local' });

async function testRLSSecurity() {
  console.log('🔒 Testing RLS Security Policies');
  console.log('===============================');
  
  const { createClient } = require('@supabase/supabase-js');
  
  // Test with anonymous key (what public users see)
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  // Test with service role (what should be blocked for anon users)
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  console.log('🔄 Testing anonymous access to sensitive tables...');
  
  const tables = ['tables', 'seats', 'orders', 'profiles'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error, count } = await anonSupabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        results[table] = { access: 'blocked', error: error.message };
      } else {
        console.log(`⚠️  ${table}: Anonymous can see ${count} rows`);
        results[table] = { access: 'allowed', count };
        
        if (data && data.length > 0) {
          console.log(`   Sample data keys: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      results[table] = { access: 'error', error: err.message };
    }
  }
  
  // Test authenticated access (guest user)
  console.log('\n🔄 Testing authenticated guest access...');
  
  try {
    const { data: authData, error: loginError } = await anonSupabase.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    });
    
    if (loginError) {
      console.log('❌ Guest login failed:', loginError.message);
    } else {
      console.log('✅ Guest authentication successful');
      
      // Test what authenticated guest can see
      for (const table of tables) {
        try {
          const { data, error, count } = await anonSupabase
            .from(table)
            .select('*', { count: 'exact' })
            .limit(1);
          
          if (error) {
            console.log(`❌ Auth ${table}: ${error.message}`);
          } else {
            console.log(`✅ Auth ${table}: Can see ${count} rows`);
          }
        } catch (err) {
          console.log(`❌ Auth ${table}: ${err.message}`);
        }
      }
      
      await anonSupabase.auth.signOut();
    }
  } catch (err) {
    console.log('❌ Authentication test failed:', err.message);
  }
  
  // Analyze security status
  console.log('\n📊 SECURITY ANALYSIS:');
  console.log('====================');
  
  const allowedTables = Object.keys(results).filter(table => results[table].access === 'allowed');
  const blockedTables = Object.keys(results).filter(table => results[table].access === 'blocked');
  
  console.log(`✅ Blocked tables: ${blockedTables.join(', ')} (${blockedTables.length})`);
  console.log(`⚠️  Exposed tables: ${allowedTables.join(', ')} (${allowedTables.length})`);
  
  if (allowedTables.length > 0) {
    console.log('\n🚨 SECURITY ISSUE CONFIRMED:');
    console.log('Anonymous users can access sensitive data!');
    console.log('Need to apply RLS policies to block anonymous access.');
    return false;
  } else {
    console.log('\n🔒 SECURITY LOOKS GOOD:');
    console.log('Anonymous access is properly blocked.');
    return true;
  }
}

testRLSSecurity()
  .then(secure => {
    if (secure) {
      console.log('\n🎉 RLS SECURITY IS WORKING!');
    } else {
      console.log('\n⚠️ RLS SECURITY NEEDS FIXING');
      console.log('🔧 Apply the RLS security policies in fix_rls_security.sql');
    }
    process.exit(secure ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Security test failed:', err);
    process.exit(1);
  });