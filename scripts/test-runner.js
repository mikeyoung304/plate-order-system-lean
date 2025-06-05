#!/usr/bin/env node

/**
 * Comprehensive test runner for Plate Restaurant System
 * Orchestrates different test types and provides detailed reporting
 */

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

class TestRunner {
  constructor() {
    this.results = {
      unit: { status: 'pending', duration: 0, coverage: null },
      integration: { status: 'pending', duration: 0, coverage: null },
      e2e: { status: 'pending', duration: 0, coverage: null },
      performance: { status: 'pending', duration: 0, metrics: null },
      lint: { status: 'pending', duration: 0, issues: null },
      typeCheck: { status: 'pending', duration: 0, errors: null },
      build: { status: 'pending', duration: 0, size: null },
    }
    this.startTime = Date.now()
    this.verbose = process.argv.includes('--verbose')
    this.failFast = process.argv.includes('--fail-fast')
    this.skipSlow = process.argv.includes('--skip-slow')
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substr(11, 8)
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      performance: '🚀',
    }[type] || 'ℹ️'
    
    console.log(`[${timestamp}] ${prefix} ${message}`)
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const child = spawn(command, args, {
        stdio: this.verbose ? 'inherit' : 'pipe',
        shell: true,
        ...options,
      })

      let stdout = ''
      let stderr = ''

      if (!this.verbose) {
        child.stdout?.on('data', (data) => {
          stdout += data.toString()
        })

        child.stderr?.on('data', (data) => {
          stderr += data.toString()
        })
      }

      child.on('close', (code) => {
        const duration = Date.now() - startTime
        resolve({
          code,
          stdout,
          stderr,
          duration,
          success: code === 0,
        })
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  async runUnitTests() {
    this.log('Running unit tests...')
    const result = await this.runCommand('npm', ['run', 'test:unit', '--', '--ci'])
    
    this.results.unit = {
      status: result.success ? 'passed' : 'failed',
      duration: result.duration,
      coverage: await this.extractCoverage('unit'),
    }

    if (result.success) {
      this.log(`Unit tests passed (${this.formatDuration(result.duration)})`, 'success')
    } else {
      this.log(`Unit tests failed (${this.formatDuration(result.duration)})`, 'error')
      if (this.verbose) {
        console.log(result.stderr)
      }
    }

    return result.success
  }

  async runIntegrationTests() {
    this.log('Running integration tests...')
    const result = await this.runCommand('npm', ['run', 'test:integration', '--', '--ci'])
    
    this.results.integration = {
      status: result.success ? 'passed' : 'failed',
      duration: result.duration,
      coverage: await this.extractCoverage('integration'),
    }

    if (result.success) {
      this.log(`Integration tests passed (${this.formatDuration(result.duration)})`, 'success')
    } else {
      this.log(`Integration tests failed (${this.formatDuration(result.duration)})`, 'error')
      if (this.verbose) {
        console.log(result.stderr)
      }
    }

    return result.success
  }

  async runE2ETests() {
    if (this.skipSlow) {
      this.log('Skipping E2E tests (--skip-slow)', 'warning')
      this.results.e2e.status = 'skipped'
      return true
    }

    this.log('Running E2E tests...')
    const result = await this.runCommand('npm', ['run', 'test:e2e', '--', '--ci'])
    
    this.results.e2e = {
      status: result.success ? 'passed' : 'failed',
      duration: result.duration,
      coverage: await this.extractCoverage('e2e'),
    }

    if (result.success) {
      this.log(`E2E tests passed (${this.formatDuration(result.duration)})`, 'success')
    } else {
      this.log(`E2E tests failed (${this.formatDuration(result.duration)})`, 'error')
      if (this.verbose) {
        console.log(result.stderr)
      }
    }

    return result.success
  }

  async runPerformanceTests() {
    if (this.skipSlow) {
      this.log('Skipping performance tests (--skip-slow)', 'warning')
      this.results.performance.status = 'skipped'
      return true
    }

    this.log('Running performance tests...')
    const result = await this.runCommand('npm', ['run', 'test:performance:ci'])
    
    this.results.performance = {
      status: result.success ? 'passed' : 'failed',
      duration: result.duration,
      metrics: await this.extractPerformanceMetrics(),
    }

    if (result.success) {
      this.log(`Performance tests passed (${this.formatDuration(result.duration)})`, 'performance')
    } else {
      this.log(`Performance tests failed (${this.formatDuration(result.duration)})`, 'error')
      if (this.verbose) {
        console.log(result.stderr)
      }
    }

    return result.success
  }

  async runLinting() {
    this.log('Running linter...')
    const result = await this.runCommand('npm', ['run', 'lint'])
    
    this.results.lint = {
      status: result.success ? 'passed' : 'failed',
      duration: result.duration,
      issues: result.success ? 0 : this.countLintIssues(result.stdout),
    }

    if (result.success) {
      this.log(`Linting passed (${this.formatDuration(result.duration)})`, 'success')
    } else {
      this.log(`Linting failed with ${this.results.lint.issues} issues (${this.formatDuration(result.duration)})`, 'error')
      if (this.verbose) {
        console.log(result.stdout)
      }
    }

    return result.success
  }

  async runTypeCheck() {
    this.log('Running type check...')
    const result = await this.runCommand('npm', ['run', 'type-check'])
    
    this.results.typeCheck = {
      status: result.success ? 'passed' : 'failed',
      duration: result.duration,
      errors: result.success ? 0 : this.countTypeErrors(result.stderr),
    }

    if (result.success) {
      this.log(`Type check passed (${this.formatDuration(result.duration)})`, 'success')
    } else {
      this.log(`Type check failed with ${this.results.typeCheck.errors} errors (${this.formatDuration(result.duration)})`, 'error')
      if (this.verbose) {
        console.log(result.stderr)
      }
    }

    return result.success
  }

  async runBuildTest() {
    this.log('Running build test...')
    const result = await this.runCommand('npm', ['run', 'build'])
    
    this.results.build = {
      status: result.success ? 'passed' : 'failed',
      duration: result.duration,
      size: result.success ? await this.calculateBuildSize() : null,
    }

    if (result.success) {
      this.log(`Build test passed (${this.formatDuration(result.duration)})`, 'success')
      if (this.results.build.size) {
        this.log(`Build size: ${this.formatSize(this.results.build.size)}`)
      }
    } else {
      this.log(`Build test failed (${this.formatDuration(result.duration)})`, 'error')
      if (this.verbose) {
        console.log(result.stderr)
      }
    }

    return result.success
  }

  async extractCoverage(testType) {
    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json')
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
        return coverage.total
      }
    } catch (error) {
      // Coverage file doesn't exist or is invalid
    }
    return null
  }

  async extractPerformanceMetrics() {
    // This would extract performance metrics from test output
    // For now, return mock data
    return {
      averageRenderTime: 25.5,
      maxRenderTime: 150,
      memoryUsage: 15.2,
    }
  }

  countLintIssues(output) {
    const lines = output.split('\n').filter(line => line.includes('✖'))
    return lines.length
  }

  countTypeErrors(output) {
    const errorMatches = output.match(/error TS\d+:/g)
    return errorMatches ? errorMatches.length : 0
  }

  async calculateBuildSize() {
    try {
      const nextDir = path.join(process.cwd(), '.next')
      if (fs.existsSync(nextDir)) {
        const stats = fs.statSync(nextDir)
        return this.getDirSize(nextDir)
      }
    } catch (error) {
      // Build directory doesn't exist
    }
    return null
  }

  getDirSize(dirPath) {
    let totalSize = 0
    const files = fs.readdirSync(dirPath)
    
    for (const file of files) {
      const filePath = path.join(dirPath, file)
      const stats = fs.statSync(filePath)
      
      if (stats.isDirectory()) {
        totalSize += this.getDirSize(filePath)
      } else {
        totalSize += stats.size
      }
    }
    
    return totalSize
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime
    
    console.log('\n' + '='.repeat(60))
    console.log('                    TEST SUMMARY')
    console.log('='.repeat(60))
    
    const testTypes = [
      ['Unit Tests', this.results.unit],
      ['Integration Tests', this.results.integration],
      ['E2E Tests', this.results.e2e],
      ['Performance Tests', this.results.performance],
      ['Linting', this.results.lint],
      ['Type Check', this.results.typeCheck],
      ['Build Test', this.results.build],
    ]

    testTypes.forEach(([name, result]) => {
      const status = result.status === 'passed' ? '✅ PASSED' :
                    result.status === 'failed' ? '❌ FAILED' :
                    result.status === 'skipped' ? '⏭️ SKIPPED' : '⏳ PENDING'
      
      console.log(`${name.padEnd(20)} ${status.padEnd(15)} ${this.formatDuration(result.duration)}`)
      
      if (result.coverage) {
        console.log(`${''.padEnd(20)} Coverage: ${result.coverage.lines.pct}% lines`)
      }
    })

    console.log('='.repeat(60))
    console.log(`Total Duration: ${this.formatDuration(totalDuration)}`)
    
    const passedTests = Object.values(this.results).filter(r => r.status === 'passed').length
    const totalTests = Object.values(this.results).filter(r => r.status !== 'skipped').length
    console.log(`Tests Passed: ${passedTests}/${totalTests}`)
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED!')
    } else {
      console.log('💥 SOME TESTS FAILED!')
    }
    
    console.log('='.repeat(60))
  }

  async run() {
    this.log('Starting Plate Restaurant System test suite...')
    
    const tests = [
      { name: 'Type Check', fn: () => this.runTypeCheck(), critical: true },
      { name: 'Linting', fn: () => this.runLinting(), critical: true },
      { name: 'Unit Tests', fn: () => this.runUnitTests(), critical: true },
      { name: 'Integration Tests', fn: () => this.runIntegrationTests(), critical: true },
      { name: 'Build Test', fn: () => this.runBuildTest(), critical: true },
      { name: 'E2E Tests', fn: () => this.runE2ETests(), critical: false },
      { name: 'Performance Tests', fn: () => this.runPerformanceTests(), critical: false },
    ]

    let allPassed = true
    
    for (const test of tests) {
      try {
        const passed = await test.fn()
        if (!passed) {
          allPassed = false
          if (test.critical && this.failFast) {
            this.log(`Critical test '${test.name}' failed. Stopping due to --fail-fast`, 'error')
            break
          }
        }
      } catch (error) {
        this.log(`Test '${test.name}' threw an error: ${error.message}`, 'error')
        allPassed = false
        if (test.critical && this.failFast) {
          this.log(`Critical test '${test.name}' errored. Stopping due to --fail-fast`, 'error')
          break
        }
      }
    }

    this.printSummary()
    
    if (!allPassed) {
      process.exit(1)
    }
  }
}

// Usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Plate Restaurant System Test Runner

Usage: node scripts/test-runner.js [options]

Options:
  --verbose     Show detailed output from all tests
  --fail-fast   Stop on first critical test failure
  --skip-slow   Skip slower tests (E2E, performance)
  --help, -h    Show this help message

Examples:
  node scripts/test-runner.js                    # Run all tests
  node scripts/test-runner.js --verbose          # Run with detailed output
  node scripts/test-runner.js --fail-fast        # Stop on first failure
  node scripts/test-runner.js --skip-slow        # Skip E2E and performance tests
`)
  process.exit(0)
}

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner()
  runner.run().catch((error) => {
    console.error('Test runner failed:', error)
    process.exit(1)
  })
}

export default TestRunner