=== BROKEN IMPORTS FROM DELETED FILES ===
Components importing from files that no longer exist:

Found 3 files with broken imports from deleted auth files:

- app/(auth)/server/page-complex.tsx (importing protected-route)
- app/(auth)/server/page-refactored.tsx (importing protected-route)
- **tests**/utils/test-utils.tsx (importing auth-context)

✅ Good news: No remaining imports from deleted demo/ directory

Components still using ProtectedRoute wrapper (6 files):

- app/(auth)/admin/page.tsx
- app/(auth)/expo/page.tsx
- app/(auth)/kitchen/metrics/page.tsx
- app/(auth)/server/page-complex.tsx
- app/(auth)/server/page-refactored.tsx
- app/(auth)/kitchen/page-complex.tsx
