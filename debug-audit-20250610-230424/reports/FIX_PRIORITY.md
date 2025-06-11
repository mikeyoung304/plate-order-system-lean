# Prioritized Fix List

Generated: $(date)

## 🔴 Week 1: Critical Fixes (App Breaking)

### 1. Remove Orphaned Auth Hook Calls

These files are calling hooks that no longer exist and will crash:

```bash
# Files to fix:
- app/(auth)/kitchen/page-simple.tsx
- app/(auth)/kitchen/page.tsx
- app/(auth)/server/page-simple.tsx
- app/(auth)/server/page.tsx
- app/dashboard/page.tsx
- components/sidebar.tsx
```

**Fix**: Replace useAuth() with server-side session checks in layouts.

### 2. Remove ProtectedRoute Imports

These files import a component that was deleted:

```bash
# Files to fix:
- app/(auth)/admin/page.tsx
- app/(auth)/expo/page.tsx
- app/(auth)/kitchen/metrics/page.tsx
- app/(auth)/kitchen/page-complex.tsx
- app/(auth)/server/page-complex.tsx
- app/(auth)/server/page-refactored.tsx
```

**Fix**: Remove ProtectedRoute wrapper, rely on layout auth.

### 3. Fix AuthForm Pattern

```bash
# File to fix:
- components/auth/AuthForm.tsx
```

**Fix**: Convert to pure server action pattern (remove onSubmit).

## 🟡 Week 2: Reconnect Features

### 1. KDS System Integration

- Verify all KDS components connect to backend
- Test order routing through stations
- Ensure real-time updates work

### 2. Voice Ordering Alignment

- Move recording logic from state context to modular assembly
- Create proper server actions for voice commands
- Test end-to-end voice ordering flow

### 3. Real-time Refactoring

Convert 12 files from client-side to server-first patterns:

- State contexts (6 files)
- Page components (5 files)
- Test file (1 file)

### 4. Analytics Persistence

- Verify metrics are saved to database
- Test OpenAI usage tracking
- Ensure cost calculations are accurate

## 🟢 Week 3: Architecture Cleanup

### 1. Remove Duplicate/Complex Pages

- Keep simple versions of pages
- Remove page-complex.tsx variants
- Consolidate page-refactored.tsx files

### 2. Standardize State Management

- Follow Luis's domain separation
- Remove optimized-\* variants
- Use consistent patterns

### 3. Security Audit

- Verify all routes have auth checks
- Test role-based access
- Remove any remaining demo artifacts

## 📝 Testing Checklist

After fixes, test these flows:

- [ ] Guest login (guest@restaurant.plate)
- [ ] Dashboard loads without errors
- [ ] Server page shows tables/orders
- [ ] Kitchen KDS displays orders
- [ ] Voice ordering creates orders
- [ ] Real-time updates work
- [ ] Analytics show correct data
- [ ] All auth redirects work properly
      EOF < /dev/null
