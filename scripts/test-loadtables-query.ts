#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testLoadTablesQuery() {
  console.log('🧪 Testing the exact loadTables() query...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    console.log('\n📋 Executing the exact query from server-client.tsx:')
    console.log(`
    SELECT id, label, status, 
           orders:orders!table_id (
             id, items, status, type, created_at,
             seat:seats!seat_id (label)
           )
    FROM tables 
    ORDER BY label ASC
    `)
    
    const { data: tablesData, error: tablesError } = await supabase
      .from('tables')
      .select(`
        id,
        label,
        status,
        orders:orders!table_id (
          id,
          items,
          status,
          type,
          created_at,
          seat:seats!seat_id (label)
        )
      `)
      .order('label', { ascending: true })

    if (tablesError) {
      console.error('❌ Query failed with error:', tablesError)
      console.error('Error code:', tablesError.code)
      console.error('Error message:', tablesError.message)
      console.error('Error details:', tablesError.details)
      console.error('Error hint:', tablesError.hint)
      
      // Check if it's an RLS error
      if (tablesError.code === 'PGRST116' || tablesError.message.includes('policy')) {
        console.log('🚫 This is an RLS policy violation!')
      }
      
      return
    }

    console.log('✅ Query succeeded!')
    console.log(`📊 Retrieved ${tablesData?.length || 0} tables`)
    
    if (tablesData && tablesData.length > 0) {
      console.log('\n📋 First table structure:')
      console.log(JSON.stringify(tablesData[0], null, 2))
      
      console.log('\n📈 Summary:')
      tablesData.forEach((table: any, index: number) => {
        console.log(`Table ${index + 1}: ${table.label} (${table.orders?.length || 0} orders)`)
      })
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err)
  }
}

// Test individual table access
async function testIndividualTableAccess() {
  console.log('\n🔍 Testing individual table access...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Test tables access
  try {
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('id, label, status')
      .limit(5)
    
    if (tablesError) {
      console.error('❌ Tables access failed:', tablesError.message)
    } else {
      console.log(`✅ Tables access OK: ${tables?.length || 0} records`)
    }
  } catch (err) {
    console.error('💥 Tables access error:', err)
  }
  
  // Test orders access
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, type, created_at, table_id')
      .limit(5)
    
    if (ordersError) {
      console.error('❌ Orders access failed:', ordersError.message)
    } else {
      console.log(`✅ Orders access OK: ${orders?.length || 0} records`)
    }
  } catch (err) {
    console.error('💥 Orders access error:', err)
  }
  
  // Test seats access
  try {
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('id, label, table_id')
      .limit(5)
    
    if (seatsError) {
      console.error('❌ Seats access failed:', seatsError.message)
    } else {
      console.log(`✅ Seats access OK: ${seats?.length || 0} records`)
    }
  } catch (err) {
    console.error('💥 Seats access error:', err)
  }
}

async function main() {
  console.log('🚀 Starting loadTables query test...')
  
  await testIndividualTableAccess()
  await testLoadTablesQuery()
}

main().catch(console.error)