# Persistent Issues Log

## 2025-06-21T11:35:00Z - CRITICAL AUTH FAILURE CASCADE

**Issue**: Complete authentication breakdown in kitchen module causing 401 cascades
**Severity**: Critical - System unusable after guest login
**Context**: Plate-Restaurant-System-App

### Root Problem:
- Guest user can login but has no RLS policy access to core tables (orders, seats, tables, kds_order_routing)
- 401 Unauthorized errors causing WebSocket failures and UI crashes
- Error boundaries triggering due to missing data permissions

### Symptoms:
- All data endpoints return 401 
- WebSocket connections fail with "closed before established"
- Multiple subscription errors from improper cleanup
- StationSelector component crashes
- KDSErrorBoundary triggers

### Investigation Required:
1. RLS policy audit for guest_admin role
2. Service role vs anon key permission review  
3. Database user role mapping verification
4. Real-time subscription permission check

**Tags**: #authentication #rls-policies #supabase #guest-access #critical-failure