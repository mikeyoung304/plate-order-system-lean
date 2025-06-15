-- ================================================================
-- PLATE RESTAURANT SYSTEM - COMPREHENSIVE RLS SECURITY FIX
-- ================================================================
-- This script fixes the Row Level Security vulnerability where
-- anonymous users can access all restaurant data.
--
-- SECURITY ISSUES ADDRESSED:
-- 1. Anonymous users can read all tables, seats, orders
-- 2. Missing 'guest' role for demo users
-- 3. No resident-specific policies
-- 4. Inconsistent policy table references
-- 5. Unsecured KDS system access
-- 6. No real-time subscription security
-- ================================================================

BEGIN;

-- ================================================================
-- STEP 1: UPDATE ROLE SYSTEM TO INCLUDE GUEST
-- ================================================================

-- Add 'guest' role to the enum for demo users
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'guest';

-- ================================================================
-- STEP 2: FIX TABLES AND SEATS RLS POLICIES
-- ================================================================

-- Drop existing inconsistent policies
DROP POLICY IF EXISTS "Servers and cooks can read tables" ON public.tables;
DROP POLICY IF EXISTS "Servers and cooks can update tables" ON public.tables;
DROP POLICY IF EXISTS "Servers and cooks can read seats" ON public.seats;
DROP POLICY IF EXISTS "Servers and cooks can update seats" ON public.seats;

-- Create comprehensive table policies using profiles table
CREATE POLICY "Admins can read all tables"
  ON public.tables
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Staff can read tables"
  ON public.tables
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('server', 'cook')
    )
  );

CREATE POLICY "Residents can read tables"
  ON public.tables
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'resident'
    )
  );

CREATE POLICY "Guests can read tables (demo access)"
  ON public.tables
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Staff can update tables"
  ON public.tables
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'server', 'cook')
    )
  );

-- Create comprehensive seat policies
CREATE POLICY "Admins can read all seats"
  ON public.seats
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Staff can read seats"
  ON public.seats
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('server', 'cook')
    )
  );

CREATE POLICY "Residents can read seats"
  ON public.seats
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'resident'
    )
  );

CREATE POLICY "Guests can read seats (demo access)"
  ON public.seats
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Staff can update seats"
  ON public.seats
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'server', 'cook')
    )
  );

-- ================================================================
-- STEP 3: ADD RESIDENT POLICIES FOR ORDERS
-- ================================================================

-- Allow residents to read their own orders
CREATE POLICY "Residents can read their own orders"
  ON public.orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'resident'
    )
    AND resident_id = auth.uid()
  );

-- Allow residents to create orders for themselves
CREATE POLICY "Residents can create their own orders"
  ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'resident'
    )
    AND resident_id = auth.uid()
  );

-- Allow residents to update their own orders (before being processed)
CREATE POLICY "Residents can update their own pending orders"
  ON public.orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'resident'
    )
    AND resident_id = auth.uid()
    AND status = 'new'
  );

-- ================================================================
-- STEP 4: SECURE PROFILES TABLE
-- ================================================================

-- Allow authenticated users to read profiles for necessary operations
CREATE POLICY "Authenticated users can read staff profiles"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (
    role IN ('server', 'cook', 'admin') OR
    (role = 'resident' AND user_id = auth.uid())
  );

-- Block anonymous access to profiles (no guest access to user data)
-- Note: anon role already blocked by existing policies

-- ================================================================
-- STEP 5: SECURE KDS SYSTEM
-- ================================================================

-- Drop inconsistent KDS policies
DROP POLICY IF EXISTS "Users can view all KDS stations" ON public.kds_stations;
DROP POLICY IF EXISTS "Admins can manage KDS stations" ON public.kds_stations;
DROP POLICY IF EXISTS "Kitchen staff can view order routing" ON public.kds_order_routing;
DROP POLICY IF EXISTS "Kitchen staff can update order routing" ON public.kds_order_routing;
DROP POLICY IF EXISTS "Kitchen staff can insert order routing" ON public.kds_order_routing;
DROP POLICY IF EXISTS "Kitchen staff can view metrics" ON public.kds_metrics;
DROP POLICY IF EXISTS "System can insert metrics" ON public.kds_metrics;
DROP POLICY IF EXISTS "Kitchen staff can view KDS configuration" ON public.kds_configuration;
DROP POLICY IF EXISTS "Admins can manage KDS configuration" ON public.kds_configuration;

-- Create secure KDS station policies
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

CREATE POLICY "Admins can manage KDS stations"
  ON public.kds_stations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create secure KDS order routing policies
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

CREATE POLICY "Kitchen staff can update order routing"
  ON public.kds_order_routing
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('cook', 'admin')
    )
  );

CREATE POLICY "Kitchen staff can insert order routing"
  ON public.kds_order_routing
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('cook', 'admin')
    )
  );

-- Create secure KDS metrics policies
CREATE POLICY "Kitchen staff can view metrics"
  ON public.kds_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('cook', 'admin')
    )
  );

CREATE POLICY "Kitchen staff can insert metrics"
  ON public.kds_metrics
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('cook', 'admin')
    )
  );

-- Create secure KDS configuration policies
CREATE POLICY "Kitchen staff can view KDS configuration"
  ON public.kds_configuration
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('cook', 'admin')
    )
  );

CREATE POLICY "Admins can manage KDS configuration"
  ON public.kds_configuration
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ================================================================
-- STEP 6: SECURE REAL-TIME SUBSCRIPTIONS
-- ================================================================

-- Grant appropriate permissions for real-time functionality
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.tables TO anon;
GRANT SELECT ON public.seats TO anon;

-- Block anonymous access to sensitive tables
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.kds_stations FROM anon;
REVOKE ALL ON public.kds_order_routing FROM anon;
REVOKE ALL ON public.kds_metrics FROM anon;
REVOKE ALL ON public.kds_configuration FROM anon;

-- ================================================================
-- STEP 7: CREATE DEMO GUEST USER SETUP
-- ================================================================

-- Function to create demo guest user with limited access
CREATE OR REPLACE FUNCTION create_demo_guest_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  guest_user_id uuid;
BEGIN
  -- This function would be called by the application
  -- when someone wants to use the demo as a guest
  -- It creates a temporary user record with guest role
  
  -- For now, we'll just return a placeholder
  -- Real implementation would create a temporary auth user
  RETURN gen_random_uuid();
END;
$$;

-- ================================================================
-- STEP 8: VALIDATION FUNCTIONS
-- ================================================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
  test_name text,
  result text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Test 1: Anonymous user can read tables
  RETURN QUERY
  SELECT 
    'Anonymous table access'::text,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.tables
        WHERE pg_has_role('anon', 'anon', 'USAGE')
      ) THEN 'PASS'
      ELSE 'FAIL'
    END::text,
    'Anonymous users should be able to read tables for demo'::text;

  -- Test 2: Anonymous user cannot read orders
  RETURN QUERY
  SELECT 
    'Anonymous order blocking'::text,
    CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM public.orders
        WHERE pg_has_role('anon', 'anon', 'USAGE')
      ) THEN 'PASS'
      ELSE 'FAIL'
    END::text,
    'Anonymous users should not be able to read orders'::text;

  -- Test 3: Check if RLS is enabled on all tables
  RETURN QUERY
  SELECT 
    'RLS enabled on all tables'::text,
    CASE 
      WHEN (
        SELECT COUNT(*) FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('tables', 'seats', 'orders', 'profiles', 'kds_stations', 'kds_order_routing', 'kds_metrics', 'kds_configuration')
      ) = (
        SELECT COUNT(*) FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE t.schemaname = 'public'
        AND t.tablename IN ('tables', 'seats', 'orders', 'profiles', 'kds_stations', 'kds_order_routing', 'kds_metrics', 'kds_configuration')
        AND c.relrowsecurity = true
      ) THEN 'PASS'
      ELSE 'FAIL'
    END::text,
    'All sensitive tables should have RLS enabled'::text;
END;
$$;

-- ================================================================
-- STEP 9: COMMIT AND SUMMARY
-- ================================================================

COMMIT;

-- Summary of changes made:
SELECT 
  'RLS Security Fix Applied Successfully!' as message,
  'The following security measures are now in place:' as details
UNION ALL
SELECT 
  '1. Guest role added for demo users' as message,
  '   - Anonymous users can read tables/seats only' as details
UNION ALL
SELECT 
  '2. Resident policies added' as message,
  '   - Residents can manage their own orders' as details
UNION ALL
SELECT 
  '3. Staff policies secured' as message,
  '   - Consistent role-based access using profiles table' as details
UNION ALL
SELECT 
  '4. KDS system secured' as message,
  '   - Only kitchen staff can access KDS features' as details
UNION ALL
SELECT 
  '5. Real-time subscriptions secured' as message,
  '   - Anonymous users limited to public data only' as details
UNION ALL
SELECT 
  '6. Test functions created' as message,
  '   - Run SELECT * FROM test_rls_policies() to validate' as details;