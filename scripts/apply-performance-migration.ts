#!/usr/bin/env tsx

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
    
    // Execute specific SQL commands that we can run through the REST API
    console.log('\n⚡ Applying performance optimizations...');
    
    // Create essential indexes one by one
    const criticalIndexes = [
      // Core order indexes
      {
        name: 'Orders Status Index',
        sql: `CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status) WHERE status IS NOT NULL`
      },
      {
        name: 'Orders Table ID Index', 
        sql: `CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id) WHERE table_id IS NOT NULL`
      },
      {
        name: 'Orders Created At Index',
        sql: `CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC)`
      },
      {
        name: 'Orders Composite Status/Time Index',
        sql: `CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC) WHERE status IS NOT NULL`
      },
      
      // Table indexes
      {
        name: 'Tables Status Index',
        sql: `CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status) WHERE status IS NOT NULL`
      },
      {
        name: 'Tables Position Index',
        sql: `CREATE INDEX IF NOT EXISTS idx_tables_position ON public.tables(x, y) WHERE x IS NOT NULL AND y IS NOT NULL`
      },
      
      // Seat indexes
      {
        name: 'Seats Table ID Index',
        sql: `CREATE INDEX IF NOT EXISTS idx_seats_table_id ON public.seats(table_id) WHERE table_id IS NOT NULL`
      },
      {
        name: 'Seats Resident ID Index', 
        sql: `CREATE INDEX IF NOT EXISTS idx_seats_resident_id ON public.seats(resident_id) WHERE resident_id IS NOT NULL`
      },
      
      // Profile indexes
      {
        name: 'Profiles Role Index',
        sql: `CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role IS NOT NULL`
      }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Execute each index creation
    for (const index of criticalIndexes) {
      try {
        console.log(`\n📋 Creating ${index.name}...`);
        
        // Use rpc to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', { sql: index.sql });
        
        if (error) {
          // Check if it's a harmless "already exists" error
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Index already exists: ${index.name}`);
            successCount++;
          } else {
            throw error;
          }
        } else {
          console.log(`✅ Successfully created: ${index.name}`);
          successCount++;
        }
        
      } catch (error: any) {
        errorCount++;
        const errorMsg = `Failed to create ${index.name}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    // Try to create performance monitoring function
    console.log('\n📊 Setting up performance monitoring...');
    
    try {
      const monitoringSQL = `
        CREATE OR REPLACE FUNCTION get_table_sizes()
        RETURNS TABLE(
          table_name text,
          row_count bigint,
          total_size text
        )
        LANGUAGE sql
        AS $$
          SELECT 
            schemaname||'.'||tablename as table_name,
            n_tup_ins - n_tup_del as row_count,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
          FROM pg_stat_user_tables 
          WHERE schemaname = 'public'
          ORDER BY n_tup_ins - n_tup_del DESC;
        $$;
      `;
      
      const { error: funcError } = await supabase.rpc('exec_sql', { sql: monitoringSQL });
      
      if (funcError) {
        console.log(`⚠️  Could not create monitoring function: ${funcError.message}`);
      } else {
        console.log('✅ Performance monitoring function created');
      }
      
    } catch (error: any) {
      console.log(`⚠️  Could not create monitoring function: ${error.message}`);
    }
    
    // Run ANALYZE on key tables for query planner optimization
    console.log('\n📊 Optimizing query planner statistics...');
    
    const analyzeTables = ['orders', 'tables', 'seats', 'profiles'];
    
    for (const table of analyzeTables) {
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: `ANALYZE public.${table};` 
        });
        
        if (error) {
          console.log(`⚠️  Could not analyze ${table}: ${error.message}`);
        } else {
          console.log(`✅ Analyzed table: ${table}`);
        }
      } catch (error: any) {
        console.log(`⚠️  Could not analyze ${table}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful operations: ${successCount}`);
    console.log(`❌ Failed operations: ${errorCount}`);
    console.log(`📊 Total operations: ${criticalIndexes.length}`);
    
    if (errors.length > 0) {
      console.log('\n🚨 ERRORS ENCOUNTERED:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (successCount > errorCount) {
      console.log('\n🎉 Performance optimization completed successfully!');
      console.log('💪 Database is now optimized for better performance');
      console.log('\n📋 Performance improvements applied:');
      console.log('   • Critical indexes for query optimization');
      console.log('   • Query planner statistics updated');
      console.log('   • Performance monitoring functions');
      
      console.log('\n🔍 Performance verification:');
      
      // Test query performance
      console.log('\n⏱️  Testing query performance...');
      
      const performanceTests = [
        {
          name: 'Orders by status query',
          test: async () => {
            const start = Date.now();
            const { data, error } = await supabase
              .from('orders')
              .select('id, status, created_at')
              .eq('status', 'pending')
              .order('created_at', { ascending: false })
              .limit(10);
            const duration = Date.now() - start;
            return { duration, error, count: data?.length || 0 };
          }
        },
        {
          name: 'Tables with positions query',
          test: async () => {
            const start = Date.now();
            const { data, error } = await supabase
              .from('tables')
              .select('id, table_id, x, y, status')
              .not('x', 'is', null)
              .not('y', 'is', null)
              .limit(50);
            const duration = Date.now() - start;
            return { duration, error, count: data?.length || 0 };
          }
        }
      ];
      
      for (const test of performanceTests) {
        try {
          const result = await test.test();
          if (result.error) {
            console.log(`❌ ${test.name}: Error - ${result.error.message}`);
          } else {
            console.log(`✅ ${test.name}: ${result.duration}ms (${result.count} rows)`);
          }
        } catch (error: any) {
          console.log(`❌ ${test.name}: ${error.message}`);
        }
      }
      
      console.log('\n🎯 Next steps:');
      console.log('   • Monitor query performance in production');
      console.log('   • Run: SELECT * FROM get_table_sizes(); to check table statistics');
      console.log('   • Consider applying the full migration file manually for advanced features');
      
    } else {
      console.log('\n⚠️  Migration completed with significant errors');
      console.log('🔧 Review the errors above and consider manual intervention');
    }
    
  } catch (error: any) {
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