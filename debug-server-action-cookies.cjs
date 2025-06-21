#!/usr/bin/env node

/**
 * Debug Server Action Cookie Handling
 * Tests if the server action can properly set Supabase auth cookies
 */

const { createClient } = require('@supabase/supabase-js')
const { createServerClient } = require('@supabase/ssr')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Mock Next.js cookies for testing
const mockCookieStore = {
  cookies: {},
  
  getAll() {
    return Object.entries(this.cookies).map(([name, value]) => ({ name, value }))
  },
  
  set(name, value, options = {}) {
    console.log(`🍪 Setting cookie: ${name} = ${value.substring(0, 20)}...`)
    this.cookies[name] = value
  },
  
  get(name) {
    return this.cookies[name] ? { value: this.cookies[name] } : undefined
  }
}

async function testServerClientAuth() {
  console.log('🔍 TESTING SERVER CLIENT AUTHENTICATION FLOW\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('1. Testing direct Supabase client (no SSR)...')
  
  // Test direct client
  const directClient = createClient(supabaseUrl, supabaseKey)
  
  try {
    const { data, error } = await directClient.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })
    
    if (error) {
      console.log('❌ Direct client auth failed:', error.message)
    } else {
      console.log('✅ Direct client auth successful')
      console.log('📊 Session details:', {
        access_token_length: data.session?.access_token?.length,
        refresh_token_length: data.session?.refresh_token?.length,
        expires_at: new Date(data.session?.expires_at * 1000).toISOString()
      })
    }
  } catch (error) {
    console.log('❌ Direct client error:', error.message)
  }
  
  console.log('\n2. Testing SSR server client (mimics server action)...')
  
  // Reset mock cookie store
  mockCookieStore.cookies = {}
  
  // Test SSR client (mimics what server action does)
  const serverClient = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return mockCookieStore.getAll()
        },
        setAll(cookiesToSet) {
          console.log(`🍪 setAll called with ${cookiesToSet.length} cookies`)
          cookiesToSet.forEach(({ name, value, options }) => {
            mockCookieStore.set(name, value, options)
          })
        }
      }
    }
  )
  
  try {
    const { data, error } = await serverClient.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    })
    
    if (error) {
      console.log('❌ Server client auth failed:', error.message)
    } else {
      console.log('✅ Server client auth successful')
      console.log('📊 Session details:', {
        access_token_length: data.session?.access_token?.length,
        refresh_token_length: data.session?.refresh_token?.length,
        expires_at: new Date(data.session?.expires_at * 1000).toISOString()
      })
      
      console.log('🍪 Cookies that should be set:')
      Object.keys(mockCookieStore.cookies).forEach(name => {
        console.log(`  - ${name}: ${mockCookieStore.cookies[name].substring(0, 30)}...`)
      })
    }
  } catch (error) {
    console.log('❌ Server client error:', error.message)
  }
  
  console.log('\n3. Testing session retrieval with cookies...')
  
  try {
    const { data: sessionData, error: sessionError } = await serverClient.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Session retrieval failed:', sessionError.message)
    } else if (sessionData.session) {
      console.log('✅ Session retrieved successfully from cookies')
    } else {
      console.log('❌ No session found in cookies')
    }
  } catch (error) {
    console.log('❌ Session retrieval error:', error.message)
  }
}

async function main() {
  await testServerClientAuth()
  
  console.log('\n' + '='.repeat(60))
  console.log('🎯 SERVER ACTION COOKIE DIAGNOSIS:')
  console.log('')
  console.log('If cookies are not being set properly, the issue is likely:')
  console.log('1. Server action cookie handling in middleware')
  console.log('2. Next.js SSR cookie configuration')
  console.log('3. Supabase SSR client setup')
  console.log('')
  console.log('The server action needs to properly set cookies so that')
  console.log('subsequent requests can authenticate the user.')
  console.log('='.repeat(60))
}

main().catch(console.error)