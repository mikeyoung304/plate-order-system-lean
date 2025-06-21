# Deployment Guide (#heyluis Production Operations)

## Complete Production Deployment for Plate Restaurant System

This guide covers end-to-end deployment processes, environment configuration, monitoring setup, and operational procedures for production environments.

## Deployment Overview

### Current Production Setup

- **Platform**: Vercel (Serverless Next.js)
- **Database**: Supabase (Managed PostgreSQL)
- **Domain**: plate-restaurant-system-ej2qsvqd2.vercel.app
- **CI/CD**: GitHub Actions → Vercel Auto-deployment
- **Status**: Live and operational

### Infrastructure Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   GitHub Repo   │────│   Vercel Build   │────│  Production Domain  │
│                 │    │                  │    │                     │
│ - Code commits  │    │ - Next.js build  │    │ - HTTPS enabled     │
│ - Auto triggers │    │ - Type checking  │    │ - CDN optimized     │
│ - Branch deploy │    │ - Optimization   │    │ - Global edge       │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  Supabase DB    │    │   Environment    │    │     OpenAI API      │
│                 │    │    Variables     │    │                     │
│ - PostgreSQL    │    │                  │    │ - Voice transcribe  │
│ - Real-time     │    │ - Secrets mgmt   │    │ - Rate limiting     │
│ - Backups       │    │ - Auto-injection │    │ - Error handling    │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## Environment Setup

### Required Environment Variables

```bash
# Core Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://eiipozoogrrfudhjoqms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Voice Processing
OPENAI_API_KEY=sk-proj-...

# Database Access (Optional - for direct queries)
SUPABASE_DB_PASSWORD=your_database_password

# Production Flags (Auto-set by Vercel)
VERCEL=1
NODE_ENV=production
VERCEL_URL=plate-restaurant-system-ej2qsvqd2.vercel.app
```

### Vercel Environment Configuration

#### Development Environment

```bash
# Set development variables
vercel env add NEXT_PUBLIC_SUPABASE_URL development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
vercel env add SUPABASE_SERVICE_ROLE_KEY development
vercel env add OPENAI_API_KEY development
```

#### Production Environment

```bash
# Set production variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production
```

#### Preview Environment

```bash
# Set preview variables (for PR deployments)
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add OPENAI_API_KEY preview
```

## Initial Deployment Setup

### 1. Repository Configuration

```bash
# Clone repository
git clone https://github.com/yourusername/Plate-Restaurant-System-App.git
cd Plate-Restaurant-System-App

# Install dependencies
npm install

# Verify build locally
npm run build
npm run start
```

### 2. Vercel Project Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link

# Configure project settings
vercel --prod
```

### 3. Database Migration

```sql
-- Run in Supabase SQL Editor
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Run all migration files in order
\i /path/to/supabase/migrations/20250511210425_setup_rbac.sql
\i /path/to/supabase/migrations/20250511222049_user_roles_permission.sql
\i /path/to/supabase/migrations/20250511222516_user_role_assignment.sql
\i /path/to/supabase/migrations/20250512164938_tables_seats.sql
\i /path/to/supabase/migrations/20250512204529_orders.sql
\i /path/to/supabase/migrations/20250517230648_profiles.sql
\i /path/to/supabase/migrations/20250527000000_seed_initial_tables.sql
\i /path/to/supabase/migrations/20250527000001_create_kds_system.sql
\i /path/to/supabase/migrations/20250529000002_add_table_bulk_operations.sql
\i /path/to/supabase/migrations/20250529000003_add_table_positions.sql
\i /path/to/supabase/migrations/20250601000000_performance_optimization_indexes.sql
```

### 4. Demo Data Setup

```bash
# Run demo data script
npm run setup:demo-data

# Or manually via SQL
psql -h db.eiipozoogrrfudhjoqms.supabase.co -U postgres -d postgres -f scripts/seed-demo-data.sql
```

## CI/CD Pipeline Configuration

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm run test

      - name: Build application
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/health",
      "destination": "/api/health"
    }
  ]
}
```

## Production Deployment Process

### Manual Deployment

```bash
# 1. Pre-deployment checks
npm run lint
npm run type-check
npm run build
npm run test

# 2. Deploy to production
vercel --prod

# 3. Verify deployment
curl -f https://your-domain.vercel.app/api/health

# 4. Run post-deployment tests
npm run test:e2e:prod
```

### Automated Deployment

```bash
# Trigger deployment via git push
git add .
git commit -m "🚀 Deploy: production release v1.2.3"
git push origin main

# Monitor deployment
vercel logs --follow
```

## Database Production Setup

### Performance Configuration

```sql
-- Production database settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();

-- Enable query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Set up automated cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Clean up old metrics (keep 90 days)
  DELETE FROM kds_metrics WHERE recorded_at < NOW() - INTERVAL '90 days';

  -- Clean up old cancelled orders (keep 30 days)
  DELETE FROM orders WHERE status = 'cancelled' AND created_at < NOW() - INTERVAL '30 days';

  -- Update statistics
  ANALYZE;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run via cron or external scheduler)
-- SELECT cleanup_old_data();
```

### Backup Strategy

```bash
#!/bin/bash
# scripts/backup-database.sh

# Database backup script
BACKUP_DIR="/backups/plate-restaurant"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -h db.eiipozoogrrfudhjoqms.supabase.co \
        -U postgres \
        -d postgres \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        --compress=9 \
        > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Clean up old backups (keep 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Recovery Procedures

```bash
# Point-in-time recovery (via Supabase dashboard)
# 1. Go to Supabase Dashboard > Database > Backups
# 2. Select point-in-time recovery
# 3. Choose recovery timestamp
# 4. Confirm recovery operation

# Manual backup restoration
psql -h db.eiipozoogrrfudhjoqms.supabase.co \
     -U postgres \
     -d postgres \
     < backup_20240101_120000.sql
```

## Monitoring and Observability

### Health Check Setup

```typescript
// scripts/health-check.ts
import { createClient } from '@supabase/supabase-js'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down'
  services: {
    database: 'up' | 'down'
    openai: 'up' | 'down'
    storage: 'up' | 'down'
  }
  timestamp: string
  response_time: number
}

export async function performHealthCheck(): Promise<HealthStatus> {
  const start = Date.now()

  const checks = await Promise.allSettled([
    checkDatabase(),
    checkOpenAI(),
    checkStorage(),
  ])

  const services = {
    database: checks[0].status === 'fulfilled' ? 'up' : 'down',
    openai: checks[1].status === 'fulfilled' ? 'up' : 'down',
    storage: checks[2].status === 'fulfilled' ? 'up' : 'down',
  }

  const allUp = Object.values(services).every(status => status === 'up')
  const anyDown = Object.values(services).some(status => status === 'down')

  return {
    status: allUp ? 'healthy' : anyDown ? 'down' : 'degraded',
    services,
    timestamp: new Date().toISOString(),
    response_time: Date.now() - start,
  }
}

async function checkDatabase(): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.from('profiles').select('id').limit(1)

  if (error) throw new Error(`Database check failed: ${error.message}`)
}

async function checkOpenAI(): Promise<void> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`OpenAI API check failed: ${response.status}`)
  }
}

async function checkStorage(): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.storage
    .from('audio-recordings')
    .list('', { limit: 1 })

  if (error) throw new Error(`Storage check failed: ${error.message}`)
}
```

### Performance Monitoring

```bash
#!/bin/bash
# scripts/monitor-performance.sh

# Monitor application performance
echo "=== Performance Monitoring Report ==="
echo "Timestamp: $(date)"
echo

# Check Vercel deployment status
echo "=== Vercel Status ==="
vercel logs --limit 10

echo
echo "=== Database Performance ==="
psql -h db.eiipozoogrrfudhjoqms.supabase.co -U postgres -d postgres -c "
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;"

echo
echo "=== Active Connections ==="
psql -h db.eiipozoogrrfudhjoqms.supabase.co -U postgres -d postgres -c "
SELECT
  state,
  COUNT(*) as count
FROM pg_stat_activity
GROUP BY state;"

echo
echo "=== Table Sizes ==="
psql -h db.eiipozoogrrfudhjoqms.supabase.co -U postgres -d postgres -c "
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;"
```

### Error Tracking

```typescript
// lib/error-tracking.ts
export interface ErrorReport {
  id: string
  message: string
  stack?: string
  url: string
  user_id?: string
  timestamp: string
  environment: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class ErrorTracker {
  static async logError(error: Error, context: any = {}): Promise<void> {
    const errorReport: ErrorReport = {
      id: crypto.randomUUID(),
      message: error.message,
      stack: error.stack,
      url: context.url || 'unknown',
      user_id: context.user_id,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      severity: this.determineSeverity(error, context),
    }

    // Log to console
    console.error('Error tracked:', errorReport)

    // Store in database
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await supabase.from('error_logs').insert(errorReport)
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError)
    }

    // Send critical errors to external service
    if (errorReport.severity === 'critical') {
      await this.sendAlert(errorReport)
    }
  }

  private static determineSeverity(
    error: Error,
    context: any
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Database connection errors
    if (
      error.message.includes('connection') ||
      error.message.includes('timeout')
    ) {
      return 'critical'
    }

    // Authentication errors
    if (
      error.message.includes('auth') ||
      error.message.includes('unauthorized')
    ) {
      return 'high'
    }

    // API errors
    if (context.url?.includes('/api/')) {
      return 'medium'
    }

    return 'low'
  }

  private static async sendAlert(errorReport: ErrorReport): Promise<void> {
    // Send to external monitoring service (Sentry, DataDog, etc.)
    // For now, just log
    console.error('CRITICAL ERROR ALERT:', errorReport)
  }
}
```

## Security Configuration

### HTTPS and SSL Setup

```bash
# Vercel automatically handles SSL certificates
# Custom domain SSL configuration
vercel domains add your-restaurant-domain.com
vercel ssl add your-restaurant-domain.com
```

### Security Headers

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://eiipozoogrrfudhjoqms.supabase.co https://api.openai.com"
  )

  return response
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
}
```

### Environment Security

```bash
# Rotate sensitive keys regularly
# Generate new Supabase service role key
supabase projects api-keys --project-ref eiipozoogrrfudhjoqms --create-service-role-key

# Generate new OpenAI API key
# Go to OpenAI Dashboard > API Keys > Create new secret key

# Update Vercel environment variables
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

## Scaling Configuration

### Vercel Pro Features

```json
// vercel.json - Pro configuration
{
  "version": 2,
  "functions": {
    "app/api/**": {
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "regions": ["iad1", "sfo1"],
  "crons": [
    {
      "path": "/api/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Database Scaling

```sql
-- Connection pooling configuration
-- In Supabase Dashboard > Settings > Database
-- Connection pooling: Enabled
-- Pool size: 15
-- Pool mode: Session

-- Read replicas (Enterprise feature)
-- Configure via Supabase Dashboard for read-heavy operations

-- Performance monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  recorded_at timestamptz DEFAULT now()
);

-- Create function to track slow queries
CREATE OR REPLACE FUNCTION track_slow_queries()
RETURNS trigger AS $$
BEGIN
  IF (extract(epoch from now() - pg_stat_activity.query_start) > 5) THEN
    INSERT INTO performance_metrics (metric_name, metric_value)
    VALUES ('slow_query_seconds', extract(epoch from now() - pg_stat_activity.query_start));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## Troubleshooting Guide

### Common Deployment Issues

#### Build Failures

```bash
# Check TypeScript errors
npm run type-check

# Check for missing dependencies
npm install

# Clear Next.js cache
rm -rf .next
npm run build
```

#### Environment Variable Issues

```bash
# Verify environment variables
vercel env ls

# Check production values
vercel env pull .env.production

# Test locally with production env
NODE_ENV=production npm run build
```

#### Database Connection Issues

```bash
# Test database connection
psql -h db.eiipozoogrrfudhjoqms.supabase.co -U postgres -d postgres -c "SELECT 1;"

# Check connection pooling
# Go to Supabase Dashboard > Settings > Database > Connection pooling

# Monitor active connections
psql -h db.eiipozoogrrfudhjoqms.supabase.co -U postgres -d postgres -c "
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';"
```

### Performance Issues

#### Slow API Responses

```sql
-- Find slow queries
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

-- Check for missing indexes
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan;
```

#### Memory Issues

```bash
# Monitor Vercel function memory usage
vercel logs --follow | grep "memory"

# Increase function memory in vercel.json
{
  "functions": {
    "app/api/**": {
      "memory": 512
    }
  }
}
```

### Recovery Procedures

#### Rollback Deployment

```bash
# Rollback to previous deployment
vercel rollback [deployment-url]

# Or redeploy previous commit
git revert HEAD
git push origin main
```

#### Database Recovery

```bash
# Point-in-time recovery (contact Supabase support)
# Or restore from backup
gunzip backup_20240101_120000.sql.gz
psql -h db.eiipozoogrrfudhjoqms.supabase.co -U postgres -d postgres < backup_20240101_120000.sql
```

## Maintenance Procedures

### Regular Maintenance Tasks

```bash
#!/bin/bash
# scripts/maintenance.sh

echo "=== Starting maintenance procedures ==="

# 1. Database maintenance
echo "Running database maintenance..."
psql -h db.eiipozoogrrfudhjoqms.supabase.co -U postgres -d postgres -c "
VACUUM ANALYZE orders;
VACUUM ANALYZE kds_order_routing;
REINDEX INDEX CONCURRENTLY orders_status_created_at;
SELECT cleanup_old_data();
"

# 2. Performance analysis
echo "Analyzing performance..."
npm run analyze

# 3. Security audit
echo "Running security audit..."
npm audit --audit-level=high

# 4. Dependencies update check
echo "Checking for dependency updates..."
npm outdated

# 5. Backup verification
echo "Verifying backups..."
./scripts/backup-database.sh

echo "=== Maintenance completed ==="
```

### Scheduled Tasks

```json
// vercel.json - Cron jobs
{
  "crons": [
    {
      "path": "/api/maintenance/cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/maintenance/backup",
      "schedule": "0 4 * * *"
    },
    {
      "path": "/api/health",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Production Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security headers configured
- [ ] SSL certificates valid
- [ ] Monitoring setup complete

### Post-Deployment

- [ ] Health check endpoint responding
- [ ] Database connections stable
- [ ] Real-time features working
- [ ] Voice transcription functional
- [ ] Error tracking operational
- [ ] Performance metrics baseline
- [ ] Backup systems verified

### Ongoing Operations

- [ ] Daily health checks
- [ ] Weekly performance reviews
- [ ] Monthly security audits
- [ ] Quarterly dependency updates
- [ ] Regular backup testing
- [ ] Incident response procedures
- [ ] Documentation updates

This deployment guide provides comprehensive coverage for maintaining a production-grade Plate Restaurant System with proper monitoring, security, and operational procedures.
