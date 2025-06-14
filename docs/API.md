# API Reference

## Authentication Endpoints

### GET /api/auth-check
**Purpose:** Verify user authentication status  
**Auth Required:** Yes  
**Returns:** User profile data or error

```typescript
// Response
{
  user: {
    id: string
    email: string
    role: 'admin' | 'server' | 'cook' | 'resident'
  }
}
```

## Transcription Endpoints

### POST /api/transcribe
**Purpose:** Transcribe audio to text for voice orders  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

```typescript
// Request
{
  audio: File // .wav, .mp3, .m4a
  context?: string // Optional order context
}

// Response
{
  text: string
  confidence: number
  suggestions?: string[]
}
```

### POST /api/transcribe/batch
**Purpose:** Process multiple audio files efficiently  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

```typescript
// Request
{
  files: File[]
  batchId?: string
}

// Response
{
  results: Array<{
    filename: string
    text: string
    confidence: number
  }>
  batchId: string
}
```

## Analytics Endpoints

### GET /api/metrics
**Purpose:** Get real-time restaurant metrics  
**Auth Required:** Yes (admin/server roles)

```typescript
// Response
{
  orders: {
    total: number
    pending: number
    completed: number
  }
  voice: {
    totalTranscriptions: number
    averageAccuracy: number
    costOptimization: number
  }
  performance: {
    averageResponseTime: number
    activeUsers: number
  }
}
```

### GET /api/openai/usage
**Purpose:** Get OpenAI API usage statistics  
**Auth Required:** Yes (admin role)

```typescript
// Response
{
  currentMonth: {
    requests: number
    cost: number
    tokens: number
  }
  optimization: {
    cachingEnabled: boolean
    batchingEnabled: boolean
    savingsPercent: number
  }
}
```

## Health Endpoints

### GET /api/health
**Purpose:** System health check with detailed status  
**Auth Required:** No

```typescript
// Response
{
  status: 'healthy' | 'degraded' | 'unhealthy'
  database: {
    connected: boolean
    responseTime: number
  }
  services: {
    openai: boolean
    supabase: boolean
  }
  timestamp: string
}
```

### GET /api/health/simple
**Purpose:** Basic health check for monitoring  
**Auth Required:** No

```typescript
// Response
{
  status: 'ok'
  timestamp: string
}
```

## Database Operations

### Server Actions (used in components)

**Authentication:**
```typescript
// app/auth/actions.ts
signIn(formData: FormData): Promise<ActionResult>
signUp(formData: FormData): Promise<ActionResult>
signOut(): Promise<void>
```

**Order Management:**
```typescript
// lib/modassembly/supabase/database/orders.ts
createOrder(orderData: CreateOrderData): Promise<Order>
updateOrderStatus(id: string, status: OrderStatus): Promise<void>
fetchRecentOrders(limit?: number): Promise<Order[]>
```

**Table Management:**
```typescript
// lib/modassembly/supabase/database/tables.ts
fetchTables(): Promise<Table[]>
updateTableStatus(id: string, status: TableStatus): Promise<void>
```

## Real-Time Subscriptions

### Order Updates
```typescript
// Subscribe to order changes
supabase
  .channel('orders-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public', 
    table: 'orders'
  }, handleOrderChange)
  .subscribe()
```

### KDS Real-Time
```typescript
// Kitchen Display System updates
supabase
  .channel('kds-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'kds_orders'
  }, handleKDSUpdate)
  .subscribe()
```

## Error Handling

### Standard Error Response
```typescript
{
  error: {
    message: string
    code?: string
    details?: any
  }
  timestamp: string
}
```

### Common HTTP Status Codes
- **200:** Success
- **400:** Bad Request (validation errors)
- **401:** Unauthorized (auth required)
- **403:** Forbidden (insufficient permissions)
- **500:** Internal Server Error

## Rate Limits

**Voice Transcription:**
- 60 requests per minute per user
- 1000 requests per hour per user

**Analytics:**
- 100 requests per minute per user

**General API:**
- 1000 requests per minute per user

## Authentication

All API endpoints (except health checks) require:
```typescript
// Headers
{
  'Authorization': 'Bearer <supabase-session-token>'
}
```

**Getting Auth Token:**
```typescript
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

## Environment Variables

**Required for API functionality:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
```