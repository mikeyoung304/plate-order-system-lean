# Troubleshooting & Maintenance Guide

## Overview

This comprehensive guide provides troubleshooting procedures, maintenance tasks, and monitoring strategies for the Plate Restaurant System's enterprise-grade deployment.

## 🔍 Quick Diagnostics

### System Health Check

```bash
# Run comprehensive health check
npm run health:check

# Expected output:
✅ Database: Connected (30+ indexes optimized)
✅ Real-time: Active (1000+ users supported)
✅ Cache: 87% hit rate (target: >85%)
✅ OpenAI: Budget on track ($18.50/month savings)
✅ Performance: 127ms avg latency (target: <200ms)
```

### Performance Dashboard

Access the real-time monitoring dashboard:

```typescript
import { RealtimeHealthMonitor } from '@/components/realtime-health-monitor'

// In admin dashboard
<RealtimeHealthMonitor
  showDetailedMetrics
  autoRefresh
  alertThresholds={{
    latency: 200,
    errorRate: 0.05,
    cacheHitRate: 0.8,
    memoryUsage: 500
  }}
/>
```

## 🚨 Common Issues & Solutions

### 1. Performance Degradation

#### Symptoms

- Response times >200ms
- High memory usage (>500MB per 100 users)
- UI lag or freezing

#### Diagnostic Commands

```bash
# Check current performance
npm run test:performance

# Monitor real-time metrics
curl http://localhost:3000/api/health/performance

# Database query analysis
npx supabase db analyze
```

#### Solutions

1. **Cache Optimization**:

   ```typescript
   // Check cache hit rates
   const cacheStats = await cache.getStats()
   if (cacheStats.hitRate < 0.85) {
     // Adjust TTL settings
     cache.configure({ ttlMs: 1800000 }) // 30 minutes
   }
   ```

2. **Connection Pool Management**:

   ```typescript
   // Monitor connection efficiency
   const { poolEfficiency } = useOptimizedRealtime()
   if (poolEfficiency < 0.8) {
     // Increase pool size
     configureConnectionPool({ maxConnections: 20 })
   }
   ```

3. **Database Index Analysis**:
   ```sql
   -- Check index usage
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
   FROM pg_stat_user_indexes
   WHERE schemaname = 'public'
   ORDER BY idx_scan DESC;
   ```

### 2. High OpenAI Costs

#### Symptoms

- Budget alerts triggering
- Cost >$0.006 per transcription
- Low cache hit rates

#### Diagnostic Commands

```bash
# Check usage analytics
curl http://localhost:3000/api/transcribe/analytics

# Analyze cost breakdown
node scripts/analyze-cost-optimization.js

# Cache performance report
node scripts/cache-performance-report.js
```

#### Solutions

1. **Enable Intelligent Caching**:

   ```typescript
   const transcriptionService = getOptimizedTranscriptionService(apiKey, {
     enableCaching: true,
     cacheTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
     enableSimilarityMatching: true,
     similarityThreshold: 0.85,
   })
   ```

2. **Audio Optimization**:

   ```typescript
   const audioOptimizer = createAudioOptimizer({
     maxSizeKB: 500,
     targetBitrate: 64000,
     maxDurationMs: 30000,
     enableCompression: true,
   })
   ```

3. **Budget Management**:
   ```env
   # Set daily budget limits
   OPENAI_DAILY_BUDGET_CENTS=500
   OPENAI_WEEKLY_BUDGET_CENTS=3000
   OPENAI_MONTHLY_BUDGET_CENTS=10000
   ```

### 3. Real-time Connection Issues

#### Symptoms

- Delayed order updates
- Connection failures
- WebSocket errors

#### Diagnostic Commands

```bash
# Monitor connection health
curl http://localhost:3000/api/health/realtime

# Check subscription filters
node scripts/test-subscription-filters.js

# Analyze data transfer
node scripts/analyze-data-transfer.js
```

#### Solutions

1. **Role-Based Filtering**:

   ```typescript
   // Verify filtering is active
   const subscription = useOptimizedOrders({
     userRole: 'server',
     userId: user.id,
     enableFiltering: true,
   })

   // Should reduce data transfer by 70-90%
   console.log('Data reduction:', subscription.dataReduction)
   ```

2. **Connection Pooling**:

   ```typescript
   // Enable connection pooling
   const realtimeProvider = (
     <OptimizedRealtimeProvider
       enableConnectionPooling={true}
       maxChannelsPerConnection={10}
       heartbeatInterval={30000}
     >
       {children}
     </OptimizedRealtimeProvider>
   )
   ```

3. **Fallback Mechanisms**:
   ```typescript
   // Configure fallback polling
   const ordersHook = useOptimizedOrders({
     enableFallback: true,
     fallbackInterval: 5000, // 5 seconds
     maxRetries: 3,
   })
   ```

### 4. Authentication & Authorization Issues

#### Symptoms

- Access denied errors
- Role permission failures
- Session timeout issues

#### Diagnostic Commands

```bash
# Check RLS policies
npx supabase db inspect

# Verify user roles
psql -c "SELECT user_id, role FROM profiles LIMIT 10;"

# Test authentication flow
node scripts/test-auth-flow.js
```

#### Solutions

1. **RLS Policy Verification**:

   ```sql
   -- Check policies for orders table
   SELECT policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'orders';
   ```

2. **Session Management**:

   ```typescript
   // Verify session handling
   const { session, user } = useAuth()
   if (!session) {
     // Redirect to login or refresh session
     await supabase.auth.refreshSession()
   }
   ```

3. **Role Assignment Check**:

   ```typescript
   // Verify user role
   const { data: profile } = await supabase
     .from('profiles')
     .select('role')
     .eq('user_id', user.id)
     .single()

   if (!profile || !['admin', 'server', 'cook'].includes(profile.role)) {
     throw new Error('Invalid user role')
   }
   ```

### 5. Cache Performance Issues

#### Symptoms

- Hit rates <80%
- High memory usage
- Slow cache lookups

#### Diagnostic Commands

```typescript
// Check cache statistics
const cacheStats = await cache.getStats()
console.log('Cache Analysis:')
console.log('├── Hit Rate:', (cacheStats.hitRate * 100).toFixed(1) + '%')
console.log('├── Total Entries:', cacheStats.totalEntries)
console.log('├── Memory Usage:', cacheStats.memoryUsage + 'MB')
console.log(
  '└── TTL Effectiveness:',
  (cacheStats.ttlEffectiveness * 100).toFixed(1) + '%'
)
```

#### Solutions

1. **TTL Optimization**:

   ```typescript
   // Adjust TTL based on usage patterns
   const cache = getTranscriptionCache({
     ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days for high-use items
     shortTtlMs: 60 * 60 * 1000, // 1 hour for one-time items
     enableAdaptiveTtl: true,
   })
   ```

2. **Memory Management**:

   ```typescript
   // Configure memory limits
   cache.configure({
     maxEntries: 10000,
     maxMemoryMB: 100,
     enableAutoCleanup: true,
     cleanupInterval: 3600000, // 1 hour
   })
   ```

3. **Similarity Matching**:
   ```typescript
   // Enable intelligent similarity matching
   cache.configure({
     enableSimilarityMatching: true,
     similarityThreshold: 0.85,
     maxSimilarityChecks: 100,
   })
   ```

## 📊 Performance Monitoring

### Real-time Metrics

Access comprehensive performance metrics:

```typescript
// Get current performance data
const { getPerformanceMetrics } = useOptimizedOrders()
const metrics = getPerformanceMetrics()

console.log('Performance Report:')
console.log('├── Average Latency:', metrics.averageLatency + 'ms')
console.log('├── Success Rate:', (metrics.successRate * 100).toFixed(1) + '%')
console.log(
  '├── Cache Hit Rate:',
  (metrics.cacheHitRate * 100).toFixed(1) + '%'
)
console.log('├── Memory Usage:', metrics.memoryUsage + 'MB')
console.log(
  '└── Data Transfer Reduction:',
  (metrics.dataReduction * 100).toFixed(1) + '%'
)
```

### Automated Alerts

Set up automated monitoring and alerting:

```typescript
// Configure performance alerts
const monitoringConfig = {
  alerts: {
    highLatency: { threshold: 200, action: 'email_admin' },
    lowCacheHitRate: { threshold: 0.8, action: 'slack_notification' },
    highErrorRate: { threshold: 0.05, action: 'emergency_alert' },
    budgetExceeded: { threshold: 500, action: 'disable_api' },
  },
  monitoring: {
    interval: 60000, // 1 minute
    retentionDays: 30,
    enableDetailedLogs: true,
  },
}
```

### Performance Benchmarks

Run regular performance benchmarks:

```bash
# Weekly performance validation
npm run test:performance:weekly

# Monthly stress testing
npm run test:stress:monthly

# Quarterly capacity planning
npm run test:capacity:quarterly
```

## 🔧 Maintenance Tasks

### Daily Tasks (Automated)

1. **Cache Cleanup**:

   ```bash
   # Automated cache maintenance
   node scripts/daily-cache-cleanup.js
   ```

2. **Performance Monitoring**:

   ```bash
   # Generate daily performance report
   node scripts/daily-performance-report.js
   ```

3. **Cost Analysis**:
   ```bash
   # Track daily OpenAI usage and costs
   node scripts/daily-cost-analysis.js
   ```

### Weekly Tasks

1. **Database Maintenance**:

   ```sql
   -- Update table statistics
   ANALYZE;

   -- Check for unused indexes
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0;
   ```

2. **Performance Review**:

   ```bash
   # Generate weekly performance report
   npm run reports:weekly:performance

   # Analyze optimization opportunities
   npm run analyze:optimization:opportunities
   ```

3. **Security Audit**:
   ```bash
   # Weekly security scan
   npm audit
   npm run security:scan:weekly
   ```

### Monthly Tasks

1. **Capacity Planning**:

   ```bash
   # Monthly capacity analysis
   npm run analyze:capacity:monthly

   # Forecast resource requirements
   npm run forecast:resources
   ```

2. **Cost Optimization Review**:

   ```bash
   # Monthly cost optimization analysis
   node scripts/monthly-cost-optimization.js

   # Update budget allocations
   node scripts/update-budget-allocations.js
   ```

3. **Performance Baseline Update**:

   ```bash
   # Update performance baselines
   npm run update:baselines:monthly

   # Validate SLA compliance
   npm run validate:sla:compliance
   ```

## 🚀 Optimization Strategies

### Cache Optimization

1. **Intelligent TTL Management**:

   ```typescript
   // Implement adaptive TTL based on usage patterns
   const adaptiveTtl = (item: CacheItem) => {
     const baseHours = 24
     const usageMultiplier = Math.min(item.useCount / 10, 5)
     return baseHours * usageMultiplier * 60 * 60 * 1000
   }
   ```

2. **Predictive Caching**:
   ```typescript
   // Pre-cache frequently used items
   const predictiveCache = async (userId: string) => {
     const commonPhrases = await getCommonPhrasesForUser(userId)
     await Promise.all(commonPhrases.map(phrase => preGenerateCache(phrase)))
   }
   ```

### Database Optimization

1. **Index Optimization**:

   ```sql
   -- Create composite indexes for common query patterns
   CREATE INDEX CONCURRENTLY idx_orders_status_created
   ON orders(status, created_at) WHERE status IN ('pending', 'ready');

   CREATE INDEX CONCURRENTLY idx_orders_server_status
   ON orders(server_id, status) WHERE status != 'completed';
   ```

2. **Query Optimization**:
   ```typescript
   // Use optimized queries with proper indexing
   const getActiveOrders = async (serverId: string) => {
     return supabase
       .from('orders')
       .select(
         `
         id, status, created_at, items,
         table:tables!inner(label),
         resident:profiles!resident_id(name)
       `
       )
       .eq('server_id', serverId)
       .in('status', ['pending', 'preparing', 'ready'])
       .order('created_at', { ascending: false })
       .limit(50)
   }
   ```

### Real-time Optimization

1. **Subscription Efficiency**:

   ```typescript
   // Optimize subscription patterns
   const optimizedSubscription = useOptimizedOrders({
     enableBatching: true,
     batchInterval: 100,
     enableDeduplication: true,
     roleBasedFiltering: true,
   })
   ```

2. **Connection Management**:
   ```typescript
   // Intelligent connection pooling
   const connectionManager = {
     maxConnections: 20,
     connectionTimeout: 30000,
     retryStrategy: 'exponential',
     healthCheckInterval: 10000,
   }
   ```

## 📋 Emergency Procedures

### High Load Emergency

1. **Immediate Actions**:

   ```bash
   # Enable emergency mode
   export EMERGENCY_MODE=true

   # Increase cache TTL
   export CACHE_TTL_EMERGENCY=3600000

   # Reduce connection limits
   export MAX_CONNECTIONS_EMERGENCY=5
   ```

2. **Load Balancing**:
   ```typescript
   // Enable load balancing features
   const emergencyConfig = {
     enableLoadBalancing: true,
     maxConcurrentRequests: 10,
     queueTimeout: 5000,
     enableDegradedMode: true,
   }
   ```

### Cost Emergency

1. **Budget Protection**:

   ```bash
   # Immediately halt API calls if budget exceeded
   export OPENAI_EMERGENCY_STOP=true

   # Enable emergency caching only
   export CACHE_ONLY_MODE=true
   ```

2. **Fallback Operations**:
   ```typescript
   // Switch to manual order entry
   const emergencyFallback = {
     disableVoiceOrdering: true,
     enableManualEntry: true,
     showEmergencyNotification: true,
   }
   ```

### Connection Emergency

1. **Fallback to Polling**:

   ```typescript
   // Automatic fallback to polling mode
   const connectionFallback = {
     enablePollingFallback: true,
     pollingInterval: 5000,
     maxRetries: 5,
     showConnectionStatus: true,
   }
   ```

2. **Offline Mode**:
   ```typescript
   // Enable offline capabilities
   const offlineConfig = {
     enableOfflineMode: true,
     queueOfflineActions: true,
     syncWhenOnline: true,
     showOfflineIndicator: true,
   }
   ```

## 🔍 Log Analysis

### Performance Logs

```bash
# Analyze performance logs
grep "PERFORMANCE" logs/application.log | tail -100

# Check for slow queries
grep "SLOW_QUERY" logs/database.log | tail -50

# Monitor API response times
grep "API_RESPONSE" logs/api.log | awk '{sum+=$4; count++} END {print "Avg:", sum/count}'
```

### Error Analysis

```bash
# Recent errors
grep "ERROR" logs/application.log | tail -50

# Authentication failures
grep "AUTH_FAILED" logs/auth.log | tail -20

# Real-time connection issues
grep "REALTIME_ERROR" logs/realtime.log | tail -30
```

### Usage Analytics

```bash
# OpenAI usage patterns
grep "OPENAI_REQUEST" logs/api.log | awk -F'|' '{print $3}' | sort | uniq -c

# Cache hit analysis
grep "CACHE_HIT\|CACHE_MISS" logs/application.log | tail -100 | sort | uniq -c

# User activity patterns
grep "USER_ACTION" logs/application.log | awk -F'|' '{print $2}' | sort | uniq -c
```

## 📞 Support Contacts

### Emergency Contacts

- **System Administrator**: [Contact Information]
- **Database Administrator**: [Contact Information]
- **Performance Engineer**: [Contact Information]

### Escalation Procedures

1. **Level 1**: Performance degradation >200ms average
2. **Level 2**: Error rate >5% or budget exceeded by 50%
3. **Level 3**: System unavailable or data corruption

### Documentation References

- **Architecture Guide**: [CLAUDE.md](../CLAUDE.md)
- **Performance Guide**: [REALTIME_OPTIMIZATION_GUIDE.md](../REALTIME_OPTIMIZATION_GUIDE.md)
- **Cost Optimization**: [docs/OPENAI_OPTIMIZATION_GUIDE.md](./OPENAI_OPTIMIZATION_GUIDE.md)

---

This troubleshooting and maintenance guide ensures the Plate Restaurant System maintains enterprise-grade performance, reliability, and cost efficiency.
