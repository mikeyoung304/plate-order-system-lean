#!/usr/bin/env node

/**
 * Apply database migration using Supabase REST API directly
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigrationDirect() {
  console.log('🔄 Applying migration via Supabase SQL REST API...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing environment variables');
    return false;
  }
  
  // Read the migration
  const sqlPath = path.join(__dirname, 'supabase/migrations/20250615000000_fix_rls_and_schema.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('📄 Migration loaded, applying via HTTP...');
  
  try {
    // Use the SQL endpoint directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql_query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Migration applied successfully via SQL API');
      console.log('📄 Result:', result);
      return true;
    } else {
      console.error('❌ Migration failed via SQL API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return false;
    }
  } catch (err) {
    console.error('❌ Error calling SQL API:', err.message);
    return false;
  }
}

async function testSimpleAddColumn() {
  console.log('\n🔄 Testing simple column addition...');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  // Test basic connection first
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Cannot connect to orders table:', error.message);
      return false;
    }
    
    console.log('✅ Basic connection to orders table works');
    
    // Check if 'total' column already exists
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('total')
      .limit(1);
      
    if (testError) {
      if (testError.message.includes('total')) {
        console.log('❌ Total column missing - need to add it manually');
        console.log('🔧 Manual fix needed via Supabase Dashboard SQL Editor');
        console.log(`   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'https://app.')}/project/sql`);
        return false;
      } else {
        console.error('❌ Unexpected error:', testError.message);
        return false;
      }
    } else {
      console.log('✅ Total column already exists!');
      return true;
    }
    
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    return false;
  }
}

async function main() {
  console.log('🔒 Database Schema Migration Tool');
  console.log('==================================');
  
  // Try direct API approach first
  const directSuccess = await applyMigrationDirect();
  
  if (!directSuccess) {
    // Fallback to testing what's possible
    const testSuccess = await testSimpleAddColumn();
    
    if (!testSuccess) {
      console.log('\n📋 MANUAL STEPS REQUIRED:');
      console.log('1. 🌐 Open Supabase Dashboard SQL Editor:');
      console.log(`   ${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'https://app.')}/project/sql`);
      console.log('2. 📄 Copy and paste the migration SQL:');
      console.log('   File: supabase/migrations/20250615000000_fix_rls_and_schema.sql');
      console.log('3. ▶️  Execute the SQL in the dashboard');
      console.log('4. ✅ Verify the "total" column is added to orders table');
      return false;
    }
  }
  
  return true;
}

main()
  .then(success => {
    if (success) {
      console.log('\n🎉 Database schema is ready!');
    } else {
      console.log('\n⚠️ Manual intervention required');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });