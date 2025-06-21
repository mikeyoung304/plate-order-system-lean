# Architecture Overview

## System Design

**Type:** Next.js 15 + Supabase restaurant management platform  
**Scale:** 254 TypeScript files, 88 React components  
**Target:** 1000+ concurrent users, <500ms response times

## Core Patterns

### 1. Luis's Modular Assembly Architecture

```
lib/modassembly/supabase/
├── auth/
│   ├── actions.ts          # Server-first auth only
│   └── roles.ts            # Role-based access control
├── database/
│   ├── orders.ts           # Order domain (isolated)
│   ├── tables.ts           # Table domain (isolated)
│   ├── seats.ts            # Seat domain (isolated)
│   └── users.ts            # User domain (isolated)
├── client.ts               # Browser client
├── server.ts               # Server client
└── middleware.ts           # Session handling
```

**Key Principles:**
- Server-first authentication (no client-side auth state)
- Domain separation (no cross-domain dependencies)
- Single responsibility modules

### 2. Component Architecture

```
components/
├── ui/                     # 30 reusable primitives
├── kds/                    # Kitchen Display System (11 components)
├── floor-plan/             # Floor planning (7 components)
├── server/                 # Server tools (5 components)
├── analytics/              # Real-time metrics
└── auth/                   # Authentication forms
```

**Rules:**
- Components: <200 lines maximum
- PascalCase names, kebab-case files
- Strategic memoization (188 optimizations implemented)

## Real-Time System

**Supabase Real-Time:**
- Kitchen orders update instantly
- Server floor plan synchronization
- Analytics dashboard live metrics

**Performance:**
- Database-level filtering
- Efficient subscription management
- Proper cleanup in useEffect

## Authentication Flow

**Server-First Pattern (Luis's Design):**
```typescript
// ✅ CORRECT: Server component auth
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth')

// ❌ FORBIDDEN: Client-side patterns (deleted by Luis)
// useAuth(), AuthProvider, ProtectedRoute
```

## Voice Ordering System

**OpenAI Integration:**
- Real-time audio transcription
- Restaurant-specific vocabulary
- Cost optimization with batching
- 65-85% cost reduction achieved

## Database Schema

**Supabase PostgreSQL:**
- Row Level Security (RLS) policies
- Role-based access (admin, server, cook, resident)
- Optimized indexes for performance
- Real-time subscriptions enabled

## Performance Architecture

**Current State:**
- 289MB bundle size (needs optimization to <100MB)
- 188 React optimizations implemented
- <500ms target for 100+ concurrent orders

**Optimization Targets:**
- Code splitting for admin/KDS features
- Bundle analysis and dependency optimization
- Real-time subscription efficiency

## Deployment

**Vercel + Supabase:**
- Next.js serverless functions
- Edge middleware for auth
- Database at Supabase
- Voice processing via OpenAI API

## Development Workflow

**Git Strategy:**
- Feature branches with descriptive names
- Emoji-categorized commits (🔒 SECURITY, 🔧 Fix, etc.)
- Luis's patterns preserved and extended

**Testing:**
- Jest + @testing-library/react
- E2E with Playwright
- Performance testing
- 80%+ coverage target