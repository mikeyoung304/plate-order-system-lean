-- Performance Optimization Indexes Migration
-- 
-- This migration adds comprehensive indexes to optimize database performance
-- for the Plate Restaurant System to handle 1000+ concurrent users.
-- 
-- Performance targets:
-- - Query response times < 50ms for 95% of requests
-- - Index-optimized queries for real-time operations
-- - Efficient filtering and sorting on key fields

-- Orders table optimization
-- High-frequency queries: status filtering, table/resident lookups, time-based sorting
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id) WHERE table_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_resident_id ON public.orders(resident_id) WHERE resident_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_server_id ON public.orders(server_id) WHERE server_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_routed_at_desc ON public.orders(routed_at DESC) WHERE routed_at IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON public.orders(table_id, status) WHERE table_id IS NOT NULL AND status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_resident_status ON public.orders(resident_id, status) WHERE resident_id IS NOT NULL AND status IS NOT NULL;

-- KDS routing table optimization
-- High-frequency queries: station filtering, status updates, time-based operations
CREATE INDEX IF NOT EXISTS idx_kds_routing_station_type ON public.kds_order_routing(station_type) WHERE station_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kds_routing_order_id ON public.kds_order_routing(order_id);
CREATE INDEX IF NOT EXISTS idx_kds_routing_routed_at_desc ON public.kds_order_routing(routed_at DESC) WHERE routed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kds_routing_started_at ON public.kds_order_routing(started_at) WHERE started_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kds_routing_completed_at ON public.kds_order_routing(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kds_routing_bumped_at ON public.kds_order_routing(bumped_at) WHERE bumped_at IS NOT NULL;

-- Composite indexes for KDS operations
CREATE INDEX IF NOT EXISTS idx_kds_routing_station_routed_at ON public.kds_order_routing(station_type, routed_at DESC) WHERE station_type IS NOT NULL AND routed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kds_routing_priority_routed_at ON public.kds_order_routing(priority DESC, routed_at DESC) WHERE priority IS NOT NULL AND routed_at IS NOT NULL;

-- Tables table optimization
-- High-frequency queries: floor plan filtering, status checks, position-based queries
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tables_floor_plan_id ON public.tables(floor_plan_id) WHERE floor_plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tables_table_id_unique ON public.tables(table_id) WHERE table_id IS NOT NULL;

-- Spatial index for table positions (for floor plan rendering)
CREATE INDEX IF NOT EXISTS idx_tables_position ON public.tables(x, y) WHERE x IS NOT NULL AND y IS NOT NULL;

-- Seats table optimization
-- High-frequency queries: table-based lookups, resident associations
CREATE INDEX IF NOT EXISTS idx_seats_table_id ON public.seats(table_id) WHERE table_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seats_resident_id ON public.seats(resident_id) WHERE resident_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seats_seat_id_unique ON public.seats(seat_id) WHERE seat_id IS NOT NULL;

-- Composite index for seat-resident queries
CREATE INDEX IF NOT EXISTS idx_seats_table_resident ON public.seats(table_id, resident_id) WHERE table_id IS NOT NULL;

-- Profiles table optimization
-- High-frequency queries: role-based filtering, user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at_desc ON public.profiles(created_at DESC);

-- User roles table optimization (if exists)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON public.user_roles(role_name) WHERE role_name IS NOT NULL;

-- Order suggestions optimization
-- Indexes for suggestion algorithm performance
CREATE INDEX IF NOT EXISTS idx_orders_resident_items ON public.orders(resident_id, (items::text)) WHERE resident_id IS NOT NULL AND items IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at_resident ON public.orders(created_at DESC, resident_id) WHERE resident_id IS NOT NULL;

-- Text search optimization for order items
-- GIN index for fast text search in order items (jsonb array)
CREATE INDEX IF NOT EXISTS idx_orders_items_gin ON public.orders USING gin (items) WHERE items IS NOT NULL;

-- Real-time subscription optimization
-- Indexes to support efficient real-time change notifications
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON public.orders(updated_at DESC) WHERE updated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kds_routing_updated_at ON public.kds_order_routing(updated_at DESC) WHERE updated_at IS NOT NULL;

-- Analytics and reporting optimization
-- Indexes for metrics and dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_created_date ON public.orders(DATE(created_at)) WHERE created_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_completed_date ON public.orders(DATE(completed_at)) WHERE completed_at IS NOT NULL;

-- Performance monitoring views
-- Create materialized view for order metrics (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS order_metrics_hourly AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    status,
    COUNT(*) as order_count,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as avg_completion_minutes,
    MAX(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as max_completion_minutes
FROM public.orders 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at), status;

-- Index for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_metrics_hourly_hour_status ON order_metrics_hourly(hour, status);

-- Station performance view
CREATE MATERIALIZED VIEW IF NOT EXISTS station_metrics_hourly AS
SELECT 
    DATE_TRUNC('hour', routed_at) as hour,
    station_type,
    COUNT(*) as routed_count,
    COUNT(started_at) as started_count,
    COUNT(completed_at) as completed_count,
    AVG(EXTRACT(EPOCH FROM (started_at - routed_at))/60) as avg_start_delay_minutes,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_prep_time_minutes
FROM public.kds_order_routing 
WHERE routed_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', routed_at), station_type;

-- Index for station metrics view
CREATE UNIQUE INDEX IF NOT EXISTS idx_station_metrics_hourly_hour_station ON station_metrics_hourly(hour, station_type);

-- Function to refresh materialized views (called by cron or manually)
CREATE OR REPLACE FUNCTION refresh_performance_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY order_metrics_hourly;
    REFRESH MATERIALIZED VIEW CONCURRENTLY station_metrics_hourly;
END;
$$;

-- Analyze tables to update statistics for query planner
ANALYZE public.orders;
ANALYZE public.kds_order_routing;
ANALYZE public.tables;
ANALYZE public.seats;
ANALYZE public.profiles;

-- Add comments for documentation
COMMENT ON INDEX idx_orders_status IS 'Index for fast order status filtering in KDS views';
COMMENT ON INDEX idx_orders_table_status IS 'Composite index for table-specific order queries';
COMMENT ON INDEX idx_kds_routing_station_routed_at IS 'Composite index for station-specific KDS queries with time ordering';
COMMENT ON INDEX idx_orders_items_gin IS 'GIN index for fast text search within order items array';
COMMENT ON MATERIALIZED VIEW order_metrics_hourly IS 'Hourly aggregated order metrics for dashboard performance';
COMMENT ON MATERIALIZED VIEW station_metrics_hourly IS 'Hourly aggregated station performance metrics';

-- Performance tuning settings (if not already set)
-- These would typically be set at the database level, included here for reference
/*
SET shared_preload_libraries = 'pg_stat_statements';
SET track_activity_query_size = 2048;
SET track_counts = on;
SET track_functions = 'all';
SET track_io_timing = on;
SET log_statement = 'mod';
SET log_min_duration_statement = 1000;
*/

-- Create a function to check index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE(
    table_name text,
    index_name text,
    index_scans bigint,
    tuples_read bigint,
    tuples_fetched bigint
)
LANGUAGE sql
AS $$
    SELECT 
        schemaname||'.'||tablename as table_name,
        indexrelname as index_name,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes 
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC;
$$;

-- Create a function to identify slow queries
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE(
    query text,
    calls bigint,
    total_time numeric,
    mean_time numeric,
    rows bigint
)
LANGUAGE sql
AS $$
    SELECT 
        query,
        calls,
        total_exec_time as total_time,
        mean_exec_time as mean_time,
        rows
    FROM pg_stat_statements 
    WHERE query LIKE '%orders%' OR query LIKE '%kds%' OR query LIKE '%tables%'
    ORDER BY mean_exec_time DESC
    LIMIT 20;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION refresh_performance_metrics() TO authenticated;
GRANT SELECT ON order_metrics_hourly TO authenticated;
GRANT SELECT ON station_metrics_hourly TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_usage_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_slow_queries() TO authenticated;