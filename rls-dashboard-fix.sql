-- ================================================================
-- CRITICAL RLS SECURITY FIX - Apply in Supabase Dashboard
-- ================================================================

BEGIN;

-- STEP 1: Add guest role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'guest';

-- STEP 2: Enable RLS on critical tables (if not already enabled)
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 3: CRITICAL - Block anonymous access to orders
DROP POLICY IF EXISTS "authenticated_access" ON public.orders;
CREATE POLICY "orders_authenticated_only"
  ON public.orders
  FOR ALL TO authenticated
  USING (true);

-- STEP 4: Allow anonymous read for tables/seats (demo functionality)
DROP POLICY IF EXISTS "authenticated_access" ON public.tables;
CREATE POLICY "tables_public_read"
  ON public.tables
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "tables_staff_write"  
  ON public.tables
  FOR ALL TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_access" ON public.seats;
CREATE POLICY "seats_public_read"
  ON public.seats  
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "seats_staff_write"
  ON public.seats
  FOR ALL TO authenticated  
  USING (true);

-- STEP 5: Fix guest user role (currently admin -> should be guest)
UPDATE public.profiles 
SET role = 'guest'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'guest@restaurant.plate'
);

COMMIT;