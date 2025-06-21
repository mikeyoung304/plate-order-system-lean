# Monitoring Setup Guide - Project Helios

## Overview
This guide provides comprehensive monitoring, alerting, and observability setup for Project Helios restaurant system in production environments.

## Health Check System

### 🏥 Built-in Health Endpoints

#### Primary Health Check
```typescript
// app/api/health/route.ts - Already implemented
GET /api/health

Response Format:
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2025-06-19T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "pass" | "fail" | "warn",
      "message": "Connected to PostgreSQL",
      "responseTime": 150
    },
    "auth": {
      "status": "pass" | "fail" | "warn", 
      "message": "Supabase authentication healthy",
      "responseTime": 75
    },
    "openai": {
      "status": "pass" | "fail" | "warn",
      "message": "OpenAI API accessible",
      "responseTime": 200
    },
    "storage": {
      "status": "pass" | "fail" | "warn",
      "message": "File storage accessible",
      "responseTime": 100
    },
    "realtime": {
      "status": "pass" | "fail" | "warn",
      "message": "Real-time connections active",
      "responseTime": 50
    }
  },
  "performance": {
    "responseTime": 175,
    "uptime": 86400,
    "memoryUsage": {
      "used": 150.5,
      "total": 512.0,
      "percentage": 29.4
    }
  },
  "deployment": {
    "vercelEnv": "production",
    "region": "iad1",
    "gitCommit": "abc123def456"
  }
}
```

#### Simple Health Check
```bash
# Quick health check endpoint
GET /api/health/simple

Response:
{
  "status": "ok",
  "timestamp": "2025-06-19T10:30:00.000Z"
}
```

### 📊 Metrics Endpoint
```typescript
// app/api/metrics/route.ts - Already implemented
GET /api/metrics

Response Format:
{
  "timestamp": "2025-06-19T10:30:00.000Z",
  "current": {
    "activeConnections": 45,
    "requestsPerMinute": 120,
    "errorRate": 0.02,
    "responseTime": {
      "p50": 150,
      "p95": 300,
      "p99": 500
    },
    "memory": {
      "heapUsed": 150.5,
      "heapTotal": 200.0,
      "external": 25.3
    },
    "cpu": {
      "usage": 35.2
    }
  },
  "database": {
    "activeConnections": 8,
    "maxConnections": 20,
    "queryTime": {
      "average": 125,
      "p95": 250
    },
    "slowQueries": 2
  },
  "openai": {
    "requestsToday": 450,
    "costToday": 12.50,
    "cacheHitRate": 75.3,
    "averageResponseTime": 1200
  },
  "realtime": {
    "subscribedChannels": 25,
    "activeConnections": 45,
    "messagesPerSecond": 15
  }
}
```

## Monitoring Tools Setup

### 🔍 Built-in Health Monitor

#### Continuous Health Monitoring
```bash
# Start continuous health monitoring
npm run monitor:health:continuous

# Monitor production deployment
npm run monitor:production --url https://your-app.vercel.app

# Custom monitoring configuration
npm run monitor:health \
  --url https://your-app.vercel.app \
  --interval 30 \
  --threshold 3 \
  --webhook https://your-webhook.com \
  --slack https://hooks.slack.com/your-webhook
```

#### Health Monitor Configuration
```typescript
// scripts/health-monitor.ts - Already implemented
interface MonitorConfig {
  url: string;                    // Application URL
  interval: number;               // Check interval (seconds)
  threshold: number;              // Failure threshold
  webhook?: string;               // Alert webhook URL
  slack?: string;                 // Slack webhook URL
  continuous: boolean;            // Run continuously
  silent: boolean;                // Suppress output
  format: 'json' | 'table' | 'minimal';
}

// Example usage
const monitor = new HealthMonitor({
  url: 'https://your-app.vercel.app',
  interval: 60,
  threshold: 3,
  slack: process.env.SLACK_WEBHOOK,
  format: 'table'
});

await monitor.runContinuous();
```

### 📈 External Monitoring Services

#### Uptime Robot Setup
```bash
# Create uptime monitors
curl -X POST https://api.uptimerobot.com/v2/newMonitor \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=YOUR_API_KEY" \
  -d "friendly_name=Project Helios - Health Check" \
  -d "url=https://your-app.vercel.app/api/health" \
  -d "type=1" \
  -d "interval=300"

# Monitor main application
curl -X POST https://api.uptimerobot.com/v2/newMonitor \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=YOUR_API_KEY" \
  -d "friendly_name=Project Helios - Main App" \
  -d "url=https://your-app.vercel.app" \
  -d "type=1" \
  -d "interval=300"
```

#### Pingdom Configuration
```bash
# HTTP check configuration
{
  "name": "Project Helios Health Check",
  "host": "your-app.vercel.app",
  "type": "http",
  "paused": false,
  "url": "/api/health",
  "encryption": true,
  "port": 443,
  "resolution": 5,
  "sendnotificationwhendown": 3,
  "notifyagainevery": 10,
  "notifywhenbackup": true,
  "responsetime_threshold": 5000,
  "custom_message": "Project Helios health check endpoint",
  "integrationids": [12345],
  "tags": ["production", "health-check", "restaurant"]
}
```

### 🚨 Datadog Integration

#### Application Performance Monitoring
```typescript
// lib/monitoring/datadog.ts
import { StatsD } from 'node-statsd';

const statsd = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'helios.',
  tags: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version
  }
});

export class DatadogMonitoring {
  // Track API response times
  static trackApiResponse(endpoint: string, duration: number, status: number) {
    statsd.timing('api.response_time', duration, [`endpoint:${endpoint}`, `status:${status}`]);
    statsd.increment('api.requests', [`endpoint:${endpoint}`, `status:${status}`]);
  }

  // Track database operations
  static trackDatabaseQuery(operation: string, duration: number, success: boolean) {
    statsd.timing('database.query_time', duration, [`operation:${operation}`]);
    statsd.increment('database.queries', [`operation:${operation}`, `success:${success}`]);
  }

  // Track OpenAI usage
  static trackOpenAIUsage(tokens: number, cost: number) {
    statsd.increment('openai.tokens', tokens);
    statsd.increment('openai.cost', cost);
  }

  // Track real-time connections
  static trackRealtimeConnections(count: number) {
    statsd.gauge('realtime.connections', count);
  }

  // Track business metrics
  static trackOrderMetrics(tableId: string, preparationTime: number) {
    statsd.timing('orders.preparation_time', preparationTime, [`table:${tableId}`]);
    statsd.increment('orders.completed', [`table:${tableId}`]);
  }
}
```

#### Custom Dashboards
```json
{
  "title": "Project Helios - Production Dashboard",
  "widgets": [
    {
      "definition": {
        "title": "Health Check Status",
        "type": "check_status",
        "check": "helios.health_check",
        "grouping": "cluster",
        "group_by": ["env", "region"],
        "tags": ["*"]
      }
    },
    {
      "definition": {
        "title": "API Response Times",
        "type": "timeseries",
        "requests": [
          {
            "q": "avg:helios.api.response_time{*} by {endpoint}",
            "display_type": "line"
          }
        ]
      }
    },
    {
      "definition": {
        "title": "Database Performance",
        "type": "timeseries",
        "requests": [
          {
            "q": "avg:helios.database.query_time{*}",
            "display_type": "line"
          }
        ]
      }
    },
    {
      "definition": {
        "title": "Order Processing Metrics",
        "type": "timeseries",
        "requests": [
          {
            "q": "sum:helios.orders.completed{*}.as_rate()",
            "display_type": "bars"
          }
        ]
      }
    }
  ]
}
```

## Alerting Configuration

### 🔔 Slack Integration

#### Webhook Setup
```typescript
// lib/alerting/slack.ts
interface SlackAlert {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  attachments?: Array<{
    color: 'good' | 'warning' | 'danger';
    title: string;
    text: string;
    fields: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
    ts: number;
  }>;
}

export class SlackAlerting {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async sendHealthAlert(status: 'healthy' | 'degraded' | 'unhealthy', details: any) {
    const color = status === 'healthy' ? 'good' : status === 'degraded' ? 'warning' : 'danger';
    const emoji = status === 'healthy' ? ':white_check_mark:' : status === 'degraded' ? ':warning:' : ':x:';

    const alert: SlackAlert = {
      text: `${emoji} Project Helios Health Alert`,
      username: 'Helios Monitor',
      icon_emoji: ':restaurant:',
      attachments: [{
        color,
        title: `System Status: ${status.toUpperCase()}`,
        text: `Health check status changed to ${status}`,
        fields: [
          {
            title: 'Environment',
            value: details.environment,
            short: true
          },
          {
            title: 'Response Time',
            value: `${details.performance.responseTime}ms`,
            short: true
          },
          {
            title: 'Failed Services',
            value: Object.entries(details.checks)
              .filter(([_, check]: [string, any]) => check.status === 'fail')
              .map(([name, _]) => name)
              .join(', ') || 'None',
            short: false
          }
        ],
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    });
  }

  async sendPerformanceAlert(metric: string, value: number, threshold: number) {
    const alert: SlackAlert = {
      text: ':chart_with_upwards_trend: Performance Alert',
      username: 'Helios Monitor',
      icon_emoji: ':restaurant:',
      attachments: [{
        color: 'warning',
        title: 'Performance Threshold Exceeded',
        text: `${metric} has exceeded the configured threshold`,
        fields: [
          {
            title: 'Metric',
            value: metric,
            short: true
          },
          {
            title: 'Current Value',
            value: value.toString(),
            short: true
          },
          {
            title: 'Threshold',
            value: threshold.toString(),
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: true
          }
        ],
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    });
  }
}
```

#### Alert Channel Configuration
```bash
# Slack channel setup
#production-alerts - Critical production issues
#health-checks - Health check status updates
#performance - Performance metrics and alerts
#deployments - Deployment notifications
#database - Database-related alerts
```

### 📧 Email Alerting

#### SendGrid Integration
```typescript
// lib/alerting/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export class EmailAlerting {
  private static readonly ALERT_RECIPIENTS = [
    'ops-team@company.com',
    'dev-team@company.com',
    'on-call@company.com'
  ];

  static async sendCriticalAlert(subject: string, details: any) {
    const msg = {
      to: this.ALERT_RECIPIENTS,
      from: 'alerts@company.com',
      subject: `[CRITICAL] Project Helios - ${subject}`,
      html: this.formatAlertEmail(details),
      text: JSON.stringify(details, null, 2)
    };

    try {
      await sgMail.sendMultiple(msg);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  private static formatAlertEmail(details: any): string {
    return `
      <h2>Project Helios Critical Alert</h2>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>Environment:</strong> ${details.environment}</p>
      <p><strong>Status:</strong> ${details.status}</p>
      
      <h3>Failed Services:</h3>
      <ul>
        ${Object.entries(details.checks)
          .filter(([_, check]: [string, any]) => check.status === 'fail')
          .map(([name, check]: [string, any]) => `<li><strong>${name}:</strong> ${check.message}</li>`)
          .join('')}
      </ul>
      
      <h3>Performance Metrics:</h3>
      <ul>
        <li><strong>Response Time:</strong> ${details.performance.responseTime}ms</li>
        <li><strong>Memory Usage:</strong> ${details.performance.memoryUsage.percentage}%</li>
      </ul>
      
      <p><a href="https://your-app.vercel.app/api/health">View Current Status</a></p>
    `;
  }
}
```

### 🚨 PagerDuty Integration

#### Incident Management
```typescript
// lib/alerting/pagerduty.ts
export class PagerDutyAlerting {
  private integrationKey: string;

  constructor(integrationKey: string) {
    this.integrationKey = integrationKey;
  }

  async triggerIncident(severity: 'critical' | 'error' | 'warning', summary: string, details: any) {
    const payload = {
      routing_key: this.integrationKey,
      event_action: 'trigger',
      dedup_key: `helios-${Date.now()}`,
      payload: {
        summary,
        severity,
        source: 'Project Helios',
        component: 'Health Monitor',
        group: 'Production',
        class: 'Application',
        custom_details: details
      }
    };

    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`PagerDuty API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async resolveIncident(dedupKey: string) {
    const payload = {
      routing_key: this.integrationKey,
      event_action: 'resolve',
      dedup_key: dedupKey
    };

    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  }
}
```

## Log Aggregation

### 📋 Structured Logging

#### Logger Configuration
```typescript
// lib/logging/logger.ts
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        service: 'project-helios',
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
        ...meta
      });
    })
  ),
  defaultMeta: {
    service: 'project-helios',
    environment: process.env.NODE_ENV
  },
  transports: [
    new transports.Console(),
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

export default logger;
```

#### Request Logging Middleware
```typescript
// middleware/logging.ts
import logger from '@/lib/logging/logger';
import { NextRequest, NextResponse } from 'next/server';

export function logRequest(request: NextRequest) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    // Log request
    logger.info('Incoming request', {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.ip,
      headers: Object.fromEntries(request.headers.entries())
    });

    // Wrap response to log completion
    const originalJson = NextResponse.json;
    NextResponse.json = function(body: any, init?: ResponseInit) {
      const response = originalJson(body, init);
      
      logger.info('Request completed', {
        method: request.method,
        url: request.url,
        status: response.status,
        duration: Date.now() - startTime,
        responseHeaders: Object.fromEntries(response.headers.entries())
      });
      
      resolve(response);
      return response;
    };
  });
}
```

### 🔍 ELK Stack Integration

#### Logstash Configuration
```yaml
# logstash.conf
input {
  file {
    path => "/app/logs/*.log"
    start_position => "beginning"
    codec => "json"
  }
}

filter {
  if [service] == "project-helios" {
    mutate {
      add_tag => [ "helios" ]
    }
    
    if [level] == "error" {
      mutate {
        add_tag => [ "error" ]
      }
    }
    
    if [url] {
      grok {
        match => { "url" => "https?://[^/]+(?<path>/[^?]*)" }
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "helios-logs-%{+YYYY.MM.dd}"
  }
  
  if "error" in [tags] {
    slack {
      url => "${SLACK_WEBHOOK_URL}"
      channel => "#production-alerts"
      username => "Logstash"
      icon_emoji => ":warning:"
      format => "Error in Project Helios: %{message}"
    }
  }
}
```

#### Elasticsearch Index Template
```json
{
  "index_patterns": ["helios-logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 1,
      "index.refresh_interval": "5s"
    },
    "mappings": {
      "properties": {
        "timestamp": {
          "type": "date"
        },
        "level": {
          "type": "keyword"
        },
        "message": {
          "type": "text",
          "analyzer": "standard"
        },
        "service": {
          "type": "keyword"
        },
        "environment": {
          "type": "keyword"
        },
        "method": {
          "type": "keyword"
        },
        "path": {
          "type": "keyword"
        },
        "status": {
          "type": "integer"
        },
        "duration": {
          "type": "integer"
        },
        "ip": {
          "type": "ip"
        }
      }
    }
  }
}
```

## Performance Monitoring

### 📊 Application Performance Monitoring (APM)

#### New Relic Integration
```typescript
// lib/monitoring/newrelic.ts
import newrelic from 'newrelic';

export class NewRelicMonitoring {
  static trackCustomEvent(eventType: string, attributes: Record<string, any>) {
    newrelic.recordCustomEvent(eventType, attributes);
  }

  static trackOrderProcessing(orderId: string, duration: number, status: string) {
    this.trackCustomEvent('OrderProcessing', {
      orderId,
      duration,
      status,
      timestamp: Date.now()
    });
  }

  static trackVoiceCommand(command: string, duration: number, success: boolean) {
    this.trackCustomEvent('VoiceCommand', {
      command,
      duration,
      success,
      timestamp: Date.now()
    });
  }

  static trackDatabaseQuery(query: string, duration: number, success: boolean) {
    this.trackCustomEvent('DatabaseQuery', {
      query,
      duration,
      success,
      timestamp: Date.now()
    });
  }

  static setCustomAttributes(attributes: Record<string, any>) {
    Object.entries(attributes).forEach(([key, value]) => {
      newrelic.addCustomAttribute(key, value);
    });
  }
}
```

#### Sentry Error Tracking
```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.level === 'warning') {
      return null;
    }
    
    // Add custom context
    event.tags = {
      ...event.tags,
      service: 'project-helios',
      version: process.env.npm_package_version
    };
    
    return event;
  }
});

export class SentryMonitoring {
  static captureException(error: Error, context?: Record<string, any>) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry.captureException(error);
    });
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    Sentry.captureMessage(message, level);
  }

  static setUser(user: { id: string; email?: string; role?: string }) {
    Sentry.setUser(user);
  }
}
```

## Deployment Commands

### 🚀 Monitoring Setup Commands

```bash
# Initialize monitoring system
npm run monitor:setup

# Verify monitoring configuration
npm run monitor:verify

# Start health monitoring
npm run monitor:health:continuous --url https://your-app.vercel.app

# Test alerting systems
npm run test:alerts

# Generate monitoring report
npm run monitor:report --format json --save monitoring-report.json

# Performance validation
npm run validate:production --url https://your-app.vercel.app --threshold 85
```

### 📈 Dashboard URLs

```bash
# Health Check Dashboard
https://your-app.vercel.app/api/health

# Metrics Dashboard  
https://your-app.vercel.app/api/metrics

# Vercel Analytics
https://vercel.com/your-team/project-helios/analytics

# Supabase Dashboard
https://supabase.com/dashboard/project/your-project

# OpenAI Usage Dashboard
https://platform.openai.com/usage
```

This monitoring setup provides comprehensive observability for Project Helios, ensuring rapid detection and resolution of issues in production environments.