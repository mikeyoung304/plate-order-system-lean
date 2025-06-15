-- Comprehensive Fix for RLS Policies and Schema Issues
-- This addresses the core problems preventing authenticated queries from working properly

-- ===========================================
-- 1. ADD MISSING COLUMNS TO ORDERS TABLE
-- ===========================================

-- Add total column for order total amount
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0.00;

-- Add optional columns for better order management
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- ===========================================
-- 2. FIX TABLES RLS POLICIES - UPDATE FROM user_roles TO profiles
-- ===========================================

-- Drop old policies that reference user_roles
DROP POLICY IF EXISTS "Admins can create tables" ON public.tables;
DROP POLICY IF EXISTS "Admins can delete tables" ON public.tables;
DROP POLICY IF EXISTS "Servers and cooks can read tables" ON public.tables;
DROP POLICY IF EXISTS "Servers and cooks can update tables" ON public.tables;

-- Create updated policies that reference profiles
CREATE POLICY "Admins can create tables"
  ON public.tables
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete tables"
  ON public.tables
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Servers and cooks can read tables"
  ON public.tables
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('server', 'cook', 'admin')
    )
  );

CREATE POLICY "Servers and cooks can update tables"
  ON public.tables
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('server', 'cook', 'admin')
    )
  );

-- ===========================================
-- 3. FIX SEATS RLS POLICIES - UPDATE FROM user_roles TO profiles
-- ===========================================

-- Drop old policies that reference user_roles
DROP POLICY IF EXISTS "Admins can create seats" ON public.seats;
DROP POLICY IF EXISTS "Admins can delete seats" ON public.seats;
DROP POLICY IF EXISTS "Servers and cooks can read seats" ON public.seats;
DROP POLICY IF EXISTS "Servers and cooks can update seats" ON public.seats;

-- Create updated policies that reference profiles
CREATE POLICY "Admins can create seats"
  ON public.seats
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete seats"
  ON public.seats
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Servers and cooks can read seats"
  ON public.seats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('server', 'cook', 'admin')
    )
  );

CREATE POLICY "Servers and cooks can update seats"
  ON public.seats
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('server', 'cook', 'admin')
    )
  );

-- ===========================================
-- 4. ENSURE NO ANONYMOUS ACCESS - BLOCK ALL ANONYMOUS QUERIES
-- ===========================================

-- Drop any policies that might allow anonymous access
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.tables;
DROP POLICY IF EXISTS "Public read access" ON public.tables;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.seats;
DROP POLICY IF EXISTS "Public read access" ON public.seats;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.orders;
DROP POLICY IF EXISTS "Public read access" ON public.orders;

-- Revoke any anonymous permissions
REVOKE ALL ON public.tables FROM anon;
REVOKE ALL ON public.seats FROM anon;
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.profiles FROM anon;

-- ===========================================
-- 5. ADD DEMO/RESIDENT POLICIES FOR COMPREHENSIVE ACCESS
-- ===========================================

-- Allow residents to read tables and seats (for browsing menu/availability)
CREATE POLICY "Residents can read tables"
  ON public.tables
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('resident', 'server', 'cook', 'admin')
    )
  );

CREATE POLICY "Residents can read seats"
  ON public.seats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('resident', 'server', 'cook', 'admin')
    )
  );

-- ===========================================
-- 6. VALIDATE THE FIX
-- ===========================================

-- Add helpful comments
COMMENT ON COLUMN public.orders.total IS 'Total amount for the order in decimal format';
COMMENT ON COLUMN public.orders.notes IS 'General notes about the order';
COMMENT ON COLUMN public.orders.special_requests IS 'Special dietary or preparation requests';

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS orders_total_idx ON public.orders(total);

-- Final verification: Ensure RLS is enabled on all tables
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Confirm permissions are correct
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT ON public.tables TO authenticated;
GRANT SELECT ON public.seats TO authenticated;