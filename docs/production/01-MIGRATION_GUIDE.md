# Database Migration Guide - Project Helios

## Overview
This guide provides step-by-step procedures for migrating the Project Helios restaurant system database to production environments with comprehensive rollback strategies.

## Pre-Migration Requirements

### System Requirements
- PostgreSQL 14.0 or higher
- Supabase CLI installed and configured
- Node.js 18.0+ with npm/tsx
- Admin access to target database
- Backup storage with 2x database size capacity

### Environment Preparation
```bash
# Install required tools
npm install -g supabase
npm install -g tsx

# Verify Supabase connection
supabase status

# Test database connectivity
npm run db:check-schema
```

## Migration Process

### Phase 1: Pre-Migration Validation

#### 1.1 Backup Current Database
```bash
# Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="production_backup_${TIMESTAMP}.sql"

# Full database backup
pg_dump $DATABASE_URL > backups/$BACKUP_FILE

# Verify backup integrity
pg_restore --list backups/$BACKUP_FILE
```

#### 1.2 Validate Migration Scripts
```bash
# Check migration file integrity
npm run db:check-schema

# Validate against current state
npm run validate:deployment
```

#### 1.3 Environment Variable Audit
```bash
# Required environment variables
cat << EOF > production.env.checklist
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
✅ SUPABASE_SERVICE_ROLE_KEY
✅ OPENAI_API_KEY
✅ SUPABASE_DB_PASSWORD
✅ NODE_ENV=production
✅ VERCEL_ENV=production
EOF

# Validate all variables are set
tsx scripts/validate-system.ts --env-check
```

### Phase 2: Database Schema Migration

#### 2.1 Schema Analysis
```bash
# Analyze current schema state
tsx scripts/investigate-database-schema.cjs

# Check for schema conflicts
tsx scripts/check-schema.ts
```

#### 2.2 Execute Migration Scripts (In Order)
```bash
# Apply migrations in correct sequence
npm run supabase:migrate

# Or apply individually for better control:
supabase db push --db-url $PRODUCTION_DATABASE_URL

# Verify each migration
tsx scripts/verify-kds-fix.ts
```

#### 2.3 Critical Migration Files (Execute in Order)
1. **20250511210425_setup_rbac.sql** - Core RBAC system
2. **20250511222049_user_roles_permission.sql** - User permissions
3. **20250511222516_user_role_assignment.sql** - Role assignments
4. **20250512164938_tables_seats.sql** - Table management
5. **20250512204529_orders.sql** - Order system
6. **20250517230648_profiles.sql** - User profiles
7. **20250527000000_seed_initial_tables.sql** - Initial data
8. **20250527000001_create_kds_system.sql** - Kitchen Display System
9. **20250601000000_performance_optimization_indexes.sql** - Performance indexes
10. **20250615000000_fix_rls_and_schema.sql** - RLS security fixes
11. **20250618224458_kds_performance_indexes.sql** - KDS optimization
12. **20250618231550_anomaly_detection_system.sql** - Monitoring system
13. **20250619024442_fix_critical_schema_mismatches.sql** - Schema fixes
14. **20250619062622_table_grouping_optimization.sql** - Table grouping

### Phase 3: Row Level Security (RLS) Configuration

#### 3.1 Apply RLS Policies
```bash
# Apply demo RLS policies for production
node apply-demo-rls.cjs

# Verify RLS is properly configured
tsx scripts/test-rls-security.cjs

# Check policy effectiveness
tsx scripts/validate-rls-fix.ts
```

#### 3.2 User Role Configuration
```bash
# Setup guest user for demos
npm run setup-guest

# Create production users
tsx scripts/create-demo-residents.ts

# Verify role assignments
tsx scripts/check-user-role-final.ts
```

### Phase 4: Performance Optimization

#### 4.1 Index Optimization
```bash
# Apply performance indexes
psql $DATABASE_URL -f scripts/apply-targeted-indexes-final.sql

# Analyze performance impact
tsx scripts/apply-migration-simple.ts
```

#### 4.2 Table Layout Optimization
```bash
# Optimize table storage
psql $DATABASE_URL -f scripts/optimize-table-layout.sql

# Verify optimization
npm run db:perf-test
```

## Data Migration

### Initial Data Seeding
```bash
# Seed production data
npm run seed-demo

# Verify data integrity
tsx scripts/final-verification.ts

# Test order creation
tsx scripts/create-test-orders.ts
```

### Production Data Import
```bash
# Import production data (if migrating from existing system)
# Customize based on your source system
psql $DATABASE_URL -f production-data-import.sql

# Validate data relationships
tsx scripts/check-relationships.cjs
```

## Post-Migration Validation

### Functional Testing
```bash
# Run comprehensive test suite
npm run test:deployment

# Validate KDS functionality
tsx scripts/test-kds-final.cjs

# Test order flow
tsx scripts/test-order-final.cjs

# Test voice ordering
npm run test:voice:quick
```

### Performance Validation
```bash
# Test database performance
tsx scripts/comprehensive-database-diagnosis.ts

# Validate production readiness
npm run validate:production

# Health check verification
npm run monitor:health
```

## Rollback Procedures

### Emergency Rollback (< 1 hour)
```bash
# Immediate rollback to backup
BACKUP_FILE="production_backup_YYYYMMDD_HHMMSS.sql"

# Stop application traffic
# Set maintenance mode in your load balancer

# Restore database
pg_restore --clean --if-exists -d $DATABASE_URL backups/$BACKUP_FILE

# Verify restoration
npm run monitor:health

# Resume traffic
```

### Selective Rollback (Specific Migration)
```bash
# Rollback specific migration
supabase migration repair --db-url $DATABASE_URL

# Apply previous migration state
supabase db reset --db-url $DATABASE_URL

# Re-apply up to desired migration
supabase db push --db-url $DATABASE_URL
```

### Data-Only Rollback
```bash
# Preserve schema, rollback data only
pg_dump --data-only $DATABASE_URL > current_data.sql
pg_restore --data-only --clean backups/$BACKUP_FILE
```

## Monitoring and Validation

### Real-time Monitoring Setup
```bash
# Start continuous health monitoring
npm run monitor:health:continuous

# Setup production monitoring
npm run monitor:production

# Verify monitoring systems
npm run monitor:verify:production
```

### Performance Metrics
```bash
# Monitor database performance
tsx scripts/analyze-database-performance.sql

# Check connection pooling
tsx scripts/test-postgres-connection.ts

# Monitor real-time connections
tsx scripts/test-realtime-connection.ts
```

## Troubleshooting

### Common Migration Issues

#### Schema Mismatch Errors
```bash
# Fix UUID type mismatches
tsx scripts/fix-table-uuid-mismatch.ts

# Resolve schema conflicts
tsx scripts/comprehensive-schema-fix.ts
```

#### RLS Policy Issues
```bash
# Diagnose RLS problems
tsx scripts/investigate-rls.ts

# Fix policy conflicts
tsx scripts/fix-basic-rls.ts
```

#### Performance Issues
```bash
# Analyze slow queries
tsx scripts/analyze-database-performance.sql

# Apply performance fixes
tsx scripts/apply-performance-migration.ts
```

### Emergency Contacts
- **Database Team**: db-team@company.com
- **DevOps Team**: devops@company.com  
- **On-call Engineer**: +1-XXX-XXX-XXXX
- **Slack Channel**: #production-alerts

## Migration Checklist

### Pre-Migration ✅
- [ ] Full database backup created
- [ ] Migration scripts validated
- [ ] Environment variables configured
- [ ] Team notified of maintenance window
- [ ] Rollback procedures reviewed

### During Migration ✅
- [ ] Database backup verified
- [ ] Schema migrations applied in order
- [ ] RLS policies configured
- [ ] Performance indexes created
- [ ] Initial data seeded
- [ ] Functional tests passed

### Post-Migration ✅
- [ ] Health checks passing
- [ ] Performance metrics within SLA
- [ ] Monitoring systems active
- [ ] User access verified
- [ ] Documentation updated
- [ ] Team notified of completion

## Success Criteria
- All health checks return "healthy" status
- Database response times < 200ms average
- All test suites pass
- Zero critical security vulnerabilities
- Monitoring dashboards operational
- User authentication working correctly

## Additional Resources
- [Database Schema Documentation](./DATABASE_SCHEMA.md)
- [Security Configuration Guide](./SECURITY_GUIDE.md)
- [Performance Tuning Guide](./PERFORMANCE_GUIDE.md)
- [Troubleshooting Guide](./05-TROUBLESHOOTING_GUIDE.md)