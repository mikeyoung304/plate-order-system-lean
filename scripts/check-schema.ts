#!/usr/bin/env tsx

/**
 * Database Schema Checker
 * 
 * This script checks the current database schema to understand
 * the table structure before applying optimizations.
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

async function checkSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    // Check tables structure
    console.log('\n📊 Tables structure:');
    const { data: tablesData, error: tablesError } = await supabase
      .from('tables')
      .select('*')
      .limit(2);
    
    if (tablesError) {
      console.log(`❌ Tables error: ${tablesError.message}`);
    } else if (tablesData && tablesData.length > 0) {
      console.log('✅ Tables columns:', Object.keys(tablesData[0]));
      console.log('📄 Sample data:', tablesData[0]);
    }
    
    // Check seats structure
    console.log('\n🪑 Seats structure:');
    const { data: seatsData, error: seatsError } = await supabase
      .from('seats')
      .select('*')
      .limit(2);
    
    if (seatsError) {
      console.log(`❌ Seats error: ${seatsError.message}`);
    } else if (seatsData && seatsData.length > 0) {
      console.log('✅ Seats columns:', Object.keys(seatsData[0]));
      console.log('📄 Sample data:', seatsData[0]);
    }
    
    // Check orders structure
    console.log('\n🍽️ Orders structure:');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(2);
    
    if (ordersError) {
      console.log(`❌ Orders error: ${ordersError.message}`);
    } else if (ordersData && ordersData.length > 0) {
      console.log('✅ Orders columns:', Object.keys(ordersData[0]));
      console.log('📄 Sample data:', ordersData[0]);
    }
    
    // Check profiles structure
    console.log('\n👤 Profiles structure:');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(2);
    
    if (profilesError) {
      console.log(`❌ Profiles error: ${profilesError.message}`);
    } else if (profilesData && profilesData.length > 0) {
      console.log('✅ Profiles columns:', Object.keys(profilesData[0]));
      console.log('📄 Sample data:', profilesData[0]);
    }
    
    // Check KDS routing table if it exists
    console.log('\n🍳 KDS Routing structure:');
    const { data: kdsData, error: kdsError } = await supabase
      .from('kds_order_routing')
      .select('*')
      .limit(2);
    
    if (kdsError) {
      console.log(`❌ KDS Routing error: ${kdsError.message}`);
    } else if (kdsData && kdsData.length > 0) {
      console.log('✅ KDS Routing columns:', Object.keys(kdsData[0]));
      console.log('📄 Sample data:', kdsData[0]);
    } else {
      console.log('ℹ️  KDS Routing table appears to be empty or doesn\'t exist');
    }
    
  } catch (error: any) {
    console.error('\n💥 Schema check failed:', error.message);
    process.exit(1);
  }
}

// Execute schema check
checkSchema().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});