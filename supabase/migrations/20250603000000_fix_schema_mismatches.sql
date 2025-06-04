-- Fix schema mismatches between database and TypeScript types

-- 1. Fix profiles table id column
-- The profiles table has id as bigint but TypeScript expects uuid
-- We need to change the primary key strategy to use user_id as the primary key

-- First, drop the existing primary key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS user_roles_pkey;

-- Drop the id column since user_id should be the primary key
ALTER TABLE public.profiles DROP COLUMN IF EXISTS id;

-- Make user_id the primary key
ALTER TABLE public.profiles ADD PRIMARY KEY (user_id);

-- Remove the unique constraint on (user_id, role) since user_id is now primary key
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_role_key;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add missing columns to match TypeScript types
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dietary_restrictions text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Fix tables.label column type
-- Currently integer but TypeScript expects text
ALTER TABLE public.tables ALTER COLUMN label TYPE text USING label::text;

-- 3. Add missing columns to tables
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS floor_plan_id uuid;

-- 4. Create update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tables_updated_at ON public.tables;
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON public.tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seats_updated_at ON public.seats;
CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON public.seats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Update RLS policies to work with new structure
-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read resident profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow auth admin to read profiles" ON public.profiles;

-- Recreate policies with proper permissions
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All users can view resident profiles"
    ON public.profiles FOR SELECT
    USING (role = 'resident');

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_floor_plan_id ON public.tables(floor_plan_id);
CREATE INDEX IF NOT EXISTS idx_seats_table_id ON public.seats(table_id);
CREATE INDEX IF NOT EXISTS idx_seats_resident_id ON public.seats(resident_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_resident_id ON public.orders(resident_id);
CREATE INDEX IF NOT EXISTS idx_orders_server_id ON public.orders(server_id);

-- 7. Update the handle_new_user function to work with new structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  raw_user_meta_data jsonb;
  user_role public.app_role;
BEGIN
  -- Get the raw user metadata
  raw_user_meta_data := new.raw_user_meta_data;
  
  -- Extract the role from metadata
  IF raw_user_meta_data ? 'role' THEN
    user_role := (raw_user_meta_data->>'role')::public.app_role;
    
    -- Insert into profiles with user_id as primary key
    INSERT INTO public.profiles (user_id, role, name, email)
    VALUES (
      new.id, 
      user_role, 
      COALESCE(raw_user_meta_data->>'name', ''),
      new.email
    );
  END IF;
  
  RETURN new;
END;
$$;

-- 8. Grant proper permissions
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;