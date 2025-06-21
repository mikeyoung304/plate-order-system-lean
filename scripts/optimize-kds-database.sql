-- KDS Database Optimization Script
-- Indexes and optimizations for <50ms query performance

BEGIN;

-- ============================================
-- INDEX OPTIMIZATIONS FOR KDS TABLES
-- ============================================

-- KDS Order Routing Indexes (Most Critical)
-- This table is queried most frequently for active orders

-- Primary index for fetching active orders by station
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_order_routing_station_active 
ON kds_order_routing (station_id, completed_at) 
WHERE completed_at IS NULL;

-- Index for fetching all active orders (main KDS view)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_order_routing_active_routed 
ON kds_order_routing (completed_at, routed_at) 
WHERE completed_at IS NULL;

-- Composite index for order completion tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_order_routing_order_station 
ON kds_order_routing (order_id, station_id, completed_at);

-- Index for priority-based sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_order_routing_priority 
ON kds_order_routing (priority DESC, routed_at ASC) 
WHERE completed_at IS NULL;

-- KDS Stations Indexes
-- Index for active stations lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_stations_active_position 
ON kds_stations (is_active, position) 
WHERE is_active = true;

-- Orders Table Indexes (for KDS joins)
-- Composite index for order details with table info
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_table_status_created 
ON orders (table_id, status, created_at);

-- Index for seat-based lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_seat_created 
ON orders (seat_id, created_at) 
WHERE seat_id IS NOT NULL;

-- Tables and Seats Indexes (for joins)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_label 
ON tables (label) 
WHERE label IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seats_label 
ON seats (label) 
WHERE label IS NOT NULL;

-- ============================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================

-- Update table statistics for better query planning
ANALYZE kds_order_routing;
ANALYZE kds_stations;
ANALYZE orders;
ANALYZE tables;
ANALYZE seats;

-- ============================================
-- STORED PROCEDURES FOR OPTIMIZED KDS QUERIES
-- ============================================

-- Optimized function to get active orders for a station
CREATE OR REPLACE FUNCTION get_station_orders_optimized(p_station_id UUID)
RETURNS TABLE (
  routing_id UUID,
  order_id UUID,
  station_id UUID,
  order_items JSONB,
  order_status TEXT,
  order_type TEXT,
  created_at TIMESTAMPTZ,
  routed_at TIMESTAMPTZ,
  priority INTEGER,
  notes TEXT,
  table_label TEXT,
  seat_label TEXT,
  station_name TEXT,
  station_type TEXT,
  station_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kor.id as routing_id,
    kor.order_id,
    kor.station_id,
    o.items as order_items,
    o.status as order_status,
    o.type as order_type,
    o.created_at,
    kor.routed_at,
    kor.priority,
    kor.notes,
    t.label as table_label,
    s.label as seat_label,
    ks.name as station_name,
    ks.type as station_type,
    ks.color as station_color
  FROM kds_order_routing kor
  INNER JOIN orders o ON kor.order_id = o.id
  LEFT JOIN tables t ON o.table_id = t.id
  LEFT JOIN seats s ON o.seat_id = s.id
  INNER JOIN kds_stations ks ON kor.station_id = ks.id
  WHERE kor.station_id = p_station_id 
    AND kor.completed_at IS NULL
  ORDER BY kor.priority DESC, kor.routed_at ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Optimized function to get all active orders
CREATE OR REPLACE FUNCTION get_all_active_orders_optimized()
RETURNS TABLE (
  routing_id UUID,
  order_id UUID,
  station_id UUID,
  order_items JSONB,
  order_status TEXT,
  order_type TEXT,
  created_at TIMESTAMPTZ,
  routed_at TIMESTAMPTZ,
  priority INTEGER,
  notes TEXT,
  table_label TEXT,
  seat_label TEXT,
  station_name TEXT,
  station_type TEXT,
  station_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kor.id as routing_id,
    kor.order_id,
    kor.station_id,
    o.items as order_items,
    o.status as order_status,
    o.type as order_type,
    o.created_at,
    kor.routed_at,
    kor.priority,
    kor.notes,
    t.label as table_label,
    s.label as seat_label,
    ks.name as station_name,
    ks.type as station_type,
    ks.color as station_color
  FROM kds_order_routing kor
  INNER JOIN orders o ON kor.order_id = o.id
  LEFT JOIN tables t ON o.table_id = t.id
  LEFT JOIN seats s ON o.seat_id = s.id
  INNER JOIN kds_stations ks ON kor.station_id = ks.id
  WHERE kor.completed_at IS NULL
  ORDER BY kor.priority DESC, kor.routed_at ASC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Optimized function for table-grouped orders
CREATE OR REPLACE FUNCTION get_table_grouped_orders_optimized()
RETURNS TABLE (
  table_id UUID,
  table_label TEXT,
  order_count BIGINT,
  earliest_order TIMESTAMPTZ,
  latest_order TIMESTAMPTZ,
  stations UUID[],
  avg_priority NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.table_id,
    t.label as table_label,
    COUNT(*) as order_count,
    MIN(o.created_at) as earliest_order,
    MAX(o.created_at) as latest_order,
    array_agg(DISTINCT kor.station_id) as stations,
    AVG(kor.priority) as avg_priority
  FROM orders o
  INNER JOIN kds_order_routing kor ON o.id = kor.order_id
  LEFT JOIN tables t ON o.table_id = t.id
  WHERE kor.completed_at IS NULL
    AND o.table_id IS NOT NULL
  GROUP BY o.table_id, t.label
  ORDER BY earliest_order ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Bulk bump orders for a table (optimized)
CREATE OR REPLACE FUNCTION bulk_bump_table_orders_optimized(
  p_table_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE kds_order_routing 
  SET 
    completed_at = NOW(),
    bumped_by = p_user_id,
    bumped_at = NOW()
  FROM orders o
  WHERE kds_order_routing.order_id = o.id
    AND o.table_id = p_table_id
    AND kds_order_routing.completed_at IS NULL;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MATERIALIZED VIEW FOR HEAVY AGGREGATIONS
-- ============================================

-- Materialized view for station metrics (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS kds_station_metrics AS
SELECT 
  ks.id as station_id,
  ks.name as station_name,
  ks.type as station_type,
  COUNT(kor.id) as active_orders,
  AVG(kor.priority) as avg_priority,
  MIN(kor.routed_at) as oldest_order,
  MAX(kor.routed_at) as newest_order,
  COUNT(CASE WHEN kor.priority > 5 THEN 1 END) as high_priority_orders
FROM kds_stations ks
LEFT JOIN kds_order_routing kor ON ks.id = kor.station_id 
  AND kor.completed_at IS NULL
WHERE ks.is_active = true
GROUP BY ks.id, ks.name, ks.type;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_kds_station_metrics_station 
ON kds_station_metrics (station_id);

-- Function to refresh station metrics
CREATE OR REPLACE FUNCTION refresh_kds_station_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY kds_station_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================

-- View for monitoring query performance
CREATE OR REPLACE VIEW kds_performance_stats AS
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  CASE 
    WHEN (seq_scan + COALESCE(idx_scan, 0)) > 0 
    THEN ROUND((seq_scan::NUMERIC / (seq_scan + COALESCE(idx_scan, 0))) * 100, 2)
    ELSE 0 
  END as seq_scan_pct
FROM pg_stat_user_tables 
WHERE tablename IN ('kds_order_routing', 'kds_stations', 'orders', 'tables', 'seats')
ORDER BY seq_scan_pct DESC;

-- ============================================
-- CLEANUP AND MAINTENANCE
-- ============================================

-- Function for cleaning up old completed orders (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_kds_orders(hours_old INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM kds_order_routing 
  WHERE completed_at IS NOT NULL 
    AND completed_at < NOW() - INTERVAL '1 hour' * hours_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================
-- RECOMMENDED CONFIGURATION SETTINGS
-- ============================================

/*
For optimal performance, consider these PostgreSQL configuration changes:

# Memory settings
shared_buffers = 256MB                    # 25% of RAM for dedicated DB server
work_mem = 4MB                           # Per-query memory for sorting/hashing
maintenance_work_mem = 64MB              # Memory for maintenance operations

# Query planner settings
random_page_cost = 1.1                   # SSD-optimized (default 4.0 for HDD)
effective_cache_size = 1GB               # Available memory for caching

# Logging for performance monitoring
log_min_duration_statement = 250         # Log queries taking >250ms
log_statement_stats = on                 # Log statement performance stats

# Connection settings
max_connections = 100                    # Adjust based on connection pooling
*/