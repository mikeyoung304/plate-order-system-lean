#!/usr/bin/env tsx

/**
 * Simple verification script to test monitoring setup
 */

async function testEndpoint(url: string, name: string): Promise<boolean> {
  try {
    console.log(`Testing ${name}...`)
    const response = await fetch(url, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
    
    if (response.ok) {
      console.log(`✅ ${name}: OK (${response.status})`)
      return true
    } else {
      console.log(`⚠️ ${name}: ${response.status} ${response.statusText}`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${name}: Failed - ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000'
  console.log(`🔍 Verifying monitoring setup for: ${baseUrl}`)
  console.log('━'.repeat(50))
  
  const tests = [
    { url: `${baseUrl}/`, name: 'Main Application' },
    { url: `${baseUrl}/api/health`, name: 'Health Check API' },
    { url: `${baseUrl}/api/metrics`, name: 'Metrics API' },
    { url: `${baseUrl}/api/openai/usage`, name: 'OpenAI Usage API' },
    { url: `${baseUrl}/api/metrics?format=prometheus`, name: 'Prometheus Metrics' }
  ]
  
  let passed = 0
  let total = tests.length
  
  for (const test of tests) {
    const success = await testEndpoint(test.url, test.name)
    if (success) passed++
    await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
  }
  
  console.log('━'.repeat(50))
  console.log(`📊 Results: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All monitoring endpoints are working!')
    process.exit(0)
  } else {
    console.log('⚠️ Some monitoring endpoints have issues')
    process.exit(1)
  }
}

main().catch(console.error)