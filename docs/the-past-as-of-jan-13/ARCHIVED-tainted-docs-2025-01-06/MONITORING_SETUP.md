# Monitoring and Verification System Setup

This document describes the comprehensive monitoring and verification tools implemented for the Plater Restaurant System.

## Overview

The monitoring system provides:

- **Real-time health monitoring** with automated alerts
- **Performance tracking** and optimization insights
- **OpenAI cost monitoring** with budget controls
- **Error tracking** and alerting
- **Deployment verification** and production readiness validation
- **Security monitoring** and compliance checking

## Components

### 1. Health Check API (`/api/health`)

Provides comprehensive system health information:

```bash
curl https://your-app.vercel.app/api/health
```

**Response includes:**

- Database connectivity and response times
- Authentication service status
- OpenAI API availability
- Storage service health
- Real-time connection status
- Memory usage and performance metrics
- Deployment information

### 2. Metrics Collection API (`/api/metrics`)

Collects and stores performance metrics:

```bash
# Get current metrics
curl https://your-app.vercel.app/api/metrics

# Get Prometheus format
curl https://your-app.vercel.app/api/metrics?format=prometheus

# Get historical data
curl https://your-app.vercel.app/api/metrics?range=24h
```

### 3. OpenAI Cost Monitoring (`/api/openai/usage`)

Tracks API usage and costs:

```bash
curl https://your-app.vercel.app/api/openai/usage
```

**Features:**

- Daily, weekly, monthly usage tracking
- Budget monitoring with alerts
- Cache hit rate optimization
- Cost-saving recommendations

### 4. Error Tracking System

Comprehensive error logging and alerting:

```typescript
import { captureError, trackPerformance } from '@/lib/monitoring/error-tracker'

// Track errors
captureError(new Error('Something went wrong'), {
  component: 'OrderProcessor',
  userId: 'user123',
})

// Track performance
trackPerformance('database_query', 250, { table: 'orders' })
```

### 5. Performance Dashboard

Visual monitoring interface at `/auth/admin/monitoring`:

- Real-time system health
- Performance metrics and trends
- OpenAI cost analysis
- Error tracking and alerts
- Security monitoring

## Setup Instructions

### 1. Database Setup

Run the monitoring migrations:

```bash
npm run monitor:setup
```

This creates the following tables:

- `error_logs` - Error tracking and logging
- `custom_metrics` - Application-specific metrics
- `alert_rules` - Alert configuration
- `alert_history` - Alert tracking
- `performance_metrics` - System performance data

### 2. Environment Variables

Add to your `.env.local`:

```env
# OpenAI Budget Controls (in cents)
OPENAI_DAILY_BUDGET_CENTS=500
OPENAI_WEEKLY_BUDGET_CENTS=3500
OPENAI_MONTHLY_BUDGET_CENTS=15000

# Monitoring Configuration
CACHE_TTL_SECONDS=1800
MAX_CONCURRENT_CONNECTIONS=100
ENABLE_PERFORMANCE_MONITORING=true

# Alert Webhooks (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_WEBHOOK_URL=https://your-alerting-service.com/webhook
```

### 3. Production Deployment

For production deployments, set additional environment variables:

```env
# Vercel deployment
VERCEL_ENV=production
VERCEL_REGION=iad1
VERCEL_GIT_COMMIT_SHA=abc123...

# Database performance
SUPABASE_DB_POOL_SIZE=10
SUPABASE_DB_TIMEOUT=5000
```

## Monitoring Scripts

### Health Monitoring

```bash
# Single health check
npm run monitor:health

# Continuous monitoring (local)
npm run monitor:health:continuous

# Production monitoring with alerts
npm run monitor:production
```

**Options:**

```bash
# Custom URL and alert settings
npx tsx scripts/health-monitor.ts \
  --url https://your-app.vercel.app \
  --continuous \
  --threshold 3 \
  --slack https://hooks.slack.com/... \
  --format table
```

### Production Readiness Validation

```bash
# Validate deployment readiness
npm run validate:production

# Full deployment verification
npm run validate:deployment

# Custom validation
npx tsx scripts/production-readiness.ts \
  --url https://your-app.vercel.app \
  --threshold 90 \
  --save report.json
```

### Deployment Verification Tests

```bash
# Run deployment verification tests
npm run test:deployment

# Run with specific URL
DEPLOYMENT_URL=https://your-app.vercel.app npm run test:deployment
```

## Alert Configuration

### Setting Up Slack Alerts

1. Create a Slack webhook URL
2. Add to environment variables:
   ```env
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```
3. Configure alert rules in the database or admin interface

### Alert Rules Examples

```sql
-- High error rate alert
INSERT INTO alert_rules (name, condition, actions) VALUES (
  'High Error Rate',
  '{"type": "threshold", "field": "error", "operator": "gt", "value": 5, "timeWindow": 15}',
  '[{"type": "slack", "config": {"url": "YOUR_SLACK_WEBHOOK"}}]'
);

-- Database performance alert
INSERT INTO alert_rules (name, condition, actions) VALUES (
  'Slow Database Queries',
  '{"type": "threshold", "field": "db_response_time", "operator": "gt", "value": 500, "timeWindow": 10}',
  '[{"type": "webhook", "config": {"url": "YOUR_WEBHOOK_URL"}}]'
);
```

## Dashboard Access

### Admin Monitoring Dashboard

Visit `/auth/admin/monitoring` (requires admin role) to access:

- **Performance Tab**: System performance metrics and trends
- **Costs Tab**: OpenAI usage and cost analysis
- **Security Tab**: Security events and compliance status
- **Errors Tab**: Error tracking and resolution metrics

### API Endpoints

| Endpoint                         | Description          | Authentication |
| -------------------------------- | -------------------- | -------------- |
| `/api/health`                    | System health status | Public         |
| `/api/metrics`                   | Performance metrics  | Public         |
| `/api/metrics?format=prometheus` | Prometheus metrics   | Public         |
| `/api/openai/usage`              | OpenAI cost tracking | Admin          |

## Performance Targets

### Production Requirements

- **Response Time**: < 200ms for 95% of requests
- **Database Queries**: < 50ms average
- **Memory Usage**: < 500MB for 100 concurrent users
- **Error Rate**: < 0.1% of total requests
- **Uptime**: > 99.9% availability
- **Cache Hit Rate**: > 80% for OpenAI requests

### Optimization Thresholds

| Metric           | Good         | Warning      | Critical      |
| ---------------- | ------------ | ------------ | ------------- |
| Response Time    | < 200ms      | < 500ms      | > 1000ms      |
| Memory Usage     | < 70%        | < 85%        | > 90%         |
| Cache Hit Rate   | > 80%        | > 60%        | < 40%         |
| Database Queries | < 100ms      | < 300ms      | > 500ms       |
| Daily API Cost   | < 80% budget | < 95% budget | > 100% budget |

## Troubleshooting

### Common Issues

1. **Health Check Failing**

   ```bash
   # Check if services are running
   npm run monitor:health

   # Verify database connection
   npx supabase status
   ```

2. **High OpenAI Costs**

   ```bash
   # Check cache performance
   curl /api/openai/usage | jq '.today.cacheHitRate'

   # Review optimization recommendations
   # Visit /auth/admin/monitoring -> Costs -> Optimization
   ```

3. **Performance Issues**

   ```bash
   # Run performance validation
   npm run validate:production

   # Check specific metrics
   curl /api/metrics | jq '.current.memory'
   ```

### Log Locations

- **Application Logs**: Console output and Vercel logs
- **Error Logs**: `error_logs` table in database
- **Performance Metrics**: `performance_metrics` table
- **Alert History**: `alert_history` table

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deployment Verification
on:
  deployment_status:
    types: [success]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Verify deployment
        env:
          DEPLOYMENT_URL: ${{ github.event.deployment_status.target_url }}
        run: |
          npm run test:deployment
          npm run validate:production -- --url $DEPLOYMENT_URL --threshold 90
```

### Monitoring in Production

```bash
# Set up continuous monitoring
npx tsx scripts/health-monitor.ts \
  --url https://your-production-app.vercel.app \
  --continuous \
  --slack $SLACK_WEBHOOK_URL \
  --threshold 2

# Schedule with cron (every 5 minutes)
*/5 * * * * cd /path/to/app && npm run monitor:health
```

## Advanced Configuration

### Custom Metrics

```typescript
// Track custom application events
import { captureInfo } from '@/lib/monitoring/error-tracker'

captureInfo('Order completed', {
  component: 'OrderProcessor',
  orderId: 'order_123',
  processingTime: 1250,
  tableId: 'table_5',
})
```

### Prometheus Integration

The metrics endpoint supports Prometheus format:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'plater-app'
    static_configs:
      - targets: ['your-app.vercel.app']
    metrics_path: '/api/metrics'
    params:
      format: ['prometheus']
```

### Database Cleanup

Automatic cleanup of old monitoring data:

```sql
-- Run monthly to clean up old data
SELECT cleanup_monitoring_data();
```

## Support

For issues with the monitoring system:

1. Check the [troubleshooting guide](#troubleshooting)
2. Review dashboard alerts and error logs
3. Run production readiness validation
4. Contact the development team with specific error messages and logs

---

**Note**: This monitoring system is designed for enterprise-scale deployment with 1000+ concurrent users. All metrics and alerts are optimized for high-traffic production environments.
