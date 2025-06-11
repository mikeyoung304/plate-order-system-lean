# Post-Restoration Migration Guide

Generated: $(date)

## Overview

This guide provides step-by-step instructions to migrate the codebase from the broken multi-auth state to Luis's clean server-first architecture.

## Phase 1: Critical Fixes (Day 1)

### Step 1: Fix Dashboard Page

```typescript
// app/dashboard/page.tsx
// REMOVE:
import { useAuth, useRole, useIsRole } from '@/lib/modassembly/supabase/auth'

// ADD:
import { createClient } from '@/lib/modassembly/supabase/server'
import { redirect } from 'next/navigation'

// In the component, replace hooks with:
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (\!user) {
    redirect('/')
  }

  // Rest of component...
}
```

### Step 2: Fix Server Pages

```typescript
// app/(auth)/server/page.tsx
// Convert from client component to server component
// Remove 'use client' directive
// Remove useAuth() calls
// Use server-side session from layout
```

### Step 3: Fix Sidebar Component

```typescript
// components/sidebar.tsx
// This needs to become a server component or receive user as prop
// Remove useAuth() hook
// Accept user data from parent
```

## Phase 2: Architecture Alignment (Week 1)

### Step 1: Convert Real-time to Server Patterns

```typescript
// Instead of client-side subscriptions:
// OLD:
useEffect(() => {
  const channel = supabase.channel('orders')
  // ...
})

// NEW: Use Server-Sent Events or WebSockets with server control
// Or use React Server Components with revalidation
```

### Step 2: Remove Complex Page Variants

```bash
# Keep only the simple versions
rm app/(auth)/server/page-complex.tsx
rm app/(auth)/server/page-refactored.tsx
rm app/(auth)/kitchen/page-complex.tsx
# Keep page-simple.tsx or page.tsx (whichever works)
```

## Phase 3: Feature Integration (Week 2)

### KDS System

1. Verify database tables exist (they do)
2. Test order routing through modular assembly
3. Ensure real-time updates work with new auth

### Voice Ordering

1. Move recording logic to modular assembly
2. Create server action for voice processing
3. Test with authenticated users

### Analytics

1. Verify data persistence
2. Test cost tracking
3. Ensure auth is properly checked

## Testing Strategy

### Unit Tests

```bash
# Update test utils first
# Then run each category
npm test -- __tests__/unit
```

### Integration Tests

```bash
# These test API routes - should mostly work
npm test -- __tests__/integration
```

### E2E Tests

```bash
# These will need auth flow updates
npm test -- __tests__/e2e
```

## Rollback Plan

If issues arise:

1. The previous commit has all the complex auth
2. Can selectively restore files from git
3. Database schema remains compatible

## Success Criteria

- [ ] Guest login works without errors
- [ ] All pages load without auth errors
- [ ] Real-time updates function
- [ ] Voice ordering creates orders
- [ ] KDS displays orders correctly
- [ ] No console errors about missing auth
- [ ] All tests pass

## Support

- Luis's patterns: See /luis-galeana-enterprise-architecture/
- Original commits: git log --author="Luis"
- Modular assembly docs: /original-developer-profile/
  EOF < /dev/null
