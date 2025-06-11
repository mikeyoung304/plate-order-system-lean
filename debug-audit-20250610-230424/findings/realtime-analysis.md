=== REAL-TIME SUBSCRIPTIONS ANALYSIS ===
Finding all Supabase channel subscriptions...

Found 12 files with real-time subscriptions:

State Contexts (6 files):

- orders-context.tsx
- optimized-orders-context.tsx
- connection-context.tsx
- tables-context.tsx
- restaurant-state-context.tsx
- optimized-realtime-context.tsx

Page Components (5 files):

- server/page.tsx
- kitchen/page.tsx
- expo/page.tsx

⚠️ ISSUE: Real-time subscriptions are implemented in client-side contexts
This doesn't follow Luis's server-first pattern

Real-time Features Detected:

- Order updates (orders table)
- Table status changes
- KDS order routing
