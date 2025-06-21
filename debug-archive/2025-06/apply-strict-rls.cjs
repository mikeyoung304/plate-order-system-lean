#!/usr/bin/env node

/**
 * Apply STRICT RLS security - block ALL anonymous access
 * This fixes the immediate security vulnerability
 */

require('dotenv').config({ path: '.env.local' });

async function applyStrictRLS() {
  console.log('🔒 Applying STRICT RLS Security Policies');
  console.log('======================================');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  // SQL commands to block anonymous access to all sensitive tables
  const securityCommands = [
    // Enable RLS on all tables
    'ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;', 
    'ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;',
    
    // Revoke ALL anonymous access
    'REVOKE ALL ON public.tables FROM anon;',
    'REVOKE ALL ON public.seats FROM anon;',
    'REVOKE ALL ON public.orders FROM anon;',
    'REVOKE ALL ON public.profiles FROM anon;',
    
    // Drop any existing policies that might allow anonymous access
    'DROP POLICY IF EXISTS "Enable read access for all users" ON public.tables;',
    'DROP POLICY IF EXISTS "Enable read access for all users" ON public.seats;',
    'DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;',
    'DROP POLICY IF EXISTS "public_read" ON public.tables;',
    'DROP POLICY IF EXISTS "public_read" ON public.seats;',
    'DROP POLICY IF EXISTS "public_read" ON public.orders;',
    'DROP POLICY IF EXISTS "Guests can read tables (demo access)" ON public.tables;',
    'DROP POLICY IF EXISTS "Guests can read seats (demo access)" ON public.seats;',
    
    // Create strict authenticated-only policies
    'CREATE POLICY "authenticated_users_only" ON public.tables FOR ALL TO authenticated USING (true);',
    'CREATE POLICY "authenticated_users_only" ON public.seats FOR ALL TO authenticated USING (true);',
    'CREATE POLICY "authenticated_users_only" ON public.orders FOR ALL TO authenticated USING (true);',
    'CREATE POLICY "authenticated_users_only" ON public.profiles FOR ALL TO authenticated USING (true);'
  ];
  
  console.log(`🔄 Executing ${securityCommands.length} security commands...`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < securityCommands.length; i++) {
    const command = securityCommands[i];
    console.log(`🔄 ${i + 1}/${securityCommands.length}: ${command.substring(0, 50)}...`);
    
    try {
      // Try multiple approaches for executing SQL
      
      // Approach 1: Try using REST API SQL endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ sql: command })
      });
      
      if (response.ok) {
        console.log(`✅ Command ${i + 1} executed successfully`);
        success++;
        continue;
      }
      
      // Approach 2: If that fails, try a different SQL execution method
      // For now, we'll log that manual intervention is needed
      console.log(`⚠️ Command ${i + 1} needs manual execution: ${command}`);
      failed++;
      
    } catch (err) {
      console.log(`❌ Command ${i + 1} failed: ${err.message}`);
      failed++;
    }
  }
  
  console.log('\n📊 SECURITY COMMAND SUMMARY:');
  console.log(`✅ Successful: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n🔧 MANUAL STEPS REQUIRED:');
    console.log('Open Supabase Dashboard SQL Editor and execute:');
    console.log(`${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'https://app.')}/project/sql`);
    console.log('\nSQL Commands to execute:');
    securityCommands.forEach(cmd => {
      console.log(cmd);
    });
  }
  
  return success > failed;
}

async function testSecurityAfterFix() {
  console.log('\n🧪 Testing security after applying strict RLS...');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const tables = ['tables', 'seats', 'orders', 'profiles'];
  let blockedCount = 0;
  
  for (const table of tables) {
    try {
      const { data, error } = await anonSupabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`✅ ${table}: Properly blocked (${error.message})`);
        blockedCount++;
      } else {
        console.log(`❌ ${table}: Still accessible! Found ${data?.length || 0} rows`);
      }
    } catch (err) {
      console.log(`✅ ${table}: Properly blocked (${err.message})`);
      blockedCount++;
    }
  }
  
  const isSecure = blockedCount === tables.length;
  
  console.log(`\n🔒 Security Status: ${isSecure ? 'SECURE' : 'VULNERABLE'}`);
  console.log(`✅ Blocked tables: ${blockedCount}/${tables.length}`);
  
  return isSecure;
}

async function main() {
  const fixApplied = await applyStrictRLS();
  
  if (fixApplied) {
    console.log('\n🎯 Testing security status...');
    const isSecure = await testSecurityAfterFix();
    
    if (isSecure) {
      console.log('\n🎉 SUCCESS! Security vulnerability fixed!');
      console.log('✅ Anonymous users can no longer access sensitive data');
      console.log('✅ All tables now require authentication');
    } else {
      console.log('\n⚠️ Security fix partially applied');
      console.log('Manual intervention may be required');
    }
    
    return isSecure;
  } else {
    console.log('\n❌ Security fix could not be applied automatically');
    console.log('Manual intervention required via Supabase Dashboard');
    return false;
  }
}

main()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });