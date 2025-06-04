/**
 * Error Tracking and Alerting System
 * 
 * Provides comprehensive error tracking, logging, and alerting capabilities
 * for the Plater Restaurant System.
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import { env } from '@/lib/env'

export interface ErrorEvent {
  id?: string
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  stack?: string
  context: {
    url?: string
    userAgent?: string
    userId?: string
    sessionId?: string
    component?: string
    action?: string
    environment: string
  }
  metadata?: Record<string, any>
  fingerprint?: string
  count?: number
}

export interface AlertRule {
  id: string
  name: string
  condition: {
    type: 'threshold' | 'anomaly' | 'pattern'
    field: string
    operator: 'gt' | 'lt' | 'eq' | 'contains'
    value: number | string
    timeWindow: number // minutes
  }
  actions: AlertAction[]
  enabled: boolean
}

export interface AlertAction {
  type: 'slack' | 'webhook' | 'email'
  config: {
    url?: string
    email?: string
    template?: string
  }
}

class ErrorTracker {
  private supabase = createClient()
  private sessionId: string
  private userId?: string
  private context: Partial<ErrorEvent['context']> = {}
  private errorBuffer: ErrorEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private alertRules: AlertRule[] = []

  constructor() {
    this.sessionId = this.generateSessionId()
    this.context = {
      environment: env.NODE_ENV,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }
    
    // Setup automatic error catching
    this.setupGlobalErrorHandlers()
    
    // Setup periodic flush
    this.startFlushInterval()
    
    // Load alert rules
    this.loadAlertRules()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private setupGlobalErrorHandlers() {
    if (typeof window !== 'undefined') {
      // Catch unhandled errors
      window.addEventListener('error', (event) => {
        this.captureError(event.error || new Error(event.message), {
          component: 'global',
          action: 'unhandled_error'
        })
      })

      // Catch unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(new Error(event.reason), {
          component: 'global',
          action: 'unhandled_rejection'
        })
      })

      // Catch React errors (if using error boundary)
      this.setupReactErrorBoundary()
    }
  }

  private setupReactErrorBoundary() {
    // This would be integrated with React Error Boundary
    // For now, we'll provide a manual method
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 5000) // Flush every 5 seconds
  }

  setUser(userId: string) {
    this.userId = userId
    this.context.userId = userId
  }

  setContext(context: Partial<ErrorEvent['context']>) {
    this.context = { ...this.context, ...context }
  }

  captureError(error: Error | string, metadata?: Record<string, any>): string {
    const errorEvent: ErrorEvent = {
      id: this.generateSessionId(),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context: {
        ...this.context,
        ...metadata
      },
      metadata,
      fingerprint: this.generateFingerprint(error, metadata)
    }

    this.errorBuffer.push(errorEvent)
    
    // Check for immediate alerts
    this.checkAlertRules(errorEvent)
    
    // Flush immediately for critical errors
    if (this.isCriticalError(errorEvent)) {
      this.flush()
    }

    return errorEvent.id!
  }

  captureWarning(message: string, metadata?: Record<string, any>): string {
    const errorEvent: ErrorEvent = {
      id: this.generateSessionId(),
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context: {
        ...this.context,
        ...metadata
      },
      metadata,
      fingerprint: this.generateFingerprint(message, metadata)
    }

    this.errorBuffer.push(errorEvent)
    return errorEvent.id!
  }

  captureInfo(message: string, metadata?: Record<string, any>): string {
    const errorEvent: ErrorEvent = {
      id: this.generateSessionId(),
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context: {
        ...this.context,
        ...metadata
      },
      metadata,
      fingerprint: this.generateFingerprint(message, metadata)
    }

    this.errorBuffer.push(errorEvent)
    return errorEvent.id!
  }

  private generateFingerprint(error: Error | string, metadata?: Record<string, any>): string {
    const message = typeof error === 'string' ? error : error.message
    const component = metadata?.component || 'unknown'
    const action = metadata?.action || 'unknown'
    
    // Create a unique fingerprint for grouping similar errors
    const fingerprintString = `${component}:${action}:${message.substring(0, 100)}`
    
    // Simple hash function
    let hash = 0
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return hash.toString(36)
  }

  private isCriticalError(errorEvent: ErrorEvent): boolean {
    const criticalPatterns = [
      /database.*connection/i,
      /payment.*failed/i,
      /authentication.*error/i,
      /security.*violation/i,
      /out of memory/i
    ]
    
    return criticalPatterns.some(pattern => pattern.test(errorEvent.message))
  }

  private async flush() {
    if (this.errorBuffer.length === 0) return

    const events = [...this.errorBuffer]
    this.errorBuffer = []

    try {
      // Store in Supabase
      const { error } = await this.supabase
        .from('error_logs')
        .insert(events.map(event => ({
          ...event,
          context: JSON.stringify(event.context),
          metadata: JSON.stringify(event.metadata)
        })))

      if (error) {
        console.error('Failed to store error logs:', error)
        // Re-add to buffer for retry
        this.errorBuffer.unshift(...events)
      }
    } catch (error) {
      console.error('Error tracker flush failed:', error)
      // Re-add to buffer for retry
      this.errorBuffer.unshift(...events)
    }
  }

  private async loadAlertRules() {
    try {
      const { data, error } = await this.supabase
        .from('alert_rules')
        .select('*')
        .eq('enabled', true)

      if (error) {
        console.error('Failed to load alert rules:', error)
        return
      }

      this.alertRules = data || []
    } catch (error) {
      console.error('Failed to load alert rules:', error)
    }
  }

  private async checkAlertRules(errorEvent: ErrorEvent) {
    for (const rule of this.alertRules) {
      if (await this.evaluateRule(rule, errorEvent)) {
        await this.triggerAlert(rule, errorEvent)
      }
    }
  }

  private async evaluateRule(rule: AlertRule, errorEvent: ErrorEvent): Promise<boolean> {
    const { condition } = rule
    
    switch (condition.type) {
      case 'threshold':
        return this.evaluateThresholdRule(rule, errorEvent)
      case 'pattern':
        return this.evaluatePatternRule(rule, errorEvent)
      case 'anomaly':
        return this.evaluateAnomalyRule(rule, errorEvent)
      default:
        return false
    }
  }

  private async evaluateThresholdRule(rule: AlertRule, errorEvent: ErrorEvent): Promise<boolean> {
    const { condition } = rule
    const timeWindow = new Date(Date.now() - condition.timeWindow * 60 * 1000)
    
    try {
      const { count, error } = await this.supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', timeWindow.toISOString())
        .eq('level', condition.field)

      if (error) return false

      const actualCount = count || 0
      
      switch (condition.operator) {
        case 'gt':
          return actualCount > condition.value
        case 'lt':
          return actualCount < condition.value
        case 'eq':
          return actualCount === condition.value
        default:
          return false
      }
    } catch (error) {
      console.error('Failed to evaluate threshold rule:', error)
      return false
    }
  }

  private evaluatePatternRule(rule: AlertRule, errorEvent: ErrorEvent): boolean {
    const { condition } = rule
    const value = condition.value as string
    
    switch (condition.operator) {
      case 'contains':
        return errorEvent.message.toLowerCase().includes(value.toLowerCase())
      case 'eq':
        return errorEvent.message === value
      default:
        return false
    }
  }

  private async evaluateAnomalyRule(rule: AlertRule, errorEvent: ErrorEvent): Promise<boolean> {
    // Simple anomaly detection: check if error rate is 3x higher than usual
    const now = new Date()
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
    const lastWeekSameHour = new Date(currentHour.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    try {
      const [currentCount, historicalCount] = await Promise.all([
        this.supabase
          .from('error_logs')
          .select('*', { count: 'exact', head: true })
          .gte('timestamp', currentHour.toISOString())
          .eq('level', 'error'),
        this.supabase
          .from('error_logs')
          .select('*', { count: 'exact', head: true })
          .gte('timestamp', lastWeekSameHour.toISOString())
          .lt('timestamp', new Date(lastWeekSameHour.getTime() + 60 * 60 * 1000).toISOString())
          .eq('level', 'error')
      ])

      const current = currentCount.count || 0
      const historical = historicalCount.count || 0
      
      return current > (historical * 3)
    } catch (error) {
      console.error('Failed to evaluate anomaly rule:', error)
      return false
    }
  }

  private async triggerAlert(rule: AlertRule, errorEvent: ErrorEvent) {
    for (const action of rule.actions) {
      try {
        await this.executeAlertAction(action, rule, errorEvent)
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error)
      }
    }
  }

  private async executeAlertAction(action: AlertAction, rule: AlertRule, errorEvent: ErrorEvent) {
    switch (action.type) {
      case 'slack':
        await this.sendSlackAlert(action.config.url!, rule, errorEvent)
        break
      case 'webhook':
        await this.sendWebhookAlert(action.config.url!, rule, errorEvent)
        break
      case 'email':
        // Would integrate with email service
        console.log('Email alert not implemented:', action.config.email)
        break
    }
  }

  private async sendSlackAlert(webhookUrl: string, rule: AlertRule, errorEvent: ErrorEvent) {
    const message = {
      text: `🚨 Alert: ${rule.name}`,
      attachments: [
        {
          color: errorEvent.level === 'error' ? 'danger' : 'warning',
          fields: [
            { title: 'Level', value: errorEvent.level.toUpperCase(), short: true },
            { title: 'Component', value: errorEvent.context.component || 'Unknown', short: true },
            { title: 'Message', value: errorEvent.message, short: false },
            { title: 'Environment', value: errorEvent.context.environment, short: true },
            { title: 'Timestamp', value: new Date(errorEvent.timestamp).toLocaleString(), short: true }
          ],
          ts: Math.floor(new Date(errorEvent.timestamp).getTime() / 1000)
        }
      ]
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
  }

  private async sendWebhookAlert(webhookUrl: string, rule: AlertRule, errorEvent: ErrorEvent) {
    const payload = {
      rule: rule.name,
      event: errorEvent,
      triggeredAt: new Date().toISOString()
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  // Performance tracking methods
  trackPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
    if (duration > 1000) { // Log slow operations
      this.captureWarning(`Slow operation: ${operation} took ${duration}ms`, {
        component: 'performance',
        operation,
        duration,
        ...metadata
      })
    }
  }

  // User interaction tracking
  trackUserAction(action: string, metadata?: Record<string, any>) {
    this.captureInfo(`User action: ${action}`, {
      component: 'user_interaction',
      action,
      ...metadata
    })
  }

  // API error tracking
  trackAPIError(endpoint: string, status: number, message: string, metadata?: Record<string, any>) {
    this.captureError(`API Error: ${endpoint} returned ${status} - ${message}`, {
      component: 'api',
      endpoint,
      status,
      ...metadata
    })
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush() // Final flush
  }
}

// Create singleton instance
let errorTracker: ErrorTracker | null = null

export function getErrorTracker(): ErrorTracker {
  if (!errorTracker) {
    errorTracker = new ErrorTracker()
  }
  return errorTracker
}

// Convenience functions
export function captureError(error: Error | string, metadata?: Record<string, any>): string {
  return getErrorTracker().captureError(error, metadata)
}

export function captureWarning(message: string, metadata?: Record<string, any>): string {
  return getErrorTracker().captureWarning(message, metadata)
}

export function captureInfo(message: string, metadata?: Record<string, any>): string {
  return getErrorTracker().captureInfo(message, metadata)
}

export function trackPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
  getErrorTracker().trackPerformance(operation, duration, metadata)
}

export function trackUserAction(action: string, metadata?: Record<string, any>) {
  getErrorTracker().trackUserAction(action, metadata)
}

export function trackAPIError(endpoint: string, status: number, message: string, metadata?: Record<string, any>) {
  getErrorTracker().trackAPIError(endpoint, status, message, metadata)
}

// React hook for error tracking
export function useErrorTracker() {
  const tracker = getErrorTracker()
  
  return {
    captureError: tracker.captureError.bind(tracker),
    captureWarning: tracker.captureWarning.bind(tracker),
    captureInfo: tracker.captureInfo.bind(tracker),
    setUser: tracker.setUser.bind(tracker),
    setContext: tracker.setContext.bind(tracker),
    trackPerformance: tracker.trackPerformance.bind(tracker),
    trackUserAction: tracker.trackUserAction.bind(tracker),
    trackAPIError: tracker.trackAPIError.bind(tracker)
  }
}