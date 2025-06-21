# Production Configuration Guide - Project Helios

## Environment Variables Configuration

### 🔧 Required Environment Variables

#### Database Configuration
```bash
# Supabase Database Settings
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_DB_PASSWORD="your-database-password"

# Direct PostgreSQL Access (for migrations)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

#### OpenAI Configuration
```bash
# OpenAI API for Voice Recognition
OPENAI_API_KEY="sk-[your-openai-key]"
OPENAI_ORGANIZATION="org-[your-org-id]"  # Optional
OPENAI_PROJECT="proj_[your-project-id]"  # Optional
```

#### Application Environment
```bash
# Environment Settings
NODE_ENV="production"
VERCEL_ENV="production"
NEXT_PUBLIC_APP_ENV="production"

# Application URLs
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXTAUTH_URL="https://your-domain.com"
```

#### Security Configuration
```bash
# JWT Secret (32+ character random string)
NEXTAUTH_SECRET="your-nextauth-secret-key-32-chars-min"

# CORS Origins (comma-separated)
ALLOWED_ORIGINS="https://your-domain.com,https://admin.your-domain.com"
```

### 🎛️ Optional Configuration Variables

#### Monitoring and Logging
```bash
# External Monitoring
WEBHOOK_URL="https://your-monitoring-webhook.com"
SLACK_WEBHOOK="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"

# Log Level Configuration
LOG_LEVEL="info"  # debug, info, warn, error
ENABLE_PERFORMANCE_LOGS="true"
```

#### Feature Flags
```bash
# Voice Recognition Features
ENABLE_VOICE_COMMANDS="true"
VOICE_COMMAND_TIMEOUT="30000"  # milliseconds
AUDIO_SAMPLE_RATE="16000"      # Hz

# Real-time Features
ENABLE_REALTIME_UPDATES="true"
REALTIME_RETRY_ATTEMPTS="3"
REALTIME_RETRY_DELAY="1000"    # milliseconds

# Cache Configuration
ENABLE_TRANSCRIPTION_CACHE="true"
CACHE_TTL="3600"               # seconds
MAX_CACHE_SIZE="100"           # MB
```

#### Performance Tuning
```bash
# Database Connection Pooling
DB_POOL_SIZE="20"
DB_POOL_TIMEOUT="10000"        # milliseconds
DB_STATEMENT_TIMEOUT="30000"   # milliseconds

# API Rate Limiting
API_RATE_LIMIT="100"           # requests per minute
BURST_LIMIT="200"              # burst requests
```

## Feature Flags Configuration

### 🎚️ Runtime Feature Toggles

#### Voice Recognition System
```typescript
// lib/config/features.ts
export const VOICE_FEATURES = {
  enabled: process.env.ENABLE_VOICE_COMMANDS === 'true',
  timeout: parseInt(process.env.VOICE_COMMAND_TIMEOUT || '30000'),
  sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '16000'),
  
  // Advanced voice features
  enableBatchProcessing: true,
  enableCaching: process.env.ENABLE_TRANSCRIPTION_CACHE === 'true',
  cacheSize: parseInt(process.env.MAX_CACHE_SIZE || '100'),
  
  // Voice command types
  supportedCommands: [
    'mark_ready',
    'mark_preparing', 
    'mark_delivered',
    'add_note',
    'call_server'
  ]
}
```

#### Real-time Updates
```typescript
// lib/config/realtime.ts
export const REALTIME_CONFIG = {
  enabled: process.env.ENABLE_REALTIME_UPDATES !== 'false',
  retryAttempts: parseInt(process.env.REALTIME_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.REALTIME_RETRY_DELAY || '1000'),
  
  // Subscription channels
  channels: {
    orders: 'orders:*',
    kds: 'kds_orders:*',
    tables: 'tables:*',
    metrics: 'restaurant_metrics:*'
  },
  
  // Connection settings
  heartbeatInterval: 30000,
  reconnectDelay: 5000,
  maxReconnectAttempts: 10
}
```

#### Performance Features
```typescript
// lib/config/performance.ts
export const PERFORMANCE_CONFIG = {
  // Bundle optimization
  enableCodeSplitting: true,
  enableImageOptimization: true,
  
  // Caching strategies
  staticCacheTTL: 86400,        // 24 hours
  apiCacheTTL: 300,             // 5 minutes
  
  // Lazy loading
  enableLazyLoading: true,
  lazyLoadThreshold: 0.1,
  
  // Virtual scrolling for large lists
  enableVirtualScrolling: true,
  virtualScrollItemHeight: 120,
  virtualScrollBuffer: 5
}
```

## Performance Tuning Parameters

### 🚀 Database Optimization

#### Connection Pool Settings
```sql
-- PostgreSQL configuration
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

#### Supabase Edge Functions
```typescript
// supabase/functions/performance-config/index.ts
export const databaseConfig = {
  // Connection pooling
  pool: {
    min: 2,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  },
  
  // Query optimization
  statement_timeout: '30s',
  lock_timeout: '10s',
  idle_in_transaction_session_timeout: '60s',
  
  // Performance monitoring
  log_min_duration_statement: 1000, // Log queries > 1s
  track_activity_query_size: 2048,
  shared_preload_libraries: 'pg_stat_statements'
}
```

### ⚡ Application Performance

#### Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  
  // Bundle optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Tree shaking optimization
    config.optimization.usedExports = true
    config.optimization.sideEffects = false
    
    // Bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }
    
    return config
  },
  
  // Headers for security and performance
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        }
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0',
        }
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        }
      ],
    }
  ]
}

module.exports = nextConfig
```

#### OpenAI API Optimization
```typescript
// lib/config/openai.ts
export const OPENAI_CONFIG = {
  // API settings
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
  
  // Transcription optimization
  transcription: {
    model: 'whisper-1',
    language: 'en',
    response_format: 'json',
    temperature: 0.2,
    
    // Audio preprocessing
    sampleRate: 16000,
    channels: 1,
    bitDepth: 16,
    
    // Batch processing
    enableBatching: true,
    batchSize: 5,
    batchTimeout: 2000
  },
  
  // Cost optimization
  budgetLimits: {
    daily: 50.00,      // $50 per day
    monthly: 1000.00,  // $1000 per month
    alertThreshold: 0.8 // Alert at 80% usage
  },
  
  // Caching strategy
  caching: {
    enabled: true,
    ttl: 3600,         // 1 hour
    maxSize: 1000,     // 1000 entries
    keyPrefix: 'openai_cache_'
  }
}
```

## Security Configuration

### 🔒 Authentication Settings

#### Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Admin access policy
CREATE POLICY "Admin full access" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Server access policy  
CREATE POLICY "Server access to assigned tables" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN table_assignments ta ON ur.user_id = ta.server_id
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'server'
      AND ta.table_id = orders.table_id
    )
  );

-- Kitchen staff access policy
CREATE POLICY "Kitchen staff order access" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('cook', 'kitchen_manager')
    )
  );
```

#### API Security
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Security headers
  const headers = new Headers(request.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  
  // API rate limiting
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Implement rate limiting logic
    const userIP = request.ip || 'unknown'
    // Check rate limit for userIP
  }
  
  // Authentication check for protected routes
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    // Implement authentication validation
  }
  
  return NextResponse.next({ headers })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### 🛡️ CORS Configuration
```typescript
// lib/cors.ts
export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://your-domain.com',
    'https://admin.your-domain.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}
```

## Environment-Specific Configurations

### 🌍 Production Environment
```bash
# Production optimizations
NODE_ENV=production
VERCEL_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Performance settings
ENABLE_BUNDLE_ANALYZER=false
ENABLE_SOURCE_MAPS=false
OPTIMIZE_FONTS=true
OPTIMIZE_CSS=true

# Security settings
SECURE_COOKIES=true
CSRF_PROTECTION=true
CONTENT_SECURITY_POLICY=strict

# Monitoring
ENABLE_ERROR_REPORTING=true
ENABLE_PERFORMANCE_MONITORING=true
LOG_LEVEL=info
```

### 🧪 Staging Environment
```bash
# Staging configurations
NODE_ENV=production
VERCEL_ENV=preview
NEXT_PUBLIC_APP_ENV=staging

# Debug settings
ENABLE_DEBUG_LOGS=true
ENABLE_PERFORMANCE_PROFILING=true
LOG_LEVEL=debug

# Feature flags
ENABLE_EXPERIMENTAL_FEATURES=true
ENABLE_A_B_TESTING=true
```

### 🔧 Development Environment
```bash
# Development settings
NODE_ENV=development
VERCEL_ENV=development
NEXT_PUBLIC_APP_ENV=development

# Debug settings
ENABLE_DEBUG_LOGS=true
ENABLE_HOT_RELOAD=true
LOG_LEVEL=debug

# Development tools
ENABLE_BUNDLE_ANALYZER=true
ENABLE_SOURCE_MAPS=true
ENABLE_TYPE_CHECKING=true
```

## Configuration Validation

### ✅ Environment Validation Script
```typescript
// scripts/validate-config.ts
import { z } from 'zod'

const configSchema = z.object({
  // Required variables
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // Optional variables with defaults
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_VOICE_COMMANDS: z.string().default('true'),
  DB_POOL_SIZE: z.string().default('20'),
  
  // Security validation
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  ALLOWED_ORIGINS: z.string().optional(),
})

export function validateConfig() {
  try {
    const config = configSchema.parse(process.env)
    console.log('✅ Configuration validation passed')
    return config
  } catch (error) {
    console.error('❌ Configuration validation failed:', error)
    process.exit(1)
  }
}
```

### 🔍 Configuration Audit
```bash
# Run configuration validation
npm run validate:config

# Check for missing variables
npm run config:audit

# Validate security settings
npm run security:audit

# Performance configuration check
npm run performance:audit
```

## Configuration Management

### 📋 Configuration Templates

#### Production Configuration Template
```bash
# Save as: .env.production.template
# Copy to .env.production and fill in values

# Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD=YOUR_DB_PASSWORD

# OpenAI (Required)
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY

# Environment (Required)
NODE_ENV=production
VERCEL_ENV=production

# Security (Required for production)
NEXTAUTH_SECRET=YOUR_32_CHAR_SECRET
ALLOWED_ORIGINS=https://yourdomain.com

# Optional Performance Tuning
DB_POOL_SIZE=20
API_RATE_LIMIT=100
ENABLE_VOICE_COMMANDS=true
ENABLE_TRANSCRIPTION_CACHE=true

# Optional Monitoring
WEBHOOK_URL=https://your-webhook.com
SLACK_WEBHOOK=https://hooks.slack.com/YOUR_WEBHOOK
LOG_LEVEL=info
```

### 🔄 Configuration Updates
```bash
# Update production configuration
vercel env add VARIABLE_NAME production

# Update staging configuration  
vercel env add VARIABLE_NAME preview

# Remove outdated variables
vercel env rm OLD_VARIABLE_NAME production

# List all environment variables
vercel env ls
```

This configuration guide ensures optimal performance, security, and reliability for Project Helios in production environments.