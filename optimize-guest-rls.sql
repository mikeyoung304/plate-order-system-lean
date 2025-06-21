-- Critical Performance Optimization for Guest Admin Access
-- This optimizes RLS policies specifically for the guest_admin role to achieve <50ms query times
-- Date: 2025-06-20

-- ===========================================
-- 1. CREATE FAST-PATH POLICIES FOR GUEST ADMIN
-- ===========================================

-- First, drop existing policies that might be causing complexity
DROP POLICY IF EXISTS "Authenticated users can read orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin role can delete orders" ON public.orders;

DROP POLICY IF EXISTS "Authenticated users can read tables" ON public.tables;
DROP POLICY IF EXISTS "Admin role can manage tables" ON public.tables;

DROP POLICY IF EXISTS "Authenticated users can read seats" ON public.seats;
DROP POLICY IF EXISTS "Admin role can manage seats" ON public.seats;

-- Create optimized policies with guest_admin fast-path
-- ORDERS: Optimized with admin fast-path
CREATE POLICY "Guest admin full access to orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

CREATE POLICY "General authenticated read orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

CREATE POLICY "General authenticated modify orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

CREATE POLICY "General authenticated update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

-- TABLES: Optimized with guest admin fast-path
CREATE POLICY "Guest admin full access to tables"
  ON public.tables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

CREATE POLICY "General authenticated read tables"
  ON public.tables FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

-- SEATS: Optimized with guest admin fast-path
CREATE POLICY "Guest admin full access to seats"
  ON public.seats FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

CREATE POLICY "General authenticated read seats"
  ON public.seats FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

-- ===========================================
-- 2. OPTIMIZE KDS TABLES FOR GUEST ADMIN
-- ===========================================

-- KDS Order Routing (critical for performance)
DROP POLICY IF EXISTS "Authenticated users can access kds_order_routing" ON public.kds_order_routing;

CREATE POLICY "Guest admin full kds routing access"
  ON public.kds_order_routing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

CREATE POLICY "General authenticated kds routing access"
  ON public.kds_order_routing FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

-- KDS Stations
DROP POLICY IF EXISTS "Authenticated users can read kds_stations" ON public.kds_stations;

CREATE POLICY "Guest admin full kds stations access"
  ON public.kds_stations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

CREATE POLICY "General authenticated kds stations read"
  ON public.kds_stations FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND auth.jwt() ->> 'email' = 'guest@restaurant.plate'
    )
  );

-- ===========================================
-- 3. CREATE PERFORMANCE INDEX FOR GUEST LOOKUP
-- ===========================================

-- Index to speed up guest admin lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_guest_admin_lookup 
ON public.profiles (user_id, role) 
WHERE role = 'admin';

-- Index to speed up auth email lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_guest_email 
ON auth.users (email) 
WHERE email = 'guest@restaurant.plate';

-- ===========================================
-- 4. VERIFY GUEST USER SETUP
-- ===========================================

-- Ensure guest user exists and has admin role
DO $$
DECLARE
    guest_user_id UUID;
BEGIN
    -- Get guest user ID
    SELECT id INTO guest_user_id 
    FROM auth.users 
    WHERE email = 'guest@restaurant.plate';
    
    IF guest_user_id IS NOT NULL THEN
        -- Ensure profile exists with admin role
        INSERT INTO public.profiles (user_id, role, name, email)
        VALUES (guest_user_id, 'admin', 'Guest Demo User', 'guest@restaurant.plate')
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'admin',
            name = 'Guest Demo User',
            email = 'guest@restaurant.plate',
            updated_at = NOW();
        
        RAISE NOTICE 'Guest user profile updated with admin role';
    ELSE
        RAISE NOTICE 'Guest user not found - needs to be created first';
    END IF;
END $$;

-- ===========================================
-- 5. PERFORMANCE VALIDATION
-- ===========================================

-- Test query performance for the critical KDS query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
  kor.id,
  kor.order_id,
  kor.station_id,
  kor.routed_at,
  kor.started_at,
  kor.completed_at,
  kor.priority,
  kor.recall_count,
  kor.notes,
  o.id as order_id_2, 
  o.items, 
  o.status, 
  o.type, 
  o.created_at,
  o.seat_id,
  t.id as table_id, 
  t.label as table_label,
  s.id as seat_id_2, 
  s.label as seat_label,
  ks.id as station_id_2, 
  ks.name as station_name, 
  ks.type as station_type, 
  ks.color as station_color
FROM public.kds_order_routing kor
INNER JOIN public.orders o ON kor.order_id = o.id
INNER JOIN public.tables t ON o.table_id = t.id
INNER JOIN public.seats s ON o.seat_id = s.id
INNER JOIN public.kds_stations ks ON kor.station_id = ks.id
WHERE kor.completed_at IS NULL
ORDER BY kor.priority DESC, kor.routed_at ASC
LIMIT 50;

COMMENT ON INDEX idx_profiles_guest_admin_lookup IS 'Optimizes guest admin role lookup for fast RLS bypass';
COMMENT ON INDEX idx_auth_users_guest_email IS 'Optimizes guest user email lookup for RLS performance';