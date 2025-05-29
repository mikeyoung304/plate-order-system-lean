# CLAUDE.md - Plater Order System Project Guide

## Project Overview

The Plater Order System is a specialized restaurant management system for assisted living facilities. This document serves as the definitive guide for AI assistance and development practices.

## Critical Project Information

### Project Links
- **Supabase Project ID**: `eiipozoogrrfudhjoqms`
- **Users Table**: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/auth/users
- **Profiles Table**: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/editor/65690?schema=public
- **Tables**: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/editor/67122
- **Seats**: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/editor/67131?schema=public
- **Orders**: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/editor/67176?schema=public

## Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **API Client**: Supabase Client, Fetch API
- **Voice Integration**: Web Audio API + OpenAI gpt-4o-transcribe

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (cookie-based)
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage (for audio files)

## Project Structure

```
plate-order-system/
├── lib/
│   └── modassembly/
│       ├── supabase/          # Supabase & OpenAI connections
│       │   ├── database/
│       │   │   └── suggestions.ts  # Order suggestion algorithm
│       │   └── auth/          # Authentication logic
│       ├── audio-recording/   # Audio recording functionality
│       └── openai/           # Audio transcription services
├── supabase/
│   └── migrations/           # Database migration history
├── app/                      # Next.js app directory
│   ├── (auth)/              # Auth-required routes
│   ├── login/               # Public auth pages
│   └── api/                 # API routes
└── components/              # React components
```

## Database Schema

### Core Tables

#### profiles
- `id` (uuid, FK to auth.users)
- `role` (text): 'admin' | 'cook' | 'server' | 'resident'
- `created_at` (timestamp)
- Additional user metadata fields

#### tables
- `id` (uuid)
- `table_id` (text, unique)
- `label` (text)
- `type` (text): table shape/style
- `status` (text): availability status

#### seats
- `id` (uuid)
- `seat_id` (text, unique)
- `table_id` (uuid, FK to tables)
- `resident_id` (uuid, FK to profiles, nullable)
- Position and metadata fields

#### orders
- `id` (uuid)
- `table_id` (uuid, FK to tables)
- `seat_id` (uuid, FK to seats)
- `resident_id` (uuid, FK to profiles)
- `server_id` (uuid, FK to profiles)
- `items` (jsonb): array of order items
- `transcript` (text): voice order transcript
- `status` (text): order status
- `type` (text): 'food' | 'beverage'
- `created_at` (timestamp)

## Authentication & Authorization

### Authentication Flow
1. Supabase Auth handles user authentication
2. Authentication state stored in cookies
3. All routes under `/(auth)` require authentication
4. Middleware validates session on each request

### User Roles & Permissions
- **admin**: Full system access, floor plan management
- **server**: Take orders, view tables, access voice ordering
- **cook**: Kitchen view, update food order status
- **resident**: Limited profile access (future feature)

### RLS Policies
- All tables have Row Level Security enabled
- Policies defined at: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/auth/policies

## Voice Ordering System

### Process Flow
1. Request microphone permission
2. Record audio to temporary file
3. Send to OpenAI gpt-4o-transcribe
4. Parse transcription to item array: "chicken, pasta, salad" → ["chicken", "pasta", "salad"]
5. Create order record in database
6. Real-time update to kitchen/bar views

### Implementation
```typescript
// lib/modassembly/audio-recording/recorder.ts
// lib/modassembly/openai/transcribe.ts
```

## Core Features

### 1. Floor Plan Management
- Dynamic table creation and positioning
- Customizable table shapes and sizes
- Seat assignment and management

### 2. Resident Recognition
- Track seating patterns
- Auto-suggest residents by seat
- Preference tracking via order history

### 3. Order Suggestions
Algorithm location: `lib/modassembly/supabase/database/suggestions.ts`
- Counts orders per resident per item type
- Returns most frequently ordered items
- Considers time of day and meal type

### 4. Real-time Updates
- WebSocket connections via Supabase Realtime
- Instant order status updates
- Multi-view synchronization

## Development Guidelines

### Code Style
```typescript
// Use TypeScript strict mode
// Prefer const over let
// Use async/await over promises
// Functional components only
// Custom hooks for shared logic

// File naming
components/OrderCard.tsx       // PascalCase for components
lib/utils/formatDate.ts       // camelCase for utilities
app/api/orders/route.ts      // lowercase for routes

// Import order
1. React/Next.js imports
2. Third-party libraries
3. Local components
4. Local utilities
5. Types
```

### Component Structure
```tsx
// components/ExampleComponent.tsx
import { FC } from 'react'
import { cn } from '@/lib/utils'

interface ExampleComponentProps {
  // Props interface
}

export const ExampleComponent: FC<ExampleComponentProps> = ({
  // Destructured props
}) => {
  // Hooks first
  // Event handlers
  // Render logic
  return <div />
}
```

### API Routes Pattern
```typescript
// app/api/[resource]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Verify authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Business logic
  // Return response
}
```

### Error Handling
```typescript
// Always use try-catch in async functions
// Log errors with context
// Return user-friendly error messages
// Use proper HTTP status codes

try {
  const result = await someOperation()
  return { success: true, data: result }
} catch (error) {
  console.error('Operation failed:', { error, context })
  return { success: false, error: 'Operation failed' }
}
```

## Testing Strategy

### Unit Tests
- Test pure functions and utilities
- Mock Supabase client
- Test component logic with React Testing Library

### Integration Tests
- Test API routes with actual database
- Test authentication flows
- Test real-time features

### E2E Tests
- Critical user journeys
- Voice ordering flow
- Order lifecycle

## Performance Considerations

### Optimization Rules
1. Use React Server Components where possible
2. Implement proper caching strategies
3. Optimize images with Next.js Image
4. Lazy load heavy components
5. Use database indexes on frequently queried fields

### Database Queries
- Always use prepared statements
- Implement pagination for lists
- Use database views for complex queries
- Cache frequently accessed data

## Security Best Practices

1. **Never expose sensitive keys in client code**
2. **Always validate user input**
3. **Use RLS policies for data access**
4. **Sanitize voice transcriptions**
5. **Implement rate limiting on API routes**
6. **Log security events**

## Deployment & Environment

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

### Build Process
```bash
npm run build        # Production build
npm run dev         # Development server
npm run lint        # Run ESLint
npm run type-check  # TypeScript validation
```

## Common Patterns

### Supabase Query Pattern
```typescript
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    resident:profiles!resident_id(name, dietary_restrictions),
    server:profiles!server_id(name)
  `)
  .eq('status', 'pending')
  .order('created_at', { ascending: false })

if (error) throw error
```

### Real-time Subscription
```typescript
useEffect(() => {
  const channel = supabase
    .channel('orders-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => handleOrderUpdate(payload)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### Voice Recording Hook
```typescript
const { 
  isRecording, 
  startRecording, 
  stopRecording, 
  transcript 
} = useVoiceRecording({
  onTranscript: (text) => parseOrderItems(text)
})
```

## MCP Servers Configuration

### Active MCP Servers
Our development environment includes these MCP servers for enhanced capabilities:

1. **sequential-thinking** - Complex problem solving and multi-step planning
2. **supabase** - Direct database operations with our Supabase backend
3. **filesystem** - Advanced file system operations
4. **desktop-commander** - Terminal control, process management, and code searching
5. **postgres** - Direct PostgreSQL access for complex queries and migrations

### Starting Claude with MCP Servers
Always use the provided startup script:
```bash
./start-claude.sh
```

This script automatically loads all environment variables and starts Claude with all configured MCP servers.

### Required Environment Variables
Add these to your `.env` file:
```env
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=https://eiipozoogrrfudhjoqms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key

# Additional for PostgreSQL MCP
SUPABASE_DB_PASSWORD=your_db_password  # Get from Supabase dashboard
```

### MCP Server Usage Guidelines

#### Desktop Commander
- Use for running builds, tests, and deployments
- Search across entire codebase with fuzzy matching
- Manage multiple terminal sessions
- Monitor running processes

#### PostgreSQL Direct Access
- Complex analytical queries
- Database migrations
- Performance optimization
- Direct SQL for reports

#### Supabase MCP
- Standard CRUD operations
- Real-time subscriptions
- RLS policy management
- User authentication

### MCP Configuration File
The `.mcp.json` file contains all server configurations. Do not edit manually unless adding new servers.

## Debugging & Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check cookie settings
   - Verify Supabase session
   - Check RLS policies

2. **Voice Recording Issues**
   - Verify HTTPS (required for mic access)
   - Check browser permissions
   - Validate audio format

3. **Real-time Not Working**
   - Check Supabase Realtime settings
   - Verify table replication
   - Check WebSocket connection

### Debug Commands
```bash
# Check Supabase connection
npx supabase status

# View migration history
npx supabase db diff

# Test voice transcription
npm run test:voice
```

## Contact & Resources

- **Project Lead**: Contact via provided channels
- **Modular Assembly**: Backend architecture team
- **Documentation**: This file is the source of truth

---

**Note**: This document should be updated whenever architectural decisions change. All team members and AI assistants should reference this as the primary project guide.