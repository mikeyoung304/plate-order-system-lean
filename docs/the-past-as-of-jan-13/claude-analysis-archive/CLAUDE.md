# CLAUDE.md - Revolutionary 3-Tier Context System
# Plate Restaurant System - AI Development Context

## 🎯 TIER 1: CRITICAL CONTEXT & SECURITY

### Project Architecture Overview
**Plate Restaurant System** - Next.js 14 + Supabase restaurant management platform

**Scale:** 254 TypeScript files, 88 React components, 289MB build
**Core Pattern:** Luis Galeana's modular assembly architecture with server-first authentication

### 🔒 SECURITY CRITICAL PATTERNS

#### Luis's Server-First Authentication (FOLLOW STRICTLY)
```typescript
// ✅ CORRECT: Server-first auth pattern
import { createClient } from '@/lib/modassembly/supabase/server'

export default async function ProtectedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth')
  }
  // Component logic here
}
```

```typescript
// ❌ NEVER USE: Client-side auth contexts (deleted by Luis)
// import { useAuth } from '@/lib/AuthContext' // DELETED - DO NOT RECREATE
// import { useUser } from '@/contexts/UserContext' // DELETED - DO NOT RECREATE
```

#### Database Module Patterns (Luis's Clean Architecture)
```typescript
// ✅ CORRECT: Domain-separated modules
// lib/modassembly/supabase/database/
├── orders.ts      // Order operations only
├── tables.ts      // Table management only  
├── seats.ts       // Seat assignment only
├── users.ts       // User profiles only
└── kds.ts         // Kitchen display only
```

### 🚨 CRITICAL SECURITY VIOLATIONS TO AVOID

1. **NEVER expose Supabase service role keys in config files**
2. **NEVER use client-side auth contexts** (deleted by Luis for security)
3. **NEVER use wildcard permissions** like `rm:*`, `chmod:*`
4. **ALWAYS use server-first auth patterns**

### 🏗️ Component Architecture Standards

#### Naming Convention (ENFORCE STRICTLY)
- **Components:** PascalCase (UserProfile.tsx)
- **Files:** kebab-case for utilities (floor-plan-utils.ts)
- **Directories:** kebab-case (floor-plan/, voice-ordering/)

#### Size Limits (BREAK DOWN IF EXCEEDED)
- **Components:** <200 lines (current violations: server-client.tsx 1,134 lines)
- **Modules:** <300 lines
- **Page components:** <150 lines

#### Performance Patterns (REQUIRED)
- **Memoization:** Use React.memo for components receiving props
- **Callbacks:** useCallback for event handlers passed to children
- **Effects:** Proper dependency arrays (currently 65 useEffect, 188 optimizations)

---

## 🛠️ TIER 2: DEVELOPMENT PATTERNS & WORKFLOWS

### File Organization Standards

#### Component Structure
```
components/
├── ui/           # Reusable primitives (30 components)
├── kds/          # Kitchen Display System (11 components)  
├── floor-plan/   # Floor planning (7 components)
├── server/       # Server-specific (5 components)
├── analytics/    # Analytics features
└── auth/         # Authentication components
```

#### Import Patterns (STANDARDIZE)
```typescript
// ✅ CORRECT: Absolute imports
import { createClient } from '@/lib/modassembly/supabase/server'
import { OrderCard } from '@/components/kds/order-card'

// ✅ CORRECT: Grouped imports
import type { Order, Table } from '@/types/database'
import { useState, useCallback, useEffect } from 'react'
```

### Real-Time & Performance Patterns

#### Supabase Real-Time (Current Working Pattern)
```typescript
// ✅ Optimized subscription pattern
const supabase = createClient()
useEffect(() => {
  const subscription = supabase
    .channel('orders-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' },
      handleOrderChange
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])
```

#### Voice Ordering Integration
```typescript
// ✅ Current working pattern with OpenAI
// lib/modassembly/openai/transcribe.ts - Batch processing
// lib/modassembly/openai/usage-tracking.ts - Cost optimization
```

### Testing Approach
```bash
# Current test structure (comprehensive)
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests  
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Coverage reporting
```

### Database Migration Pattern
```bash
# Supabase migration workflow
npm run supabase:migrate  # Apply migrations
supabase db push         # Push to remote
```

---

## ⚡ TIER 3: REVOLUTIONARY COMMANDS & AUTOMATION

### /project:auth-fix
**Fix authentication to Luis's server-first patterns**
1. Remove all `useAuth()`, `useUser()`, `useRole()` calls
2. Update components to use server-side auth
3. Remove any client-side auth context imports
4. Test complete auth flow

### /project:component-debloat  
**Break down oversized components**
1. Identify components >200 lines: `server-client.tsx` (1,134 lines)
2. Extract reusable sub-components
3. Create proper component hierarchy
4. Update imports and exports

### /project:security-audit
**Comprehensive security review**
1. Scan for hardcoded secrets
2. Review permissions and access patterns
3. Validate RLS policies in Supabase
4. Check for injection vulnerabilities

### /project:performance-optimize
**System-wide performance improvements**
1. Add React.memo to unmemoized components
2. Optimize useEffect dependency arrays
3. Implement code splitting for large routes
4. Analyze and reduce bundle size (current: 289MB)

### /project:duplicate-resolver
**Eliminate component duplicates**
1. Merge duplicate table-list components
2. Consolidate loading state components  
3. Choose single sidebar implementation
4. Update all imports to use consolidated versions

### /project:realtime-optimize
**Optimize real-time subscriptions**
1. Audit current subscriptions for efficiency
2. Implement connection pooling
3. Add reconnection logic
4. Monitor subscription performance

### /project:voice-enhance
**Enhance voice ordering system** 
1. Optimize OpenAI transcription batching
2. Improve voice command recognition
3. Add voice feedback and confirmations
4. Integrate with KDS real-time updates

### /project:kds-performance
**Kitchen Display System optimizations**
1. Implement order batching
2. Add intelligent routing (current: intelligentOrderRouting)
3. Optimize real-time order updates
4. Add performance monitoring

### /project:deploy-ready
**Production deployment preparation**
1. Run full test suite: `npm run test:all`
2. Type check: `npm run type-check`
3. Lint and format: `npm run lint && npm run format`
4. Build and analyze: `ANALYZE=true npm run build`
5. Security scan and environment validation

### /project:luis-alignment
**Align post-Luis features with original patterns**
1. Review KDS system for Luis pattern compliance
2. Update voice ordering to use server-first auth
3. Align analytics with modular assembly structure
4. Ensure all new features follow clean domain separation

---

## 🎯 CRITICAL SUCCESS METRICS

### Code Quality Gates
- **Zero** TypeScript errors: `npm run type-check`
- **Zero** ESLint errors: `npm run lint`
- **>90%** test coverage: `npm run test:coverage`
- **Zero** security vulnerabilities: Security scan clean

### Performance Benchmarks  
- **Build time:** <2 minutes
- **Bundle size:** <100MB (current: 289MB)
- **Page load:** <2 seconds first contentful paint
- **Real-time latency:** <200ms for order updates

### Architecture Compliance
- **All components** follow Luis's server-first auth
- **Zero client-side** auth patterns
- **Clean domain separation** in database modules
- **Consistent naming** across entire codebase

---

## 📚 ESSENTIAL CONTEXT FOR AI ASSISTANTS

### What Luis Built (PRESERVE)
- Server-first authentication with middleware
- Clean database module separation by domain
- Modular assembly architecture in `/lib/modassembly/`
- Session management via server actions

### Post-Luis Additions (ALIGN WITH PATTERNS)
- KDS (Kitchen Display System) - Working but needs alignment
- Voice ordering with OpenAI - Working but needs auth updates  
- Real-time analytics - Working but needs pattern compliance
- Performance optimizations - Many already implemented

### Current System State
- ✅ Luis's auth foundation restored and working
- ✅ Database modules clean and functional  
- ⚠️ 14 components need auth pattern updates
- ✅ Post-Luis features working but need alignment

### Immediate Priorities
1. **Fix broken auth imports** in 14 components
2. **Security cleanup** of configuration files
3. **Component size reduction** for maintainability
4. **Performance optimization** to reduce 289MB build

---

*Last Updated: Based on comprehensive forensic analysis of 254 TypeScript files*
*Architecture Source: Luis Galeana's commit 56f4526 + current system audit*
*Purpose: Revolutionary AI-assisted development with security and performance*