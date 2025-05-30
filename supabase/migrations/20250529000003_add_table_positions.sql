-- Add position and layout columns to tables for floor plan editor
-- Migration: 20250529000003_add_table_positions.sql

alter table public.tables 
add column position_x numeric default 100,
add column position_y numeric default 100,
add column width numeric default 100,
add column height numeric default 80,
add column rotation numeric default 0,
add column z_index integer default 1;

-- Add comment for documentation
comment on column public.tables.position_x is 'X coordinate for floor plan editor';
comment on column public.tables.position_y is 'Y coordinate for floor plan editor';
comment on column public.tables.width is 'Width for floor plan editor';
comment on column public.tables.height is 'Height for floor plan editor';
comment on column public.tables.rotation is 'Rotation angle in degrees for floor plan editor';
comment on column public.tables.z_index is 'Z-index for layering in floor plan editor';