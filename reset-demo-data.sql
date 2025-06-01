-- Reset demo data for Plate Restaurant System
-- This will clean and reseed tables, seats, and sample orders

-- Clean existing data (in dependency order)
DELETE FROM orders;
DELETE FROM seats;
DELETE FROM tables;

-- Insert tables with proper structure
INSERT INTO tables (label, type, status, position_x, position_y, width, height, rotation, z_index) VALUES
(1, 'circle', 'available', 100, 100, 80, 80, 0, 1),
(2, 'rectangle', 'available', 250, 100, 120, 80, 0, 1),
(3, 'square', 'available', 400, 100, 100, 100, 0, 1),
(4, 'circle', 'available', 100, 250, 80, 80, 0, 1),
(5, 'rectangle', 'available', 250, 250, 120, 80, 0, 1),
(6, 'circle', 'available', 400, 250, 80, 80, 0, 1),
(7, 'square', 'available', 100, 400, 100, 100, 0, 1),
(8, 'circle', 'available', 250, 400, 80, 80, 0, 1);

-- Insert seats for each table
-- Table 1 (4 seats)
INSERT INTO seats (table_id, label, status) 
SELECT id, 1, 'available' FROM tables WHERE label = 1
UNION ALL
SELECT id, 2, 'available' FROM tables WHERE label = 1
UNION ALL
SELECT id, 3, 'available' FROM tables WHERE label = 1
UNION ALL
SELECT id, 4, 'available' FROM tables WHERE label = 1;

-- Table 2 (6 seats)
INSERT INTO seats (table_id, label, status)
SELECT id, 1, 'available' FROM tables WHERE label = 2
UNION ALL
SELECT id, 2, 'available' FROM tables WHERE label = 2
UNION ALL
SELECT id, 3, 'available' FROM tables WHERE label = 2
UNION ALL
SELECT id, 4, 'available' FROM tables WHERE label = 2
UNION ALL
SELECT id, 5, 'available' FROM tables WHERE label = 2
UNION ALL
SELECT id, 6, 'available' FROM tables WHERE label = 2;

-- Table 3 (4 seats)
INSERT INTO seats (table_id, label, status)
SELECT id, 1, 'available' FROM tables WHERE label = 3
UNION ALL
SELECT id, 2, 'available' FROM tables WHERE label = 3
UNION ALL
SELECT id, 3, 'available' FROM tables WHERE label = 3
UNION ALL
SELECT id, 4, 'available' FROM tables WHERE label = 3;

-- Table 4 (4 seats)
INSERT INTO seats (table_id, label, status)
SELECT id, 1, 'available' FROM tables WHERE label = 4
UNION ALL
SELECT id, 2, 'available' FROM tables WHERE label = 4
UNION ALL
SELECT id, 3, 'available' FROM tables WHERE label = 4
UNION ALL
SELECT id, 4, 'available' FROM tables WHERE label = 4;

-- Table 5 (6 seats)
INSERT INTO seats (table_id, label, status)
SELECT id, 1, 'available' FROM tables WHERE label = 5
UNION ALL
SELECT id, 2, 'available' FROM tables WHERE label = 5
UNION ALL
SELECT id, 3, 'available' FROM tables WHERE label = 5
UNION ALL
SELECT id, 4, 'available' FROM tables WHERE label = 5
UNION ALL
SELECT id, 5, 'available' FROM tables WHERE label = 5
UNION ALL
SELECT id, 6, 'available' FROM tables WHERE label = 5;

-- Table 6 (4 seats)
INSERT INTO seats (table_id, label, status)
SELECT id, 1, 'available' FROM tables WHERE label = 6
UNION ALL
SELECT id, 2, 'available' FROM tables WHERE label = 6
UNION ALL
SELECT id, 3, 'available' FROM tables WHERE label = 6
UNION ALL
SELECT id, 4, 'available' FROM tables WHERE label = 6;

-- Table 7 (4 seats)
INSERT INTO seats (table_id, label, status)
SELECT id, 1, 'available' FROM tables WHERE label = 7
UNION ALL
SELECT id, 2, 'available' FROM tables WHERE label = 7
UNION ALL
SELECT id, 3, 'available' FROM tables WHERE label = 7
UNION ALL
SELECT id, 4, 'available' FROM tables WHERE label = 7;

-- Table 8 (4 seats)
INSERT INTO seats (table_id, label, status)
SELECT id, 1, 'available' FROM tables WHERE label = 8
UNION ALL
SELECT id, 2, 'available' FROM tables WHERE label = 8
UNION ALL
SELECT id, 3, 'available' FROM tables WHERE label = 8
UNION ALL
SELECT id, 4, 'available' FROM tables WHERE label = 8;

-- Show results
SELECT 'Tables created:' as summary, count(*) as count FROM tables
UNION ALL
SELECT 'Seats created:', count(*) FROM seats;