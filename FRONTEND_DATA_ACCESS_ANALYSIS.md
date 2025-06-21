# Frontend Data Access Analysis Report

## Executive Summary

The frontend React components are failing to access database data due to Row Level Security (RLS) policies that block queries for users with the 'server' role. While authentication works correctly, the RLS policies were designed to only allow 'cook' role users to access the Kitchen Display System (KDS) data, which includes order routing and station information.

## Root Cause Analysis

### 1. Server Component Issue
**File**: `/Users/mike/Plate-Restaurant-System-App/components/server-client.tsx`
**Problem**: Lines 260-268 contain fallback logic that creates mock data when RLS blocks access
**Evidence**: 
- If tables query fails with RLS error (`PGRST116` or policy message), it falls back to mock data
- Line 265 logs: "Using mock data due to RLS restrictions"
- Lines 633-634 show "(Demo)" in UI when using mock data

### 2. Kitchen Component Issue  
**File**: `/Users/mike/Plate-Restaurant-System-App/components/kitchen-client.tsx`
**Problem**: No fallback logic - when RLS blocks queries, shows "All Caught Up!"
**Query**: Lines 55-82 query `kds_order_routing` table with joins to `orders`, `tables`, `kds_stations`
**Error Handling**: Lines 86-90 set error and stop (no mock data fallback)

### 3. Expo Component Issue
**File**: `/Users/mike/Plate-Restaurant-System-App/components/expo-client.tsx`  
**Problem**: Uses `useKDSOrders` hook which has no fallback logic
**Query**: Via `fetchAllActiveOrders()` function
**Error Handling**: Shows "No orders pending for expo" when orders array is empty

### 4. Core Issue: RLS Policies
**File**: `/Users/mike/Plate-Restaurant-System-App/fix_rls_security.sql`
**Problem**: RLS policies only allow 'cook' role to access KDS data

Key problematic policies:
```sql
-- Lines 211-220: Only 'cook' and 'admin' can view KDS stations
CREATE POLICY "Kitchen staff can view KDS stations"
  ON public.kds_stations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('cook', 'admin')
    )
  );

-- Lines 234-243: Only 'cook' and 'admin' can view order routing  
CREATE POLICY "Kitchen staff can view order routing"
  ON public.kds_order_routing
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('cook', 'admin')
    )
  );
```

## Data Flow Analysis

### Working Backend Queries
The blinking numbers (Server: 2, Kitchen: 5, Expo: 2) work because they use different query paths that bypass RLS or use service role credentials.

### Frontend Query Failures

1. **Server Component**: 
   - Queries `tables` table with joins to `orders` and `seats`
   - When RLS blocks access, falls back to mock data
   - User sees functional UI but with fake data

2. **Kitchen Component**:
   - Queries `kds_order_routing` table with complex joins
   - When RLS blocks access, gets empty array
   - Shows "All Caught Up!" message

3. **Expo Component**:
   - Uses same `fetchAllActiveOrders()` as Kitchen
   - When RLS blocks access, gets empty array  
   - Shows "No orders pending for expo" message

## Order Creation Failures

**File**: `/Users/mike/Plate-Restaurant-System-App/components/server-client.tsx`
**Location**: Lines 436-544 in `handleSelectMeal()` function

Order creation fails because:
1. Line 458: Checks if table ID starts with 'mock-' and blocks creation
2. Lines 465-490: Attempts to look up seat in database using mock table ID
3. Database queries fail because user lacks permissions due to RLS policies

## Authentication vs Authorization

✅ **Authentication Works**: User is properly authenticated as "demo guest" with "server" role
❌ **Authorization Fails**: RLS policies don't grant 'server' role access to KDS data

The user shows up correctly in debug info:
- User: demo user email
- Role: server  
- But RLS policies require 'cook' or 'admin' role for KDS access

## Solution Requirements

To fix this issue, you need to either:

### Option 1: Update RLS Policies (Recommended)
Add 'server' role to KDS policies:
```sql
-- Allow servers to view KDS data for order management
CREATE POLICY "Staff can view KDS stations"
  ON public.kds_stations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('server', 'cook', 'admin')
    )
  );
```

### Option 2: Add Fallback Logic
Add mock data fallback to Kitchen and Expo components like the Server component has.

### Option 3: Change User Role
Update the demo user's role from 'server' to 'cook' in the profiles table.

## Files Requiring Changes

1. **Database RLS Policies**: Update policies in `fix_rls_security.sql` to include 'server' role
2. **Kitchen Component**: Add RLS fallback logic similar to server-client.tsx
3. **Expo Component**: Add RLS fallback logic via useKDSOrders hook
4. **KDS Database Functions**: Update queries to handle RLS failures gracefully

## Testing Validation

After implementing fixes, verify:
1. Kitchen shows actual orders instead of "All Caught Up!"
2. Expo shows actual orders instead of "No orders pending" 
3. Server can create real orders instead of being blocked by mock table IDs
4. All components display real data consistently
5. RLS policies still properly secure data from unauthorized access

## Security Considerations

The current RLS policies are working as designed - they're preventing unauthorized access to sensitive kitchen data. The issue is that the 'server' role was not considered when the policies were written, creating a legitimate use case that's being blocked by security measures.