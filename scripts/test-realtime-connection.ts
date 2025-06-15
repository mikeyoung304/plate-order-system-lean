#!/usr/bin/env node
/**
 * Test script to validate real-time connection restoration
 * Tests Luis's backend patterns are working correctly
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function testRealtimeConnection() {
  console.log('🔍 Testing Real-time Connection Restoration...\n')

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Test 1: Basic Database Connectivity
  console.log('1️⃣ Testing Database Connectivity...')
  try {
    const { error } = await supabase.from('orders').select('count').limit(1)
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      process.exit(1)
    }
    console.log('✅ Database connection successful\n')
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }

  // Test 2: Real-time Subscription
  console.log('2️⃣ Testing Real-time Subscription...')
  let subscriptionSuccess = false
  
  const channel = supabase
    .channel('test-orders-realtime')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('📨 Real-time event received:', payload.eventType)
      }
    )
    .subscribe((status) => {
      console.log('📡 Subscription status:', status)
      if (status === 'SUBSCRIBED') {
        subscriptionSuccess = true
        console.log('✅ Real-time subscription active\n')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Real-time subscription error')
      }
    })

  // Wait for subscription
  await new Promise(resolve => setTimeout(resolve, 3000))

  if (!subscriptionSuccess) {
    console.error('❌ Real-time subscription failed to establish')
    channel.unsubscribe()
    process.exit(1)
  }

  // Test 3: Create Test Order (validates our changes)
  console.log('3️⃣ Testing Order Creation (without mocks)...')
  try {
    // First get a valid table and seat
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('id')
      .limit(1)

    if (tableError || !tables || tables.length === 0) {
      console.error('❌ Could not fetch table:', tableError?.message || 'No tables found')
      channel.unsubscribe()
      process.exit(1)
    }
    
    const table = tables[0]

    const { data: seats, error: seatError } = await supabase
      .from('seats')
      .select('id')
      .eq('table_id', table.id)
      .limit(1)
      .single()

    if (seatError || !seats) {
      console.error('❌ Could not fetch seat:', seatError?.message)
      channel.unsubscribe()
      process.exit(1)
    }

    // Create test order
    const testOrder = {
      table_id: table.id,
      seat_id: seats.id,
      resident_id: 'test-resident-' + Date.now(),
      server_id: 'test-server-' + Date.now(),
      items: ['Test Item'],
      transcript: 'Test order from validation script',
      type: 'food' as const,
      status: 'new'
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single()

    if (orderError) {
      console.error('❌ Order creation failed:', orderError.message)
      channel.unsubscribe()
      process.exit(1)
    }

    console.log('✅ Order created successfully:', order.id)

    // Clean up test order
    await supabase.from('orders').delete().eq('id', order.id)
    console.log('🧹 Test order cleaned up\n')

  } catch (err) {
    console.error('❌ Unexpected error during order test:', err)
    channel.unsubscribe()
    process.exit(1)
  }

  // Cleanup
  channel.unsubscribe()
  console.log('✅ All tests passed! Real-time backend is working correctly.')
  console.log('📝 Luis\'s patterns have been successfully restored.')
  process.exit(0)
}

// Run the test
testRealtimeConnection()