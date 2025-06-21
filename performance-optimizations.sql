-- =============================================
-- KDS Performance Optimization Indexes
-- Target: <50ms query performance
-- =============================================

-- 1. Primary index for active orders query optimization
-- This is the most critical index for fetchAllActiveOrders performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_active_orders 
ON kds_order_routing (station_id, completed_at, priority DESC, routed_at ASC) 
WHERE completed_at IS NULL;

-- 2. Index for table grouping operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_table_grouping
ON kds_order_routing (order_id, routed_at)
WHERE completed_at IS NULL;

-- 3. Optimize order lookups by table and seat
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_table_seat
ON orders (table_id, seat_id, created_at);

-- 4. Active stations index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_stations_active
ON kds_stations (is_active, position)
WHERE is_active = true;

-- 5. High priority orders for urgent processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_high_priority
ON kds_order_routing (routed_at)
WHERE completed_at IS NULL AND priority >= 8;

-- 6. Overdue orders detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_overdue
ON kds_order_routing (routed_at)
WHERE completed_at IS NULL AND routed_at < NOW() - INTERVAL '10 minutes';

-- 7. Order completion tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_completed
ON kds_order_routing (completed_at, bumped_at)
WHERE completed_at IS NOT NULL;

-- 8. Station performance metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_station_metrics
ON kds_order_routing (station_id, routed_at, completed_at);

-- =============================================
-- Optimized Table Groups Function
-- =============================================

CREATE OR REPLACE FUNCTION get_table_groups_optimized()
RETURNS TABLE (
  table_id uuid,
  table_label text,
  order_count bigint,
  total_items bigint,
  earliest_order_time timestamptz,
  latest_order_time timestamptz,
  max_priority integer,
  has_overdue_orders boolean,
  overall_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.table_id,
    t.label as table_label,
    COUNT(kor.id) as order_count,
    COALESCE(SUM(array_length(o.items, 1)), 0) as total_items,
    MIN(kor.routed_at) as earliest_order_time,
    MAX(kor.routed_at) as latest_order_time,
    COALESCE(MAX(kor.priority), 0) as max_priority,
    BOOL_OR(kor.routed_at < NOW() - INTERVAL '10 minutes') as has_overdue_orders,
    CASE 
      WHEN COUNT(*) FILTER (WHERE kor.completed_at IS NOT NULL) = COUNT(*) THEN 'ready'
      WHEN COUNT(*) FILTER (WHERE kor.started_at IS NOT NULL) = COUNT(*) THEN 'preparing'
      WHEN COUNT(*) FILTER (WHERE kor.started_at IS NULL AND kor.completed_at IS NULL) = COUNT(*) THEN 'new'
      ELSE 'mixed'
    END as overall_status
  FROM kds_order_routing kor
  JOIN orders o ON kor.order_id = o.id
  JOIN tables t ON o.table_id = t.id
  WHERE kor.completed_at IS NULL
  GROUP BY o.table_id, t.label
  ORDER BY MIN(kor.routed_at);
END;
$$ LANGUAGE plpgsql;

-- Update table statistics for optimal query planning
ANALYZE kds_order_routing;
ANALYZE orders;
ANALYZE tables;
ANALYZE kds_stations;

-- Optional: Create a compound index for the most common query pattern
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_compound_performance
ON kds_order_routing (completed_at, priority DESC, routed_at ASC, station_id)
WHERE completed_at IS NULL;