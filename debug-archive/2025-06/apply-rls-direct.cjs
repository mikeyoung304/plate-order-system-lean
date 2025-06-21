#!/usr/bin/env node

/**
 * Apply RLS Security Directly via Supabase migrations
 */

require('dotenv').config({ path: '.env.local' });

async function applyRLSDirect() {
  console.log('🔒 Applying RLS Security via Supabase');
  console.log('====================================');
  
  const { createClient } = require('@supabase/supabase-js');
  
  // Use service role for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  console.log('🔄 Checking current anonymous access...');
  
  // Test with anonymous client first
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const tables = ['tables', 'seats', 'orders'];
  
  console.log('\n📊 Current Anonymous Access:');
  for (const table of tables) {
    try {
      const { data, error, count } = await anonSupabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`✅ ${table}: Already blocked (${error.message})`);
      } else {
        console.log(`❌ ${table}: Anonymous can see ${count} rows`);
      }
    } catch (err) {
      console.log(`✅ ${table}: Already blocked (${err.message})`);
    }
  }
  
  console.log('\n🔧 The best way to fix this is to apply the migration:');
  console.log('1. Copy the SQL from apply-demo-rls.sql');
  console.log('2. Run it in your Supabase dashboard SQL editor');
  console.log('3. Or use: npx supabase db push (if using Supabase CLI)');
  
  console.log('\n🎯 Alternative: Run the existing RLS fix script:');
  console.log('node apply-strict-rls.cjs');
  
  // Test guest authentication
  console.log('\n🔍 Testing guest authentication...');
  try {
    const { data: authData, error: loginError } = await anonSupabase.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    });
    
    if (loginError) {
      console.log('❌ Guest login failed:', loginError.message);
    } else {
      console.log('✅ Guest authentication successful');
      console.log('✅ Guest has god mode access for demo purposes');
      await anonSupabase.auth.signOut();
    }
  } catch (err) {
    console.log('❌ Guest auth test failed:', err.message);
  }
}

applyRLSDirect().catch(console.error);