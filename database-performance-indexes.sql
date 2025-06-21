-- ===============================================
-- CRITICAL KDS PERFORMANCE INDEXES
-- Expected improvement: 40-60ms reduction per query
-- ===============================================

-- 1. ULTRA-FAST KDS ORDER ROUTING INDEX
-- Optimizes the most frequent query: active orders by priority and time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_active_performance
ON kds_order_routing (completed_at, station_id, priority DESC, routed_at ASC)
WHERE completed_at IS NULL;

-- 2. STATION-SPECIFIC ACTIVE ORDERS INDEX  
-- Optimizes station-specific queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_station_active
ON kds_order_routing (station_id, completed_at, routed_at ASC)
WHERE completed_at IS NULL;

-- 3. ORDER COMPLETION TRACKING INDEX
-- Optimizes completion time calculations and bumping operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_completion_tracking
ON kds_order_routing (order_id, completed_at, bumped_at);

-- 4. PRIORITY QUEUE INDEX
-- Ultra-fast priority-based ordering for critical orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_priority_queue
ON kds_order_routing (priority DESC, routed_at ASC)
WHERE completed_at IS NULL AND priority > 0;

-- 5. TABLE GROUPING OPTIMIZATION INDEX
-- Optimizes table-based grouping queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_table_grouping
ON orders (table_id, seat_id, created_at DESC, status)
WHERE status = 'active';

-- 6. REAL-TIME SUBSCRIPTION INDEX
-- Optimizes real-time update queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_realtime
ON kds_order_routing (updated_at DESC, id)
WHERE completed_at IS NULL;

-- 7. RECALL TRACKING INDEX
-- Optimizes recall operations and tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_recalls
ON kds_order_routing (recall_count, recalled_at DESC)
WHERE recall_count > 0;

-- 8. STATION LOOKUP INDEX
-- Ultra-fast station metadata retrieval
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_stations_active_lookup
ON kds_stations (is_active, position ASC, id)
WHERE is_active = true;

-- ===============================================
-- PARTIAL INDEXES FOR EXTREME PERFORMANCE
-- ===============================================

-- 9. NEW ORDERS ONLY INDEX (most frequent filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_new_orders
ON kds_order_routing (routed_at ASC, station_id)
WHERE completed_at IS NULL AND started_at IS NULL;

-- 10. PREPARING ORDERS INDEX
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_preparing
ON kds_order_routing (started_at DESC, station_id)
WHERE completed_at IS NULL AND started_at IS NOT NULL;

-- 11. OVERDUE ORDERS INDEX (critical for alerts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_overdue
ON kds_order_routing (routed_at ASC, station_id)
WHERE completed_at IS NULL AND routed_at < (NOW() - INTERVAL '10 minutes');

-- ===============================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ===============================================

-- 12. TABLE-SEAT-STATUS COMPOSITE INDEX
-- Optimizes the complex table grouping queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_table_seat_status
ON orders (table_id, seat_id, status, created_at DESC);

-- 13. KDS ROUTING FOREIGN KEY OPTIMIZATION
-- Speeds up joins between orders and routing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_order_join
ON kds_order_routing (order_id, station_id, completed_at);

-- ===============================================
-- ANALYZE TABLES FOR OPTIMAL QUERY PLANNING
-- ===============================================

ANALYZE kds_order_routing;
ANALYZE orders;
ANALYZE kds_stations;
ANALYZE tables;
ANALYZE seats;

-- ===============================================
-- EXPECTED PERFORMANCE IMPROVEMENTS
-- ===============================================

/*
BEFORE INDEXES:
- fetchAllActiveOrders: 325ms-1591ms
- fetchStationOrders: 280ms-450ms
- Table grouping queries: 400ms-800ms

AFTER INDEXES (ESTIMATED):
- fetchAllActiveOrders: 80ms-120ms (70-85% improvement)
- fetchStationOrders: 60ms-90ms (75-80% improvement)  
- Table grouping queries: 100ms-200ms (75% improvement)

TOTAL EXPECTED IMPROVEMENT: 40-60ms reduction per query
ENABLES TARGET: <150ms response times (significant improvement toward <50ms goal)
*/