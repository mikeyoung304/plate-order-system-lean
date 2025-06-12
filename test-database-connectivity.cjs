#!/usr/bin/env node
/**
 * Database Connectivity Test Script
 * Tests both HTTP API connectivity and direct database issues
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  const env = {};
  
  for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes if present
          env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      });
    }
  }
  
  return env;
}

const env = loadEnv();

console.log('🔍 Database Connectivity Investigation');
console.log('======================================\n');

// Test 1: Environment Variables
console.log('1. Environment Variables:');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING'}`);
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING'}`);
console.log(`   SUPABASE_DB_PASSWORD: ${env.SUPABASE_DB_PASSWORD ? '✅ SET' : '❌ MISSING'}`);

// Test 2: URL Validation
if (env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(`   ✅ URL is valid: ${url.hostname}`);
    
    // Extract project reference for PostgreSQL
    const projectRef = url.hostname.split('.')[0];
    const postgresHost = `db.${projectRef}.supabase.co`;
    console.log(`   PostgreSQL host would be: ${postgresHost}`);
  } catch (error) {
    console.log(`   ❌ URL is invalid: ${error.message}`);
  }
} else {
  console.log('   ❌ Cannot validate URL - not set');
}

console.log('\n2. Testing HTTP Connectivity:');

async function testHttpEndpoints() {
  const endpoints = [
    { name: 'Health Check', url: 'http://localhost:3000/api/health' },
    { name: 'Auth Check', url: 'http://localhost:3000/api/auth-check' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(endpoint.url, { timeout: 5000 });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ${endpoint.name}: ${response.status}`);
        
        if (endpoint.name === 'Health Check' && data.checks) {
          console.log(`      Database: ${data.checks.database.status} - ${data.checks.database.message}`);
          console.log(`      Auth: ${data.checks.auth.status} - ${data.checks.auth.message}`);
        }
      } else {
        console.log(`   ❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

console.log('\n3. Direct Supabase Test:');

async function testSupabaseDirectly() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('   ❌ Missing required environment variables for direct test');
      return;
    }
    
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );
    
    // Test database tables
    const tables = ['profiles', 'tables', 'orders', 'kds_stations'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: ${data?.length || 0} records accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Direct Supabase test failed: ${error.message}`);
  }
}

async function main() {
  await testHttpEndpoints();
  await testSupabaseDirectly();
  
  console.log('\n4. Recommendations:');
  
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('   🔧 Fix missing environment variables in .env.local');
  }
  
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_URL.includes('"')) {
    console.log('   🔧 Remove quotes from environment variables in .env.local');
  }
  
  console.log('   🔧 Restart development server after environment changes');
  console.log('   🔧 Check Supabase project status at supabase.com');
  
  console.log('\n✅ Database connectivity investigation complete!');
}

main().catch(console.error);