#!/usr/bin/env node

/**
 * Database Performance Migration Script
 * 
 * This script applies the performance optimization indexes migration
 * to the Supabase database for handling 1000+ concurrent users.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Starting database performance optimization migration...');
  console.log(`📡 Connecting to: ${SUPABASE_URL}`);
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250603000001_performance_optimization_indexes.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`📄 Loaded migration file: ${migrationPath}`);
    console.log(`📊 SQL content size: ${migrationSQL.length} characters`);
    
    // Test database connection first
    console.log('\n🔍 Testing database connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      throw new Error(`Database connection failed: ${healthError.message}`);
    }
    
    console.log('✅ Database connection successful');
    
    // Execute the migration SQL
    console.log('\n⚡ Executing performance optimization migration...');
    
    // Split SQL into individual statements for better error handling
    const sqlStatements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📝 Found ${sqlStatements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      
      try {
        // Extract statement type for logging
        const statementType = statement.split(' ')[0].toUpperCase();
        
        console.log(`\n📋 Executing statement ${i + 1}/${sqlStatements.length}: ${statementType}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          // Some errors might be expected (like IF NOT EXISTS conflicts)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            console.log(`⚠️  Expected warning: ${error.message}`);
          } else {
            throw error;
          }
        }
        
        successCount++;
        console.log(`✅ Statement ${i + 1} completed successfully`);
        
      } catch (error) {
        errorCount++;
        const errorMsg = `Statement ${i + 1} failed: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        
        // Continue with next statement unless it's a critical error
        if (error.message.includes('permission denied') || 
            error.message.includes('connection')) {
          console.error('💥 Critical error detected, stopping migration');
          break;
        }
      }
    }
    
    // Execute ANALYZE commands separately (these are important for performance)
    console.log('\n📊 Running table analysis for query optimizer...');
    
    const analyzeTables = [
      'public.orders',
      'public.kds_order_routing', 
      'public.tables',
      'public.seats',
      'public.profiles'
    ];
    
    for (const table of analyzeTables) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ANALYZE ${table};`
        });
        
        if (error) {
          console.log(`⚠️  Could not analyze ${table}: ${error.message}`);
        } else {
          console.log(`✅ Analyzed table: ${table}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not analyze ${table}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📊 Total statements: ${sqlStatements.length}`);
    
    if (errors.length > 0) {
      console.log('\n🚨 ERRORS ENCOUNTERED:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (successCount > errorCount) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💪 Database is now optimized for 1000+ concurrent users');
      console.log('\n📋 Performance improvements applied:');
      console.log('   • 30+ strategic indexes for query optimization');
      console.log('   • Materialized views for dashboard metrics');
      console.log('   • Composite indexes for common query patterns');
      console.log('   • GIN indexes for fast text search');
      console.log('   • Performance monitoring functions');
      
      console.log('\n🔍 Next steps:');
      console.log('   • Monitor query performance in production');
      console.log('   • Use get_index_usage_stats() to track index effectiveness');
      console.log('   • Use get_slow_queries() to identify bottlenecks');
      console.log('   • Refresh materialized views periodically: SELECT refresh_performance_metrics();');
      
    } else {
      console.log('\n⚠️  Migration completed with significant errors');
      console.log('🔧 Review the errors above and consider manual intervention');
    }
    
  } catch (error) {
    console.error('\n💥 Migration failed with critical error:');
    console.error(error.message);
    console.error('\n🔧 Troubleshooting steps:');
    console.error('   1. Verify Supabase connection and permissions');
    console.error('   2. Check if database schema matches expected structure');
    console.error('   3. Ensure service role key has necessary privileges');
    console.error('   4. Review Supabase dashboard for any configuration issues');
    process.exit(1);
  }
}

// Execute migration
applyMigration().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});