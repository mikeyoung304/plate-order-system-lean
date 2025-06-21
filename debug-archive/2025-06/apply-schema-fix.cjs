#!/usr/bin/env node

/**
 * Apply the database schema migration
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  console.log('🔄 Reading schema migration file...');
  
  const sqlPath = path.join(__dirname, 'supabase/migrations/20250615000000_fix_rls_and_schema.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Migration file not found:', sqlPath);
    return false;
  }
  
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  console.log('✅ Migration file loaded');
  
  // Import Supabase client
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  console.log('🔄 Applying migration via Supabase...');
  
  // Split into statements and execute
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
  
  console.log(`📝 Found ${statements.length} statements to execute`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.length === 0) continue;
    
    console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      // Use rpc to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        query: stmt + ';'
      });
      
      if (error) {
        console.error(`❌ Statement ${i + 1} failed:`, error.message);
        failed++;
      } else {
        console.log(`✅ Statement ${i + 1} succeeded`);
        success++;
      }
    } catch (err) {
      console.error(`❌ Statement ${i + 1} error:`, err.message);
      failed++;
    }
  }
  
  console.log('\n📊 MIGRATION SUMMARY:');
  console.log(`✅ Successful: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  
  return success > failed;
}

applyMigration()
  .then(success => {
    if (success) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('🔄 Testing order creation...');
    } else {
      console.log('\n⚠️ Migration had issues - manual intervention may be needed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });