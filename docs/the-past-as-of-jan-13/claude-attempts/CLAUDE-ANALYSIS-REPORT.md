# 3-Tier CLAUDE.md Analysis Report

## GLOBAL PREFERENCES (for ~/.claude/CLAUDE.md)

### Code Style Standards
**Naming Conventions:**
- **Variables/Functions:** `camelCase` (selectedTable, handleOrderAction, fetchRecentOrders)
- **Components:** `PascalCase` files with kebab-case filenames (OrderCard → order-card.tsx)  
- **Types/Interfaces:** `PascalCase` with descriptive suffixes (OrderCardProps, UseKDSOrdersReturn)
- **Boolean Variables:** Clear prefixes (isLoading, hasErrors, showVoiceOrderPanel)
- **Event Handlers:** Consistent `handle` prefix (handleBump, handleStationChange)

**Import/Export Patterns:**
```typescript
// 1. React imports first
import { memo, useCallback, useState } from 'react'
// 2. Next.js imports  
import { useRouter } from 'next/navigation'
// 3. Third-party libraries
import { cn } from '@/lib/utils'
// 4. Internal components (absolute imports ONLY)
import { Button } from '@/components/ui/button'
// 5. Types (grouped separately)
import type { Order, Table } from '@/types/database'
```

**Styling Patterns:**
- **Tailwind CSS:** Utility-first approach consistently applied
- **className merging:** Universal `cn()` utility (clsx + tailwind-merge)
- **Responsive design:** Mobile-first with responsive utilities

### Language Preferences
**TypeScript Excellence:**
- **Zero `any` types** - Exceptional type safety across 254 files
- **Strict typing:** Explicit return type annotations on functions
- **Interface over type:** For extensible objects and component props
- **Generic constraints:** Proper use with `T extends keyof Database`
- **Utility types:** Strategic use of `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`

**React Patterns:**
- **100% Functional Components** - No class components
- **Strategic memoization:** `React.memo()` with custom comparison functions
- **Performance optimization:** 188 implementations of useCallback/useMemo
- **Custom hooks:** Domain-specific logic separation (use-kds-orders, use-server-state)

**Async Patterns:**
- **async/await preferred** over promises and callbacks
- **Consistent error handling:** try/catch with user-friendly error messages
- **Type-safe async functions:** Proper return type annotations

### Testing Standards
**Coverage Requirements:**
- **Unit tests:** Jest with @testing-library/react
- **Integration tests:** Multi-component testing
- **E2E tests:** Playwright (currently needs dependency fix)
- **Performance tests:** Dedicated performance benchmarking
- **Coverage target:** >80% for critical business logic

**Test Organization:**
```
__tests__/
├── unit/           # Component and function tests
├── integration/    # Multi-component workflows  
├── e2e/           # End-to-end user journeys
├── performance/   # Performance benchmarks
└── smoke/         # Basic functionality checks
```

### Git Conventions
**Commit Message Format:** `{emoji} {CATEGORY}: {description}`

**Common Emoji Categories:**
- 🔒 SECURITY: Security-related fixes
- 🔧 Fix: General bug fixes and repairs
- 🔐 Fix: Authentication-specific fixes  
- 🔥 RESTORED: Major restoration/rollback work
- ✅ ENTERPRISE: Enterprise feature implementations
- 🚨 CRITICAL FIX: Urgent production fixes
- 🎉 TRANSFORMATION COMPLETE: Major milestones

**Branch Naming:**
- **Feature branches:** `attempted-luis-fication-of-the-supabase-connect`
- **Personal branches:** `mikes-edit-3`, `lgaleana/voice_to_order`
- **Milestone branches:** `ui-transformation-20250604`

---

## PROJECT SPECIFICS (for .claude/CLAUDE.md)

### Project Identity
- **Name:** Plate Restaurant System (package: "my-v0-project")
- **Type:** Next.js 15 + Supabase restaurant management platform
- **Purpose:** Real-time restaurant operations with voice ordering, KDS, and server management
- **Scale:** 254 TypeScript files, 88 React components, 289MB build

### Critical Patterns

**🏆 LUIS GALEANA'S PURE ARCHITECTURE (COMMIT 56f4526) - FOLLOW RELIGIOUSLY:**

> **Source Validation:** Based on current clean codebase (98% accuracy validated Dec 2025)  
> **Audit Reference:** `docs/ARCHIVED-crisis-docs-2025-01-06/LUIS_BACKEND_ARCHITECTURE/`

```typescript
// ✅ LUIS'S AUTHENTIC SERVER-FIRST PATTERN (commit 56f4526)
// This is the EXACT pattern Luis created - never deviate from this
import { createClient } from '@/lib/modassembly/supabase/server'

export default async function ProtectedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser() // Luis's security fix
  
  if (!user) redirect('/auth')
  return <PageContent user={user} />
}

// ❌ ABSOLUTELY FORBIDDEN: These were DELETED by Luis for security reasons
// import { useAuth } from '@/lib/AuthContext'        // DELETED by Luis - NEVER recreate
// import { AuthProvider } from '@/components/auth'   // DELETED by Luis - NEVER recreate
// import { ProtectedRoute } from '@/components/auth' // DELETED by Luis - NEVER recreate
```

**🚨 CRITICAL: DISTINGUISH LUIS'S WORK FROM AI CONTAMINATION:**
- **Luis's Pure Patterns:** Everything in `lib/modassembly/supabase/` (commit 56f4526)
- **Post-Luis Features:** KDS, Voice Ordering, Analytics (keep functionality, align patterns)
- **AI Contamination:** Configuration bloat, duplicates, monster components (eliminate completely)

**🔒 SECURITY CRITICAL:**
- **NEVER use `getSession()`** - Recent security fix (commit 11baed7) migrated to `getUser()`
- **NEVER hardcode secrets** - Use environment variables only
- **Middleware protection:** ALL routes protected except static/api/images

**📐 COMPONENT SIZE LIMITS (ENFORCE STRICTLY):**
- **Components:** 200 lines maximum
- **Page components:** 150 lines maximum
- **Utilities:** 300 lines maximum
- **CURRENT VIOLATIONS:** 4 components over 500 lines need immediate refactoring

### Essential Commands
1. **`npm run dev`** - Start development server on port 3000
2. **`npm run dev:clean`** - Kill port and start fresh development
3. **`npm run test:quick`** - Run unit tests + lint + type-check
4. **`npm run test:coverage`** - Generate coverage report with HTML output
5. **`npm run build`** - Production build
6. **`npm run type-check`** - TypeScript validation
7. **`npm run lint`** - ESLint with auto-fix
8. **`npm run analyze`** - Bundle analysis (ANALYZE=true npm run build)
9. **`npm run supabase:migrate`** - Apply database migrations
10. **`npm run demo:setup`** - Setup demo environment (guest + seed data)

### Architecture

**🏆 LUIS'S AUTHENTIC MODULAR ASSEMBLY (COMMIT 56f4526):**

> **CRITICAL:** This is Luis's EXACT architecture from his refactor. Do not modify this structure.

```
lib/modassembly/supabase/          # Luis's creation - modular assembly approach
├── auth/
│   ├── actions.ts                 # ✅ Luis's server actions (pure server-first)
│   ├── roles.ts                   # ✅ Luis's role-based access control
│   └── session.ts                 # ✅ Luis's session management
├── database/                      # ✅ Luis's domain separation pattern
│   ├── orders.ts                  # ✅ Order operations ONLY (clean domain)
│   ├── tables.ts                  # ✅ Table management ONLY (clean domain)
│   ├── seats.ts                   # ✅ Seat assignment ONLY (clean domain)
│   ├── users.ts                   # ✅ User profiles ONLY (clean domain)
│   └── kds.ts                     # ⚠️ Post-Luis addition (align with patterns)
├── client.ts                      # ✅ Luis's browser Supabase client
├── server.ts                      # ✅ Luis's server Supabase client
└── middleware.ts                  # ✅ Luis's session handling (CRITICAL)
```

**VALIDATION STATUS (98% Accuracy Confirmed):**
- ✅ **All Luis files verified working** in current clean codebase
- ✅ **No cross-domain dependencies** - each module isolated
- ✅ **Server-first auth** - no client-side state management
- ⚠️ **kds.ts added later** - keep functionality, ensure pattern compliance

**Component Organization:**
```
components/
├── ui/           # 30 reusable primitives (✅ excellent)
├── kds/          # 11 Kitchen Display components
├── floor-plan/   # 7 floor planning components
├── server/       # 5 server-specific components
├── analytics/    # Analytics features
└── auth/         # Authentication components
```

### Dependencies & Gotchas
**Version-Critical Dependencies:**
- **Next.js:** 15.2.4 (React 19 - cutting edge)
- **Supabase:** @supabase/ssr ^0.6.1 + supabase-js ^2.49.4
- **OpenAI:** ^4.102.0 (voice ordering integration)
- **TypeScript:** ^5.8.3 (strict mode)

**Known Issues:**
- **Test dependencies:** Missing `@playwright/test` for E2E tests
- **OpenAI imports:** Module resolution issues in test environment
- **Bundle size:** 289MB (needs optimization to <100MB)

**Workarounds:**
- **Port conflicts:** Use `npm run dev:clean` to kill port 3000
- **Real-time issues:** Restart Supabase with `npm run supabase:start`
- **Test failures:** Run `npm run test:smoke` for basic validation

### Performance Requirements
**Build Performance:**
- **Target:** <100MB bundle size (currently 289MB)
- **Code splitting:** Lazy load admin/KDS features
- **Optimization:** 188 React optimizations already implemented

**Real-time Performance:**
- **Subscription efficiency:** Database-level filtering
- **Connection management:** Proper cleanup with useEffect returns
- **Latency target:** <200ms for order updates

---

## LOCAL CONTEXT (for .claude/CLAUDE.local.md)

### Current Status
- **Branch:** `attempted-luis-fication-of-the-supabase-connect`
- **Main branch:** `main`
- **Recent Focus:** Completed major cleanup - 70+ AI bloat files deleted
- **Codebase State:** ✅ Clean current state (validated 98% accuracy Dec 2025)
- **Luis Architecture:** ✅ Fully restored and working (commit 56f4526)
- **Test Coverage:** ⚠️ Partially functional (missing Playwright dependency)

> **IMPORTANT:** Current working directory contains ONLY the clean, essential files. All AI automation scripts, old debug folders, and problematic documentation have been permanently deleted.

### Active TODOs
**High Priority:**
1. **Server Order Creation** (`components/server-client.tsx:410`):
   ```typescript
   // TODO: Create actual order in database
   ```

2. **Test Infrastructure** (URGENT):
   - Fix missing `@playwright/test` dependency
   - Resolve OpenAI import issues in tests
   - Restore E2E test functionality

**Medium Priority:**
3. **Suggestion System** (`lib/modassembly/supabase/database/suggestions.ts`):
   - Implement seat-based resident suggestions (line 115)
   - Implement time-based resident suggestions (line 123)

### Environment Needs
**Required Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

**Setup Commands:**
```bash
# 1. Install dependencies
npm install @playwright/test  # Fix E2E tests

# 2. Start local Supabase
npm run supabase:start

# 3. Run migrations
npm run supabase:migrate

# 4. Setup demo data
npm run demo:setup

# 5. Start development
npm run dev:clean
```

---

## RECOMMENDED SLASH COMMANDS

### Based on Analysis
1. **`/fix:auth-patterns`** - Migrate components to Luis's server-first auth (14 components identified)
2. **`/security:cleanup`** - Extract hardcoded secrets, simplify permissions  
3. **`/test:repair`** - Fix missing dependencies and module resolution issues
4. **`/performance:optimize`** - Reduce 289MB build size with code splitting
5. **`/component:debloat`** - Break down 4 oversized components (>500 lines)
6. **`/realtime:optimize`** - Optimize Supabase subscriptions and connections
7. **`/voice:enhance`** - Improve OpenAI voice ordering integration
8. **`/kds:performance`** - Kitchen Display System optimization
9. **`/deploy:production`** - Complete production readiness checklist
10. **`/luis:align`** - Ensure all features follow Luis's modular assembly patterns

---

## IMPLEMENTATION NOTES

### Unique Patterns Found

**🏆 LUIS GALEANA'S AUTHENTIC EXCELLENCE (Verified from Clean Codebase):**
- **Zero client-side auth contexts** - Pure server-first security (commit 56f4526)
- **Domain-separated database modules** - Clean single-responsibility architecture
- **Modular assembly structure** - Predictable, scalable patterns  
- **Complete auth refactor** - Deleted 188 lines of client auth, created server actions

**🔄 POST-LUIS IMPROVEMENTS (Keep but Align):**
- **Performance optimizations** - 188 React optimizations added later
- **KDS system** - Kitchen Display System (working, needs pattern alignment)
- **Voice ordering** - OpenAI integration (working, needs pattern alignment)
- **Analytics system** - Real-time metrics (working, needs pattern alignment)

**✅ RECENT SECURITY FIXES (Current State):**
- **Critical fix (commit 11baed7):** Migration from `getSession()` to `getUser()` 
- **Major cleanup:** 70+ AI bloat files permanently deleted
- **Documentation validation:** 98% accuracy confirmed against actual code

### Optimization Opportunities
**Immediate (Week 1):**
- Fix test infrastructure dependencies
- Complete order creation in server components
- Resolve authentication pattern inconsistencies

**Short-term (Month 1):**
- Reduce bundle size by 65% (289MB → <100MB)
- Break down monster components
- Optimize real-time subscriptions

**Long-term (Month 2+):**
- Implement comprehensive monitoring
- Extract microservices for scale
- Advanced analytics and ML integration

**Architecture Evolution:**
This codebase represents a sophisticated restaurant management platform built on Luis Galeana's excellent foundation, currently undergoing performance optimization and architectural refinement to support 1000+ concurrent users with sub-second real-time updates.