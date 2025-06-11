-- Find tables that might have been added after Luis's original build
WITH original_tables AS (
  -- Luis's original tables based on restored modules
  SELECT unnest(ARRAY['profiles', 'tables', 'seats', 'orders']) as table_name
),
current_tables AS (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
)
SELECT 
  ct.table_name,
  CASE 
    WHEN ot.table_name IS NULL THEN 'ADDED_AFTER_LUIS'
    ELSE 'ORIGINAL'
  END as status
FROM current_tables ct
LEFT JOIN original_tables ot ON ct.table_name = ot.table_name
ORDER BY status DESC, ct.table_name;
EOF < /dev/null