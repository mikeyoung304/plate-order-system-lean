#!/usr/bin/env tsx

/**
 * Health Monitor Script
 * 
 * Monitors the health of the deployed application and provides alerts.
 * Can be run manually, as a cron job, or in CI/CD pipelines.
 * 
 * Usage:
 *   npx tsx scripts/health-monitor.ts [options]
 * 
 * Options:
 *   --url <url>           Application URL to monitor (default: http://localhost:3000)
 *   --interval <seconds>  Monitoring interval in seconds (default: 60)
 *   --threshold <number>  Failure threshold before alert (default: 3)
 *   --webhook <url>       Webhook URL for alerts
 *   --slack <webhook>     Slack webhook for notifications
 *   --continuous          Run continuously (default: single check)
 *   --silent             Suppress console output
 *   --format <format>     Output format: json, table, minimal (default: table)
 */

import { readFileSync } from 'fs'
import { join } from 'path'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  checks: {
    database: HealthCheck
    auth: HealthCheck
    openai: HealthCheck
    storage: HealthCheck
    realtime: HealthCheck
  }
  performance: {
    responseTime: number
    uptime: number
    memoryUsage: any
  }
  deployment: {
    vercelEnv?: string
    region?: string
    gitCommit?: string
  }
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn'
  message: string
  responseTime?: number
  details?: any
}

interface MonitorConfig {
  url: string
  interval: number
  threshold: number
  webhook?: string
  slack?: string
  continuous: boolean
  silent: boolean
  format: 'json' | 'table' | 'minimal'
}

interface AlertHistory {
  timestamp: string
  status: string
  consecutiveFailures: number
  details: string
}

class HealthMonitor {
  private config: MonitorConfig
  private consecutiveFailures = 0
  private lastAlertTime = 0
  private alertHistory: AlertHistory[] = []
  private isRunning = false

  constructor(config: MonitorConfig) {
    this.config = config
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${this.config.url}/api/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Health-Monitor/1.0'
        },
        // Set timeout
        signal: AbortSignal.timeout(10000)
      })

      const result: HealthCheckResult = await response.json()
      
      // Add network timing information
      result.performance.responseTime = Date.now() - startTime
      
      return result
      
    } catch (error) {
      // Return failed health check if endpoint is unreachable
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: 'unknown',
        environment: 'unknown',
        checks: {
          database: { status: 'fail', message: 'Endpoint unreachable' },
          auth: { status: 'fail', message: 'Endpoint unreachable' },
          openai: { status: 'fail', message: 'Endpoint unreachable' },
          storage: { status: 'fail', message: 'Endpoint unreachable' },
          realtime: { status: 'fail', message: 'Endpoint unreachable' }
        },
        performance: {
          responseTime: Date.now() - startTime,
          uptime: 0,
          memoryUsage: {}
        },
        deployment: {}
      }
    }
  }

  async sendAlert(result: HealthCheckResult): Promise<void> {
    const now = Date.now()
    const alertCooldown = 300000 // 5 minutes
    
    // Don't send alerts too frequently
    if (now - this.lastAlertTime < alertCooldown) {
      return
    }

    const alertData = {
      timestamp: result.timestamp,
      status: result.status,
      consecutiveFailures: this.consecutiveFailures,
      url: this.config.url,
      environment: result.environment,
      checks: result.checks,
      performance: result.performance
    }

    // Send to webhook if configured
    if (this.config.webhook) {
      try {
        await fetch(this.config.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData)
        })
      } catch (error) {
        console.error('Failed to send webhook alert:', error)
      }
    }

    // Send to Slack if configured
    if (this.config.slack) {
      const slackMessage = {
        text: `🚨 Health Check Alert - ${result.status.toUpperCase()}`,
        attachments: [
          {
            color: result.status === 'unhealthy' ? 'danger' : 'warning',
            fields: [
              { title: 'Status', value: result.status, short: true },
              { title: 'Environment', value: result.environment, short: true },
              { title: 'Consecutive Failures', value: this.consecutiveFailures.toString(), short: true },
              { title: 'Response Time', value: `${result.performance.responseTime}ms`, short: true },
              { title: 'Failed Checks', value: Object.entries(result.checks)
                .filter(([_, check]) => check.status === 'fail')
                .map(([name, check]) => `${name}: ${check.message}`)
                .join('\n'), short: false }
            ],
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      }

      try {
        await fetch(this.config.slack, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        })
      } catch (error) {
        console.error('Failed to send Slack alert:', error)
      }
    }

    this.lastAlertTime = now
    this.alertHistory.push({
      timestamp: result.timestamp,
      status: result.status,
      consecutiveFailures: this.consecutiveFailures,
      details: Object.entries(result.checks)
        .filter(([_, check]) => check.status === 'fail')
        .map(([name, check]) => `${name}: ${check.message}`)
        .join('; ')
    })

    // Keep only last 50 alerts
    if (this.alertHistory.length > 50) {
      this.alertHistory = this.alertHistory.slice(-50)
    }
  }

  formatOutput(result: HealthCheckResult): string {
    switch (this.config.format) {
      case 'json':
        return JSON.stringify(result, null, 2)
      
      case 'minimal':
        const failed = Object.entries(result.checks)
          .filter(([_, check]) => check.status === 'fail')
          .map(([name]) => name)
        return `${result.timestamp} | ${result.status.toUpperCase()} | ${result.performance.responseTime}ms${failed.length ? ` | Failed: ${failed.join(',')}` : ''}`
      
      case 'table':
      default:
        const lines = [
          `┌─ Health Check Results (${result.timestamp}) ─┐`,
          `│ Status: ${this.colorizeStatus(result.status)} │`,
          `│ Response Time: ${result.performance.responseTime}ms │`,
          `│ Environment: ${result.environment} │`,
          `│ Version: ${result.version} │`,
          `├─ Service Checks ─┤`,
        ]
        
        Object.entries(result.checks).forEach(([name, check]) => {
          const status = this.colorizeStatus(check.status)
          const time = check.responseTime ? ` (${check.responseTime}ms)` : ''
          lines.push(`│ ${name}: ${status}${time} │`)
          if (check.status !== 'pass') {
            lines.push(`│   └─ ${check.message} │`)
          }
        })
        
        if (result.deployment.vercelEnv) {
          lines.push(`├─ Deployment Info ─┤`)
          lines.push(`│ Environment: ${result.deployment.vercelEnv} │`)
          if (result.deployment.region) {
            lines.push(`│ Region: ${result.deployment.region} │`)
          }
          if (result.deployment.gitCommit) {
            lines.push(`│ Commit: ${result.deployment.gitCommit.substring(0, 8)} │`)
          }
        }
        
        lines.push(`└─────────────────────────────────────────────┘`)
        
        return lines.join('\n')
    }
  }

  private colorizeStatus(status: string): string {
    switch (status) {
      case 'healthy':
      case 'pass':
        return `\x1b[32m${status.toUpperCase()}\x1b[0m` // Green
      case 'degraded':
      case 'warn':
        return `\x1b[33m${status.toUpperCase()}\x1b[0m` // Yellow
      case 'unhealthy':
      case 'fail':
        return `\x1b[31m${status.toUpperCase()}\x1b[0m` // Red
      default:
        return status.toUpperCase()
    }
  }

  async runSingleCheck(): Promise<HealthCheckResult> {
    const result = await this.checkHealth()
    
    // Update failure counter
    if (result.status === 'unhealthy') {
      this.consecutiveFailures++
    } else {
      this.consecutiveFailures = 0
    }

    // Send alert if threshold exceeded
    if (this.consecutiveFailures >= this.config.threshold && (this.config.webhook || this.config.slack)) {
      await this.sendAlert(result)
    }

    // Output result unless silent
    if (!this.config.silent) {
      console.log(this.formatOutput(result))
    }

    return result
  }

  async runContinuous(): Promise<void> {
    this.isRunning = true
    
    if (!this.config.silent) {
      console.log(`🔍 Starting continuous health monitoring...`)
      console.log(`📍 URL: ${this.config.url}`)
      console.log(`⏱️ Interval: ${this.config.interval}s`)
      console.log(`🚨 Alert threshold: ${this.config.threshold} consecutive failures`)
      console.log('━'.repeat(50))
    }

    while (this.isRunning) {
      await this.runSingleCheck()
      
      if (this.isRunning) {
        await new Promise(resolve => setTimeout(resolve, this.config.interval * 1000))
      }
    }
  }

  stop(): void {
    this.isRunning = false
  }

  getStats() {
    return {
      consecutiveFailures: this.consecutiveFailures,
      alertHistory: this.alertHistory,
      isRunning: this.isRunning
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  
  const config: MonitorConfig = {
    url: 'http://localhost:3000',
    interval: 60,
    threshold: 3,
    continuous: false,
    silent: false,
    format: 'table'
  }

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        config.url = args[++i]
        break
      case '--interval':
        config.interval = parseInt(args[++i])
        break
      case '--threshold':
        config.threshold = parseInt(args[++i])
        break
      case '--webhook':
        config.webhook = args[++i]
        break
      case '--slack':
        config.slack = args[++i]
        break
      case '--continuous':
        config.continuous = true
        break
      case '--silent':
        config.silent = true
        break
      case '--format':
        config.format = args[++i] as 'json' | 'table' | 'minimal'
        break
      case '--help':
        console.log(`
Health Monitor Script

Usage: npx tsx scripts/health-monitor.ts [options]

Options:
  --url <url>           Application URL to monitor (default: http://localhost:3000)
  --interval <seconds>  Monitoring interval in seconds (default: 60)
  --threshold <number>  Failure threshold before alert (default: 3)
  --webhook <url>       Webhook URL for alerts
  --slack <webhook>     Slack webhook for notifications
  --continuous          Run continuously (default: single check)
  --silent             Suppress console output
  --format <format>     Output format: json, table, minimal (default: table)
  --help               Show this help message

Examples:
  # Single health check
  npx tsx scripts/health-monitor.ts --url https://myapp.vercel.app

  # Continuous monitoring with Slack alerts
  npx tsx scripts/health-monitor.ts --continuous --slack https://hooks.slack.com/...

  # Production monitoring with webhook
  npx tsx scripts/health-monitor.ts --url https://prod.app.com --continuous --threshold 2 --webhook https://alerts.company.com/webhook
        `)
        process.exit(0)
    }
  }

  const monitor = new HealthMonitor(config)

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down health monitor...')
    monitor.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...')
    monitor.stop()
    process.exit(0)
  })

  try {
    if (config.continuous) {
      await monitor.runContinuous()
    } else {
      const result = await monitor.runSingleCheck()
      process.exit(result.status === 'healthy' ? 0 : 1)
    }
  } catch (error) {
    console.error('❌ Health monitor failed:', error)
    process.exit(1)
  }
}

// Run as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { HealthMonitor, type HealthCheckResult, type MonitorConfig }