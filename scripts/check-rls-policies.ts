#!/usr/bin/env node
/**
 * Check RLS Policies using Supabase Service Role
 * This bypasses the need for direct PostgreSQL connection
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS Policies using Service Role...\n')

  // Create Supabase client with service role (bypasses RLS)
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
    // Check what's actually in the tables using service role
    console.log('📊 Checking table data with service role...')
    
    const { data: tables, error: tableError, count: tableCount } = await supabase
      .from('tables')
      .select('*', { count: 'exact' })
    
    console.log(`Tables found: ${tableCount}`)
    if (tableError) {
      console.error('Table error:', tableError)
    } else {
      console.log('Sample table:', tables?.[0])
    }

    const { data: seats, error: seatError, count: seatCount } = await supabase
      .from('seats')
      .select('*', { count: 'exact' })
      .limit(1)
    
    console.log(`Seats found: ${seatCount}`)
    if (seatError) {
      console.error('Seat error:', seatError)
    }

    const { data: orders, error: orderError, count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .limit(1)
    
    console.log(`Orders found: ${orderCount}`)
    if (orderError) {
      console.error('Order error:', orderError)
    }

    console.log('\n📋 Now checking with anon key (what our app sees)...')
    
    // Create client with anon key to see what regular users see
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: anonTables, error: anonTableError, count: anonTableCount } = await anonSupabase
      .from('tables')
      .select('*', { count: 'exact' })
    
    console.log(`Anon tables found: ${anonTableCount}`)
    if (anonTableError) {
      console.error('Anon table error:', anonTableError)
    }

    // Compare results
    console.log('\n🔐 RLS Analysis:')
    console.log(`Service role sees ${tableCount} tables`)
    console.log(`Anon key sees ${anonTableCount} tables`)
    
    if (tableCount > 0 && anonTableCount === 0) {
      console.log('🚨 RLS is blocking anonymous access to tables')
      console.log('🔧 This explains why our real-time test failed')
    } else if (tableCount === anonTableCount) {
      console.log('✅ RLS allows anonymous access to tables')
    }

  } catch (error) {
    console.error('❌ Error checking policies:', error)
  }
}

// Run the check
checkRLSPolicies()