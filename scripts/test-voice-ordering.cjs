#!/usr/bin/env node

/**
 * Voice Ordering System Test Suite Runner
 * Comprehensive testing script for cost efficiency and performance validation
 */

const { spawn } = require('child_process')
const fs = require('fs').promises
const path = require('path')

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Test configuration
const TEST_CONFIG = {
  timeout: 300000, // 5 minutes per test suite
  maxRetries: 2,
  parallel: true,
  coverage: true,
  reporter: 'detailed'
}

// Test suites with their priorities and expected outcomes
const TEST_SUITES = [
  {
    name: 'Transcription Cache',
    path: '__tests__/unit/lib/voice-ordering/transcription-cache.test.ts',
    priority: 'high',
    expectedCacheHitRate: 0.85,
    expectedCostSavings: 0.65,
    description: 'Validates caching functionality and >85% hit rate'
  },
  {
    name: 'Usage Tracking',
    path: '__tests__/unit/lib/voice-ordering/usage-tracking.test.ts',
    priority: 'high',
    expectedCostPerRequest: 0.02,
    expectedBudgetCompliance: true,
    description: 'Verifies cost tracking under $0.02/request with budget controls'
  },
  {
    name: 'Audio Optimization',
    path: '__tests__/unit/lib/voice-ordering/audio-optimization.test.ts',
    priority: 'high',
    expectedCompressionRatio: 2.0,
    expectedProcessingTime: 5000,
    description: 'Tests audio compression and preprocessing optimization'
  },
  {
    name: 'Batch Processing',
    path: '__tests__/unit/lib/voice-ordering/batch-processor.test.ts',
    priority: 'medium',
    expectedThroughput: 20,
    expectedConcurrency: 5,
    description: 'Validates batch processing capabilities and efficiency'
  },
  {
    name: 'E2E Voice Ordering',
    path: '__tests__/e2e/voice-ordering-flow.test.ts',
    priority: 'medium',
    expectedResponseTime: 3000,
    expectedSuccessRate: 0.95,
    description: 'End-to-end voice ordering workflow tests'
  },
  {
    name: 'Production Readiness',
    path: '__tests__/integration/voice-ordering-production-readiness.test.ts',
    priority: 'critical',
    expectedSLACompliance: true,
    expectedSecurityScore: 0.9,
    description: 'Comprehensive production readiness validation'
  }
]

// Metrics tracking
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  totalTime: 0,
  coverage: {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0
  },
  costMetrics: {
    averageCostPerRequest: 0,
    cacheHitRate: 0,
    optimizationRatio: 0
  },
  performanceMetrics: {
    averageResponseTime: 0,
    throughput: 0,
    errorRate: 0
  }
}

/**
 * Print formatted console output
 */
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * Print test suite header
 */
function printHeader(title) {
  const border = '='.repeat(80)
  print(border, 'cyan')
  print(`  ${title}`, 'bright')
  print(border, 'cyan')
}

/**
 * Print test results summary
 */
function printSummary(suite, results) {
  print(`\n${suite.name} Results:`, 'bright')
  print(`  Tests: ${results.total}`, results.total > 0 ? 'green' : 'yellow')
  print(`  Passed: ${results.passed}`, results.passed > 0 ? 'green' : 'red')
  print(`  Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green')
  print(`  Duration: ${results.duration}ms`, 'blue')
  
  if (results.metrics) {
    print(`  Metrics:`, 'magenta')
    Object.entries(results.metrics).forEach(([key, value]) => {
      print(`    ${key}: ${value}`, 'cyan')
    })
  }
}

/**
 * Run a single test suite
 */
async function runTestSuite(suite) {
  print(`\nRunning ${suite.name}...`, 'yellow')
  print(`Description: ${suite.description}`, 'blue')
  
  const startTime = Date.now()
  
  return new Promise((resolve, reject) => {
    const jestArgs = [
      '--testPathPattern', suite.path,
      '--verbose',
      '--silent',
      '--detectOpenHandles',
      '--forceExit'
    ]

    if (TEST_CONFIG.coverage) {
      jestArgs.push('--coverage', '--coverageReporters', 'text-summary')
    }

    const jestProcess = spawn('npx', ['jest', ...jestArgs], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    })

    let stdout = ''
    let stderr = ''

    jestProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    jestProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    jestProcess.on('close', (code) => {
      const endTime = Date.now()
      const duration = endTime - startTime

      // Parse Jest output for test results
      const results = parseJestOutput(stdout, stderr, duration)
      
      if (code === 0) {
        print(`✅ ${suite.name} passed`, 'green')
        resolve({ ...results, success: true, suite })
      } else {
        print(`❌ ${suite.name} failed`, 'red')
        if (stderr) {
          print(`Error output: ${stderr}`, 'red')
        }
        resolve({ ...results, success: false, suite, error: stderr })
      }
    })

    jestProcess.on('error', (error) => {
      print(`Error running ${suite.name}: ${error.message}`, 'red')
      reject(error)
    })

    // Timeout handling
    setTimeout(() => {
      jestProcess.kill('SIGTERM')
      reject(new Error(`Test suite ${suite.name} timed out after ${TEST_CONFIG.timeout}ms`))
    }, TEST_CONFIG.timeout)
  })
}

/**
 * Parse Jest output to extract test results and metrics
 */
function parseJestOutput(stdout, stderr, duration) {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration,
    coverage: null,
    metrics: {}
  }

  // Extract test counts from Jest output
  const testSummaryMatch = stdout.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/i)
  if (testSummaryMatch) {
    results.failed = parseInt(testSummaryMatch[1])
    results.passed = parseInt(testSummaryMatch[2])
    results.total = parseInt(testSummaryMatch[3])
  } else {
    // Try alternative format
    const passedMatch = stdout.match(/(\d+)\s+passed/i)
    const failedMatch = stdout.match(/(\d+)\s+failed/i)
    
    if (passedMatch) results.passed = parseInt(passedMatch[1])
    if (failedMatch) results.failed = parseInt(failedMatch[1])
    results.total = results.passed + results.failed
  }

  // Extract coverage information
  const coverageMatch = stdout.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/i)
  if (coverageMatch) {
    results.coverage = {
      statements: parseFloat(coverageMatch[1]),
      branches: parseFloat(coverageMatch[2]),
      functions: parseFloat(coverageMatch[3]),
      lines: parseFloat(coverageMatch[4])
    }
  }

  // Extract custom metrics from console output
  const metricsMatches = stdout.match(/Metrics: (.+)/g)
  if (metricsMatches) {
    metricsMatches.forEach(match => {
      try {
        const metricsStr = match.replace('Metrics: ', '')
        const metrics = JSON.parse(metricsStr)
        Object.assign(results.metrics, metrics)
      } catch (e) {
        // Ignore parsing errors
      }
    })
  }

  return results
}

/**
 * Generate comprehensive test report
 */
async function generateReport(allResults) {
  const reportPath = path.join(__dirname, '..', 'test-reports', 'voice-ordering-report.md')
  
  let report = `# Voice Ordering System Test Report\n\n`
  report += `**Generated:** ${new Date().toISOString()}\n\n`
  
  // Executive Summary
  report += `## Executive Summary\n\n`
  report += `- **Total Test Suites:** ${allResults.length}\n`
  report += `- **Passed:** ${allResults.filter(r => r.success).length}\n`
  report += `- **Failed:** ${allResults.filter(r => !r.success).length}\n`
  report += `- **Overall Success Rate:** ${((allResults.filter(r => r.success).length / allResults.length) * 100).toFixed(1)}%\n\n`
  
  // Cost Efficiency Analysis
  report += `## Cost Efficiency Analysis\n\n`
  report += `### Key Metrics\n`
  report += `- **Target Cost per Request:** < $0.02\n`
  report += `- **Target Cache Hit Rate:** > 85%\n`
  report += `- **Target Optimization Ratio:** > 2.0x\n\n`
  
  // Performance Analysis
  report += `## Performance Analysis\n\n`
  report += `### Response Time Targets\n`
  report += `- **Cache Hits:** < 200ms\n`
  report += `- **Transcription:** < 3000ms\n`
  report += `- **End-to-End:** < 5000ms\n\n`
  
  // Detailed Results
  report += `## Detailed Test Results\n\n`
  
  for (const result of allResults) {
    report += `### ${result.suite.name}\n\n`
    report += `**Priority:** ${result.suite.priority.toUpperCase()}\n`
    report += `**Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}\n`
    report += `**Duration:** ${result.duration}ms\n`
    report += `**Tests:** ${result.total} (${result.passed} passed, ${result.failed} failed)\n\n`
    
    if (result.coverage) {
      report += `**Coverage:**\n`
      report += `- Statements: ${result.coverage.statements}%\n`
      report += `- Branches: ${result.coverage.branches}%\n`
      report += `- Functions: ${result.coverage.functions}%\n`
      report += `- Lines: ${result.coverage.lines}%\n\n`
    }
    
    if (Object.keys(result.metrics).length > 0) {
      report += `**Metrics:**\n`
      Object.entries(result.metrics).forEach(([key, value]) => {
        report += `- ${key}: ${value}\n`
      })
      report += `\n`
    }
    
    if (result.error) {
      report += `**Error Details:**\n\`\`\`\n${result.error}\n\`\`\`\n\n`
    }
  }
  
  // Recommendations
  report += `## Recommendations\n\n`
  
  const failedTests = allResults.filter(r => !r.success)
  if (failedTests.length > 0) {
    report += `### Critical Issues\n`
    failedTests.forEach(test => {
      report += `- **${test.suite.name}:** ${test.suite.description}\n`
    })
    report += `\n`
  }
  
  report += `### Production Readiness Checklist\n`
  report += `- [ ] All test suites passing\n`
  report += `- [ ] Cost per request < $0.02\n`
  report += `- [ ] Cache hit rate > 85%\n`
  report += `- [ ] Response times within SLA\n`
  report += `- [ ] Error rate < 5%\n`
  report += `- [ ] Security validations passed\n`
  report += `- [ ] Load testing completed\n`
  
  // Create reports directory if it doesn't exist
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, report)
  
  print(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan')
}

/**
 * Main test execution function
 */
async function runAllTests() {
  printHeader('Voice Ordering System Test Suite')
  print(`Running ${TEST_SUITES.length} test suites with ${TEST_CONFIG.parallel ? 'parallel' : 'sequential'} execution\n`, 'blue')
  
  const startTime = Date.now()
  const allResults = []
  
  try {
    if (TEST_CONFIG.parallel) {
      // Run high priority tests first, then others in parallel
      const highPriorityTests = TEST_SUITES.filter(suite => suite.priority === 'critical' || suite.priority === 'high')
      const otherTests = TEST_SUITES.filter(suite => suite.priority !== 'critical' && suite.priority !== 'high')
      
      // Run critical/high priority tests sequentially
      for (const suite of highPriorityTests) {
        const result = await runTestSuite(suite)
        allResults.push(result)
        printSummary(suite, result)
      }
      
      // Run other tests in parallel
      if (otherTests.length > 0) {
        print('\nRunning medium priority tests in parallel...', 'yellow')
        const parallelResults = await Promise.allSettled(
          otherTests.map(suite => runTestSuite(suite))
        )
        
        parallelResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allResults.push(result.value)
            printSummary(otherTests[index], result.value)
          } else {
            print(`Error running ${otherTests[index].name}: ${result.reason}`, 'red')
          }
        })
      }
    } else {
      // Sequential execution
      for (const suite of TEST_SUITES) {
        const result = await runTestSuite(suite)
        allResults.push(result)
        printSummary(suite, result)
      }
    }
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Calculate overall results
    const totalTests = allResults.reduce((sum, r) => sum + r.total, 0)
    const passedTests = allResults.reduce((sum, r) => sum + r.passed, 0)
    const failedTests = allResults.reduce((sum, r) => sum + r.failed, 0)
    const successfulSuites = allResults.filter(r => r.success).length
    
    // Print final summary
    printHeader('Test Execution Summary')
    print(`Total execution time: ${(totalTime / 1000).toFixed(2)} seconds`, 'blue')
    print(`Test suites: ${successfulSuites}/${allResults.length} passed`, successfulSuites === allResults.length ? 'green' : 'red')
    print(`Individual tests: ${passedTests}/${totalTests} passed`, passedTests === totalTests ? 'green' : 'red')
    
    if (failedTests > 0) {
      print(`\n⚠️  ${failedTests} tests failed. Voice ordering system may not be production ready.`, 'red')
    } else {
      print(`\n🎉 All tests passed! Voice ordering system is production ready.`, 'green')
    }
    
    // Generate comprehensive report
    await generateReport(allResults)
    
    // Exit with appropriate code
    process.exit(failedTests > 0 ? 1 : 0)
    
  } catch (error) {
    print(`\n💥 Test execution failed: ${error.message}`, 'red')
    process.exit(1)
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2)
  
  // Parse command line arguments
  if (args.includes('--help')) {
    print('Voice Ordering Test Suite Runner', 'bright')
    print('\nUsage: node scripts/test-voice-ordering.js [options]', 'blue')
    print('\nOptions:', 'blue')
    print('  --sequential     Run tests sequentially instead of parallel')
    print('  --no-coverage    Skip coverage collection')
    print('  --timeout <ms>   Set timeout per test suite (default: 300000)')
    print('  --help           Show this help message')
    process.exit(0)
  }
  
  if (args.includes('--sequential')) {
    TEST_CONFIG.parallel = false
  }
  
  if (args.includes('--no-coverage')) {
    TEST_CONFIG.coverage = false
  }
  
  const timeoutIndex = args.indexOf('--timeout')
  if (timeoutIndex !== -1 && args[timeoutIndex + 1]) {
    TEST_CONFIG.timeout = parseInt(args[timeoutIndex + 1])
  }
  
  // Run the tests
  runAllTests().catch(error => {
    print(`Fatal error: ${error.message}`, 'red')
    process.exit(1)
  })
}