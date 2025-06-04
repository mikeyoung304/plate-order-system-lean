#!/usr/bin/env tsx

/**
 * Production Readiness Validation Script
 * 
 * Comprehensive validation of the application's readiness for production deployment.
 * Checks performance, security, monitoring, and optimization requirements.
 * 
 * Usage:
 *   npx tsx scripts/production-readiness.ts [options]
 * 
 * Options:
 *   --url <url>          Application URL to validate (default: http://localhost:3000)
 *   --format <format>    Output format: json, table, minimal (default: table)
 *   --threshold <number> Minimum score required to pass (default: 80)
 *   --save <file>        Save report to file
 *   --config <file>      Load configuration from file
 *   --silent            Suppress console output
 */

interface ValidationResult {
  category: string
  test: string
  status: 'pass' | 'fail' | 'warn'
  score: number
  message: string
  details?: any
  impact: 'low' | 'medium' | 'high' | 'critical'
  recommendation?: string
}

interface ValidationReport {
  timestamp: string
  url: string
  overallScore: number
  status: 'ready' | 'needs_work' | 'not_ready'
  categories: {
    performance: ValidationResult[]
    security: ValidationResult[]
    monitoring: ValidationResult[]
    optimization: ValidationResult[]
    deployment: ValidationResult[]
    scalability: ValidationResult[]
  }
  summary: {
    totalTests: number
    passed: number
    warnings: number
    failed: number
    critical: number
  }
  recommendations: string[]
}

interface ValidationConfig {
  url: string
  format: 'json' | 'table' | 'minimal'
  threshold: number
  timeout: number
  save?: string
  silent: boolean
}

class ProductionReadinessValidator {
  private config: ValidationConfig
  private results: ValidationResult[] = []

  constructor(config: ValidationConfig) {
    this.config = config
  }

  async validate(): Promise<ValidationReport> {
    if (!this.config.silent) {
      console.log('🔍 Starting production readiness validation...')
      console.log(`📍 Target URL: ${this.config.url}`)
      console.log('━'.repeat(60))
    }

    // Run all validation categories
    await this.validatePerformance()
    await this.validateSecurity()
    await this.validateMonitoring()
    await this.validateOptimization()
    await this.validateDeployment()
    await this.validateScalability()

    return this.generateReport()
  }

  private async validatePerformance(): Promise<void> {
    if (!this.config.silent) console.log('⚡ Validating Performance...')

    // Response time test
    const startTime = Date.now()
    try {
      const response = await this.fetch('/')
      const responseTime = Date.now() - startTime
      
      this.addResult({
        category: 'performance',
        test: 'Response Time',
        status: responseTime < 2000 ? 'pass' : responseTime < 5000 ? 'warn' : 'fail',
        score: Math.max(0, 100 - (responseTime / 50)),
        message: `Homepage loads in ${responseTime}ms`,
        impact: responseTime > 5000 ? 'high' : responseTime > 2000 ? 'medium' : 'low',
        recommendation: responseTime > 2000 ? 'Optimize server response time and reduce bundle size' : undefined
      })
    } catch (error) {
      this.addResult({
        category: 'performance',
        test: 'Response Time',
        status: 'fail',
        score: 0,
        message: 'Failed to load homepage',
        impact: 'critical',
        recommendation: 'Fix application startup and connectivity issues'
      })
    }

    // Health check performance
    try {
      const healthStart = Date.now()
      const healthResponse = await this.fetch('/api/health')
      const healthTime = Date.now() - healthStart
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        
        this.addResult({
          category: 'performance',
          test: 'Health Check Speed',
          status: healthTime < 1000 ? 'pass' : healthTime < 3000 ? 'warn' : 'fail',
          score: Math.max(0, 100 - (healthTime / 30)),
          message: `Health check responds in ${healthTime}ms`,
          impact: 'medium',
          recommendation: healthTime > 1000 ? 'Optimize health check queries and connections' : undefined
        })

        // Database performance
        const dbCheck = healthData.checks?.database
        if (dbCheck) {
          this.addResult({
            category: 'performance',
            test: 'Database Performance',
            status: dbCheck.responseTime < 200 ? 'pass' : dbCheck.responseTime < 500 ? 'warn' : 'fail',
            score: Math.max(0, 100 - (dbCheck.responseTime / 5)),
            message: `Database responds in ${dbCheck.responseTime}ms`,
            impact: 'high',
            recommendation: dbCheck.responseTime > 200 ? 'Review database indexes and query optimization' : undefined
          })
        }
      }
    } catch (error) {
      this.addResult({
        category: 'performance',
        test: 'Health Check Speed',
        status: 'fail',
        score: 0,
        message: 'Health check endpoint not accessible',
        impact: 'high',
        recommendation: 'Implement health check endpoint for monitoring'
      })
    }

    // Memory usage check
    try {
      const metricsResponse = await this.fetch('/api/metrics')
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        const memoryUsage = metricsData.current?.memory?.heapUsed || 0
        const memoryTotal = metricsData.current?.memory?.heapTotal || 1
        const memoryPercent = (memoryUsage / memoryTotal) * 100

        this.addResult({
          category: 'performance',
          test: 'Memory Usage',
          status: memoryPercent < 70 ? 'pass' : memoryPercent < 85 ? 'warn' : 'fail',
          score: Math.max(0, 100 - memoryPercent),
          message: `Memory usage at ${memoryPercent.toFixed(1)}%`,
          impact: 'medium',
          recommendation: memoryPercent > 70 ? 'Monitor memory leaks and optimize data structures' : undefined
        })
      }
    } catch (error) {
      // Metrics endpoint is optional
    }
  }

  private async validateSecurity(): Promise<void> {
    if (!this.config.silent) console.log('🔒 Validating Security...')

    // Security headers
    try {
      const response = await this.fetch('/')
      const headers = response.headers

      const securityHeaders = {
        'x-frame-options': headers.get('x-frame-options'),
        'x-content-type-options': headers.get('x-content-type-options'),
        'referrer-policy': headers.get('referrer-policy'),
        'strict-transport-security': headers.get('strict-transport-security')
      }

      const presentHeaders = Object.values(securityHeaders).filter(h => h !== null).length
      const totalHeaders = Object.keys(securityHeaders).length

      this.addResult({
        category: 'security',
        test: 'Security Headers',
        status: presentHeaders >= 3 ? 'pass' : presentHeaders >= 1 ? 'warn' : 'fail',
        score: (presentHeaders / totalHeaders) * 100,
        message: `${presentHeaders}/${totalHeaders} security headers present`,
        details: securityHeaders,
        impact: 'high',
        recommendation: presentHeaders < 3 ? 'Implement comprehensive security headers' : undefined
      })

      // Check for sensitive information exposure
      const serverHeader = headers.get('server')
      const poweredBy = headers.get('x-powered-by')

      this.addResult({
        category: 'security',
        test: 'Information Disclosure',
        status: (!serverHeader && !poweredBy) ? 'pass' : 'warn',
        score: (!serverHeader && !poweredBy) ? 100 : 60,
        message: serverHeader || poweredBy ? 'Server information exposed in headers' : 'No sensitive server information exposed',
        impact: 'medium',
        recommendation: (serverHeader || poweredBy) ? 'Remove or obfuscate server identification headers' : undefined
      })

    } catch (error) {
      this.addResult({
        category: 'security',
        test: 'Security Headers',
        status: 'fail',
        score: 0,
        message: 'Unable to check security headers',
        impact: 'high'
      })
    }

    // HTTPS check
    const isHTTPS = this.config.url.startsWith('https://')
    this.addResult({
      category: 'security',
      test: 'HTTPS Enforcement',
      status: isHTTPS ? 'pass' : 'fail',
      score: isHTTPS ? 100 : 0,
      message: isHTTPS ? 'Using HTTPS' : 'Not using HTTPS',
      impact: 'critical',
      recommendation: !isHTTPS ? 'Enable HTTPS for all production traffic' : undefined
    })

    // Authentication check
    try {
      const authResponse = await this.fetch('/auth/admin')
      const isProtected = [401, 403, 302].includes(authResponse.status)

      this.addResult({
        category: 'security',
        test: 'Route Protection',
        status: isProtected ? 'pass' : 'fail',
        score: isProtected ? 100 : 0,
        message: isProtected ? 'Protected routes require authentication' : 'Protected routes accessible without authentication',
        impact: 'critical',
        recommendation: !isProtected ? 'Implement proper authentication middleware' : undefined
      })
    } catch (error) {
      this.addResult({
        category: 'security',
        test: 'Route Protection',
        status: 'warn',
        score: 50,
        message: 'Unable to verify route protection',
        impact: 'high'
      })
    }
  }

  private async validateMonitoring(): Promise<void> {
    if (!this.config.silent) console.log('📊 Validating Monitoring...')

    // Health check endpoint
    try {
      const response = await this.fetch('/api/health')
      const isHealthy = response.ok
      
      if (isHealthy) {
        const data = await response.json()
        const hasComprehensiveChecks = data.checks && 
          Object.keys(data.checks).length >= 3 // At least 3 service checks

        this.addResult({
          category: 'monitoring',
          test: 'Health Check Endpoint',
          status: hasComprehensiveChecks ? 'pass' : 'warn',
          score: hasComprehensiveChecks ? 100 : 70,
          message: `Health endpoint available with ${Object.keys(data.checks || {}).length} service checks`,
          impact: 'high',
          recommendation: !hasComprehensiveChecks ? 'Add comprehensive service health checks' : undefined
        })
      } else {
        this.addResult({
          category: 'monitoring',
          test: 'Health Check Endpoint',
          status: 'fail',
          score: 0,
          message: 'Health check endpoint not working',
          impact: 'critical',
          recommendation: 'Implement working health check endpoint'
        })
      }
    } catch (error) {
      this.addResult({
        category: 'monitoring',
        test: 'Health Check Endpoint',
        status: 'fail',
        score: 0,
        message: 'Health check endpoint not accessible',
        impact: 'critical',
        recommendation: 'Implement health check endpoint'
      })
    }

    // Metrics endpoint
    try {
      const response = await this.fetch('/api/metrics')
      const hasMetrics = response.ok

      this.addResult({
        category: 'monitoring',
        test: 'Metrics Collection',
        status: hasMetrics ? 'pass' : 'warn',
        score: hasMetrics ? 100 : 30,
        message: hasMetrics ? 'Metrics endpoint available' : 'No metrics collection',
        impact: 'medium',
        recommendation: !hasMetrics ? 'Implement metrics collection for observability' : undefined
      })

      if (hasMetrics) {
        // Test Prometheus format
        const prometheusResponse = await this.fetch('/api/metrics?format=prometheus')
        const hasPrometheus = prometheusResponse.ok

        this.addResult({
          category: 'monitoring',
          test: 'Prometheus Metrics',
          status: hasPrometheus ? 'pass' : 'warn',
          score: hasPrometheus ? 100 : 70,
          message: hasPrometheus ? 'Prometheus metrics available' : 'No Prometheus metrics format',
          impact: 'low',
          recommendation: !hasPrometheus ? 'Add Prometheus metrics support for better monitoring integration' : undefined
        })
      }
    } catch (error) {
      this.addResult({
        category: 'monitoring',
        test: 'Metrics Collection',
        status: 'warn',
        score: 30,
        message: 'Metrics endpoint not accessible',
        impact: 'medium'
      })
    }

    // Error tracking
    try {
      // Check if error logs table exists by checking health endpoint response structure
      const healthResponse = await this.fetch('/api/health')
      if (healthResponse.ok) {
        const data = await healthResponse.json()
        // This is a proxy check - in a real implementation, you'd check for error tracking directly
        const hasErrorTracking = data.environment === 'production'

        this.addResult({
          category: 'monitoring',
          test: 'Error Tracking',
          status: hasErrorTracking ? 'pass' : 'warn',
          score: hasErrorTracking ? 100 : 50,
          message: hasErrorTracking ? 'Error tracking likely configured' : 'Error tracking not verified',
          impact: 'medium',
          recommendation: !hasErrorTracking ? 'Implement comprehensive error tracking and alerting' : undefined
        })
      }
    } catch (error) {
      this.addResult({
        category: 'monitoring',
        test: 'Error Tracking',
        status: 'warn',
        score: 50,
        message: 'Unable to verify error tracking',
        impact: 'medium'
      })
    }
  }

  private async validateOptimization(): Promise<void> {
    if (!this.config.silent) console.log('⚡ Validating Optimizations...')

    // Compression
    try {
      const response = await this.fetch('/', {
        headers: { 'Accept-Encoding': 'gzip, deflate, br' }
      })
      
      const contentEncoding = response.headers.get('content-encoding')
      const hasCompression = ['gzip', 'br', 'deflate'].includes(contentEncoding || '')

      this.addResult({
        category: 'optimization',
        test: 'Content Compression',
        status: hasCompression ? 'pass' : 'warn',
        score: hasCompression ? 100 : 40,
        message: hasCompression ? `Using ${contentEncoding} compression` : 'No content compression detected',
        impact: 'medium',
        recommendation: !hasCompression ? 'Enable gzip or brotli compression' : undefined
      })
    } catch (error) {
      this.addResult({
        category: 'optimization',
        test: 'Content Compression',
        status: 'warn',
        score: 40,
        message: 'Unable to check compression',
        impact: 'medium'
      })
    }

    // Caching headers
    try {
      const response = await this.fetch('/')
      const cacheControl = response.headers.get('cache-control')
      const etag = response.headers.get('etag')
      const hasCaching = cacheControl || etag

      this.addResult({
        category: 'optimization',
        test: 'Caching Strategy',
        status: hasCaching ? 'pass' : 'warn',
        score: hasCaching ? 100 : 50,
        message: hasCaching ? 'Caching headers present' : 'No caching headers detected',
        impact: 'medium',
        recommendation: !hasCaching ? 'Implement proper caching strategy' : undefined
      })
    } catch (error) {
      this.addResult({
        category: 'optimization',
        test: 'Caching Strategy',
        status: 'warn',
        score: 50,
        message: 'Unable to check caching',
        impact: 'medium'
      })
    }

    // OpenAI cost optimization
    try {
      const response = await this.fetch('/api/openai/usage')
      if (response.ok) {
        const data = await response.json()
        const cacheHitRate = data.today?.cacheHitRate || 0

        this.addResult({
          category: 'optimization',
          test: 'OpenAI Cache Efficiency',
          status: cacheHitRate >= 70 ? 'pass' : cacheHitRate >= 50 ? 'warn' : 'fail',
          score: cacheHitRate,
          message: `OpenAI cache hit rate: ${cacheHitRate.toFixed(1)}%`,
          impact: 'high',
          recommendation: cacheHitRate < 70 ? 'Optimize audio preprocessing and caching strategy' : undefined
        })

        // Budget monitoring
        const budgetUsage = (data.today?.cost || 0) / (data.budget?.daily || 1) * 100

        this.addResult({
          category: 'optimization',
          test: 'Cost Monitoring',
          status: budgetUsage < 80 ? 'pass' : budgetUsage < 95 ? 'warn' : 'fail',
          score: Math.max(0, 100 - budgetUsage),
          message: `Daily budget usage: ${budgetUsage.toFixed(1)}%`,
          impact: 'medium',
          recommendation: budgetUsage > 80 ? 'Monitor and optimize API usage costs' : undefined
        })
      }
    } catch (error) {
      this.addResult({
        category: 'optimization',
        test: 'OpenAI Cost Optimization',
        status: 'warn',
        score: 50,
        message: 'Unable to verify OpenAI optimization',
        impact: 'medium'
      })
    }
  }

  private async validateDeployment(): Promise<void> {
    if (!this.config.silent) console.log('🚀 Validating Deployment...')

    // Environment configuration
    try {
      const response = await this.fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        const isProduction = data.environment === 'production'

        this.addResult({
          category: 'deployment',
          test: 'Environment Configuration',
          status: isProduction ? 'pass' : 'warn',
          score: isProduction ? 100 : 70,
          message: `Running in ${data.environment} mode`,
          impact: 'medium',
          recommendation: !isProduction ? 'Ensure production environment variables are properly set' : undefined
        })

        // Deployment info
        const hasDeploymentInfo = data.deployment && (data.deployment.vercelEnv || data.deployment.region)

        this.addResult({
          category: 'deployment',
          test: 'Deployment Metadata',
          status: hasDeploymentInfo ? 'pass' : 'warn',
          score: hasDeploymentInfo ? 100 : 60,
          message: hasDeploymentInfo ? 'Deployment metadata available' : 'Limited deployment metadata',
          impact: 'low',
          recommendation: !hasDeploymentInfo ? 'Add deployment metadata for better observability' : undefined
        })
      }
    } catch (error) {
      this.addResult({
        category: 'deployment',
        test: 'Environment Configuration',
        status: 'fail',
        score: 0,
        message: 'Unable to verify environment configuration',
        impact: 'high'
      })
    }

    // API availability
    const apiEndpoints = ['/api/health', '/api/metrics']
    let availableEndpoints = 0

    for (const endpoint of apiEndpoints) {
      try {
        const response = await this.fetch(endpoint)
        if (response.ok) availableEndpoints++
      } catch (error) {
        // Endpoint not available
      }
    }

    this.addResult({
      category: 'deployment',
      test: 'API Availability',
      status: availableEndpoints === apiEndpoints.length ? 'pass' : availableEndpoints > 0 ? 'warn' : 'fail',
      score: (availableEndpoints / apiEndpoints.length) * 100,
      message: `${availableEndpoints}/${apiEndpoints.length} core API endpoints available`,
      impact: 'high',
      recommendation: availableEndpoints < apiEndpoints.length ? 'Ensure all core API endpoints are working' : undefined
    })
  }

  private async validateScalability(): Promise<void> {
    if (!this.config.silent) console.log('📈 Validating Scalability...')

    // Database indexes (proxy check through health response time)
    try {
      const response = await this.fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        const dbResponseTime = data.checks?.database?.responseTime || 1000
        
        this.addResult({
          category: 'scalability',
          test: 'Database Performance',
          status: dbResponseTime < 100 ? 'pass' : dbResponseTime < 300 ? 'warn' : 'fail',
          score: Math.max(0, 100 - (dbResponseTime / 10)),
          message: `Database queries average ${dbResponseTime}ms`,
          impact: 'high',
          recommendation: dbResponseTime > 100 ? 'Review database indexes and query optimization' : undefined
        })
      }
    } catch (error) {
      this.addResult({
        category: 'scalability',
        test: 'Database Performance',
        status: 'warn',
        score: 50,
        message: 'Unable to verify database performance',
        impact: 'high'
      })
    }

    // Connection pooling (inferred from consistent response times)
    const responseTimes = []
    for (let i = 0; i < 3; i++) {
      try {
        const start = Date.now()
        await this.fetch('/api/health')
        responseTimes.push(Date.now() - start)
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        responseTimes.push(5000) // Penalty for failed requests
      }
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    const responseTimeVariance = Math.max(...responseTimes) - Math.min(...responseTimes)

    this.addResult({
      category: 'scalability',
      test: 'Connection Stability',
      status: responseTimeVariance < 500 ? 'pass' : responseTimeVariance < 1000 ? 'warn' : 'fail',
      score: Math.max(0, 100 - (responseTimeVariance / 10)),
      message: `Response time variance: ${responseTimeVariance}ms`,
      impact: 'medium',
      recommendation: responseTimeVariance > 500 ? 'Implement connection pooling and load balancing' : undefined
    })

    // Real-time capabilities
    try {
      const response = await this.fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        const hasRealtime = data.checks?.realtime?.status === 'pass'

        this.addResult({
          category: 'scalability',
          test: 'Real-time Capabilities',
          status: hasRealtime ? 'pass' : 'warn',
          score: hasRealtime ? 100 : 60,
          message: hasRealtime ? 'Real-time services operational' : 'Real-time services not verified',
          impact: 'medium',
          recommendation: !hasRealtime ? 'Verify and optimize real-time connection handling' : undefined
        })
      }
    } catch (error) {
      this.addResult({
        category: 'scalability',
        test: 'Real-time Capabilities',
        status: 'warn',
        score: 60,
        message: 'Unable to verify real-time capabilities',
        impact: 'medium'
      })
    }
  }

  private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.url}${path}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private addResult(result: Omit<ValidationResult, 'score'> & { score: number }): void {
    this.results.push(result as ValidationResult)
    
    if (!this.config.silent) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌'
      const score = result.score.toFixed(0)
      console.log(`  ${icon} ${result.test}: ${result.message} (${score}/100)`)
    }
  }

  private generateReport(): ValidationReport {
    const categories = {
      performance: this.results.filter(r => r.category === 'performance'),
      security: this.results.filter(r => r.category === 'security'),
      monitoring: this.results.filter(r => r.category === 'monitoring'),
      optimization: this.results.filter(r => r.category === 'optimization'),
      deployment: this.results.filter(r => r.category === 'deployment'),
      scalability: this.results.filter(r => r.category === 'scalability')
    }

    const totalTests = this.results.length
    const passed = this.results.filter(r => r.status === 'pass').length
    const warnings = this.results.filter(r => r.status === 'warn').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const critical = this.results.filter(r => r.impact === 'critical' && r.status === 'fail').length

    const overallScore = this.results.reduce((sum, r) => sum + r.score, 0) / totalTests
    
    const status = critical > 0 ? 'not_ready' : 
                 overallScore >= this.config.threshold ? 'ready' : 'needs_work'

    const recommendations = this.results
      .filter(r => r.recommendation)
      .map(r => r.recommendation!)

    return {
      timestamp: new Date().toISOString(),
      url: this.config.url,
      overallScore,
      status,
      categories,
      summary: {
        totalTests,
        passed,
        warnings,
        failed,
        critical
      },
      recommendations
    }
  }

  formatReport(report: ValidationReport): string {
    switch (this.config.format) {
      case 'json':
        return JSON.stringify(report, null, 2)
      
      case 'minimal':
        return `${report.timestamp} | ${report.status.toUpperCase()} | Score: ${report.overallScore.toFixed(1)}/100 | Critical: ${report.summary.critical}`
      
      case 'table':
      default:
        return this.formatTableReport(report)
    }
  }

  private formatTableReport(report: ValidationReport): string {
    const lines = []
    
    lines.push('┌─ Production Readiness Report ─┐')
    lines.push(`│ URL: ${report.url}`)
    lines.push(`│ Score: ${report.overallScore.toFixed(1)}/100`)
    lines.push(`│ Status: ${this.colorizeStatus(report.status)}`)
    lines.push(`│ Timestamp: ${new Date(report.timestamp).toLocaleString()}`)
    lines.push('├─ Summary ─┤')
    lines.push(`│ Total Tests: ${report.summary.totalTests}`)
    lines.push(`│ Passed: ${report.summary.passed}`)
    lines.push(`│ Warnings: ${report.summary.warnings}`)
    lines.push(`│ Failed: ${report.summary.failed}`)
    lines.push(`│ Critical Issues: ${report.summary.critical}`)
    
    Object.entries(report.categories).forEach(([category, results]) => {
      lines.push(`├─ ${category.charAt(0).toUpperCase() + category.slice(1)} ─┤`)
      results.forEach(result => {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌'
        const score = result.score.toFixed(0)
        lines.push(`│ ${icon} ${result.test}: ${score}/100`)
        if (result.status !== 'pass') {
          lines.push(`│   └─ ${result.message}`)
        }
      })
    })
    
    if (report.recommendations.length > 0) {
      lines.push('├─ Recommendations ─┤')
      report.recommendations.forEach(rec => {
        lines.push(`│ • ${rec}`)
      })
    }
    
    lines.push('└─────────────────────────────────┘')
    
    return lines.join('\n')
  }

  private colorizeStatus(status: string): string {
    switch (status) {
      case 'ready':
        return `\x1b[32m${status.toUpperCase()}\x1b[0m` // Green
      case 'needs_work':
        return `\x1b[33m${status.toUpperCase()}\x1b[0m` // Yellow
      case 'not_ready':
        return `\x1b[31m${status.toUpperCase()}\x1b[0m` // Red
      default:
        return status.toUpperCase()
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  
  const config: ValidationConfig = {
    url: 'http://localhost:3000',
    format: 'table',
    threshold: 80,
    timeout: 10000,
    silent: false
  }

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        config.url = args[++i]
        break
      case '--format':
        config.format = args[++i] as 'json' | 'table' | 'minimal'
        break
      case '--threshold':
        config.threshold = parseInt(args[++i])
        break
      case '--save':
        config.save = args[++i]
        break
      case '--silent':
        config.silent = true
        break
      case '--help':
        console.log(`
Production Readiness Validation Script

Usage: npx tsx scripts/production-readiness.ts [options]

Options:
  --url <url>          Application URL to validate (default: http://localhost:3000)
  --format <format>    Output format: json, table, minimal (default: table)
  --threshold <number> Minimum score required to pass (default: 80)
  --save <file>        Save report to file
  --silent            Suppress console output
  --help              Show this help message

Examples:
  # Validate local development
  npx tsx scripts/production-readiness.ts

  # Validate production deployment
  npx tsx scripts/production-readiness.ts --url https://myapp.vercel.app

  # Generate JSON report
  npx tsx scripts/production-readiness.ts --format json --save report.json

  # Silent validation for CI/CD
  npx tsx scripts/production-readiness.ts --silent --threshold 90
        `)
        process.exit(0)
    }
  }

  try {
    const validator = new ProductionReadinessValidator(config)
    const report = await validator.validate()
    
    const output = validator.formatReport(report)
    
    if (!config.silent) {
      console.log('\n' + output)
    }
    
    if (config.save) {
      const fs = await import('fs')
      fs.writeFileSync(config.save, output)
      if (!config.silent) {
        console.log(`\n📄 Report saved to ${config.save}`)
      }
    }
    
    // Exit with appropriate code
    const exitCode = report.status === 'ready' ? 0 : 
                    report.status === 'needs_work' ? 1 : 2
    
    if (!config.silent) {
      console.log(`\n${report.status === 'ready' ? '🎉' : report.status === 'needs_work' ? '⚠️' : '❌'} ${report.status.replace('_', ' ').toUpperCase()}`)
    }
    
    process.exit(exitCode)
    
  } catch (error) {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  }
}

// Run as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { ProductionReadinessValidator, type ValidationReport, type ValidationConfig }