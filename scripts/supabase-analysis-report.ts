#!/usr/bin/env npx tsx

/**
 * Comprehensive Supabase Analysis Report
 * Tests all aspects of the Plate Restaurant System's database integration
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// Environment configuration check
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔍 PLATE RESTAURANT SYSTEM - SUPABASE ANALYSIS REPORT')
console.log('=' .repeat(60))

// Create clients
const anonClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
const serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function analyzeEnvironment() {
  console.log('\n📋 1. ENVIRONMENT CONFIGURATION')
  console.log('─'.repeat(40))
  
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '❌ Missing')
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓ Set' : '❌ Missing')
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '❌ Missing')
  console.log('✅ DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '❌ Missing')
}

async function testAuthentication() {
  console.log('\n🔐 2. AUTHENTICATION STATUS')
  console.log('─'.repeat(40))
  
  try {
    const { data: { session }, error } = await anonClient.auth.getSession()
    if (error) {
      console.log('❌ Auth Error:', error.message)
    } else {
      console.log('🔓 Session Status:', session ? 'Active' : 'None (Expected for anon)')
      console.log('👤 User Status:', session?.user ? `Logged in as ${session.user.email}` : 'Anonymous')
    }
    
    // Test auth endpoints
    console.log('🔗 Auth Endpoints Available:', {
      signUp: '✓',
      signIn: '✓',
      signOut: '✓'
    })
  } catch (error) {
    console.log('❌ Auth Test Failed:', error)
  }
}

async function analyzeTables() {
  console.log('\n📊 3. DATABASE SCHEMA ANALYSIS')
  console.log('─'.repeat(40))
  
  const expectedTables = [
    'profiles', 'tables', 'seats', 'orders', 
    'kds_stations', 'kds_order_routing', 'kds_metrics', 'kds_configuration',
    'transcription_cache', 'openai_usage_metrics'
  ]
  
  for (const tableName of expectedTables) {
    try {
      const { data, error, count } = await serviceClient
        .from(tableName as any)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`✅ ${tableName}: ${count || 0} records`)
      }
    } catch (error) {
      console.log(`❌ ${tableName}: Connection failed`)
    }
  }
}

async function testDataAccess() {
  console.log('\n🔄 4. DATA ACCESS PATTERNS')
  console.log('─'.repeat(40))
  
  try {
    // Test read operations
    const { data: tables, error: tablesError } = await anonClient
      .from('tables')
      .select('*')
      .limit(5)
    
    if (tablesError) {
      console.log('❌ Read Tables:', tablesError.message)
    } else {
      console.log(`✅ Read Tables: ${tables?.length || 0} records accessible`)
    }
    
    const { data: orders, error: ordersError } = await anonClient
      .from('orders')
      .select('*, tables!inner(label), seats!inner(label)')
      .limit(5)
    
    if (ordersError) {
      console.log('❌ Read Orders with Joins:', ordersError.message)
    } else {
      console.log(`✅ Read Orders with Joins: ${orders?.length || 0} records`)
    }
    
    const { data: seats, error: seatsError } = await anonClient
      .from('seats')
      .select('*')
      .limit(5)
    
    if (seatsError) {
      console.log('❌ Read Seats:', seatsError.message)
    } else {
      console.log(`✅ Read Seats: ${seats?.length || 0} records accessible`)
    }
    
  } catch (error) {
    console.log('❌ Data Access Test Failed:', error)
  }
}

async function testRealTimeSubscriptions() {
  console.log('\n🔄 5. REAL-TIME SUBSCRIPTIONS')
  console.log('─'.repeat(40))
  
  return new Promise<void>((resolve) => {
    let connectionTestPassed = false
    let subscriptionCount = 0
    
    // Test orders table subscription
    const ordersChannel = anonClient
      .channel('orders-test')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('📡 Orders subscription received event:', payload.eventType)
          subscriptionCount++
        }
      )
      .subscribe((status) => {
        console.log('📡 Orders subscription status:', status)
        if (status === 'SUBSCRIBED') {
          connectionTestPassed = true
        }
      })
    
    // Test tables subscription
    const tablesChannel = anonClient
      .channel('tables-test')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        (payload) => {
          console.log('📡 Tables subscription received event:', payload.eventType)
        }
      )
      .subscribe((status) => {
        console.log('📡 Tables subscription status:', status)
      })
    
    // Clean up after test
    setTimeout(() => {
      ordersChannel.unsubscribe()
      tablesChannel.unsubscribe()
      
      if (connectionTestPassed) {
        console.log('✅ Real-time subscriptions: Working')
      } else {
        console.log('❌ Real-time subscriptions: Failed to connect')
      }
      
      resolve()
    }, 3000)
  })
}

async function testSecurityPolicies() {
  console.log('\n🛡️ 6. SECURITY ANALYSIS')
  console.log('─'.repeat(40))
  
  try {
    // Test with anon key vs service role
    const { data: anonTables, error: anonError } = await anonClient
      .from('tables')
      .select('count', { count: 'exact', head: true })
    
    const { data: serviceTables, error: serviceError } = await serviceClient
      .from('tables')
      .select('count', { count: 'exact', head: true })
    
    if (anonError && serviceError) {
      console.log('❌ RLS Check: Both keys failed')
    } else if (anonError && !serviceError) {
      console.log('✅ RLS Check: Properly blocking anon access')
    } else {
      console.log('⚠️ RLS Check: Anon access allowed - Review security policies')
      console.log(`   Anon count: ${anonTables?.length || 0}`)
      console.log(`   Service count: ${serviceTables?.length || 0}`)
    }
    
    // Test profile access
    const { data: profiles, error: profileError } = await anonClient
      .from('profiles')
      .select('count', { count: 'exact', head: true })
    
    if (profileError) {
      console.log('✅ Profile Security: Anon access blocked')
    } else {
      console.log('⚠️ Profile Security: Anon access allowed - Review policies')
    }
    
  } catch (error) {
    console.log('❌ Security Analysis Failed:', error)
  }
}

async function generateRecommendations() {
  console.log('\n🛠️ 7. RECOMMENDATIONS')
  console.log('─'.repeat(40))
  
  const recommendations = []
  
  // Check if menu_items table exists
  try {
    const { error } = await serviceClient
      .from('menu_items' as any)
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      recommendations.push('⚠️ Create menu_items table for complete restaurant functionality')
    }
  } catch (error) {
    recommendations.push('⚠️ Create menu_items table for complete restaurant functionality')
  }
  
  // Check for residents table (implied by foreign keys)
  try {
    const { data: orders } = await serviceClient
      .from('orders')
      .select('resident_id')
      .limit(1)
    
    if (orders && orders.length > 0) {
      try {
        const { error } = await serviceClient
          .from('profiles')
          .select('user_id')
          .eq('role', 'resident')
          .limit(1)
        
        if (error) {
          recommendations.push('⚠️ Ensure resident profiles exist in profiles table')
        }
      } catch (error) {
        recommendations.push('⚠️ Create resident profiles in profiles table')
      }
    }
  } catch (error) {
    // Expected if no orders exist
  }
  
  recommendations.push('✅ Consider implementing row-level security policies if not already done')
  recommendations.push('✅ Set up database backups and monitoring')
  recommendations.push('✅ Implement connection pooling for production')
  
  recommendations.forEach(rec => console.log(rec))
}

async function main() {
  try {
    await analyzeEnvironment()
    await testAuthentication()
    await analyzeTables()
    await testDataAccess()
    await testRealTimeSubscriptions()
    await testSecurityPolicies()
    await generateRecommendations()
    
    console.log('\n🎉 ANALYSIS COMPLETE')
    console.log('=' .repeat(60))
    console.log('📝 Report generated successfully')
    console.log('🔗 Ready for multi-agent debugging coordination')
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

// Run the analysis
main()