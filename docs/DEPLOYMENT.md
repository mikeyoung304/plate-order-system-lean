# Deployment Guide

## Production Deployment

### Vercel Deployment (Recommended)

**Prerequisites:**
- Vercel CLI installed (`npm i -g vercel`)
- GitHub repository connected to Vercel
- Supabase project configured

**Steps:**
1. **Environment Variables**
   ```bash
   # Set in Vercel dashboard or CLI
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add OPENAI_API_KEY
   ```

2. **Deploy**
   ```bash
   npm run build        # Test build locally first
   vercel --prod        # Deploy to production
   ```

3. **Verify Deployment**
   ```bash
   npm run deploy-check # Run deployment validation
   ```

## Pre-Deployment Checklist

### Code Quality ✅
```bash
npm run test:quick      # Unit tests + lint + type-check
npm run test:coverage   # Ensure 80%+ coverage
npm run analyze         # Check bundle size (<100MB target)
```

### Security Audit ✅
```bash
npm audit              # Check for vulnerabilities
npm run security:scan  # Custom security validation
```

### Performance Validation ✅
```bash
npm run test:performance  # Performance benchmarks
npm run build && npm run analyze  # Bundle analysis
```

### Database Migrations ✅
```bash
npm run supabase:migrate  # Apply any pending migrations
supabase db push         # Push to production database
```

## Environment Configuration

### Development (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key
SUPABASE_SERVICE_ROLE_KEY=local-service-role-key
OPENAI_API_KEY=sk-your-dev-key
```

### Production (.env.production)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key
OPENAI_API_KEY=sk-your-prod-key
```

## Database Setup

### Supabase Configuration

**1. Create Project**
- Go to supabase.com
- Create new project
- Note project URL and keys

**2. Apply Migrations**
```bash
supabase link --project-ref your-project-ref
supabase db push
```

**3. Configure RLS Policies**
- Row Level Security enabled automatically
- Policies configured for role-based access
- Test with different user roles

**4. Enable Real-Time**
```sql
-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE kds_orders;
```

## Performance Optimization

### Bundle Optimization
```bash
# Analyze bundle composition
ANALYZE=true npm run build

# Check for optimization opportunities
npm run analyze
```

**Target Metrics:**
- Bundle size: <100MB (current: 289MB needs work)
- Page load: <2 seconds first contentful paint
- KDS performance: <500ms for 100 orders

### CDN Configuration
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
  }
}
```

## Monitoring Setup

### Health Checks
```bash
# Basic health endpoint
curl https://your-app.vercel.app/api/health

# Detailed health with auth
curl -H "Authorization: Bearer <token>" \
     https://your-app.vercel.app/api/health
```

### Performance Monitoring
```bash
# Custom monitoring script
npm run monitor:production

# Continuous monitoring
npm run monitor:health:continuous
```

### Error Tracking
- Vercel Analytics (automatic)
- Console error monitoring
- Performance vitals tracking

## Scaling Considerations

### Database Performance
```sql
-- Key indexes for performance
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY idx_kds_orders_station ON kds_orders(station_id);
```

### Real-Time Optimization
```typescript
// Efficient subscription patterns
const subscription = supabase
  .channel('orders-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `server_id=eq.${serverId}` // Filter at DB level
  }, handleUpdate)
  .subscribe()
```

### Caching Strategy
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/health/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300'
          }
        ]
      }
    ]
  }
}
```

## Rollback Strategy

### Quick Rollback
```bash
# Vercel rollback to previous deployment
vercel rollback

# Database rollback (if needed)
supabase migration down
```

### Blue-Green Deployment
```bash
# Deploy to staging
vercel --target staging

# Test staging environment
npm run test:e2e --env staging

# Promote to production
vercel promote --target production
```

## Troubleshooting

### Common Deployment Issues

**Build Errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Environment Variable Issues:**
```bash
# Verify environment variables
vercel env ls
vercel env pull .env.vercel
```

**Database Connection Issues:**
```bash
# Test database connectivity
npm run supabase:status
npx tsx scripts/validate-system.ts
```

### Performance Issues
```bash
# Analyze bundle size
npm run analyze

# Check for memory leaks
npm run test:performance

# Monitor real-time performance
npm run monitor:health
```

### Security Issues
```bash
# Audit dependencies
npm audit --audit-level moderate

# Check for exposed secrets
npm run security:scan
```

## Backup & Recovery

### Database Backups
- Supabase automatic daily backups
- Manual backup: `supabase db dump`
- Point-in-time recovery available

### Code Backups
- Git repository (multiple remotes recommended)
- Vercel deployment history
- Local development environment preservation

## Maintenance

### Regular Tasks
- **Weekly:** Dependency updates (`npm update`)
- **Monthly:** Security audit (`npm audit`)
- **Quarterly:** Performance review and optimization
- **As needed:** Database migration application

### Monitoring Alerts
```bash
# Set up monitoring
npm run monitor:setup

# Configure alerts for:
# - Response time > 2 seconds
# - Error rate > 1%
# - Memory usage > 80%
# - Database connection issues
```