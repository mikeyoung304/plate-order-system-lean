-- Seed initial tables and seats for testing
-- This migration adds some initial table data for the floor plan editor

-- Insert initial tables
INSERT INTO public.tables (id, label, type, status) VALUES 
  (gen_random_uuid(), 1, 'circle', 'available'),
  (gen_random_uuid(), 2, 'circle', 'available'),
  (gen_random_uuid(), 3, 'circle', 'available'),
  (gen_random_uuid(), 4, 'rectangle', 'available'),
  (gen_random_uuid(), 5, 'rectangle', 'available'),
  (gen_random_uuid(), 6, 'rectangle', 'available');

-- Insert seats for each table
-- Table 1: 4 seats
INSERT INTO public.seats (table_id, label, status) 
SELECT id, generate_series(1, 4), 'available' 
FROM public.tables WHERE label = 1;

-- Table 2: 4 seats  
INSERT INTO public.seats (table_id, label, status)
SELECT id, generate_series(1, 4), 'available'
FROM public.tables WHERE label = 2;

-- Table 3: 4 seats
INSERT INTO public.seats (table_id, label, status)
SELECT id, generate_series(1, 4), 'available' 
FROM public.tables WHERE label = 3;

-- Table 4: 6 seats (rectangle)
INSERT INTO public.seats (table_id, label, status)
SELECT id, generate_series(1, 6), 'available'
FROM public.tables WHERE label = 4;

-- Table 5: 6 seats (rectangle)
INSERT INTO public.seats (table_id, label, status)
SELECT id, generate_series(1, 6), 'available'
FROM public.tables WHERE label = 5;

-- Table 6: 8 seats (large rectangle)
INSERT INTO public.seats (table_id, label, status)
SELECT id, generate_series(1, 8), 'available'
FROM public.tables WHERE label = 6;