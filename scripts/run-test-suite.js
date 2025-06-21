#!/usr/bin/env node

/**
 * Project Helios Test Suite Runner
 * Comprehensive test orchestration for voice commands, anomaly detection, and KDS
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
}

class TestSuiteRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      coverage: {},
      duration: 0,
      suites: []
    }
    this.startTime = Date.now()
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: 'pipe',
        ...options
      })

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (data) => {
        stdout += data.toString()
        if (options.verbose) {
          process.stdout.write(data)
        }
      })

      proc.stderr.on('data', (data) => {
        stderr += data.toString()
        if (options.verbose) {
          process.stderr.write(data)
        }
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code })
        } else {
          reject({ stdout, stderr, code })
        }
      })
    })
  }

  async runTestSuite(name, command, args, options = {}) {
    log.header(`Running ${name}`)
    
    const suiteStart = Date.now()
    
    try {
      const result = await this.runCommand(command, args, {
        verbose: options.verbose || process.argv.includes('--verbose')
      })
      
      const duration = Date.now() - suiteStart
      
      // Parse Jest output for test results
      const testResults = this.parseJestOutput(result.stdout)
      
      this.results.suites.push({
        name,
        status: 'passed',
        duration,
        tests: testResults.tests,
        coverage: testResults.coverage
      })
      
      this.results.total += testResults.tests
      this.results.passed += testResults.tests
      
      log.success(`${name} completed in ${(duration / 1000).toFixed(2)}s`)
      return result
      
    } catch (error) {
      const duration = Date.now() - suiteStart
      
      this.results.suites.push({
        name,
        status: 'failed',
        duration,
        error: error.stderr || error.stdout,
        tests: 0
      })
      
      this.results.failed += 1
      
      log.error(`${name} failed after ${(duration / 1000).toFixed(2)}s`)
      
      if (options.verbose || process.argv.includes('--verbose')) {
        console.log('\nError Output:')
        console.log(error.stderr || error.stdout)
      }
      
      if (options.failFast || process.argv.includes('--fail-fast')) {
        throw error
      }
    }
  }

  parseJestOutput(output) {
    const lines = output.split('\n')
    let tests = 0
    let coverage = {}
    
    // Look for test summary
    for (const line of lines) {
      const testMatch = line.match(/Tests:\s+(\d+)\s+passed/)
      if (testMatch) {
        tests = parseInt(testMatch[1])
      }
      
      // Parse coverage if available
      const coverageMatch = line.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/)
      if (coverageMatch) {
        coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        }
      }
    }
    
    return { tests, coverage }
  }

  async checkPrerequisites() {
    log.header('Checking Prerequisites')
    
    // Check if npm is available
    try {
      await this.runCommand('npm', ['--version'])
      log.success('npm is available')
    } catch (error) {
      log.error('npm is not available')
      throw new Error('npm is required to run tests')
    }
    
    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      log.warning('node_modules not found, running npm install...')
      await this.runCommand('npm', ['install'])
      log.success('Dependencies installed')
    }
    
    // Check if test directories exist
    const testDirs = ['__tests__/unit', '__tests__/integration', '__tests__/e2e', '__tests__/performance']
    for (const dir of testDirs) {
      if (!fs.existsSync(dir)) {
        log.warning(`Test directory ${dir} not found`)
      } else {
        log.success(`Test directory ${dir} exists`)
      }
    }
  }

  async runUnitTests() {
    const args = [
      'run', 'test:unit',
      '--',
      '--passWithNoTests',
      '--verbose',
      '--testPathPattern=voice-command|anomaly-detection|table-grouped'
    ]
    
    if (process.argv.includes('--coverage')) {
      args.push('--coverage')
      args.push('--coverageReporters=text')
      args.push('--coverageReporters=json-summary')
    }
    
    await this.runTestSuite('Unit Tests - Voice Commands & Anomaly Detection', 'npm', args)
  }

  async runIntegrationTests() {
    const args = [
      'run', 'test:integration',
      '--',
      '--passWithNoTests',
      '--verbose',
      '--testPathPattern=voice-command-e2e|anomaly-detection-integration|real-time'
    ]
    
    await this.runTestSuite('Integration Tests - End-to-End Flows', 'npm', args)
  }

  async runE2ETests() {
    // Check if Playwright is available
    try {
      if (process.argv.includes('--e2e')) {
        await this.runTestSuite('E2E Tests - Playwright', 'npm', ['run', 'test:playwright'])
      } else {
        log.info('Skipping E2E tests (use --e2e to include)')
      }
    } catch (error) {
      log.warning('Playwright not available, skipping E2E tests')
    }
  }

  async runPerformanceTests() {
    if (process.argv.includes('--performance')) {
      const args = [
        'run', 'test:performance',
        '--',
        '--passWithNoTests',
        '--verbose'
      ]
      
      await this.runTestSuite('Performance Tests', 'npm', args)
    } else {
      log.info('Skipping performance tests (use --performance to include)')
    }
  }

  async runCustomTests() {
    const customPattern = process.argv.find(arg => arg.startsWith('--pattern='))
    if (customPattern) {
      const pattern = customPattern.split('=')[1]
      log.info(`Running custom test pattern: ${pattern}`)
      
      const args = [
        'test',
        '--',
        '--testPathPattern=' + pattern,
        '--passWithNoTests',
        '--verbose'
      ]
      
      await this.runTestSuite(`Custom Tests - ${pattern}`, 'npm', args)
    }
  }

  async generateReport() {
    log.header('Test Suite Summary')
    
    this.results.duration = Date.now() - this.startTime
    
    console.log(`${colors.bright}Overall Results:${colors.reset}`)
    console.log(`  Total Suites: ${this.results.suites.length}`)
    console.log(`  Passed: ${colors.green}${this.results.suites.filter(s => s.status === 'passed').length}${colors.reset}`)
    console.log(`  Failed: ${colors.red}${this.results.suites.filter(s => s.status === 'failed').length}${colors.reset}`)
    console.log(`  Duration: ${(this.results.duration / 1000).toFixed(2)}s`)
    
    console.log(`\n${colors.bright}Suite Breakdown:${colors.reset}`)
    for (const suite of this.results.suites) {
      const status = suite.status === 'passed' 
        ? `${colors.green}PASS${colors.reset}` 
        : `${colors.red}FAIL${colors.reset}`
      
      console.log(`  ${status} ${suite.name} (${(suite.duration / 1000).toFixed(2)}s)`)
      
      if (suite.coverage) {
        console.log(`       Coverage: ${suite.coverage.lines}% lines, ${suite.coverage.functions}% functions`)
      }
    }
    
    // Generate JSON report
    const reportPath = path.join('test-reports', 'helios-test-summary.json')
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2))
    
    log.success(`Test report saved to ${reportPath}`)
    
    // Check if any tests failed
    const failedSuites = this.results.suites.filter(s => s.status === 'failed')
    if (failedSuites.length > 0) {
      console.log(`\n${colors.red}${colors.bright}Failed Suites:${colors.reset}`)
      for (const suite of failedSuites) {
        console.log(`  ${colors.red}✗${colors.reset} ${suite.name}`)
        if (suite.error && !process.argv.includes('--quiet')) {
          console.log(`    ${suite.error.split('\n')[0]}`)
        }
      }
      
      process.exit(1)
    } else {
      log.success('All test suites passed!')
    }
  }

  async run() {
    try {
      console.log(`${colors.bright}${colors.cyan}Project Helios Test Suite Runner${colors.reset}\n`)
      
      await this.checkPrerequisites()
      
      // Run test suites in order
      await this.runUnitTests()
      await this.runIntegrationTests()
      await this.runE2ETests()
      await this.runPerformanceTests()
      await this.runCustomTests()
      
      await this.generateReport()
      
    } catch (error) {
      log.error(`Test suite failed: ${error.message}`)
      process.exit(1)
    }
  }
}

// Parse command line arguments
function printUsage() {
  console.log(`
${colors.bright}Project Helios Test Suite Runner${colors.reset}

Usage: node scripts/run-test-suite.js [options]

Options:
  --coverage         Include code coverage analysis
  --e2e             Run Playwright E2E tests
  --performance     Run performance tests
  --verbose         Show detailed output
  --fail-fast       Stop on first failure
  --pattern=<regex> Run tests matching pattern
  --quiet           Minimal output
  --help            Show this help

Examples:
  node scripts/run-test-suite.js --coverage
  node scripts/run-test-suite.js --e2e --performance
  node scripts/run-test-suite.js --pattern="voice-command"
  node scripts/run-test-suite.js --verbose --fail-fast
`)
}

if (process.argv.includes('--help')) {
  printUsage()
  process.exit(0)
}

// Run the test suite
const runner = new TestSuiteRunner()
runner.run().catch(error => {
  log.error(`Unexpected error: ${error.message}`)
  process.exit(1)
})