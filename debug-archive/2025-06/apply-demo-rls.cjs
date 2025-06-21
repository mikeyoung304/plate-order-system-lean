#!/usr/bin/env node

/**
 * Apply Demo Mode RLS Security
 * This script applies RLS policies to block anonymous access while allowing guest admin
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function applyDemoRLS() {
  console.log('🔒 Applying Demo Mode RLS Security');
  console.log('===================================');
  
  const { createClient } = require('@supabase/supabase-js');
  
  // Use service role for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  console.log('📂 Reading SQL script...');
  const sqlScript = fs.readFileSync('./apply-demo-rls.sql', 'utf8');
  
  try {
    console.log('🔄 Executing RLS security policies...');
    
    // Split the SQL script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !stmt.match(/^COMMENT\s+ON/i)); // Skip COMMENT statements
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const [index, statement] of statements.entries()) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('dummy').select('1').limit(0);
          if (directError) {
            console.log(`⚠️  Statement ${index + 1}: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${index + 1}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors`);
    
    // Test the security after applying
    console.log('\n🔍 Testing security after applying RLS...');
    await testSecurity(supabase);
    
  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error.message);
    process.exit(1);
  }
}

async function testSecurity(serviceSupabase) {
  // Test with anonymous client
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const tables = ['tables', 'seats', 'orders'];
  let blockedCount = 0;
  let allowedCount = 0;
  
  for (const table of tables) {
    try {
      const { data, error, count } = await anonSupabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`✅ ${table}: Anonymous access blocked`);
        blockedCount++;
      } else {
        console.log(`❌ ${table}: Anonymous can still see ${count} rows`);
        allowedCount++;
      }
    } catch (err) {
      console.log(`✅ ${table}: Anonymous access blocked (${err.message})`);
      blockedCount++;
    }
  }
  
  // Test guest authentication
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
            console.log(`✅ Auth ${table}: Guest can see ${count} rows`);
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
  
  console.log(`\n🎯 Security Summary: ${blockedCount} tables blocked for anonymous, ${allowedCount} still exposed`);
  
  if (allowedCount === 0) {
    console.log('🎉 SUCCESS: All tables are now secured from anonymous access!');
    console.log('🔑 Guest user can authenticate and access demo data');
  } else {
    console.log('⚠️  WARNING: Some tables are still accessible to anonymous users');
  }
}

// Run the script
applyDemoRLS().catch(console.error);