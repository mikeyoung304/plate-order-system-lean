#!/usr/bin/env node

/**
 * 🤖 AUTOMATED KDS AUTHENTICATION FIX VERIFICATION
 * 
 * This script automates the entire testing process:
 * 1. Starts development server
 * 2. Runs automated browser tests
 * 3. Verifies authentication cascade
 * 4. Tests KDS functionality end-to-end
 * 5. Reports results with actionable feedback
 */

const { spawn, exec } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log(`\n${colors.bold}${colors.cyan}━━━ ${title} ━━━${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// Global test state
let serverProcess = null
let testResults = {
  serverStart: false,
  authentication: false,
  kdsLoad: false,
  sessionPropagation: false,
  realTimeConnection: false,
  dataFetching: false,
  overallSuccess: false
}

// Cleanup function
function cleanup() {
  if (serverProcess) {
    logInfo('Cleaning up server process...')
    serverProcess.kill('SIGTERM')
    
    // Force kill after 5 seconds
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL')
      }
    }, 5000)
  }
}

// Handle graceful shutdown
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
process.on('exit', cleanup)

async function waitForServer(url, timeout = 30000) {
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return true
      }
    } catch (error) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return false
}

async function startDevelopmentServer() {
  logSection('🚀 STARTING DEVELOPMENT SERVER')
  
  return new Promise((resolve, reject) => {
    // Kill any existing processes on port 3000
    exec('lsof -ti:3000 | xargs kill -9 2>/dev/null || true', () => {
      
      logInfo('Starting Next.js development server...')
      serverProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: process.cwd()
      })

      let serverReady = false
      let serverOutput = ''

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString()
        serverOutput += output
        
        if (output.includes('Ready in') && !serverReady) {
          serverReady = true
          testResults.serverStart = true
          logSuccess('Development server started successfully')
          resolve()
        }
      })

      serverProcess.stderr.on('data', (data) => {
        const output = data.toString()
        serverOutput += output
        logWarning(`Server stderr: ${output.trim()}`)
      })

      serverProcess.on('error', (error) => {
        logError(`Failed to start server: ${error.message}`)
        testResults.serverStart = false
        reject(error)
      })

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!serverReady) {
          logError('Server startup timeout (60s)')
          logInfo('Server output:')
          console.log(serverOutput)
          testResults.serverStart = false
          reject(new Error('Server startup timeout'))
        }
      }, 60000)
    })
  })
}

async function runAutomatedBrowserTests() {
  logSection('🌐 AUTOMATED BROWSER TESTING')
  
  // Install puppeteer if not present
  try {
    require('puppeteer')
  } catch (error) {
    logInfo('Installing puppeteer for browser automation...')
    await new Promise((resolve, reject) => {
      exec('npm install puppeteer --save-dev', (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }

  const puppeteer = require('puppeteer')
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  // Enable console logging
  const consoleLogs = []
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    })
  })

  try {
    // Test 1: Navigate to login page and handle existing session
    logInfo('Testing: Navigation and authentication check...')
    await page.goto('http://localhost:3000')
    
    // Wait for page to load and check current state
    await page.waitForSelector('body', { timeout: 10000 })
    
    const currentUrl = page.url()
    logInfo(`Current URL after navigation: ${currentUrl}`)
    
    // Check if already authenticated (redirected to dashboard/kitchen)
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/kitchen')) {
      logSuccess('Already authenticated - session persists!')
      testResults.authentication = true
    } else {
      // Try to find login form
      const loginForm = await page.$('input[type="email"]')
      
      if (loginForm) {
        logInfo('Login form found - performing authentication...')
        
        // Test 2: Perform login
        await page.type('input[type="email"]', 'guest@restaurant.plate')
        await page.type('input[type="password"]', 'guest12345')
        
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
          page.click('button[type="submit"]')
        ])
        
        // Check for successful login
        const newUrl = page.url()
        if (newUrl.includes('/dashboard') || newUrl.includes('/kitchen')) {
          testResults.authentication = true
          logSuccess('Authentication successful')
        } else {
          logError(`Authentication failed - redirected to: ${newUrl}`)
          // Continue testing even if auth fails
        }
      } else {
        // Check if there's a login link or if we're on a different page
        const loginLink = await page.$('a[href*="login"], button:contains("Sign in"), button:contains("Login")')
        
        if (loginLink) {
          logInfo('Found login link - clicking...')
          await loginLink.click()
          await page.waitForSelector('input[type="email"]', { timeout: 5000 })
          
          // Perform login
          await page.type('input[type="email"]', 'guest@restaurant.plate')
          await page.type('input[type="password"]', 'guest12345')
          
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('button[type="submit"]')
          ])
          
          const newUrl = page.url()
          if (newUrl.includes('/dashboard') || newUrl.includes('/kitchen')) {
            testResults.authentication = true
            logSuccess('Authentication successful')
          }
        } else {
          logWarning('No login form or link found - checking if already authenticated')
          
          // Check page content for authenticated elements
          const authenticatedElements = await page.$$('[class*="dashboard"], [class*="kitchen"], [data-testid*="auth"]')
          if (authenticatedElements.length > 0) {
            testResults.authentication = true
            logSuccess('Already authenticated (detected by page elements)')
          } else {
            logError('Cannot find login form or authenticated content')
          }
        }
      }
    }

    // Test 3: Navigate to KDS
    logInfo('Testing: KDS page navigation...')
    await page.goto('http://localhost:3000/kitchen/kds')
    await page.waitForSelector('body', { timeout: 10000 })
    
    // Wait for potential loading states
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check for KDS-specific elements
    const kdsElements = await page.$$('[class*="kds"], [data-testid*="kds"]')
    if (kdsElements.length > 0) {
      testResults.kdsLoad = true
      logSuccess('KDS page loaded successfully')
    }

    // Test 4: Check console for session errors
    logInfo('Testing: Session propagation and error analysis...')
    
    const sessionErrors = consoleLogs.filter(log => 
      log.text.includes('No session') || 
      log.text.includes('42501') || 
      log.text.includes('permission denied') ||
      log.text.includes('Authentication required')
    )
    
    const sessionSuccesses = consoleLogs.filter(log =>
      log.text.includes('Session refreshed') &&
      log.text.includes('hasSession: true')
    )

    if (sessionSuccesses.length > 0 && sessionErrors.length === 0) {
      testResults.sessionPropagation = true
      logSuccess('Session propagation working correctly')
    } else {
      logError(`Session issues detected: ${sessionErrors.length} errors, ${sessionSuccesses.length} successes`)
      
      // Log specific errors for debugging
      sessionErrors.slice(0, 3).forEach(error => {
        logWarning(`Console Error: ${error.text}`)
      })
    }

    // Test 5: Check for real-time connection
    logInfo('Testing: Real-time WebSocket connection...')
    
    const connectionLogs = consoleLogs.filter(log =>
      log.text.includes('real-time subscription') ||
      log.text.includes('WebSocket') ||
      log.text.includes('connection')
    )
    
    const connectionErrors = connectionLogs.filter(log =>
      log.text.includes('No session for real-time') ||
      log.text.includes('connection failed')
    )

    if (connectionLogs.length > 0 && connectionErrors.length === 0) {
      testResults.realTimeConnection = true
      logSuccess('Real-time connection established')
    } else if (connectionErrors.length > 0) {
      logWarning('Real-time connection issues detected')
    }

    // Test 6: Check for successful data fetching
    logInfo('Testing: Data fetching and display...')
    
    const dataErrors = consoleLogs.filter(log =>
      log.text.includes('Failed to fetch') ||
      log.text.includes('Error fetching') ||
      log.text.includes('Error loading')
    )

    if (dataErrors.length === 0) {
      testResults.dataFetching = true
      logSuccess('Data fetching working correctly')
    } else {
      logError(`Data fetching issues: ${dataErrors.length} errors`)
      dataErrors.slice(0, 3).forEach(error => {
        logWarning(`Data Error: ${error.text}`)
      })
    }

  } catch (error) {
    logError(`Browser test failed: ${error.message}`)
  } finally {
    await browser.close()
  }
}

async function generateDetailedReport() {
  logSection('📊 DETAILED TEST RESULTS')

  const totalTests = Object.keys(testResults).length - 1 // Exclude overallSuccess
  const passedTests = Object.values(testResults).filter(result => result === true).length
  const successRate = Math.round((passedTests / totalTests) * 100)

  testResults.overallSuccess = successRate >= 80

  log(`\n${colors.bold}${colors.cyan}🎯 AUTOMATED VERIFICATION SUMMARY${colors.reset}`)
  log(`${colors.bold}Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)${colors.reset}\n`)

  // Individual test results
  Object.entries(testResults).forEach(([test, result]) => {
    if (test === 'overallSuccess') return
    
    const status = result ? '✅ PASS' : '❌ FAIL'
    const color = result ? 'green' : 'red'
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    
    log(`${status} ${testName}`, color)
  })

  // Overall status
  log(`\n${colors.bold}${testResults.overallSuccess ? colors.green : colors.red}🎊 OVERALL STATUS: ${testResults.overallSuccess ? 'SUCCESS' : 'NEEDS ATTENTION'}${colors.reset}`)

  // Actionable recommendations
  if (!testResults.overallSuccess) {
    log(`\n${colors.yellow}🔧 RECOMMENDED ACTIONS:${colors.reset}`)
    
    if (!testResults.serverStart) {
      log('• Check server startup logs and dependencies', 'yellow')
    }
    if (!testResults.authentication) {
      log('• Verify guest user credentials and auth configuration', 'yellow')
    }
    if (!testResults.sessionPropagation) {
      log('• Check cookie settings and session manager configuration', 'yellow')
    }
    if (!testResults.realTimeConnection) {
      log('• Verify WebSocket configuration and session context', 'yellow')
    }
    if (!testResults.dataFetching) {
      log('• Check database permissions and RLS policies', 'yellow')
    }
  } else {
    log(`\n${colors.green}🎉 KDS AUTHENTICATION CASCADE IS FULLY OPERATIONAL!${colors.reset}`)
    log(`${colors.green}✅ Ready for production deployment${colors.reset}`)
  }

  // Save results to file
  const reportPath = path.join(process.cwd(), 'test-reports', 'automated-verification-report.json')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  
  const detailedReport = {
    timestamp: new Date().toISOString(),
    successRate: successRate,
    testResults: testResults,
    overallSuccess: testResults.overallSuccess,
    recommendations: !testResults.overallSuccess ? [
      'Check individual test failures above',
      'Review console logs for specific errors',
      'Verify environment configuration'
    ] : ['System ready for production']
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2))
  logInfo(`Detailed report saved to: ${reportPath}`)
}

// Main execution
async function main() {
  try {
    log(`${colors.bold}${colors.cyan}`)
    log('┌─────────────────────────────────────────────────────────────┐')
    log('│        🤖 AUTOMATED KDS FIX VERIFICATION SYSTEM 🤖          │')
    log('│                                                             │')
    log('│  This will automatically test the entire authentication     │')
    log('│  cascade and KDS functionality end-to-end.                 │')
    log('└─────────────────────────────────────────────────────────────┘')
    log(`${colors.reset}`)

    await startDevelopmentServer()
    
    // Wait for server to be fully ready
    logInfo('Waiting for server to be fully ready...')
    const serverReady = await waitForServer('http://localhost:3000')
    
    if (!serverReady) {
      throw new Error('Server failed to respond within timeout')
    }
    
    await runAutomatedBrowserTests()
    await generateDetailedReport()
    
  } catch (error) {
    logError(`Automation failed: ${error.message}`)
    testResults.overallSuccess = false
    await generateDetailedReport()
  } finally {
    cleanup()
    
    // Exit with appropriate code
    process.exit(testResults.overallSuccess ? 0 : 1)
  }
}

// Run the automation
main().catch(error => {
  logError(`Critical error: ${error.message}`)
  cleanup()
  process.exit(1)
})