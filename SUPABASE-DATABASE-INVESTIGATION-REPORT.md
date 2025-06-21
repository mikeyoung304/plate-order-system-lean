# Supabase Database Investigation Report

## Executive Summary

The frontend shows `authenticated:true` with a valid UUID user session (`b0055f8c-d2c3-425f-add2-e4ee6572829e`), but loadTables() queries are working while order creation fails, causing issues with the application flow. The investigation reveals several critical database structure and security policy issues.

## Key Findings

### ✅ What's Working
- **Authentication**: Guest user successfully authenticates with valid session
- **Table Access**: Authenticated users can read tables and seats
- **User Profiles**: Guest user has proper profile with 'server' role
- **Basic RLS**: Some level of access control is functioning

### ❌ Critical Issues Identified

#### 1. Schema Mismatch - Missing 'total' Column
- **Issue**: Orders table lacks 'total' column that frontend expects
- **Error**: `Could not find the 'total' column of 'orders' in the schema cache`
- **Impact**: Order creation fails completely

#### 2. Outdated RLS Policies
- **Issue**: Tables and seats policies reference `user_roles` table that was renamed to `profiles`
- **Location**: Migration `20250512164938_tables_seats.sql` uses old table name
- **Impact**: Policies are likely failing silently or allowing unintended access

#### 3. Security Gap - Anonymous Access Allowed
- **Issue**: Anonymous users can access tables (should be blocked)
- **Expected**: Only authenticated users with roles should have access
- **Impact**: Violates security design principles

## Technical Analysis

### Database Schema Status
```sql
-- CURRENT ORDERS SCHEMA (MISSING COLUMNS)
CREATE TABLE public.orders (
  id uuid,
  table_id uuid,
  seat_id uuid, 
  resident_id uuid,
  server_id uuid,
  items jsonb,
  transcript text,
  status text,
  type text,
  created_at timestamptz
  -- MISSING: total, notes, special_requests
);

-- PROFILES TABLE (CORRECTLY RENAMED)
CREATE TABLE public.profiles (
  id bigint,
  user_id uuid,
  role app_role, -- 'admin', 'server', 'cook', 'resident'
  name text
);
```

### RLS Policy Issues
Current policies in `tables` and `seats` still reference:
```sql
EXISTS (
  SELECT 1 FROM public.user_roles  -- ❌ Table doesn't exist
  WHERE user_id = auth.uid()
  AND role = 'server'
)
```

Should reference:
```sql
EXISTS (
  SELECT 1 FROM public.profiles    -- ✅ Correct table
  WHERE user_id = auth.uid()
  AND role = 'server'
)
```

## Authentication Flow Analysis

1. **Frontend Authentication**: ✅ Working
   - User logs in as `guest@restaurant.plate`
   - Receives valid session with UUID `b0055f8c-d2c3-425f-add2-e4ee6572829e`

2. **Profile Lookup**: ✅ Working
   - Guest user has profile with role 'server'
   - Profile table structure is correct

3. **Table Access**: ✅ Working (but with security issues)
   - loadTables() succeeds and returns 12 tables
   - Access works despite policy inconsistencies

4. **Order Creation**: ❌ Failing
   - Frontend attempts to insert `total` field
   - Database schema doesn't have `total` column
   - Operation fails with schema cache error

## Comprehensive Fix Required

### Migration: `20250615000000_fix_rls_and_schema.sql`

1. **Add Missing Columns**:
   ```sql
   ALTER TABLE public.orders ADD COLUMN total DECIMAL(10,2) DEFAULT 0.00;
   ALTER TABLE public.orders ADD COLUMN notes TEXT;
   ALTER TABLE public.orders ADD COLUMN special_requests TEXT;
   ```

2. **Update RLS Policies**:
   - Drop all policies referencing `user_roles`
   - Recreate policies referencing `profiles`
   - Block anonymous access entirely

3. **Security Hardening**:
   ```sql
   REVOKE ALL ON public.tables FROM anon;
   REVOKE ALL ON public.seats FROM anon;
   REVOKE ALL ON public.orders FROM anon;
   ```

## Root Cause Analysis

The core issue stems from incomplete migration handling:

1. **Migration 20250517230648**: Renamed `user_roles` to `profiles` and updated order policies
2. **Missing Update**: Tables and seats policies were never updated to use new table name
3. **Schema Evolution**: Orders table structure wasn't updated to match frontend expectations

## Impact Assessment

- **Immediate**: Order creation completely broken
- **Security**: Anonymous access violates security model
- **Performance**: RLS policies may be inefficient due to missing table references
- **Development**: Frontend falls back to mock data, hiding real issues

## Recommended Actions

### Priority 1 (Critical)
1. Add `total` column to orders table
2. Update all RLS policies to reference `profiles` instead of `user_roles`

### Priority 2 (Security)
1. Block all anonymous access
2. Audit all policies for consistency

### Priority 3 (Enhancement)
1. Add missing columns (`notes`, `special_requests`)
2. Create proper indexes for new columns

## Files Analyzed

- `/supabase/migrations/20250511210425_setup_rbac.sql` - Original RBAC setup
- `/supabase/migrations/20250512164938_tables_seats.sql` - Outdated policies
- `/supabase/migrations/20250517230648_profiles.sql` - Table rename
- `/lib/modassembly/supabase/database/tables.ts` - Frontend query logic

## Test Results

```bash
# Authentication Test
✅ Guest login successful: b0055f8c-d2c3-425f-add2-e4ee6572829e
✅ Guest profile found: server role

# Access Tests  
✅ Tables accessible: 12 total rows
✅ Seats accessible: 46 total rows  
✅ Orders accessible: 8 total rows

# Security Tests
⚠️ Anonymous access allowed (should be blocked)
❌ Order creation fails: missing 'total' column

# Schema Tests
✅ Profiles table exists with correct structure
❌ Orders table missing expected columns
```

## Conclusion

The authentication system is functioning correctly, but database schema inconsistencies and outdated RLS policies are causing order creation failures. The fix requires both schema updates and security policy corrections to restore full functionality while maintaining the intended security model.