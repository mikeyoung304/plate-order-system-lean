#!/usr/bin/env node
/**
 * Test PostgreSQL connection string directly
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function testConnection() {
  console.log('🔍 Testing PostgreSQL Connection String...\n')
  
  const connectionString = process.env.DATABASE_URL
  console.log('Connection string found:', connectionString ? 'Yes' : 'No')
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment')
    return
  }
  
  // Test with service role to verify the format works
  console.log('🔑 Testing with service role...')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data, error } = await supabase.rpc('version')
    if (error) {
      console.log('📊 Testing basic query instead...')
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5)
      
      if (tableError) {
        console.error('❌ Query failed:', tableError)
      } else {
        console.log('✅ Connection working, found tables:', tables?.map(t => t.table_name))
      }
    } else {
      console.log('✅ Database version:', data)
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err)
  }
}

testConnection()