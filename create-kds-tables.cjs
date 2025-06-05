#!/usr/bin/env node

// Script to manually create KDS tables in production

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eiipozoogrrfudhjoqms.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function createKDSTables() {
  console.log('🔧 Creating KDS tables...\n');

  try {
    // Read the KDS migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250527000001_create_kds_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    console.log('📊 Executing KDS migration...');
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Try alternative approach - execute SQL directly
      console.log('⚡ Trying direct SQL execution...');
      const { data, error: directError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('tablename', 'kds_stations');

      if (directError) {
        throw directError;
      }

      if (data.length === 0) {
        console.log('🏗️ KDS tables do not exist, they need to be created via Supabase dashboard');
        console.log('📋 Please run the following SQL in the Supabase SQL editor:');
        console.log('🔗 https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/sql');
        console.log('\n--- SQL TO RUN ---');
        console.log(migrationSQL);
        console.log('--- END SQL ---\n');
      } else {
        console.log('✅ KDS tables already exist');
      }
    } else {
      console.log('✅ KDS migration executed successfully');
    }

    // Test if tables exist by querying them
    console.log('\n🧪 Testing KDS tables...');
    
    const { data: stations, error: stationsError } = await supabase
      .from('kds_stations')
      .select('*')
      .limit(1);

    if (stationsError) {
      console.log('❌ KDS stations table error:', stationsError.message);
      console.log('⚠️  You need to create the tables manually in Supabase dashboard');
      return false;
    } else {
      console.log(`✅ KDS stations table exists with ${stations.length} stations`);
    }

    const { data: routing, error: routingError } = await supabase
      .from('kds_order_routing')
      .select('*')
      .limit(1);

    if (routingError) {
      console.log('❌ KDS routing table error:', routingError.message);
    } else {
      console.log(`✅ KDS routing table exists with ${routing.length} entries`);
    }

    return true;

  } catch (error) {
    console.error('❌ Failed to create KDS tables:', error.message);
    return false;
  }
}

if (require.main === module) {
  createKDSTables().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = createKDSTables;