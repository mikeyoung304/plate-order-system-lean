// DEMO READINESS COORDINATOR - Critical Priority System
// Comprehensive demo health check and verification system

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
config({ path: '.env.local' })

interface DemoCheckResult {
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
  critical: boolean
}

interface DemoHealthReport {
  overall: 'ready' | 'warning' | 'failed'
  timestamp: string
  checks: Record<string, DemoCheckResult>
  criticalIssues: string[]
  warnings: string[]
  readyForDemo: boolean
  fallbacksAvailable: boolean
}

class DemoReadinessCoordinator {
  private supabase: any
  private results: DemoHealthReport

  constructor() {
    this.results = {
      overall: 'failed',
      timestamp: new Date().toISOString(),
      checks: {},
      criticalIssues: [],
      warnings: [],
      readyForDemo: false,
      fallbacksAvailable: false,
    }

    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    }
  }

  private addCheck(name: string, result: DemoCheckResult) {
    this.results.checks[name] = result
    if (result.status === 'fail' && result.critical) {
      this.results.criticalIssues.push(result.message)
    } else if (result.status === 'warning') {
      this.results.warnings.push(result.message)
    }
  }

  // 1. ENVIRONMENT CONFIGURATION CHECKS
  async checkEnvironmentVariables(): Promise<void> {
    console.log('🔧 Checking environment configuration...')

    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
    ]

    let missingVars = []
    for (const variable of requiredVars) {
      if (!process.env[variable]) {
        missingVars.push(variable)
      }
    }

    if (missingVars.length === 0) {
      this.addCheck('environment', {
        status: 'pass',
        message: 'All required environment variables configured',
        critical: true,
      })
    } else {
      this.addCheck('environment', {
        status: 'fail',
        message: `Missing environment variables: ${missingVars.join(', ')}`,
        details: { missing: missingVars },
        critical: true,
      })
    }
  }

  // 2. DATABASE CONNECTION AND DATA CHECKS
  async checkDatabaseConnection(): Promise<void> {
    console.log('🗄️ Checking database connection...')

    if (!this.supabase) {
      this.addCheck('database_connection', {
        status: 'fail',
        message: 'Cannot create Supabase client - missing credentials',
        critical: true,
      })
      return
    }

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (error) {
        this.addCheck('database_connection', {
          status: 'fail',
          message: `Database connection failed: ${error.message}`,
          details: error,
          critical: true,
        })
      } else {
        this.addCheck('database_connection', {
          status: 'pass',
          message: 'Database connection successful',
          critical: true,
        })
      }
    } catch (error) {
      this.addCheck('database_connection', {
        status: 'fail',
        message: `Database connection error: ${error}`,
        details: error,
        critical: true,
      })
    }
  }

  // 3. DEMO DATA VALIDATION
  async checkDemoDataIntegrity(): Promise<void> {
    console.log('📊 Validating demo data integrity...')

    if (!this.supabase) return

    try {
      // Check for demo users
      const { data: profiles, error: profilesError } = await this.supabase
        .from('profiles')
        .select('id, name, role')

      if (profilesError) {
        this.addCheck('demo_data', {
          status: 'fail',
          message: `Cannot access profiles: ${profilesError.message}`,
          critical: true,
        })
        return
      }

      const adminUsers = profiles?.filter(p => p.role === 'admin') || []
      const serverUsers = profiles?.filter(p => p.role === 'server') || []
      const cookUsers = profiles?.filter(p => p.role === 'cook') || []
      const residentUsers = profiles?.filter(p => p.role === 'resident') || []

      if (adminUsers.length === 0 || serverUsers.length === 0) {
        this.addCheck('demo_data', {
          status: 'fail',
          message: 'Missing critical demo users (admin/server required)',
          details: {
            admins: adminUsers.length,
            servers: serverUsers.length,
            cooks: cookUsers.length,
            residents: residentUsers.length,
          },
          critical: true,
        })
      } else {
        this.addCheck('demo_data', {
          status: 'pass',
          message: `Demo users available: ${profiles.length} total`,
          details: {
            admins: adminUsers.length,
            servers: serverUsers.length,
            cooks: cookUsers.length,
            residents: residentUsers.length,
          },
          critical: true,
        })
      }

      // Check for tables and seats
      const { data: tables } = await this.supabase
        .from('tables')
        .select('id, label')
      const { data: seats } = await this.supabase
        .from('seats')
        .select('id, table_id')

      if (!tables || tables.length === 0) {
        this.addCheck('demo_tables', {
          status: 'fail',
          message: 'No demo tables configured',
          critical: true,
        })
      } else {
        this.addCheck('demo_tables', {
          status: 'pass',
          message: `${tables.length} demo tables available`,
          details: { tableCount: tables.length, seatCount: seats?.length || 0 },
          critical: false,
        })
      }
    } catch (error) {
      this.addCheck('demo_data', {
        status: 'fail',
        message: `Demo data validation failed: ${error}`,
        details: error,
        critical: true,
      })
    }
  }

  // 4. AUTHENTICATION SYSTEM CHECK
  async checkAuthenticationSystem(): Promise<void> {
    console.log('🔐 Checking authentication system...')

    if (!this.supabase) return

    try {
      // Test guest account login
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: 'guest@restaurant.plate',
        password: 'guest123',
      })

      if (error) {
        this.addCheck('auth_system', {
          status: 'warning',
          message: 'Guest account login failed - may need recreation',
          details: error,
          critical: false,
        })
      } else {
        this.addCheck('auth_system', {
          status: 'pass',
          message: 'Guest authentication working',
          critical: false,
        })
        // Sign out immediately
        await this.supabase.auth.signOut()
      }
    } catch (error) {
      this.addCheck('auth_system', {
        status: 'warning',
        message: `Auth system check failed: ${error}`,
        details: error,
        critical: false,
      })
    }
  }

  // 5. API ENDPOINTS VALIDATION
  async checkApiEndpoints(): Promise<void> {
    console.log('🌐 Checking API endpoints...')

    const endpoints = ['/api/test-env', '/api/auth-check', '/api/transcribe']

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.ok || response.status === 401) {
          // 401 is expected for protected endpoints
          this.addCheck(`api_${endpoint.replace(/[\/\-]/g, '_')}`, {
            status: 'pass',
            message: `API endpoint ${endpoint} accessible`,
            critical: false,
          })
        } else {
          this.addCheck(`api_${endpoint.replace(/[\/\-]/g, '_')}`, {
            status: 'warning',
            message: `API endpoint ${endpoint} returned ${response.status}`,
            critical: false,
          })
        }
      } catch (error) {
        this.addCheck(`api_${endpoint.replace(/[\/\-]/g, '_')}`, {
          status: 'warning',
          message: `API endpoint ${endpoint} not accessible (server not running?)`,
          details: error,
          critical: false,
        })
      }
    }
  }

  // 6. FILE SYSTEM DEPENDENCIES
  async checkFileSystemDependencies(): Promise<void> {
    console.log('📁 Checking file system dependencies...')

    const criticalFiles = [
      'package.json',
      'next.config.js',
      'components.json',
      'tailwind.config.ts',
      'tsconfig.json',
    ]

    const criticalDirs = ['components', 'app', 'lib', 'hooks', 'types']

    let missingFiles = []
    let missingDirs = []

    for (const file of criticalFiles) {
      const filePath = path.join(process.cwd(), file)
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file)
      }
    }

    for (const dir of criticalDirs) {
      const dirPath = path.join(process.cwd(), dir)
      if (!fs.existsSync(dirPath)) {
        missingDirs.push(dir)
      }
    }

    if (missingFiles.length === 0 && missingDirs.length === 0) {
      this.addCheck('file_system', {
        status: 'pass',
        message: 'All critical files and directories present',
        critical: true,
      })
    } else {
      this.addCheck('file_system', {
        status: 'fail',
        message: 'Missing critical files or directories',
        details: { missingFiles, missingDirs },
        critical: true,
      })
    }
  }

  // 7. VOICE SYSTEM READINESS
  async checkVoiceSystemReadiness(): Promise<void> {
    console.log('🎤 Checking voice system readiness...')

    if (!process.env.OPENAI_API_KEY) {
      this.addCheck('voice_system', {
        status: 'fail',
        message: 'OpenAI API key not configured - voice ordering will fail',
        critical: true,
      })
      return
    }

    // Check if voice components exist
    const voiceFiles = [
      'lib/modassembly/openai/transcribe.ts',
      'lib/modassembly/audio-recording/record.ts',
      'components/voice-order-panel.tsx',
    ]

    let missingVoiceFiles = []
    for (const file of voiceFiles) {
      const filePath = path.join(process.cwd(), file)
      if (!fs.existsSync(filePath)) {
        missingVoiceFiles.push(file)
      }
    }

    if (missingVoiceFiles.length === 0) {
      this.addCheck('voice_system', {
        status: 'pass',
        message: 'Voice system components present',
        critical: false,
      })
    } else {
      this.addCheck('voice_system', {
        status: 'warning',
        message: 'Some voice system files missing',
        details: { missing: missingVoiceFiles },
        critical: false,
      })
    }
  }

  // 8. REAL-TIME SYSTEM CHECK
  async checkRealtimeSystem(): Promise<void> {
    console.log('⚡ Checking real-time system...')

    if (!this.supabase) return

    try {
      // Test realtime connection capability
      const channel = this.supabase.channel('demo-test')
      const isConnected = await new Promise(resolve => {
        const timeout = setTimeout(() => resolve(false), 5000)

        channel
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {}
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout)
              resolve(true)
            }
          })
      })

      await this.supabase.removeChannel(channel)

      if (isConnected) {
        this.addCheck('realtime_system', {
          status: 'pass',
          message: 'Real-time subscriptions working',
          critical: false,
        })
      } else {
        this.addCheck('realtime_system', {
          status: 'warning',
          message: 'Real-time connection timeout',
          critical: false,
        })
      }
    } catch (error) {
      this.addCheck('realtime_system', {
        status: 'warning',
        message: `Real-time system check failed: ${error}`,
        details: error,
        critical: false,
      })
    }
  }

  // 9. PERFORMANCE BASELINE CHECK
  async checkPerformanceBaseline(): Promise<void> {
    console.log('⚡ Checking performance baseline...')

    const startTime = Date.now()

    if (this.supabase) {
      try {
        await this.supabase.from('profiles').select('count').limit(1)
        const queryTime = Date.now() - startTime

        if (queryTime < 1000) {
          this.addCheck('performance', {
            status: 'pass',
            message: `Database query performance good (${queryTime}ms)`,
            details: { queryTime },
            critical: false,
          })
        } else {
          this.addCheck('performance', {
            status: 'warning',
            message: `Database query slow (${queryTime}ms)`,
            details: { queryTime },
            critical: false,
          })
        }
      } catch (error) {
        this.addCheck('performance', {
          status: 'warning',
          message: 'Could not measure database performance',
          details: error,
          critical: false,
        })
      }
    }
  }

  // MAIN EXECUTION
  async runAllChecks(): Promise<DemoHealthReport> {
    console.log(
      '🎯 DEMO READINESS COORDINATOR - Starting comprehensive check...'
    )
    console.log('='.repeat(70))

    await this.checkEnvironmentVariables()
    await this.checkDatabaseConnection()
    await this.checkDemoDataIntegrity()
    await this.checkAuthenticationSystem()
    await this.checkApiEndpoints()
    await this.checkFileSystemDependencies()
    await this.checkVoiceSystemReadiness()
    await this.checkRealtimeSystem()
    await this.checkPerformanceBaseline()

    // Calculate overall status
    const criticalFails = Object.values(this.results.checks).filter(
      check => check.status === 'fail' && check.critical
    ).length

    const totalWarnings = Object.values(this.results.checks).filter(
      check => check.status === 'warning'
    ).length

    if (criticalFails === 0) {
      this.results.overall = totalWarnings === 0 ? 'ready' : 'warning'
      this.results.readyForDemo = true
    } else {
      this.results.overall = 'failed'
      this.results.readyForDemo = false
    }

    // Check for fallback availability
    this.results.fallbacksAvailable = this.checkFallbackAvailability()

    return this.results
  }

  private checkFallbackAvailability(): boolean {
    // Fallbacks available if we have basic auth and database access
    const hasDatabase =
      this.results.checks['database_connection']?.status === 'pass'
    const hasAuth = this.results.checks['auth_system']?.status !== 'fail'
    const hasFiles = this.results.checks['file_system']?.status === 'pass'

    return hasDatabase && hasAuth && hasFiles
  }

  // GENERATE REPORT
  generateReport(): string {
    const report = []
    report.push('🎯 DEMO READINESS REPORT')
    report.push('='.repeat(50))
    report.push(`Overall Status: ${this.results.overall.toUpperCase()}`)
    report.push(`Ready for Demo: ${this.results.readyForDemo ? 'YES' : 'NO'}`)
    report.push(
      `Fallbacks Available: ${this.results.fallbacksAvailable ? 'YES' : 'NO'}`
    )
    report.push(`Timestamp: ${this.results.timestamp}`)
    report.push('')

    if (this.results.criticalIssues.length > 0) {
      report.push('🚨 CRITICAL ISSUES:')
      this.results.criticalIssues.forEach(issue => {
        report.push(`   ❌ ${issue}`)
      })
      report.push('')
    }

    if (this.results.warnings.length > 0) {
      report.push('⚠️  WARNINGS:')
      this.results.warnings.forEach(warning => {
        report.push(`   ⚠️  ${warning}`)
      })
      report.push('')
    }

    report.push('📋 DETAILED CHECKS:')
    Object.entries(this.results.checks).forEach(([name, check]) => {
      const icon =
        check.status === 'pass'
          ? '✅'
          : check.status === 'warning'
            ? '⚠️'
            : '❌'
      const critical = check.critical ? ' (CRITICAL)' : ''
      report.push(`   ${icon} ${name}${critical}: ${check.message}`)
    })

    report.push('')
    report.push('🚀 DEMO READINESS SUMMARY:')
    if (this.results.readyForDemo) {
      report.push('   ✅ SYSTEM READY FOR DEMO')
    } else {
      report.push('   ❌ SYSTEM NOT READY - RESOLVE CRITICAL ISSUES')
    }

    return report.join('\n')
  }
}

// CLI EXECUTION
async function main() {
  const coordinator = new DemoReadinessCoordinator()
  const results = await coordinator.runAllChecks()

  console.log('\n' + coordinator.generateReport())

  // Exit with appropriate code
  process.exit(results.readyForDemo ? 0 : 1)
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Demo readiness check failed:', error)
    process.exit(1)
  })
}

export { DemoReadinessCoordinator, type DemoHealthReport }
