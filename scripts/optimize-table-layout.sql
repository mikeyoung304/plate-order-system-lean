-- Optimize table layout with intelligent positioning
-- This script positions tables in an efficient restaurant floor plan layout

-- Update table positions with intelligent layout
-- Section A (Left side): Tables 1, 3
-- Section B (Center): Table 5 (feature table)  
-- Section C (Right side): Tables 2, 4, 6

-- Table 1: Small 4-seat round table (Section A, front)
UPDATE public.tables 
SET 
  position_x = 150,
  position_y = 120,
  width = 80,
  height = 80,
  type = 'circle',
  rotation = 0,
  z_index = 1
WHERE label = 1;

-- Table 2: Small 4-seat round table (Section C, front)  
UPDATE public.tables
SET
  position_x = 450,
  position_y = 120,
  width = 80,
  height = 80,
  type = 'circle',
  rotation = 0,
  z_index = 1
WHERE label = 2;

-- Table 3: Medium 6-seat round table (Section A, back)
UPDATE public.tables
SET
  position_x = 150,
  position_y = 280,
  width = 100,
  height = 100,
  type = 'circle', 
  rotation = 0,
  z_index = 1
WHERE label = 3;

-- Table 4: Small 2-seat bistro table (Section C, back)
UPDATE public.tables
SET
  position_x = 450,
  position_y = 300,
  width = 60,
  height = 60,
  type = 'rectangle',
  rotation = 0,
  z_index = 1
WHERE label = 4;

-- Update seats for Table 4 to only have 2 seats (bistro style)
DELETE FROM public.seats WHERE table_id = (SELECT id FROM public.tables WHERE label = 4) AND label > 2;

-- Table 5: Large 8-seat rectangular table (Section B, center feature)
UPDATE public.tables
SET
  position_x = 300,
  position_y = 200,
  width = 120,
  height = 60,
  type = 'rectangle',
  rotation = 0,
  z_index = 1
WHERE label = 5;

-- Table 6: Medium 6-seat rectangular table (Section C, middle)
UPDATE public.tables
SET
  position_x = 450,
  position_y = 200,
  width = 100,
  height = 50,
  type = 'rectangle', 
  rotation = 0,
  z_index = 1
WHERE label = 6;

-- Add comments for reference
COMMENT ON TABLE public.tables IS 'Restaurant tables with optimized positioning: Section A (Tables 1,3), Section B (Table 5), Section C (Tables 2,4,6)';