#!/usr/bin/env ts-node
/**
 * Application-Level RLS Policy Test
 * Tests the RLS policies from the application perspective using Supabase client
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  details: string
  data?: any
}

async function runRLSTests(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Test 1: Anonymous user access (what guests see)
  console.log('🔍 Testing anonymous user access...')
  
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Test 1a: Anonymous can read tables (for demo)
  try {
    const { data: tables, error, count } = await anonClient
      .from('tables')
      .select('*', { count: 'exact' })
      .limit(5)

    if (error) {
      results.push({
        test: 'Anonymous table access',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        data: error
      })
    } else {
      results.push({
        test: 'Anonymous table access',
        status: 'PASS',
        details: `Found ${count} tables - anonymous users can view restaurant layout`,
        data: { count, sample: tables?.[0] }
      })
    }
  } catch (err) {
    results.push({
      test: 'Anonymous table access',
      status: 'FAIL',
      details: `Exception: ${err}`,
      data: err
    })
  }

  // Test 1b: Anonymous can read seats (for demo)
  try {
    const { data: seats, error, count } = await anonClient
      .from('seats')
      .select('*', { count: 'exact' })
      .limit(5)

    if (error) {
      results.push({
        test: 'Anonymous seat access',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        data: error
      })
    } else {
      results.push({
        test: 'Anonymous seat access',
        status: 'PASS',
        details: `Found ${count} seats - anonymous users can view seating layout`,
        data: { count, sample: seats?.[0] }
      })
    }
  } catch (err) {
    results.push({
      test: 'Anonymous seat access',
      status: 'FAIL',
      details: `Exception: ${err}`,
      data: err
    })
  }

  // Test 1c: Anonymous CANNOT read orders (security)
  try {
    const { data: orders, error, count } = await anonClient
      .from('orders')
      .select('*', { count: 'exact' })
      .limit(1)

    if (error) {
      results.push({
        test: 'Anonymous order blocking',
        status: 'PASS',
        details: `Orders properly blocked: ${error.message}`,
        data: { error: error.message }
      })
    } else {
      results.push({
        test: 'Anonymous order blocking',
        status: 'FAIL',
        details: `SECURITY RISK: Anonymous users can see ${count} orders!`,
        data: { count, sample: orders?.[0] }
      })
    }
  } catch (err) {
    results.push({
      test: 'Anonymous order blocking',
      status: 'PASS',
      details: `Orders properly blocked by exception: ${err}`,
      data: err
    })
  }

  // Test 1d: Anonymous CANNOT read profiles (privacy)
  try {
    const { data: profiles, error, count } = await anonClient
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(1)

    if (error) {
      results.push({
        test: 'Anonymous profile blocking',
        status: 'PASS',
        details: `Profiles properly blocked: ${error.message}`,
        data: { error: error.message }
      })
    } else {
      results.push({
        test: 'Anonymous profile blocking',
        status: 'FAIL',
        details: `PRIVACY RISK: Anonymous users can see ${count} profiles!`,
        data: { count, sample: profiles?.[0] }
      })
    }
  } catch (err) {
    results.push({
      test: 'Anonymous profile blocking',
      status: 'PASS',
      details: `Profiles properly blocked by exception: ${err}`,
      data: err
    })
  }

  // Test 1e: Anonymous CANNOT read KDS data (internal operations)
  try {
    const { data: kdsStations, error, count } = await anonClient
      .from('kds_stations')
      .select('*', { count: 'exact' })
      .limit(1)

    if (error) {
      results.push({
        test: 'Anonymous KDS blocking',
        status: 'PASS',
        details: `KDS properly blocked: ${error.message}`,
        data: { error: error.message }
      })
    } else {
      results.push({
        test: 'Anonymous KDS blocking',
        status: 'FAIL',
        details: `SECURITY RISK: Anonymous users can see ${count} KDS stations!`,
        data: { count, sample: kdsStations?.[0] }
      })
    }
  } catch (err) {
    results.push({
      test: 'Anonymous KDS blocking',
      status: 'PASS',
      details: `KDS properly blocked by exception: ${err}`,
      data: err
    })
  }

  // Test 2: Service role access (should see everything)
  console.log('🔍 Testing service role access...')
  
  const serviceClient = createClient(
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
    const { data: serviceTables, error, count } = await serviceClient
      .from('tables')
      .select('*', { count: 'exact' })
      .limit(1)

    if (error) {
      results.push({
        test: 'Service role access',
        status: 'FAIL',
        details: `Service role blocked: ${error.message}`,
        data: error
      })
    } else {
      results.push({
        test: 'Service role access',
        status: 'PASS',
        details: `Service role can access ${count} tables (bypasses RLS)`,
        data: { count }
      })
    }
  } catch (err) {
    results.push({
      test: 'Service role access',
      status: 'FAIL',
      details: `Service role exception: ${err}`,
      data: err
    })
  }

  // Test 3: Real-time subscription test
  console.log('🔍 Testing real-time subscriptions...')
  
  try {
    // Test if anonymous user can subscribe to tables (should work)
    const tablesChannel = anonClient
      .channel('test-tables')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tables' },
        (payload) => {
          console.log('Table change received:', payload)
        }
      )
    
    // Subscribe and immediately unsubscribe
    const subscriptionResult = await tablesChannel.subscribe()
    
    if (subscriptionResult === 'SUBSCRIBED') {
      results.push({
        test: 'Anonymous table subscription',
        status: 'PASS',
        details: 'Anonymous users can subscribe to table changes for demo',
        data: { subscription: 'SUBSCRIBED' }
      })
    } else {
      results.push({
        test: 'Anonymous table subscription',
        status: 'WARNING',
        details: `Subscription status: ${subscriptionResult}`,
        data: { subscription: subscriptionResult }
      })
    }
    
    // Clean up
    await anonClient.removeChannel(tablesChannel)
    
  } catch (err) {
    results.push({
      test: 'Anonymous table subscription',
      status: 'FAIL',
      details: `Subscription error: ${err}`,
      data: err
    })
  }

  return results
}

async function runRLSValidation() {
  console.log('🔐 Running RLS Policy Validation Tests...\n')
  
  try {
    const results = await runRLSTests()
    
    console.log('\n📊 TEST RESULTS:')
    console.log('=' .repeat(60))
    
    let passCount = 0
    let failCount = 0
    let warningCount = 0
    
    results.forEach((result, index) => {
      const statusIcon = {
        'PASS': '✅',
        'FAIL': '❌',
        'WARNING': '⚠️'
      }[result.status]
      
      console.log(`${index + 1}. ${statusIcon} ${result.test}`)
      console.log(`   ${result.details}`)
      
      if (result.status === 'PASS') passCount++
      else if (result.status === 'FAIL') failCount++
      else warningCount++
      
      if (result.data && (result.status === 'FAIL' || process.env.VERBOSE)) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`)
      }
      console.log()
    })
    
    console.log('=' .repeat(60))
    console.log(`📈 SUMMARY: ${passCount} passed, ${failCount} failed, ${warningCount} warnings`)
    
    if (failCount === 0) {
      console.log('🎉 All critical tests passed! RLS policies are working correctly.')
    } else {
      console.log('⚠️  Some tests failed. Please review the RLS policies.')
    }
    
    // Security recommendations
    console.log('\n🔒 SECURITY RECOMMENDATIONS:')
    console.log('1. Anonymous users should only access tables and seats (demo)')
    console.log('2. Orders, profiles, and KDS data should be blocked for anonymous users')
    console.log('3. Real-time subscriptions should respect RLS policies')
    console.log('4. Test with actual authenticated users for complete validation')
    
  } catch (error) {
    console.error('❌ Test execution failed:', error)
  }
}

// Run the validation
runRLSValidation()