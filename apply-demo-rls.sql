-- Demo Mode RLS Configuration
-- This script blocks anonymous access while allowing guest admin full access
-- Date: 2025-06-16

-- ===========================================
-- 1. ENSURE RLS IS ENABLED ON ALL TABLES
-- ===========================================

ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on KDS tables if they exist
ALTER TABLE IF EXISTS public.kds_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kds_category_stations ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 2. DROP EXISTING POLICIES (CLEAN SLATE)
-- ===========================================

-- Drop all existing policies on tables
DROP POLICY IF EXISTS "Admins can create tables" ON public.tables;
DROP POLICY IF EXISTS "Admins can delete tables" ON public.tables;
DROP POLICY IF EXISTS "Servers and cooks can read tables" ON public.tables;
DROP POLICY IF EXISTS "Servers and cooks can update tables" ON public.tables;

-- Drop all existing policies on seats
DROP POLICY IF EXISTS "Admins can create seats" ON public.seats;
DROP POLICY IF EXISTS "Admins can delete seats" ON public.seats;
DROP POLICY IF EXISTS "Servers and cooks can read seats" ON public.seats;
DROP POLICY IF EXISTS "Servers and cooks can update seats" ON public.seats;

-- Drop all existing policies on orders
DROP POLICY IF EXISTS "Servers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Servers and cooks can read orders" ON public.orders;
DROP POLICY IF EXISTS "Servers and cooks can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- ===========================================
-- 3. CREATE DEMO MODE POLICIES
-- ===========================================

-- TABLES: Only authenticated users can access
CREATE POLICY "Authenticated users can read tables"
  ON public.tables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin role can manage tables"
  ON public.tables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- SEATS: Only authenticated users can access
CREATE POLICY "Authenticated users can read seats"
  ON public.seats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin role can manage seats"
  ON public.seats FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ORDERS: Only authenticated users can access
CREATE POLICY "Authenticated users can read orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin role can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- PROFILES: Users can see their own, admins see all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ===========================================
-- 4. GRANT NECESSARY PERMISSIONS
-- ===========================================

-- Revoke all permissions from anon role (block anonymous access)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant schema usage to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tables TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Grant sequence permissions for ID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===========================================
-- 5. VERIFY GUEST USER SETUP
-- ===========================================

-- Ensure guest user has admin role in profiles
UPDATE public.profiles 
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'guest@restaurant.plate'
);

-- ===========================================
-- 6. ADD DEMO MODE MARKER
-- ===========================================

-- Create a demo_config table to track demo mode status
CREATE TABLE IF NOT EXISTS public.demo_config (
  id SERIAL PRIMARY KEY,
  demo_mode_enabled BOOLEAN DEFAULT true,
  guest_email TEXT DEFAULT 'guest@restaurant.plate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on demo_config
ALTER TABLE public.demo_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage demo config
CREATE POLICY "Only admins can manage demo config"
  ON public.demo_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Insert default demo config
INSERT INTO public.demo_config (demo_mode_enabled, guest_email)
VALUES (true, 'guest@restaurant.plate')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.demo_config TO authenticated;

COMMENT ON TABLE public.demo_config IS 'Demo mode configuration for the restaurant app';