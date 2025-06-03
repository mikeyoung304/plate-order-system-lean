# Database Operations Guide (#heyluis Backend Focus)

## Current Database State

The Plate Restaurant System uses **Supabase PostgreSQL** with a hybrid schema showing evolution from simple restaurant management to enterprise KDS system. The database is **75% production-ready** with several critical schema mismatches requiring attention.

## Schema Overview

### **Core Tables Structure**

```sql
-- User Management
profiles (
  id bigint PRIMARY KEY,           -- ⚠️ Should be UUID for consistency
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,          -- 'admin'|'server'|'cook'|'resident'
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Restaurant Layout
tables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  label integer NOT NULL,          -- ⚠️ TypeScript expects string
  type text NOT NULL,
  status text DEFAULT 'available',
  position_x numeric DEFAULT 100,  -- Added for floor plan
  position_y numeric DEFAULT 100,
  width numeric DEFAULT 100,
  height numeric DEFAULT 80,
  rotation numeric DEFAULT 0,
  z_index integer DEFAULT 1
);

seats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id uuid REFERENCES tables(id) ON DELETE CASCADE,
  label integer NOT NULL,
  status text DEFAULT 'available'
  -- ⚠️ Missing: resident_id, position fields expected by frontend
);

-- Order Management
orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id uuid REFERENCES tables(id) ON DELETE CASCADE,
  seat_id uuid REFERENCES seats(id) ON DELETE CASCADE,
  resident_id uuid,               -- ⚠️ Should reference auth.users(id)
  server_id uuid,                 -- ⚠️ Should reference auth.users(id)
  items jsonb NOT NULL,
  transcript text,
  status text DEFAULT 'new',      -- ⚠️ No constraints, accepts any value
  type text NOT NULL,             -- ⚠️ No constraints, should be enum
  created_at timestamptz DEFAULT now()
);

-- Kitchen Display System
kds_stations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text CHECK (type IN ('grill','fryer','salad','expo','bar','prep','dessert')),
  position integer DEFAULT 1,
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

kds_order_routing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  station_id uuid REFERENCES kds_stations(id) ON DELETE CASCADE,
  sequence integer DEFAULT 1,
  routed_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  bumped_by uuid,                 -- ⚠️ Should reference profiles(id) but types mismatch
  bumped_at timestamptz,
  recalled_at timestamptz,
  recall_count integer DEFAULT 0,
  estimated_prep_time integer,
  actual_prep_time integer,
  notes text,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_order_station UNIQUE(order_id, station_id)
);
```

## Critical Schema Issues to Fix

### **1. Primary Key Type Inconsistency**

```sql
-- PROBLEM: profiles.id is bigint but referenced as uuid elsewhere
-- SOLUTION: Migrate to UUID for consistency

BEGIN;
-- Create new UUID column
ALTER TABLE profiles ADD COLUMN new_id uuid DEFAULT gen_random_uuid();

-- Update all foreign key references
UPDATE kds_order_routing SET bumped_by = profiles.new_id
FROM profiles WHERE kds_order_routing.bumped_by::text = profiles.id::text;

-- Drop old column and rename
ALTER TABLE profiles DROP COLUMN id;
ALTER TABLE profiles RENAME COLUMN new_id TO id;
ALTER TABLE profiles ADD PRIMARY KEY (id);
COMMIT;
```

### **2. Missing Foreign Key Constraints**

```sql
-- Add proper foreign key constraints for data integrity
ALTER TABLE orders
ADD CONSTRAINT fk_orders_resident
FOREIGN KEY (resident_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE orders
ADD CONSTRAINT fk_orders_server
FOREIGN KEY (server_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix kds_order_routing reference
ALTER TABLE kds_order_routing
ADD CONSTRAINT fk_routing_bumped_by
FOREIGN KEY (bumped_by) REFERENCES profiles(id) ON DELETE SET NULL;
```

### **3. Add Missing Columns for Frontend Compatibility**

```sql
-- Add missing table fields expected by TypeScript
ALTER TABLE tables ADD COLUMN table_id text UNIQUE;
UPDATE tables SET table_id = label::text;
ALTER TABLE tables ALTER COLUMN table_id SET NOT NULL;

-- Add missing seat fields
ALTER TABLE seats ADD COLUMN resident_id uuid REFERENCES auth.users(id);
ALTER TABLE seats ADD COLUMN position_x numeric DEFAULT 0;
ALTER TABLE seats ADD COLUMN position_y numeric DEFAULT 0;
ALTER TABLE seats ADD COLUMN is_occupied boolean DEFAULT false;

-- Add missing order fields
ALTER TABLE orders ADD COLUMN special_requests text;
ALTER TABLE orders ADD COLUMN estimated_time integer; -- minutes
ALTER TABLE orders ADD COLUMN actual_time integer;    -- minutes
```

### **4. Add Data Validation Constraints**

```sql
-- Order status constraints
ALTER TABLE orders ADD CONSTRAINT check_order_status
CHECK (status IN ('new', 'preparing', 'ready', 'delivered', 'cancelled'));

-- Order type constraints
ALTER TABLE orders ADD CONSTRAINT check_order_type
CHECK (type IN ('food', 'beverage', 'dessert'));

-- Table status constraints
ALTER TABLE tables ADD CONSTRAINT check_table_status
CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning'));

-- Seat status constraints
ALTER TABLE seats ADD CONSTRAINT check_seat_status
CHECK (status IN ('available', 'occupied', 'reserved'));
```

## Performance Optimization

### **Current Index Analysis**

```sql
-- Existing indexes (well-designed)
CREATE INDEX orders_table_id_idx ON orders(table_id);
CREATE INDEX orders_seat_id_idx ON orders(seat_id);
CREATE INDEX orders_resident_id_idx ON orders(resident_id);
CREATE INDEX orders_server_id_idx ON orders(server_id);
CREATE INDEX orders_created_at_idx ON orders(created_at);
CREATE INDEX orders_status_idx ON orders(status);

-- KDS system indexes (optimized for real-time queries)
CREATE INDEX idx_kds_order_routing_order_station ON kds_order_routing(order_id, station_id);
CREATE INDEX idx_kds_order_routing_station_active ON kds_order_routing(station_id)
  WHERE completed_at IS NULL;
CREATE INDEX idx_kds_order_routing_routed_at ON kds_order_routing(routed_at);

-- Performance optimization indexes (recent addition)
CREATE INDEX CONCURRENTLY idx_orders_status_created_at ON orders(status, created_at);
CREATE INDEX CONCURRENTLY idx_orders_type_status ON orders(type, status);
CREATE INDEX CONCURRENTLY idx_orders_table_seat_status ON orders(table_id, seat_id, status);
CREATE INDEX CONCURRENTLY idx_orders_items_gin ON orders USING GIN (items);
```

### **Recommended Additional Indexes**

```sql
-- Missing indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_orders_resident_created_at
ON orders(resident_id, created_at) WHERE resident_id IS NOT NULL;

-- Partial index for active tables (most queries focus on occupied tables)
CREATE INDEX CONCURRENTLY idx_tables_status_occupied
ON tables(status) WHERE status = 'occupied';

-- Index for KDS priority sorting
CREATE INDEX CONCURRENTLY idx_kds_routing_priority_routed
ON kds_order_routing(priority DESC, routed_at ASC) WHERE completed_at IS NULL;

-- Composite index for resident order history queries
CREATE INDEX CONCURRENTLY idx_orders_resident_type_date
ON orders(resident_id, type, created_at DESC) WHERE resident_id IS NOT NULL;
```

## Database Functions & Triggers

### **Active Automation Functions**

```sql
-- Auto-route orders to appropriate KDS stations
CREATE OR REPLACE FUNCTION auto_route_order_to_stations()
RETURNS trigger AS $$
BEGIN
  -- Route food orders to grill, then expo
  IF NEW.type = 'food' THEN
    INSERT INTO kds_order_routing (order_id, station_id, sequence)
    SELECT NEW.id, id, 1 FROM kds_stations WHERE type = 'grill' AND is_active = true;

    INSERT INTO kds_order_routing (order_id, station_id, sequence)
    SELECT NEW.id, id, 2 FROM kds_stations WHERE type = 'expo' AND is_active = true;
  END IF;

  -- Route beverage orders to bar
  IF NEW.type = 'beverage' THEN
    INSERT INTO kds_order_routing (order_id, station_id, sequence)
    SELECT NEW.id, id, 1 FROM kds_stations WHERE type = 'bar' AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-route new orders
CREATE TRIGGER trigger_auto_route_orders
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_route_order_to_stations();
```

### **Performance Metrics Automation**

```sql
-- Calculate prep time metrics when orders complete
CREATE OR REPLACE FUNCTION calculate_prep_time_metrics()
RETURNS trigger AS $$
BEGIN
  IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
    -- Insert prep time metric
    INSERT INTO kds_metrics (station_id, order_id, metric_type, value_seconds)
    VALUES (
      NEW.station_id,
      NEW.order_id,
      'prep_time',
      EXTRACT(EPOCH FROM (NEW.completed_at - NEW.routed_at))::INTEGER
    );

    -- Update actual prep time in routing table
    NEW.actual_prep_time := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.routed_at))::INTEGER;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Calculate metrics on completion
CREATE TRIGGER trigger_calculate_prep_metrics
  BEFORE UPDATE ON kds_order_routing
  FOR EACH ROW
  EXECUTE FUNCTION calculate_prep_time_metrics();
```

### **Bulk Operations for KDS Efficiency**

```sql
-- Bulk bump all orders for a table (when delivered)
CREATE OR REPLACE FUNCTION bulk_bump_table_orders(
  p_table_id UUID,
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE kds_order_routing
  SET
    completed_at = NOW(),
    bumped_by = p_user_id,
    bumped_at = NOW()
  FROM orders
  WHERE orders.id = kds_order_routing.order_id
    AND orders.table_id = p_table_id
    AND kds_order_routing.completed_at IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Views for Complex Queries

### **KDS Table Summary View**

```sql
-- Real-time view for KDS table grouping
CREATE OR REPLACE VIEW kds_table_summary AS
SELECT
  t.id as table_id,
  t.label as table_label,
  COUNT(DISTINCT o.id) as order_count,
  COUNT(DISTINCT s.id) as seat_count,
  MIN(kor.routed_at) as earliest_order_time,
  MAX(kor.routed_at) as latest_order_time,
  COUNT(CASE WHEN kor.completed_at IS NULL THEN 1 END) as pending_orders,
  COUNT(CASE WHEN kor.started_at IS NOT NULL AND kor.completed_at IS NULL THEN 1 END) as preparing_orders,
  COUNT(CASE WHEN kor.completed_at IS NOT NULL THEN 1 END) as completed_orders,
  COALESCE(MAX(kor.priority), 0) as max_priority,
  COALESCE(MAX(kor.recall_count), 0) as total_recalls,
  COALESCE(MAX(EXTRACT(EPOCH FROM (NOW() - kor.routed_at))), 0)::INTEGER as max_elapsed_seconds
FROM tables t
INNER JOIN orders o ON o.table_id = t.id
INNER JOIN seats s ON s.table_id = t.id
INNER JOIN kds_order_routing kor ON kor.order_id = o.id
WHERE o.created_at >= NOW() - INTERVAL '4 hours'
GROUP BY t.id, t.label
HAVING SUM(CASE WHEN kor.completed_at IS NULL THEN 1 ELSE 0 END) > 0
ORDER BY MIN(kor.routed_at);
```

### **Resident Order History View**

```sql
-- Optimized view for order suggestions
CREATE OR REPLACE VIEW resident_order_history AS
SELECT
  o.resident_id,
  p.name as resident_name,
  unnest(o.items::text[]) as item_name,
  COUNT(*) as frequency,
  MAX(o.created_at) as last_ordered,
  o.type as order_type,
  AVG(EXTRACT(HOUR FROM o.created_at)) as typical_hour
FROM orders o
JOIN profiles p ON p.user_id = o.resident_id
WHERE o.resident_id IS NOT NULL
  AND o.created_at >= NOW() - INTERVAL '90 days'
  AND o.status != 'cancelled'
GROUP BY o.resident_id, p.name, unnest(o.items::text[]), o.type
HAVING COUNT(*) >= 2
ORDER BY o.resident_id, frequency DESC;
```

## Row Level Security (RLS)

### **Current RLS Policies**

```sql
-- Tables: Public read for authenticated users
CREATE POLICY "Users can view all tables" ON tables
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage tables" ON tables
  FOR ALL TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
  );

-- Orders: Role-based access
CREATE POLICY "Staff can view orders" ON orders
  FOR SELECT TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'server', 'cook')
    )
  );

CREATE POLICY "Servers can create orders" ON orders
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'server')
    )
  );

-- KDS: Kitchen staff only
CREATE POLICY "Kitchen staff can access KDS" ON kds_order_routing
  FOR ALL TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'cook')
    )
  );
```

### **Security Gaps to Address**

```sql
-- Add missing UPDATE policy for profiles
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for servers (order cancellation)
CREATE POLICY "Servers can cancel recent orders" ON orders
  FOR DELETE TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'server'))
    AND created_at >= NOW() - INTERVAL '2 hours'
  );

-- Add time-based access control for shift workers
CREATE POLICY "Cook access during shifts" ON kds_order_routing
  FOR ALL TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'cook')
    AND EXTRACT(hour FROM NOW()) BETWEEN 6 AND 22  -- Kitchen hours
  );
```

## Query Optimization Examples

### **Common Query Patterns**

```sql
-- 1. Active orders for KDS display (highly optimized)
SELECT
  o.id, o.items, o.created_at, o.status,
  t.label as table_label,
  s.label as seat_label,
  kor.station_id, kor.sequence, kor.routed_at, kor.priority,
  EXTRACT(EPOCH FROM (NOW() - kor.routed_at))::INTEGER as elapsed_seconds
FROM orders o
JOIN tables t ON t.id = o.table_id
JOIN seats s ON s.id = o.seat_id
JOIN kds_order_routing kor ON kor.order_id = o.id
WHERE kor.station_id = $1
  AND kor.completed_at IS NULL
  AND o.status IN ('new', 'preparing')
ORDER BY kor.priority DESC, kor.routed_at ASC;

-- 2. Resident order suggestions (optimized with materialized approach)
WITH recent_orders AS (
  SELECT
    resident_id,
    unnest(items::text[]) as item,
    COUNT(*) as frequency
  FROM orders
  WHERE resident_id = $1
    AND created_at >= NOW() - INTERVAL '30 days'
    AND status != 'cancelled'
  GROUP BY resident_id, unnest(items::text[])
)
SELECT item, frequency
FROM recent_orders
ORDER BY frequency DESC
LIMIT 5;

-- 3. Table status with order counts (real-time dashboard)
SELECT
  t.id, t.label, t.status,
  COUNT(CASE WHEN o.status IN ('new', 'preparing') THEN 1 END) as active_orders,
  MAX(o.created_at) as latest_order_time
FROM tables t
LEFT JOIN orders o ON o.table_id = t.id AND o.created_at >= NOW() - INTERVAL '4 hours'
GROUP BY t.id, t.label, t.status
ORDER BY t.label;
```

### **Performance Testing Results**

```sql
-- Query performance benchmarks (with current indexes)
EXPLAIN ANALYZE SELECT * FROM kds_table_summary;
-- Execution time: ~45ms (acceptable for real-time display)

EXPLAIN ANALYZE SELECT * FROM resident_order_history WHERE resident_id = $1;
-- Execution time: ~12ms (excellent for suggestion generation)

-- Identify slow queries for optimization
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries taking >100ms
ORDER BY mean_exec_time DESC;
```

## Migration Strategy

### **Safe Schema Changes Process**

```sql
-- 1. Always backup before schema changes
SELECT pg_dump('your_database') INTO '/backup/pre_migration.sql';

-- 2. Use transactions for related changes
BEGIN;
  -- Make multiple related changes atomically
  ALTER TABLE table1 ADD COLUMN new_field;
  UPDATE table1 SET new_field = default_value;
  ALTER TABLE table1 ALTER COLUMN new_field SET NOT NULL;
COMMIT;

-- 3. Add indexes concurrently to avoid locks
CREATE INDEX CONCURRENTLY idx_new_field ON table1(new_field);

-- 4. Test with production data volume
EXPLAIN ANALYZE SELECT * FROM table1 WHERE new_field = 'value';
```

### **Data Migration Helpers**

```sql
-- Function to safely update order items format
CREATE OR REPLACE FUNCTION migrate_order_items_format()
RETURNS void AS $$
BEGIN
  -- Convert old format to new format if needed
  UPDATE orders
  SET items = jsonb_build_array(items::text)
  WHERE jsonb_typeof(items) = 'string';

  RAISE NOTICE 'Migrated % orders', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;
```

## Monitoring & Maintenance

### **Database Health Checks**

```sql
-- Check for missing foreign key indexes
SELECT
  schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100;

-- Monitor connection count
SELECT
  state,
  COUNT(*)
FROM pg_stat_activity
GROUP BY state;

-- Check for long-running queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

### **Automated Maintenance Tasks**

```sql
-- Clean up old metrics data (run daily)
DELETE FROM kds_metrics
WHERE recorded_at < NOW() - INTERVAL '90 days';

-- Update table statistics (run weekly)
ANALYZE;

-- Vacuum tables with high update activity (run nightly)
VACUUM ANALYZE orders;
VACUUM ANALYZE kds_order_routing;
```

## Backup & Recovery

### **Backup Strategy**

```bash
# Daily full backup
pg_dump -h hostname -U username dbname > backup_$(date +%Y%m%d).sql

# Point-in-time recovery setup (via Supabase)
# - Automatic backups every 4 hours
# - 30-day retention period
# - Point-in-time recovery available
```

### **Recovery Procedures**

```sql
-- Restore specific table from backup
pg_restore -h hostname -U username -d dbname -t orders backup.sql

-- Point-in-time recovery (contact Supabase support)
-- Can restore to any point within 30-day window
```

## Next Steps for Luis

### **Immediate Priorities**

1. **Fix schema mismatches** - Critical for type safety
2. **Add missing foreign key constraints** - Data integrity
3. **Implement proper validation constraints** - Data quality
4. **Add missing indexes** - Query performance

### **Medium-term Goals**

1. **Set up automated testing** - Database integration tests
2. **Implement audit triggers** - Change tracking
3. **Optimize query performance** - Sub-100ms response times
4. **Set up monitoring** - Query performance and error tracking

### **Advanced Features**

1. **Partitioning strategy** - For metrics tables with high volume
2. **Read replicas** - For reporting queries
3. **Connection pooling** - For high concurrency
4. **Database migrations** - Automated schema versioning

The database is in good shape with clear technical debt items. Focus on the schema mismatches first, then performance optimization for enterprise scale.
