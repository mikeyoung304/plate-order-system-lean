# User Roles Management Analysis & Fix Summary

## Problem Identified

The guest user existed in the database but had inconsistent role assignments:
- **User metadata**: role = "server"
- **Profile table**: role = "resident" 

This caused the guest user to appear in the resident selection dropdown when it should have been acting as a server user.

## Root Cause Analysis

1. **Database Schema Evolution**: The system migrated from `user_roles` table to `profiles` table, but some trigger functions and constraints weren't fully updated.

2. **Role Mismatch**: The guest user (ID: `b0055f8c-d2c3-425f-add2-e4ee6572829e`) was created with server role in metadata but somehow got assigned "resident" role in the profiles table.

3. **Frontend Logic**: The application's `useServerPageData` hook specifically queries for users with `role = 'resident'` to populate the residents dropdown, causing the guest user to appear inappropriately.

## Database Schema Overview

### Current Tables Structure

**Profiles Table** (`public.profiles`):
- `user_id` (UUID, Primary Key) - References `auth.users.id`
- `name` (TEXT, NOT NULL) - Display name
- `role` (app_role ENUM) - One of: 'admin', 'server', 'cook', 'resident'
- `email` (TEXT, NULLABLE) 
- `dietary_restrictions` (TEXT[], NULLABLE)
- `preferences` (JSONB, NULLABLE)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Role Enum** (`public.app_role`):
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'server', 'cook', 'resident');
```

### Key Functions

**Profile Creation Trigger** (`public.handle_new_user()`):
- Automatically creates profiles when new users are added to `auth.users`
- Extracts role from user metadata
- Creates corresponding profile record

**Role Checking Functions** (in `/lib/modassembly/supabase/auth/roles.ts`):
- `getUserRole()` - Gets user's role from profile
- `hasRole()` - Checks if user has specific role(s)
- `requireRole()` - Enforces role requirements

## RLS Policies

The system uses Row Level Security (RLS) policies for access control:

### Profiles Table Policies
- Users can view their own profile
- Users can update their own profile  
- Users can insert their own profile
- All users can view resident profiles (for dropdown population)
- Admins can view/update all profiles

### Orders Table Policies
- Role-based access (admin, server, cook can create/read/update orders)
- Each role has specific permissions based on their function

## Fix Implementation

### 1. Guest User Role Correction
**Script**: `scripts/fix-guest-user-role-mismatch.ts`

**Actions Taken**:
- Updated guest user profile role from "resident" to "server"
- Synchronized user metadata to match profile role
- Verified guest user no longer appears in residents list

### 2. Demo Residents Creation
**Script**: `scripts/create-demo-residents.ts`

**Actions Taken**:
- Created 17 demo resident users with proper "resident" role
- Ensured each has a complete profile record
- Verified residents appear correctly in application queries

### 3. Comprehensive Verification
**Script**: `scripts/investigate-guest-user-roles.ts`

**Verification Steps**:
- Confirmed authentication works correctly
- Tested role-based database access
- Verified RLS policies function properly
- Confirmed frontend queries return expected data

## Current System State

### User Distribution
- **1 Server**: Guest user (`guest@restaurant.plate`)
- **17 Residents**: Demo users for testing
- **0 Admins**: None currently configured
- **0 Cooks**: None currently configured

### Guest User Details
- **Email**: `guest@restaurant.plate`
- **Password**: `guest12345`
- **Name**: `Demo Guest`
- **Role**: `server`
- **User ID**: `b0055f8c-d2c3-425f-add2-e4ee6572829e`

### Demo Residents
All residents have:
- **Email**: `[name]@restaurant.plate`
- **Password**: `resident123`
- **Role**: `resident`

Examples:
- Mable Meatballs (`mable@restaurant.plate`)
- Waffles Ohulahan (`waffles@restaurant.plate`)
- Bernie Bend (`bernie@restaurant.plate`)
- ... and 14 more

## Application Behavior Changes

### Before Fix
- Guest user appeared in resident selection dropdown
- Caused "guest/unknown resident selection error"
- Role confusion in application logic

### After Fix
- Guest user acts as intended server role
- 17 proper residents available for selection
- Clear role separation and proper permissions
- Application functions correctly for order management

## Files Modified/Created

### Investigation Scripts
- `scripts/investigate-guest-user-roles.ts` - Comprehensive analysis
- `scripts/fix-guest-user-role-mismatch.ts` - Role correction
- `scripts/create-demo-residents.ts` - Resident user creation
- `scripts/final-verification.ts` - Final state verification

### Key Application Files Analyzed
- `lib/modassembly/supabase/auth/roles.ts` - Server-side role management
- `lib/modassembly/supabase/auth/client-roles.ts` - Client-side role functions
- `lib/modassembly/supabase/database/users.ts` - User data functions
- `lib/hooks/use-server-page-data.ts` - Frontend data loading
- `types/database.ts` - TypeScript type definitions

### Database Schema Files
- `supabase/migrations/20250511210425_setup_rbac.sql` - Initial RBAC setup
- `supabase/migrations/20250517230648_profiles.sql` - Profiles table creation
- `supabase/migrations/20250603000000_fix_schema_mismatches.sql` - Schema fixes

## Testing Recommendations

### Manual Testing
1. **Login as Guest User**:
   - URL: Application login page
   - Credentials: `guest@restaurant.plate` / `guest12345`
   - Expected: Successful login with server permissions

2. **Resident Selection**:
   - Navigate to order creation
   - Check resident dropdown
   - Expected: 17 residents available, guest user NOT in list

3. **Order Creation**:
   - Select any resident from dropdown
   - Create test order
   - Expected: No "guest/unknown resident" errors

### Automated Testing
Consider adding tests for:
- Role-based access control
- Profile creation triggers
- RLS policy enforcement
- Frontend role checking functions

## Security Considerations

### Current Security Measures
- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- Proper user/profile relationship enforcement
- Secure trigger functions with SECURITY DEFINER

### Recommendations
1. **Add Admin User**: Create at least one admin user for system management
2. **Password Policy**: Consider stronger passwords for production
3. **Role Transitions**: Implement controlled role change procedures
4. **Audit Logging**: Add change tracking for role modifications

## Conclusion

The user roles management system is now properly configured with:
- ✅ Clear role separation (server vs resident)
- ✅ Proper database schema and constraints
- ✅ Working RLS policies
- ✅ Functional frontend integration
- ✅ Comprehensive test data

The "guest/unknown resident selection error" has been resolved by correcting the guest user's role from "resident" to "server" and ensuring proper resident users exist for selection.