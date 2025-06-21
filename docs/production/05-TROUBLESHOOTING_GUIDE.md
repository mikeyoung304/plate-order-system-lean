# Troubleshooting Guide - Project Helios

## Common Production Issues

### 🚨 Application Won't Start

#### Symptoms
- Application fails to start
- Build errors during deployment
- Environment variable errors

#### Diagnostic Steps
```bash
# Check application logs
vercel logs --follow

# Verify environment variables
npm run validate:config

# Test build locally
npm run build

# Check dependencies
npm audit

# Verify Node.js version
node --version  # Should be 18.0+
```

#### Common Causes & Solutions

**Missing Environment Variables**
```bash
# Verify required variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
echo $OPENAI_API_KEY

# Add missing variables
vercel env add VARIABLE_NAME production
```

**Build Failures**
```bash
# Clear build cache
rm -rf .next node_modules
npm ci
npm run build

# Check for TypeScript errors
npm run type-check

# Fix dependency conflicts
npm audit fix
```

**Port Conflicts (Local Development)**
```bash
# Kill processes on port 3000
npm run kill-port

# Use different port
npm run dev -- -p 3001
```

### 🔌 Database Connection Issues

#### Symptoms
- Health check fails for database
- "Cannot connect to database" errors
- Query timeouts

#### Diagnostic Commands
```bash
# Test database connectivity
tsx scripts/test-postgres-connection.ts

# Check Supabase status
supabase status

# Verify database schema
npm run db:check-schema

# Test direct connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### Solutions

**Connection Pool Exhaustion**
```bash
# Check active connections
tsx scripts/comprehensive-database-diagnosis.ts

# Restart connection pool
# Update DB_POOL_SIZE environment variable
vercel env add DB_POOL_SIZE 20 production

# Redeploy application
vercel --prod
```

**RLS Policy Issues**
```bash
# Diagnose RLS problems
tsx scripts/investigate-rls.ts

# Fix RLS policies
tsx scripts/fix-basic-rls.ts

# Test RLS with current user
tsx scripts/test-rls-security.cjs
```

**Schema Mismatches**
```bash
# Apply missing migrations
npm run supabase:migrate

# Fix schema conflicts
tsx scripts/fix-critical-schema-mismatches.ts

# Verify schema integrity
tsx scripts/final-verification.ts
```

### 🔐 Authentication Problems

#### Symptoms
- Users cannot log in
- "Unauthorized" errors
- JWT token issues

#### Diagnostic Steps
```bash
# Test auth endpoint
curl https://your-app.vercel.app/api/auth-check

# Check Supabase auth configuration
# Visit: https://supabase.com/dashboard/project/your-project/auth

# Verify JWT secret
echo $NEXTAUTH_SECRET | wc -c  # Should be 32+ characters
```

#### Solutions

**Invalid JWT Configuration**
```bash
# Generate new JWT secret
openssl rand -base64 32

# Update environment variable
vercel env add NEXTAUTH_SECRET "your-new-secret" production

# Redeploy
vercel --prod
```

**User Role Issues**
```bash
# Check user roles
tsx scripts/check-user-role-final.ts

# Fix guest user setup
npm run setup-guest

# Verify role assignments
tsx scripts/investigate-guest-user-roles.ts
```

**Session Expiry**
```bash
# Clear user sessions (in Supabase dashboard)
# Navigate to: Authentication > Users
# Click on user > "Sign out user"

# Update session configuration
# In Supabase: Authentication > Settings
# Adjust JWT expiry and refresh token settings
```

### 🎤 Voice Recognition Issues

#### Symptoms
- Voice commands not working
- OpenAI API errors
- Audio processing failures

#### Diagnostic Commands
```bash
# Test OpenAI API connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check voice command integration
npm run test:voice:quick

# Verify audio configuration
# Check browser console for microphone permissions
```

#### Solutions

**OpenAI API Issues**
```bash
# Check API key validity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check usage limits
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/usage

# Update API key if expired
vercel env add OPENAI_API_KEY "sk-new-key" production
```

**Audio Processing Problems**
```bash
# Check transcription cache
# Verify ENABLE_TRANSCRIPTION_CACHE is set to "true"

# Clear audio cache
# In browser: Clear site data for your domain

# Test audio quality
# Ensure microphone produces clear audio
# Test with different browsers
```

**Budget Exceeded**
```bash
# Check OpenAI usage
npm run demo:metrics

# Monitor cost in OpenAI dashboard
# https://platform.openai.com/usage

# Adjust budget limits in configuration
```

### 📊 Performance Issues

#### Symptoms
- Slow response times
- High memory usage
- Database query timeouts

#### Performance Diagnostics
```bash
# Run production readiness check
npm run validate:production --url https://your-app.vercel.app

# Analyze database performance
tsx scripts/analyze-database-performance.sql

# Check memory usage
npm run monitor:health --url https://your-app.vercel.app

# Performance profiling
npm run test:performance:ci
```

#### Solutions

**Slow Database Queries**
```bash
# Apply performance indexes
psql $DATABASE_URL -f scripts/apply-targeted-indexes-final.sql

# Optimize table layout
psql $DATABASE_URL -f scripts/optimize-table-layout.sql

# Check for missing indexes
tsx scripts/comprehensive-database-diagnosis.ts
```

**High Memory Usage**
```bash
# Restart application (Vercel does this automatically)
vercel --prod

# Check for memory leaks in logs
vercel logs --follow | grep -i "memory"

# Optimize bundle size
npm run analyze
```

**Slow API Responses**
```bash
# Enable response compression
# Verify next.config.js has compress: true

# Optimize images
# Check image optimization in next.config.js

# Enable caching
# Verify cache headers in API responses
```

### 🔄 Real-time Connection Issues

#### Symptoms
- Orders not updating in real-time
- WebSocket connection failures
- Stale data in KDS

#### Diagnostic Steps
```bash
# Test real-time connectivity
tsx scripts/test-realtime-connection.ts

# Check Supabase real-time status
# Visit: https://supabase.com/dashboard/project/your-project/logs

# Verify real-time subscriptions
# Check browser network tab for WebSocket connections
```

#### Solutions

**WebSocket Connection Failures**
```bash
# Check firewall/proxy settings
# Ensure WebSocket connections are allowed

# Verify Supabase configuration
# Check real-time settings in Supabase dashboard

# Test with different network
# Try mobile hotspot to isolate network issues
```

**Subscription Issues**
```bash
# Restart real-time listeners
# Refresh the browser page

# Check RLS policies for real-time
tsx scripts/test-rls-security.cjs

# Verify table permissions
# Ensure real-time is enabled for tables in Supabase
```

### 📱 KDS (Kitchen Display System) Issues

#### Symptoms
- Orders not appearing in KDS
- Display showing "No orders"
- Order status not updating

#### KDS-Specific Diagnostics
```bash
# Test KDS data access
tsx scripts/debug-kds-data-access.cjs

# Check KDS query structure
tsx scripts/test-kds-final.cjs

# Verify order creation
tsx scripts/test-order-final.cjs

# Debug table grouping
tsx scripts/test-table-grouping.cjs
```

#### Solutions

**Orders Not Appearing**
```bash
# Check order creation process
tsx scripts/create-test-orders.ts

# Verify KDS query filters
tsx scripts/test-complete-kds-query.cjs

# Check user permissions
tsx scripts/check-user-role-final.ts
```

**Display Issues**
```bash
# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Check real-time subscriptions
# Verify WebSocket connections in browser dev tools

# Restart KDS display
# Navigate away and back to KDS page
```

## Emergency Procedures

### 🚨 Critical System Failure

#### Immediate Response (< 5 minutes)
1. **Assess Impact**
   ```bash
   # Check health status
   curl https://your-app.vercel.app/api/health/simple
   
   # Check Vercel deployment status
   vercel ls
   ```

2. **Enable Maintenance Mode**
   ```bash
   # Create maintenance page
   echo "Under maintenance" > maintenance.html
   
   # Deploy maintenance page
   vercel --prod maintenance.html
   ```

3. **Alert Team**
   ```bash
   # Send Slack alert
   curl -X POST $SLACK_WEBHOOK \
     -H 'Content-Type: application/json' \
     -d '{"text":"🚨 CRITICAL: Project Helios system failure detected"}'
   ```

#### System Recovery (< 30 minutes)

**Option 1: Quick Rollback**
```bash
# Rollback to previous deployment
vercel rollback

# Verify rollback success
npm run monitor:health --url https://your-app.vercel.app
```

**Option 2: Database Recovery**
```bash
# Restore from backup
LATEST_BACKUP=$(ls -t backups/*.sql | head -1)
pg_restore --clean --if-exists -d $DATABASE_URL $LATEST_BACKUP

# Verify database integrity
tsx scripts/final-verification.ts
```

**Option 3: Fresh Deployment**
```bash
# Deploy from known good commit
git checkout KNOWN_GOOD_COMMIT
vercel --prod

# Verify deployment
npm run validate:deployment
```

### 🔧 Database Emergency Recovery

#### Data Corruption
```bash
# Stop write operations
# Enable read-only mode in application

# Assess corruption extent
psql $DATABASE_URL -c "
  SELECT schemaname, tablename, 
         pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Restore from most recent backup
BACKUP_FILE="backups/production_backup_$(date -d '1 hour ago' +%Y%m%d_%H%M%S).sql"
pg_restore --clean --if-exists -d $DATABASE_URL $BACKUP_FILE
```

#### Connection Pool Exhaustion
```bash
# Kill all connections
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE datname = current_database() 
  AND pid <> pg_backend_pid();
"

# Restart application
vercel --prod

# Monitor connections
tsx scripts/test-postgres-connection.ts
```

### 💰 OpenAI Budget Emergency

#### Budget Exceeded
```bash
# Disable voice features immediately
vercel env add ENABLE_VOICE_COMMANDS "false" production
vercel --prod

# Check current usage
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/usage

# Set up billing alerts in OpenAI dashboard
```

#### API Rate Limiting
```bash
# Enable transcription caching
vercel env add ENABLE_TRANSCRIPTION_CACHE "true" production

# Reduce API calls
vercel env add VOICE_COMMAND_TIMEOUT "60000" production

# Monitor cache hit rate
npm run demo:metrics
```

## Debugging Commands Reference

### 🔍 System Diagnostics
```bash
# Comprehensive health check
npm run monitor:health --url https://your-app.vercel.app --format table

# Production readiness validation
npm run validate:production --threshold 80

# Database performance analysis
tsx scripts/comprehensive-database-diagnosis.ts

# Real-time connection test
tsx scripts/test-realtime-connection.ts

# Security validation
tsx scripts/test-rls-security.cjs
```

### 🗄️ Database Diagnostics
```bash
# Schema validation
npm run db:check-schema

# Connection test
tsx scripts/test-postgres-connection.ts

# RLS policy check
tsx scripts/investigate-rls.ts

# Performance analysis
tsx scripts/analyze-database-performance.sql

# Migration status
supabase migration list
```

### 🎯 Application-Specific Tests
```bash
# KDS system test
tsx scripts/test-kds-final.cjs

# Order management test
tsx scripts/test-order-final.cjs

# Voice recognition test
npm run test:voice:quick

# Authentication test
tsx scripts/check-user-role-final.ts

# Table grouping test
tsx scripts/test-table-grouping.cjs
```

## Escalation Procedures

### 📞 Contact Information
- **Primary On-Call**: Slack @oncall or +1-XXX-XXX-XXXX
- **Database Team**: #database-support
- **DevOps Team**: #devops-alerts  
- **Product Team**: #product-updates
- **Vendor Support**: 
  - Supabase: support@supabase.io
  - Vercel: support@vercel.com
  - OpenAI: support@openai.com

### 🚨 Escalation Triggers
- **Level 1 (5 minutes)**: Single service failure
- **Level 2 (15 minutes)**: Multiple service failures
- **Level 3 (30 minutes)**: Complete system unavailability
- **Level 4 (1 hour)**: Data integrity issues

### 📋 Incident Response Checklist
- [ ] Assess impact and severity
- [ ] Enable maintenance mode if needed
- [ ] Alert appropriate team members
- [ ] Begin diagnostic procedures
- [ ] Document issue and resolution steps
- [ ] Conduct post-incident review
- [ ] Update monitoring and alerts
- [ ] Update documentation

## Prevention Strategies

### 🔍 Proactive Monitoring
```bash
# Set up continuous monitoring
npm run monitor:health:continuous --url https://your-app.vercel.app

# Schedule regular health checks
# Add to cron: */5 * * * * npm run monitor:health --silent

# Performance regression testing
npm run test:performance:ci

# Security audits
npm audit && npm run security:audit
```

### 📊 Capacity Planning
- Monitor resource usage trends
- Set up auto-scaling policies
- Plan for traffic spikes during meal times
- Regular performance benchmarking

### 🔧 Maintenance Windows
- Weekly: Dependency updates and security patches
- Monthly: Database maintenance and optimization
- Quarterly: Full system health review
- Annually: Disaster recovery testing

This troubleshooting guide provides systematic approaches to diagnosing and resolving common issues in Project Helios production environments.