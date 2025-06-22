-- ===============================================
-- CRITICAL RLS FIX: Guest User Authentication Failure
-- Fixes 401 Unauthorized errors after guest login
-- ===============================================

-- STEP 1: Ensure guest user profile exists with admin role
INSERT INTO public.profiles (user_id, role, name, created_at, updated_at) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'guest@restaurant.plate'),
  'admin',
  'Demo Guest User',
  NOW(),
  NOW()
) 
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'admin',
  name = 'Demo Guest User',
  updated_at = NOW();

-- STEP 2: Verify all critical RLS policies allow admin role access

-- Ensure orders table policies include admin role
DROP POLICY IF EXISTS "Admins can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can read orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Admins can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can read orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- STEP 3: Ensure comprehensive server role policies for guest admin access
CREATE POLICY "Servers can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('server', 'admin')
    )
  );

CREATE POLICY "Servers can read orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('server', 'admin')
    )
  );

CREATE POLICY "Servers can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('server', 'admin')
    )
  );

-- STEP 4: Ensure KDS policies explicitly include admin role
-- (These should already exist from migration, but ensuring they're correct)

-- Update KDS order routing policies to ensure admin access
DROP POLICY IF EXISTS "Kitchen staff can view order routing" ON kds_order_routing;
DROP POLICY IF EXISTS "Kitchen staff can update order routing" ON kds_order_routing;
DROP POLICY IF EXISTS "Kitchen staff can insert order routing" ON kds_order_routing;

CREATE POLICY "Kitchen staff can view order routing" ON kds_order_routing
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('cook', 'admin')
    )
  );

CREATE POLICY "Kitchen staff can update order routing" ON kds_order_routing
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('cook', 'admin')
    )
  );

CREATE POLICY "Kitchen staff can insert order routing" ON kds_order_routing
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('cook', 'admin')
    )
  );

-- STEP 5: Verification queries
SELECT 
  u.email,
  u.id as user_id,
  p.role,
  p.name,
  CASE 
    WHEN p.role IS NULL THEN 'MISSING PROFILE'
    WHEN p.role = 'admin' THEN 'CORRECT ROLE'
    ELSE 'WRONG ROLE: ' || p.role
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email = 'guest@restaurant.plate';

-- Check if policies exist for critical tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('orders', 'tables', 'seats', 'kds_order_routing')
ORDER BY tablename, policyname;

-- EXPECTED RESULTS:
-- 1. Guest user should have 'admin' role in profiles table
-- 2. All critical tables should have policies allowing 'admin' role access
-- 3. Guest user should be able to access all core functionality after this fix