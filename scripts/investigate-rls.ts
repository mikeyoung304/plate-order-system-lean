#!/usr/bin/env node
/**
 * Investigate RLS Policies using Supabase Service Role
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function investigateRLS() {
  console.log('🔍 Investigating RLS Policies...\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // Query RLS policies using SQL
    console.log('📋 Checking RLS policies on tables, seats, orders...')
    
    const { data: policies, error } = await supabase
      .rpc('sql_query', {
        query: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename IN ('tables', 'seats', 'orders')
          ORDER BY tablename, policyname;
        `
      })

    if (error) {
      console.log('⚠️ Direct RLS query failed, trying alternative method...')
      
      // Check if RLS is enabled on tables
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('sql_query', {
          query: `
            SELECT 
              schemaname,
              tablename,
              rowsecurity
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN ('tables', 'seats', 'orders');
          `
        })

      if (rlsError) {
        console.log('📊 Checking table structure instead...')
        
        // Just check what tables exist and their basic info
        const { data: tables } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .in('table_name', ['tables', 'seats', 'orders'])

        console.log('Tables found:', tables)
        
        // Check actual data access
        console.log('\n🔐 Testing data access with different roles...')
        
        const { data: serviceData, count: serviceCount } = await supabase
          .from('tables')
          .select('*', { count: 'exact' })
          .limit(1)
        
        console.log(`Service role sees ${serviceCount} tables`)
        
        // Test with anon key
        const anonSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: anonData, count: anonCount, error: anonError } = await anonSupabase
          .from('tables')
          .select('*', { count: 'exact' })
          .limit(1)
        
        console.log(`Anonymous role sees ${anonCount} tables`)
        if (anonError) {
          console.log('Anonymous error:', anonError.code, anonError.message)
        }
        
      } else {
        console.log('RLS Status:', rlsStatus)
      }
      
    } else {
      console.log('RLS Policies:', policies)
    }

  } catch (err) {
    console.error('❌ Investigation failed:', err)
  }
}

investigateRLS()