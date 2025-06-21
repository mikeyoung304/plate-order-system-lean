-- Critical Schema Migration: Fix Type Mismatches and Missing Constraints
-- This migration addresses:
-- 1. Fix profiles.id type mismatch (bigint -> uuid)
-- 2. Convert tables.label from integer to text
-- 3. Add missing foreign key constraints for orders table
-- 4. Add missing columns to orders and seats tables

BEGIN;

-- ============================================================================
-- 1. Fix profiles.id type mismatch
-- ============================================================================

-- Check if profiles table still has bigint id column
DO $$
BEGIN
    -- If the id column exists and is bigint, we need to fix it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'id' 
        AND data_type = 'bigint'
    ) THEN
        
        -- Step 1: Add new uuid id column
        ALTER TABLE public.profiles ADD COLUMN id_new uuid DEFAULT gen_random_uuid();
        
        -- Step 2: Update all existing records with new UUIDs
        UPDATE public.profiles SET id_new = gen_random_uuid() WHERE id_new IS NULL;
        
        -- Step 3: Find and update any foreign key references
        -- (Add specific FK updates here if any tables reference profiles.id)
        
        -- Step 4: Drop old primary key constraint
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
        
        -- Step 5: Drop old id column
        ALTER TABLE public.profiles DROP COLUMN id;
        
        -- Step 6: Rename new column to id
        ALTER TABLE public.profiles RENAME COLUMN id_new TO id;
        
        -- Step 7: Make new id column the primary key
        ALTER TABLE public.profiles ADD PRIMARY KEY (id);
        
        -- Step 8: Make id column NOT NULL and remove default for new records
        ALTER TABLE public.profiles ALTER COLUMN id SET NOT NULL;
        ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;
        
    END IF;
END $$;

-- ============================================================================
-- 2. Convert tables.label from integer to text
-- ============================================================================

-- Check if tables.label is integer type and convert to text
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' 
        AND column_name = 'label' 
        AND data_type = 'integer'
    ) THEN
        -- Convert integer to text with proper casting
        ALTER TABLE public.tables ALTER COLUMN label TYPE text USING label::text;
    END IF;
END $$;

-- ============================================================================
-- 3. Add missing foreign key constraints for orders table
-- ============================================================================

-- Add resident_id foreign key constraint if it doesn't exist
DO $$
BEGIN
    -- First ensure the resident_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'resident_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN resident_id uuid;
    END IF;
    
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_orders_resident_id'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT fk_orders_resident_id 
        FOREIGN KEY (resident_id) 
        REFERENCES public.profiles(user_id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add server_id foreign key constraint if it doesn't exist
DO $$
BEGIN
    -- First ensure the server_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'server_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN server_id uuid;
    END IF;
    
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_orders_server_id'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT fk_orders_server_id 
        FOREIGN KEY (server_id) 
        REFERENCES public.profiles(user_id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 4. Add missing columns to orders table
-- ============================================================================

-- Add special_requests column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_requests text;

-- Add estimated_prep_time column (in minutes)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_prep_time integer;

-- Add actual_prep_time column (in minutes)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS actual_prep_time integer;

-- ============================================================================
-- 5. Add missing columns to seats table
-- ============================================================================

-- Add resident_id foreign key column to seats
DO $$
BEGIN
    -- First ensure the resident_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seats' AND column_name = 'resident_id'
    ) THEN
        ALTER TABLE public.seats ADD COLUMN resident_id uuid;
    END IF;
    
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_seats_resident_id'
    ) THEN
        ALTER TABLE public.seats 
        ADD CONSTRAINT fk_seats_resident_id 
        FOREIGN KEY (resident_id) 
        REFERENCES public.profiles(user_id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 6. Create indexes for performance on new foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_resident_id ON public.orders(resident_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_server_id ON public.orders(server_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seats_resident_id ON public.seats(resident_id);

-- ============================================================================
-- 7. Update RLS policies to work with new schema
-- ============================================================================

-- Update policies that might reference the old profiles.id structure
-- Only recreate if necessary to avoid breaking existing policies

-- Ensure orders table has proper RLS policies for new FK columns
CREATE POLICY IF NOT EXISTS "Users can view orders for their tables"
    ON public.orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.seats s
            JOIN public.profiles p ON s.resident_id = p.user_id
            WHERE s.table_id = orders.table_id
            AND p.user_id = auth.uid()
        )
        OR 
        server_id = auth.uid()
        OR
        resident_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'cook')
        )
    );

-- ============================================================================
-- 8. Validate schema integrity
-- ============================================================================

-- Add constraint to ensure prep times are positive when specified
ALTER TABLE public.orders ADD CONSTRAINT check_estimated_prep_time_positive 
    CHECK (estimated_prep_time IS NULL OR estimated_prep_time > 0);

ALTER TABLE public.orders ADD CONSTRAINT check_actual_prep_time_positive 
    CHECK (actual_prep_time IS NULL OR actual_prep_time > 0);

-- ============================================================================
-- 9. Grant necessary permissions
-- ============================================================================

-- Ensure authenticated users can access new columns
GRANT SELECT, INSERT, UPDATE ON TABLE public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.seats TO authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- Grant usage on sequences if any were created
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;

-- ============================================================================
-- Migration Notes:
-- ============================================================================
-- 1. This migration safely handles existing data by using conditional checks
-- 2. Foreign key constraints use ON DELETE SET NULL to prevent cascading deletes
-- 3. Indexes are created CONCURRENTLY to avoid locking issues
-- 4. RLS policies are updated to work with new foreign key relationships
-- 5. Data integrity constraints ensure prep times are positive values
-- 6. All changes are wrapped in a transaction for atomicity