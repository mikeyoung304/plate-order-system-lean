-- ================================================================
-- PLATE RESTAURANT SYSTEM - RLS POLICY VALIDATION TESTS
-- ================================================================
-- This script tests the Row Level Security policies to ensure
-- they work correctly for all user types and scenarios.
-- ================================================================

-- Test 1: Check if RLS is enabled on all tables
SELECT 
  t.tablename,
  c.relrowsecurity as rls_enabled,
  CASE 
    WHEN c.relrowsecurity THEN '✅ SECURED'
    ELSE '❌ VULNERABLE'
  END as status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN (
  'tables', 'seats', 'orders', 'profiles', 
  'kds_stations', 'kds_order_routing', 
  'kds_metrics', 'kds_configuration'
)
ORDER BY t.tablename;

-- Test 2: Count policies per table
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'tables', 'seats', 'orders', 'profiles', 
  'kds_stations', 'kds_order_routing', 
  'kds_metrics', 'kds_configuration'
)
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Test 3: List all policies by table and type
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  CASE 
    WHEN 'anon' = ANY(roles) THEN '🔓 ANON ACCESS'
    WHEN 'authenticated' = ANY(roles) THEN '🔒 AUTH ONLY'
    ELSE '🔐 RESTRICTED'
  END as access_level
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'tables', 'seats', 'orders', 'profiles', 
  'kds_stations', 'kds_order_routing', 
  'kds_metrics', 'kds_configuration'
)
ORDER BY tablename, cmd;

-- Test 4: Check anonymous access permissions
SELECT 
  'ANONYMOUS USER ACCESS TEST' as test_section,
  '=' as separator;

-- Check if anon can access tables (should be YES for demo)
SELECT 
  'tables' as table_name,
  has_table_privilege('anon', 'public.tables', 'SELECT') as can_select,
  has_table_privilege('anon', 'public.tables', 'INSERT') as can_insert,
  has_table_privilege('anon', 'public.tables', 'UPDATE') as can_update,
  CASE 
    WHEN has_table_privilege('anon', 'public.tables', 'SELECT') 
     AND NOT has_table_privilege('anon', 'public.tables', 'INSERT')
     AND NOT has_table_privilege('anon', 'public.tables', 'UPDATE')
    THEN '✅ CORRECT (Read-only demo access)'
    ELSE '❌ INCORRECT'
  END as assessment;

-- Check if anon can access seats (should be YES for demo)
SELECT 
  'seats' as table_name,
  has_table_privilege('anon', 'public.seats', 'SELECT') as can_select,
  has_table_privilege('anon', 'public.seats', 'INSERT') as can_insert,
  has_table_privilege('anon', 'public.seats', 'UPDATE') as can_update,
  CASE 
    WHEN has_table_privilege('anon', 'public.seats', 'SELECT') 
     AND NOT has_table_privilege('anon', 'public.seats', 'INSERT')
     AND NOT has_table_privilege('anon', 'public.seats', 'UPDATE')
    THEN '✅ CORRECT (Read-only demo access)'
    ELSE '❌ INCORRECT'
  END as assessment;

-- Check if anon CANNOT access orders (should be NO)
SELECT 
  'orders' as table_name,
  has_table_privilege('anon', 'public.orders', 'SELECT') as can_select,
  has_table_privilege('anon', 'public.orders', 'INSERT') as can_insert,
  has_table_privilege('anon', 'public.orders', 'UPDATE') as can_update,
  CASE 
    WHEN NOT has_table_privilege('anon', 'public.orders', 'SELECT')
     AND NOT has_table_privilege('anon', 'public.orders', 'INSERT')
     AND NOT has_table_privilege('anon', 'public.orders', 'UPDATE')
    THEN '✅ CORRECT (No access to sensitive data)'
    ELSE '❌ INCORRECT (Security risk!)'
  END as assessment;

-- Check if anon CANNOT access profiles (should be NO)
SELECT 
  'profiles' as table_name,
  has_table_privilege('anon', 'public.profiles', 'SELECT') as can_select,
  has_table_privilege('anon', 'public.profiles', 'INSERT') as can_insert,
  has_table_privilege('anon', 'public.profiles', 'UPDATE') as can_update,
  CASE 
    WHEN NOT has_table_privilege('anon', 'public.profiles', 'SELECT')
     AND NOT has_table_privilege('anon', 'public.profiles', 'INSERT')
     AND NOT has_table_privilege('anon', 'public.profiles', 'UPDATE')
    THEN '✅ CORRECT (No access to user data)'
    ELSE '❌ INCORRECT (Privacy risk!)'
  END as assessment;

-- Test 5: Check authenticated user permissions
SELECT 
  'AUTHENTICATED USER ACCESS TEST' as test_section,
  '=' as separator;

-- Check if authenticated users have proper access to main tables
SELECT 
  'authenticated_tables' as test_name,
  has_table_privilege('authenticated', 'public.tables', 'SELECT') as can_select,
  has_table_privilege('authenticated', 'public.tables', 'UPDATE') as can_update,
  '✅ Should have conditional access based on role' as note;

SELECT 
  'authenticated_orders' as test_name,
  has_table_privilege('authenticated', 'public.orders', 'SELECT') as can_select,
  has_table_privilege('authenticated', 'public.orders', 'INSERT') as can_insert,
  has_table_privilege('authenticated', 'public.orders', 'UPDATE') as can_update,
  '✅ Should have conditional access based on role' as note;

-- Test 6: Verify app_role enum includes guest
SELECT 
  'GUEST ROLE VERIFICATION' as test_section,
  '=' as separator;

SELECT 
  unnest(enum_range(NULL::public.app_role)) as available_roles,
  CASE 
    WHEN 'guest' = ANY(enum_range(NULL::public.app_role))
    THEN '✅ Guest role available'
    ELSE '❌ Guest role missing'
  END as guest_status;

-- Test 7: Security summary
SELECT 
  'SECURITY ASSESSMENT SUMMARY' as test_section,
  '=' as separator;

WITH security_check AS (
  SELECT 
    COUNT(*) FILTER (WHERE c.relrowsecurity = true) as secured_tables,
    COUNT(*) as total_tables
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'tables', 'seats', 'orders', 'profiles', 
    'kds_stations', 'kds_order_routing', 
    'kds_metrics', 'kds_configuration'
  )
),
policy_check AS (
  SELECT COUNT(DISTINCT tablename) as tables_with_policies
  FROM pg_policies 
  WHERE schemaname = 'public'
  AND tablename IN (
    'tables', 'seats', 'orders', 'profiles', 
    'kds_stations', 'kds_order_routing', 
    'kds_metrics', 'kds_configuration'
  )
),
anon_access_check AS (
  SELECT 
    CASE 
      WHEN has_table_privilege('anon', 'public.tables', 'SELECT') 
       AND has_table_privilege('anon', 'public.seats', 'SELECT')
       AND NOT has_table_privilege('anon', 'public.orders', 'SELECT')
       AND NOT has_table_privilege('anon', 'public.profiles', 'SELECT')
      THEN true 
      ELSE false 
    END as anon_access_correct
)
SELECT 
  sc.secured_tables || '/' || sc.total_tables as rls_status,
  pc.tables_with_policies || ' tables have policies' as policy_status,
  CASE 
    WHEN aac.anon_access_correct 
    THEN '✅ Anonymous access properly restricted'
    ELSE '❌ Anonymous access configuration issue'
  END as anon_status,
  CASE 
    WHEN sc.secured_tables = sc.total_tables 
     AND pc.tables_with_policies >= 6
     AND aac.anon_access_correct
    THEN '🎉 SECURITY FIX SUCCESSFUL!'
    ELSE '⚠️  SECURITY ISSUES REMAIN'
  END as overall_status
FROM security_check sc, policy_check pc, anon_access_check aac;

-- Test 8: Recommendations
SELECT 
  'RECOMMENDATIONS' as section,
  '=' as separator;

SELECT 
  '1. Test with actual user accounts' as recommendation,
  'Create test users for each role and verify access' as details
UNION ALL
SELECT 
  '2. Monitor real-time subscriptions' as recommendation,
  'Ensure anonymous users can only subscribe to public data' as details
UNION ALL
SELECT 
  '3. Regular security audits' as recommendation,
  'Run this test script periodically to verify policies' as details
UNION ALL
SELECT 
  '4. Application-level validation' as recommendation,
  'Test the UI to ensure it respects the RLS policies' as details;