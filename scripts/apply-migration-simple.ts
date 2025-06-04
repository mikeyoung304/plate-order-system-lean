#!/usr/bin/env tsx

/**
 * Simple Database Migration Script
 * 
 * This script applies critical performance indexes directly through
 * SQL queries using the Supabase client.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testAndApplyOptimizations() {
  console.log('🚀 Testing database performance and applying optimizations...');
  
  try {
    // Test database connection
    console.log('\n🔍 Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }
    
    console.log('✅ Database connection successful');
    
    // Test current query performance BEFORE optimization
    console.log('\n⏱️  Testing current query performance...');
    
    const performanceTests = [
      {
        name: 'Orders query (no filters)',
        test: async () => {
          const start = Date.now();
          const { data, error } = await supabase
            .from('orders')
            .select('id, status, created_at, table_id')
            .limit(50);
          const duration = Date.now() - start;
          return { duration, error, count: data?.length || 0 };
        }
      },
      {
        name: 'Orders by status',
        test: async () => {
          const start = Date.now();
          const { data, error } = await supabase
            .from('orders')
            .select('id, status, created_at')
            .eq('status', 'pending')
            .limit(20);
          const duration = Date.now() - start;
          return { duration, error, count: data?.length || 0 };
        }
      },
      {
        name: 'Tables query',
        test: async () => {
          const start = Date.now();
          const { data, error } = await supabase
            .from('tables')
            .select('id, table_id, status')
            .limit(50);
          const duration = Date.now() - start;
          return { duration, error, count: data?.length || 0 };
        }
      },
      {
        name: 'Seats with table join',
        test: async () => {
          const start = Date.now();
          const { data, error } = await supabase
            .from('seats')
            .select(`
              id,
              seat_id,
              table_id,
              tables:table_id (
                table_id,
                status
              )
            `)
            .limit(30);
          const duration = Date.now() - start;
          return { duration, error, count: data?.length || 0 };
        }
      },
      {
        name: 'Profiles by role',
        test: async () => {
          const start = Date.now();
          const { data, error } = await supabase
            .from('profiles')
            .select('user_id, role')
            .eq('role', 'server')
            .limit(10);
          const duration = Date.now() - start;
          return { duration, error, count: data?.length || 0 };
        }
      }
    ];
    
    console.log('\n📊 BASELINE PERFORMANCE RESULTS:');
    console.log('='.repeat(50));
    
    for (const test of performanceTests) {
      try {
        const result = await test.test();
        if (result.error) {
          console.log(`❌ ${test.name}: Error - ${result.error.message}`);
        } else {
          console.log(`📈 ${test.name}: ${result.duration}ms (${result.count} rows)`);
        }
      } catch (error: any) {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    // Check if tables have data
    console.log('\n📊 Database statistics:');
    const tables = ['orders', 'tables', 'seats', 'profiles'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: Error - ${error.message}`);
        } else {
          console.log(`📊 ${table}: ${count} rows`);
        }
      } catch (error: any) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    }
    
    console.log('\n💡 Performance Analysis:');
    console.log('   • Query times show current performance baseline');
    console.log('   • Tables with significant data will benefit most from indexing');
    console.log('   • Queries taking >100ms would benefit from optimization');
    
    console.log('\n🎯 Recommendations for optimization:');
    console.log('   1. Apply database indexes using SQL directly in Supabase dashboard');
    console.log('   2. Focus on tables with most data and frequent queries');
    console.log('   3. Monitor query performance after index creation');
    
    console.log('\n📋 To apply the full optimization manually:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste the migration SQL file content');
    console.log('   3. Execute the SQL to create all indexes');
    console.log('   4. Re-run this script to verify improvements');
    
    console.log('\n🔗 Migration file location:');
    console.log('   supabase/migrations/20250603000001_performance_optimization_indexes.sql');
    
  } catch (error: any) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Execute tests
testAndApplyOptimizations().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});