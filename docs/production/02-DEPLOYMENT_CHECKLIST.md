# Production Deployment Checklist - Project Helios

## Pre-Deployment Validation

### 🔍 Environment Verification
- [ ] **Node.js Version**: 18.0 or higher
- [ ] **Supabase CLI**: Latest version installed
- [ ] **PostgreSQL**: Version 14.0+ accessible
- [ ] **Build Tools**: tsx, npm, git available
- [ ] **SSL Certificates**: Valid and properly configured

### 📋 Environment Variables
#### Required Variables ✅
```bash
# Database Configuration
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export SUPABASE_DB_PASSWORD="your-db-password"

# OpenAI Configuration
export OPENAI_API_KEY="your-openai-key"

# Environment Settings
export NODE_ENV="production"
export VERCEL_ENV="production"

# Optional: Monitoring
export WEBHOOK_URL="https://your-webhook-url"
export SLACK_WEBHOOK="https://hooks.slack.com/your-webhook"
```

#### Validation Commands
```bash
# Verify all environment variables
tsx scripts/validate-system.ts --env-check

# Test database connectivity
npm run db:check-schema

# Validate OpenAI API access
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

### 🔒 Security Validation
- [ ] **HTTPS Enforcement**: Enabled for all routes
- [ ] **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- [ ] **CORS Configuration**: Properly configured for production domains
- [ ] **API Keys**: Rotated and secure
- [ ] **Database Access**: RLS policies active and tested
- [ ] **Authentication**: JWT tokens properly configured

### 📊 Performance Baseline
```bash
# Run performance tests
npm run test:performance:ci

# Validate production readiness
npm run validate:production --threshold 85

# Check bundle size
npm run analyze
```

## Deployment Steps

### 1️⃣ Pre-Deployment Build
```bash
# Clean build environment
rm -rf .next node_modules
npm ci

# Run comprehensive tests
npm run test:all

# Build for production
npm run build

# Verify build output
ls -la .next/
```

### 2️⃣ Database Migration
```bash
# Backup current database
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backups/pre_deploy_${TIMESTAMP}.sql"

# Apply migrations
npm run supabase:migrate

# Verify migration success
tsx scripts/final-verification.ts
```

### 3️⃣ Application Deployment

#### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Verify deployment
vercel ls
```

#### Manual Deployment
```bash
# Start production server
npm run start

# Verify server start
curl http://localhost:3000/api/health
```

### 4️⃣ Post-Deployment Verification
```bash
# Health check
npm run monitor:health --url https://your-app.vercel.app

# Run deployment tests
npm run test:deployment

# Verify all endpoints
curl -f https://your-app.vercel.app/api/health
curl -f https://your-app.vercel.app/api/metrics
```

## Environment Setup Checklist

### 🌐 Production Environment
- [ ] **Domain Configuration**: Custom domain configured
- [ ] **SSL Certificate**: Valid and automatically renewing
- [ ] **CDN Configuration**: Static assets properly cached
- [ ] **Environment Variables**: All required variables set
- [ ] **Monitoring Setup**: Health checks and alerts configured

### 🗄️ Database Configuration
- [ ] **Connection Pooling**: Configured for production load
- [ ] **Backup Strategy**: Automated backups enabled
- [ ] **Performance Monitoring**: Slow query logging enabled
- [ ] **Index Optimization**: All performance indexes applied
- [ ] **RLS Policies**: Row Level Security properly configured

### 🔍 Monitoring Setup
- [ ] **Health Endpoints**: /api/health responding correctly
- [ ] **Metrics Collection**: /api/metrics providing data
- [ ] **Error Tracking**: Application errors being captured
- [ ] **Performance Monitoring**: Response times tracked
- [ ] **Uptime Monitoring**: External monitoring configured

## Post-Deployment Verification

### 🧪 Functional Testing
```bash
# Test core functionality
npm run test:smoke

# Test authentication flow
curl -X POST https://your-app.vercel.app/api/auth-check

# Test KDS system
tsx scripts/test-kds-final.cjs

# Test order management
tsx scripts/test-order-final.cjs

# Test voice features
npm run test:voice:quick
```

### 📈 Performance Validation
```bash
# Response time validation
npm run monitor:health --url https://your-app.vercel.app

# Load testing (if applicable)
npm run test:performance

# Database performance check
tsx scripts/analyze-database-performance.sql
```

### 🔐 Security Validation
```bash
# Security headers check
curl -I https://your-app.vercel.app

# Authentication check
curl https://your-app.vercel.app/auth/admin
# Should return 401/403 or redirect to login

# RLS policy validation
tsx scripts/test-rls-security.cjs
```

## Rollback Procedures

### 🚨 Emergency Rollback
```bash
# Immediate rollback (Vercel)
vercel rollback

# Database rollback (if needed)
BACKUP_FILE="backups/pre_deploy_TIMESTAMP.sql"
pg_restore --clean --if-exists -d $DATABASE_URL $BACKUP_FILE

# Verify rollback
npm run monitor:health --url https://your-app.vercel.app
```

### 📋 Rollback Checklist
- [ ] **Application Rollback**: Previous version deployed
- [ ] **Database Rollback**: Schema and data restored
- [ ] **Environment Variables**: Previous configuration restored
- [ ] **Monitoring Alerts**: Incident response team notified
- [ ] **Status Page**: Users informed of issues

## Monitoring and Alerting

### 🔔 Alert Configuration
```bash
# Setup continuous monitoring
npm run monitor:health:continuous --url https://your-app.vercel.app

# Configure Slack alerts
npm run monitor:health --slack $SLACK_WEBHOOK --threshold 2

# Setup webhook notifications
npm run monitor:health --webhook $WEBHOOK_URL --continuous
```

### 📊 Key Metrics to Monitor
- **Response Time**: < 2 seconds for homepage
- **Database Performance**: < 200ms average query time
- **Error Rate**: < 1% of total requests
- **Uptime**: > 99.9% availability
- **Memory Usage**: < 80% of allocated memory

### 🚨 Alert Thresholds
- **Critical**: 3 consecutive health check failures
- **Warning**: Response time > 5 seconds
- **Info**: Memory usage > 70%

## Production Readiness Criteria

### ✅ Minimum Requirements
- [ ] **Build Success**: Application builds without errors
- [ ] **Test Coverage**: All critical tests passing
- [ ] **Health Checks**: All endpoints responding correctly
- [ ] **Security**: HTTPS enabled, security headers present
- [ ] **Database**: Migrations applied, RLS configured
- [ ] **Monitoring**: Health checks and metrics operational

### 🏆 Optimization Goals
- [ ] **Performance Score**: > 85/100 on production readiness test
- [ ] **Security Score**: > 90/100 on security validation
- [ ] **Database Performance**: < 100ms average response time
- [ ] **Bundle Size**: < 2MB for core application
- [ ] **Cache Hit Rate**: > 70% for OpenAI API calls

## Deployment Commands Reference

### 🔧 Essential Commands
```bash
# Full deployment validation
npm run validate:deployment

# Production readiness check
npm run validate:production --url https://your-app.vercel.app

# Health monitoring
npm run monitor:health --continuous

# Performance analysis
npm run analyze

# Test suite execution
npm run test:all

# Database migration
npm run supabase:migrate
```

### 🔍 Diagnostic Commands
```bash
# Check application logs
vercel logs --follow

# Database connection test
tsx scripts/test-postgres-connection.ts

# Real-time functionality test
tsx scripts/test-realtime-connection.ts

# Comprehensive system check
tsx scripts/comprehensive-database-diagnosis.ts
```

## Team Communication

### 📢 Deployment Notifications
- [ ] **Pre-Deployment**: Team notified 24 hours before
- [ ] **During Deployment**: Real-time updates in #deployments
- [ ] **Post-Deployment**: Success/failure notification
- [ ] **Issues Found**: Immediate escalation to on-call team

### 📞 Emergency Contacts
- **On-Call Engineer**: Slack @oncall or +1-XXX-XXX-XXXX
- **Database Team**: #database-support
- **DevOps Team**: #devops-alerts
- **Product Team**: #product-updates

## Documentation Updates

### 📝 Post-Deployment Tasks
- [ ] **Deployment Log**: Record deployment details
- [ ] **Performance Metrics**: Document baseline performance
- [ ] **Known Issues**: Update known issues list
- [ ] **User Documentation**: Update user-facing documentation
- [ ] **Runbook Updates**: Update operational procedures

### 📋 Deployment Record Template
```markdown
## Deployment Record - [Date]

**Deployment ID**: [Vercel deployment ID]
**Git Commit**: [commit hash]
**Deployed By**: [team member]
**Start Time**: [timestamp]
**End Time**: [timestamp]
**Status**: [SUCCESS/FAILED/ROLLED_BACK]

### Changes Deployed
- [List of features/fixes deployed]

### Performance Metrics
- Response Time: [average ms]
- Health Check: [status]
- Database Performance: [average ms]

### Issues Encountered
- [List any issues and resolutions]

### Rollback Information
- [Rollback procedures used, if any]
```

## Success Metrics

### 📈 Key Performance Indicators
- **Deployment Success Rate**: > 95%
- **Rollback Rate**: < 5%
- **Mean Time to Recovery**: < 30 minutes
- **Zero-Downtime Deployments**: 100%
- **Post-Deployment Issues**: < 2 per month

### 🎯 Quality Gates
- All automated tests must pass
- Security scan results must be clean
- Performance regression must be < 10%
- Database migration must complete successfully
- Health checks must return 200 OK status

This checklist ensures consistent, reliable deployments while maintaining high availability and performance standards for Project Helios.