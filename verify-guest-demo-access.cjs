#!/usr/bin/env node

/**
 * Guest Demo Access Verification
 * Comprehensive test suite to ensure guest user has seamless access for investor demos
 * Tests: Authentication, RLS policies, query performance, WebSocket connectivity
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const guestEmail = 'guest@restaurant.plate'
const guestPassword = 'guest12345'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🔍 Starting Guest Demo Access Verification...')
console.log(`   Target: Seamless access for ${guestEmail}`)
console.log(`   Goal: <50ms query performance, reliable WebSocket connection`)

let testResults = {
  authentication: false,
  adminRole: false,
  tableAccess: false,
  orderAccess: false,
  kdsAccess: false,
  queryPerformance: false,
  websocketConnection: false,
  overallScore: 0
}

async function verifyGuestAccess() {
  // Initialize service role client for admin operations
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Initialize guest client for testing
  const guestClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: {
      persistSession: false
    }
  })

  try {
    // Test 1: Guest Authentication
    console.log('\\n🔐 Test 1: Guest Authentication')
    try {
      const { data: authData, error: authError } = await guestClient.auth.signInWithPassword({
        email: guestEmail,
        password: guestPassword
      })

      if (authError) {
        console.log('   ❌ Authentication failed:', authError.message)
        console.log('   💡 Guest user may need to be created with correct credentials')
      } else if (authData.user) {
        console.log('   ✅ Authentication successful')
        console.log('   📧 User ID:', authData.user.id)
        console.log('   👤 Email:', authData.user.email)
        testResults.authentication = true
      }
    } catch (error) {
      console.log('   ❌ Authentication error:', error.message)
    }

    // Test 2: Admin Role Verification
    console.log('\\n👑 Test 2: Admin Role Verification')
    try {
      const { data: profile, error: profileError } = await guestClient
        .from('profiles')
        .select('role, name, email')
        .single()

      if (profileError) {
        console.log('   ❌ Profile access failed:', profileError.message)
        console.log('   💡 Check RLS policies for profiles table')
      } else if (profile) {
        console.log('   ✅ Profile access successful')
        console.log('   🎭 Role:', profile.role)
        console.log('   📝 Name:', profile.name)
        
        if (profile.role === 'admin') {
          console.log('   👑 ADMIN ROLE CONFIRMED')
          testResults.adminRole = true
        } else {
          console.log('   ⚠️  Role is not admin - demos may have limited access')
        }
      }
    } catch (error) {
      console.log('   ❌ Profile verification error:', error.message)
    }

    // Test 3: Table Access Performance
    console.log('\\n🍽️  Test 3: Table Access Performance')
    try {
      const startTime = Date.now()
      
      const { data: tables, error: tableError } = await guestClient
        .from('tables')
        .select('id, label, status, capacity')
        .limit(20)

      const queryTime = Date.now() - startTime

      if (tableError) {
        console.log('   ❌ Table access failed:', tableError.message)
        console.log('   💡 Check RLS policies for tables')
      } else {
        console.log('   ✅ Table access successful')
        console.log(`   ⏱️  Query time: ${queryTime}ms`)
        console.log(`   📊 Tables found: ${tables?.length || 0}`)
        
        if (queryTime < 50) {
          console.log('   🚀 EXCELLENT performance (<50ms)')
          testResults.tableAccess = true
        } else if (queryTime < 100) {
          console.log('   ✅ Good performance, but could be faster')
          testResults.tableAccess = true
        } else {
          console.log('   ⚠️  Slow performance - may impact demo experience')
        }
      }
    } catch (error) {
      console.log('   ❌ Table access error:', error.message)
    }

    // Test 4: Order Access and Performance
    console.log('\\n📋 Test 4: Order Access and Performance')
    try {
      const startTime = Date.now()
      
      const { data: orders, error: orderError } = await guestClient
        .from('orders')
        .select(`
          id, items, status, type, created_at,
          table:tables!table_id (id, label),
          seat:seats!seat_id (id, label)
        `)
        .limit(20)

      const queryTime = Date.now() - startTime

      if (orderError) {
        console.log('   ❌ Order access failed:', orderError.message)
        console.log('   💡 Check RLS policies for orders')
      } else {
        console.log('   ✅ Order access successful')
        console.log(`   ⏱️  Query time: ${queryTime}ms`)
        console.log(`   📊 Orders found: ${orders?.length || 0}`)
        
        if (queryTime < 50) {
          console.log('   🚀 EXCELLENT performance (<50ms)')
          testResults.orderAccess = true
        } else if (queryTime < 100) {
          console.log('   ✅ Good performance, but could be faster')
          testResults.orderAccess = true
        } else {
          console.log('   ⚠️  Slow performance - may impact demo experience')
        }
      }
    } catch (error) {
      console.log('   ❌ Order access error:', error.message)
    }

    // Test 5: KDS Critical Query Performance
    console.log('\\n🔥 Test 5: KDS Critical Query Performance (THE BIG TEST)')
    try {
      const startTime = Date.now()
      
      const { data: kdsData, error: kdsError } = await guestClient
        .from('kds_order_routing')
        .select(`
          id,
          order_id,
          station_id,
          routed_at,
          started_at,
          completed_at,
          priority,
          recall_count,
          notes,
          order:orders!inner (
            id, items, status, type, created_at, seat_id,
            table:tables!table_id (id, label),
            seat:seats!seat_id (id, label)
          ),
          station:kds_stations!station_id (id, name, type, color)
        `)
        .is('completed_at', null)
        .order('priority', { ascending: false })
        .order('routed_at', { ascending: true })
        .limit(50)

      const queryTime = Date.now() - startTime

      if (kdsError) {
        console.log('   ❌ KDS access failed:', kdsError.message)
        console.log('   💡 This is CRITICAL - KDS is the core of the demo')
        console.log('   🔧 Check RLS policies for kds_order_routing, kds_stations')
      } else {
        console.log('   ✅ KDS access successful')
        console.log(`   ⏱️  Query time: ${queryTime}ms`)
        console.log(`   📊 Active orders: ${kdsData?.length || 0}`)
        
        if (queryTime < 50) {
          console.log('   🎉 🚀 PERFECT! Demo-ready performance (<50ms)')
          testResults.kdsAccess = true
          testResults.queryPerformance = true
        } else if (queryTime < 100) {
          console.log('   ✅ Good performance, acceptable for demos')
          testResults.kdsAccess = true
        } else {
          console.log('   🚨 CRITICAL: Performance too slow for investor demos')
          console.log('   💡 Run optimize-guest-rls.sql to improve performance')
        }
      }
    } catch (error) {
      console.log('   ❌ KDS access error:', error.message)
    }

    // Test 6: WebSocket Connection Test
    console.log('\\n🔌 Test 6: WebSocket Connection Test')
    try {
      let websocketConnected = false
      
      const connectionPromise = new Promise((resolve) => {
        const channel = guestClient
          .channel('test-connection')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'kds_order_routing'
          }, () => {
            // Received event
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              websocketConnected = true
              console.log('   ✅ WebSocket connection successful')
              testResults.websocketConnection = true
              guestClient.removeChannel(channel)
              resolve(true)
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.log('   ❌ WebSocket connection failed:', status)
              resolve(false)
            }
          })

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!websocketConnected) {
            console.log('   ⚠️  WebSocket connection timeout')
            guestClient.removeChannel(channel)
            resolve(false)
          }
        }, 10000)
      })

      await connectionPromise
    } catch (error) {
      console.log('   ❌ WebSocket test error:', error.message)
    }

    // Calculate overall score
    const tests = Object.keys(testResults).filter(key => key !== 'overallScore')
    const passedTests = tests.filter(key => testResults[key]).length
    testResults.overallScore = Math.round((passedTests / tests.length) * 100)

    // Final Report
    console.log('\\n📊 FINAL VERIFICATION REPORT')
    console.log('=' .repeat(50))
    console.log(`🎯 Overall Score: ${testResults.overallScore}%`)
    console.log('\\n📋 Test Results:')
    console.log(`   Authentication: ${testResults.authentication ? '✅' : '❌'}`)
    console.log(`   Admin Role: ${testResults.adminRole ? '✅' : '❌'}`)
    console.log(`   Table Access: ${testResults.tableAccess ? '✅' : '❌'}`)
    console.log(`   Order Access: ${testResults.orderAccess ? '✅' : '❌'}`)
    console.log(`   KDS Access: ${testResults.kdsAccess ? '✅' : '❌'}`)
    console.log(`   Query Performance: ${testResults.queryPerformance ? '✅' : '❌'}`)
    console.log(`   WebSocket Connection: ${testResults.websocketConnection ? '✅' : '❌'}`)

    console.log('\\n💡 Recommendations:')
    
    if (testResults.overallScore >= 85) {
      console.log('   🎉 DEMO READY! Guest access is working excellently')
      console.log('   ✅ Safe to proceed with investor demonstrations')
    } else if (testResults.overallScore >= 70) {
      console.log('   ⚠️  Demo mostly ready, but some issues need attention')
      console.log('   🔧 Fix failing tests before critical demos')
    } else {
      console.log('   🚨 DEMO NOT READY - Critical issues must be resolved')
      console.log('   ❌ Do not proceed with investor demos until fixed')
    }

    if (!testResults.authentication) {
      console.log('   🔧 Create guest user: supabase auth admin create-user')
    }
    
    if (!testResults.adminRole) {
      console.log('   🔧 Set admin role: UPDATE profiles SET role = \'admin\' WHERE email = \'guest@restaurant.plate\'')
    }
    
    if (!testResults.queryPerformance) {
      console.log('   🔧 Run optimize-guest-rls.sql for better performance')
    }
    
    if (!testResults.websocketConnection) {
      console.log('   🔧 Check real-time subscriptions and network configuration')
    }

    console.log('\\n🚀 Demo Checklist:')
    console.log('   □ Guest login works (guest@restaurant.plate / guest12345)')
    console.log('   □ KDS displays orders within 50ms')
    console.log('   □ Real-time updates work smoothly')
    console.log('   □ No console errors or warnings')
    console.log('   □ Professional demo environment ready')

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  } finally {
    // Clean up connections
    try {
      await guestClient.auth.signOut()
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Run the verification
verifyGuestAccess().catch(console.error)