-- Targeted Performance Optimization Indexes - FINAL VERSION
-- Fixed PostgreSQL system catalog column names
-- Based on actual schema: tables(id, label, type, status), seats(id, table_id, label, status), 
-- orders(id, table_id, seat_id, resident_id, server_id, items, transcript, status, type, created_at)
-- profiles(id, user_id, role, name)

-- Performance targets:
-- - Query response times < 50ms for 95% of requests  
-- - Index-optimized queries for real-time operations
-- - Efficient filtering and sorting on key fields

-- Orders table optimization (172 rows - high priority)
-- High-frequency queries: status filtering, table/resident lookups, time-based sorting
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id) WHERE table_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_resident_id ON public.orders(resident_id) WHERE resident_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_server_id ON public.orders(server_id) WHERE server_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_type ON public.orders(type) WHERE type IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON public.orders(table_id, status) WHERE table_id IS NOT NULL AND status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_resident_status ON public.orders(resident_id, status) WHERE resident_id IS NOT NULL AND status IS NOT NULL;

-- Tables table optimization (8 rows)
-- High-frequency queries: status checks, type filtering
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tables_type ON public.tables(type) WHERE type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tables_label ON public.tables(label) WHERE label IS NOT NULL;

-- Seats table optimization (36 rows)  
-- High-frequency queries: table-based lookups
CREATE INDEX IF NOT EXISTS idx_seats_table_id ON public.seats(table_id) WHERE table_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seats_status ON public.seats(status) WHERE status IS NOT NULL;

-- Profiles table optimization (25 rows)
-- High-frequency queries: role-based filtering, user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id) WHERE user_id IS NOT NULL;

-- Order suggestions optimization - CORRECTED
-- Simple composite index + separate GIN index for JSONB search
CREATE INDEX IF NOT EXISTS idx_orders_resident_created ON public.orders(resident_id, created_at DESC) WHERE resident_id IS NOT NULL;

-- Text search optimization for order items - ENHANCED  
-- GIN index for fast JSONB search
CREATE INDEX IF NOT EXISTS idx_orders_items_gin ON public.orders USING gin (items) WHERE items IS NOT NULL;

-- Analytics and reporting optimization - CORRECTED
-- Use base timestamp index (query can filter with WHERE DATE(created_at) = ?)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_only ON public.orders(created_at) WHERE created_at IS NOT NULL;

-- Additional performance indexes for common queries
-- KDS real-time queries optimization
CREATE INDEX IF NOT EXISTS idx_orders_status_table_created ON public.orders(status, table_id, created_at DESC) 
    WHERE status IS NOT NULL AND table_id IS NOT NULL;

-- Server workflow optimization  
CREATE INDEX IF NOT EXISTS idx_orders_server_status_created ON public.orders(server_id, status, created_at DESC)
    WHERE server_id IS NOT NULL AND status IS NOT NULL;

-- Performance monitoring function - FIXED COLUMN NAMES
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    total_size text
)
LANGUAGE sql STABLE
AS $$
    SELECT 
        schemaname||'.'||relname as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY n_tup_ins - n_tup_del DESC;
$$;

-- Index usage monitoring function - FIXED COLUMN NAMES
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE(
    table_name text,
    index_name text,
    index_scans bigint,
    tuples_read bigint,
    tuples_fetched bigint
)
LANGUAGE sql STABLE
AS $$
    SELECT 
        schemaname||'.'||relname as table_name,
        indexrelname as index_name,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes 
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC;
$$;

-- Analyze tables to update statistics for query planner
ANALYZE public.orders;
ANALYZE public.tables;
ANALYZE public.seats;
ANALYZE public.profiles;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION get_table_sizes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_usage_stats() TO authenticated;

-- Add comments for documentation
COMMENT ON INDEX idx_orders_status IS 'Index for fast order status filtering in KDS views';
COMMENT ON INDEX idx_orders_table_status IS 'Composite index for table-specific order queries';
COMMENT ON INDEX idx_orders_items_gin IS 'GIN index for fast JSONB search within order items';
COMMENT ON INDEX idx_orders_status_table_created IS 'Triple composite index for KDS real-time queries';
COMMENT ON FUNCTION get_table_sizes IS 'Function to monitor table sizes and row counts';
COMMENT ON FUNCTION get_index_usage_stats IS 'Function to monitor index usage and effectiveness';