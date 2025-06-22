-- CRITICAL GUEST USER AUTHENTICATION FIX
-- Addresses 401 Unauthorized errors after guest login

-- 1. Check current guest user role
SELECT 
  u.email,
  p.role,
  p.created_at,
  p.updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'guest@restaurant.plate';

-- 2. Ensure guest user has admin role for demo access
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
  u.id,
  'guest@restaurant.plate',
  'Guest Demo User',
  'admin',
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'guest@restaurant.plate'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- 3. Verify all critical RLS policies are in place
-- Orders table policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow full access for authenticated users with role') THEN
    CREATE POLICY "Allow full access for authenticated users with role" ON orders 
    FOR ALL TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'server', 'cook')
      )
    );
  END IF;
END $$;

-- Tables table policies  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tables' AND policyname = 'Allow full access for authenticated users with role') THEN
    CREATE POLICY "Allow full access for authenticated users with role" ON tables
    FOR ALL TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'server', 'cook')
      )
    );
  END IF;
END $$;

-- Seats table policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seats' AND policyname = 'Allow full access for authenticated users with role') THEN
    CREATE POLICY "Allow full access for authenticated users with role" ON seats
    FOR ALL TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'server', 'cook')
      )
    );
  END IF;
END $$;

-- KDS Order Routing policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kds_order_routing' AND policyname = 'Allow read access for authenticated users with cook or admin role') THEN
    CREATE POLICY "Allow read access for authenticated users with cook or admin role" ON kds_order_routing
    FOR SELECT TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'cook')
      )
    );
  END IF;
END $$;

-- 4. Final verification
SELECT 
  'Guest user verification:' as check_type,
  u.email,
  p.role,
  CASE 
    WHEN p.role = 'admin' THEN '✅ CORRECT - Has admin role for demo access'
    ELSE '❌ NEEDS FIX - Should have admin role'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'guest@restaurant.plate';

-- 5. Test queries that should work after fix
SELECT 'Testing orders access...' as test;
SELECT COUNT(*) as order_count FROM orders WHERE true;

SELECT 'Testing tables access...' as test;  
SELECT COUNT(*) as table_count FROM tables WHERE true;

SELECT 'Testing KDS access...' as test;
SELECT COUNT(*) as kds_station_count FROM kds_stations WHERE true;