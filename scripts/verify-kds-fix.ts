#!/usr/bin/env node
/**
 * Verify KDS Fix with Service Key
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyKDSFix() {
  console.log('✅ Verifying KDS Fix...')
  
  // Test the exact query the app will use
  const { data, error } = await supabase
    .from('kds_order_routing')
    .select(`
      *,
      order:orders!inner (
        id, items, status, type, created_at, transcript,
        table:tables!table_id (label)
      ),
      station:kds_stations!station_id (id, name, type, color)
    `)
    .is('completed_at', null)
    .order('routed_at', { ascending: true })
  
  if (error) {
    console.error('❌ KDS query failed:', error)
    return false
  }
  
  console.log(`✅ Found ${data.length} active KDS orders`)
  
  if (data.length > 0) {
    console.log('\n📋 Sample order structure:')
    console.log(JSON.stringify(data[0], null, 2))
    
    console.log('\n📊 Orders by station:')
    const stationCounts = data.reduce((acc: any, item: any) => {
      const stationName = item.station?.name || 'Unknown'
      acc[stationName] = (acc[stationName] || 0) + 1
      return acc
    }, {})
    
    Object.entries(stationCounts).forEach(([station, count]) => {
      console.log(`  ${station}: ${count} orders`)
    })
  }
  
  return true
}

verifyKDSFix().then(success => {
  console.log(success ? '\n🎉 KDS is working!' : '\n❌ KDS still has issues')
  process.exit(success ? 0 : 1)
})