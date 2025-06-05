#!/usr/bin/env node
/**
 * Check Seat Database Structure
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSeatStructure() {
  console.log('🔍 Checking seat database structure...')
  
  // Check seats table structure
  const { data: seats, error: seatsError } = await supabase
    .from('seats')
    .select('*')
    .limit(5)
  
  if (seatsError) {
    console.error('❌ Error querying seats:', seatsError)
  } else {
    console.log('✅ Seats table sample:')
    console.log(JSON.stringify(seats, null, 2))
  }
  
  // Check orders table structure  
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, seat_id, table_id')
    .limit(3)
  
  if (ordersError) {
    console.error('❌ Error querying orders:', ordersError)
  } else {
    console.log('\n✅ Orders table sample (seat info):')
    console.log(JSON.stringify(orders, null, 2))
  }
}

checkSeatStructure().catch(console.error)