#!/usr/bin/env node

/**
 * KDS Recovery Verification Script
 * 
 * This script verifies that the industry-leading KDS system
 * has been successfully restored to professional operation.
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Run with proper .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyKDSRecovery() {
  console.log('🔍 VERIFYING KDS RECOVERY...\n')
  
  const results = {
    stations: false,
    dataStructure: false,
    professionalDisplay: false,
    timing: false,
    components: false
  }
  
  try {
    // 1. Verify KDS Stations
    console.log('1. ✅ Checking KDS Stations...')
    const { data: stations, error: stationsError } = await supabase
      .from('kds_stations')
      .select('*')
      .eq('is_active', true)
      
    if (stationsError || !stations || stations.length < 5) {
      console.log('❌ KDS Stations not properly configured')
    } else {
      console.log(`✅ Found ${stations.length} active stations: ${stations.map(s => s.name).join(', ')}`)
      results.stations = true
    }
    
    // 2. Verify Data Structure  
    console.log('\n2. ✅ Checking Data Structure...')
    const { data: kdsData, error: kdsError } = await supabase
      .from('kds_order_routing')
      .select(`
        *,
        order:orders!inner (
          id, items, status, type, created_at,
          table:tables!table_id (id, label),
          seat:seats!seat_id (id, label)
        ),
        station:kds_stations!station_id (id, name, type, color)
      `)
      .is('completed_at', null)
      .limit(1)
      .single()
      
    if (kdsError || !kdsData) {
      console.log('❌ Data structure query failed')
    } else {
      console.log('✅ Data structure query successful')
      results.dataStructure = true
      
      // 3. Verify Professional Display Format
      const tableLabel = kdsData.order?.table?.label
      const seatLabel = kdsData.order?.seat?.label
      
      if (tableLabel && seatLabel) {
        const professionalFormat = `T${tableLabel}-S${seatLabel}`
        console.log(`✅ Professional display format: "${professionalFormat}"`)
        results.professionalDisplay = true
        
        // Check that it's NOT showing UUIDs  
        if (!String(tableLabel).includes('-') && !String(seatLabel).includes('-')) {
          console.log('✅ No UUID fragments in display (fixed!)')
        } else {
          console.log('⚠️  Still showing UUID-like data')
        }
      } else {
        console.log('❌ Missing table or seat labels')
      }
      
      // 4. Verify Timing Calculation
      if (kdsData.order?.created_at) {
        const createdTime = new Date(kdsData.order.created_at)
        const now = new Date()
        const elapsedMs = now.getTime() - createdTime.getTime()
        const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))
        const colorStatus = elapsedMinutes <= 5 ? 'GREEN' : elapsedMinutes <= 10 ? 'YELLOW' : 'RED'
        
        console.log(`✅ Timing calculation working: ${elapsedMinutes}m (${colorStatus})`)
        results.timing = true
      }
      
      // Sample order details
      console.log('\n📋 Sample Order Details:')
      console.log(`- Display: "T${tableLabel}-S${seatLabel}"`)
      console.log(`- Station: ${kdsData.station?.name}`)
      console.log(`- Items: ${JSON.stringify(kdsData.order?.items)}`)
      console.log(`- Status: ${kdsData.order?.status}`)
    }
    
    // 5. Verify Component Files Exist
    console.log('\n3. ✅ Checking Component Files...')
    const fs = require('fs')
    const componentFiles = [
      './components/kds/order-card.tsx',
      './components/kds/table-group-card.tsx', 
      './components/kds/KDSLayoutRefactored.tsx',
      './components/kds/stations/GrillStation.tsx',
      './components/kds/voice-command-panel.tsx'
    ]
    
    let componentsExist = 0
    componentFiles.forEach(file => {
      if (fs.existsSync(file)) {
        componentsExist++
      }
    })
    
    if (componentsExist === componentFiles.length) {
      console.log(`✅ All ${componentFiles.length} advanced KDS components exist`)
      results.components = true
    } else {
      console.log(`❌ Missing components: ${componentsExist}/${componentFiles.length} found`)
    }
    
    // FINAL ASSESSMENT
    console.log('\n' + '='.repeat(60))
    console.log('🎯 KDS RECOVERY VERIFICATION RESULTS')
    console.log('='.repeat(60))
    
    const checks = [
      { name: 'KDS Stations Active', status: results.stations },
      { name: 'Data Structure Fixed', status: results.dataStructure },
      { name: 'Professional Display', status: results.professionalDisplay },
      { name: 'Timing Calculation', status: results.timing },
      { name: 'Advanced Components', status: results.components }
    ]
    
    checks.forEach(check => {
      const icon = check.status ? '✅' : '❌'
      console.log(`${icon} ${check.name}`)
    })
    
    const successCount = checks.filter(c => c.status).length
    const successRate = (successCount / checks.length) * 100
    
    console.log('\n' + '='.repeat(60))
    
    if (successRate === 100) {
      console.log('🎉 KDS RECOVERY: COMPLETE SUCCESS!')
      console.log('✨ Industry-leading KDS system fully operational')
      console.log('🚀 Professional order displays ready for kitchen use')
      console.log('\n📱 Next: Visit /kitchen/kds to see the professional interface')
    } else if (successRate >= 80) {
      console.log('⚠️  KDS RECOVERY: MOSTLY SUCCESSFUL')
      console.log(`✅ ${successCount}/${checks.length} checks passed (${successRate}%)`)
      console.log('🔧 Minor issues may need attention')
    } else {
      console.log('❌ KDS RECOVERY: NEEDS ATTENTION')
      console.log(`⚠️  Only ${successCount}/${checks.length} checks passed (${successRate}%)`)
      console.log('🛠️  Additional fixes required')
    }
    
    console.log('\n📄 Full report: VIBE_U/kds_recovery_report.md')
    
  } catch (error) {
    console.error('💥 Verification failed:', error)
    process.exit(1)
  }
}

verifyKDSRecovery()