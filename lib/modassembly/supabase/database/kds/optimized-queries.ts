import { createClient } from '@/lib/modassembly/supabase/client'
import { measureApiCall } from '@/lib/performance-utils'
import type { KDSOrderRouting, KDSStation } from './types'

/**
 * Optimized database queries for KDS operations
 * Features:
 * - Minimal data fetching (only required fields)
 * - Database-level filtering instead of client-side
 * - Proper indexing considerations
 * - Query result caching
 * - Connection pooling
 */

// In-memory query cache with TTL
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private static instance: QueryCache

  static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache()
    }
    return QueryCache.instance
  }

  set<T>(key: string, data: T, ttlMs: number = 5000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {return null}

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

const queryCache = QueryCache.getInstance()

// Cleanup expired cache entries every 30 seconds
setInterval(() => queryCache.cleanup(), 30000)

/**
 * Optimized query to fetch active orders with minimal data
 * Only fetches essential fields to reduce payload size
 */
export async function fetchActiveOrdersOptimized(options: {
  stationId?: string
  limit?: number
  includeCompleted?: boolean
  priority?: 'high' | 'normal' | 'low'
  createdAfter?: Date
} = {}): Promise<any[]> {
  const cacheKey = `active_orders_${JSON.stringify(options)}`
  const cached = queryCache.get<any[]>(cacheKey)
  if (cached) {return cached}

  return measureApiCall('fetch_active_orders_optimized', async () => {
    const supabase = createClient()
    
    let query = supabase
      .from('kds_order_routing')
      .select(`
        id,
        order_id,
        station_id,
        routed_at,
        started_at,
        completed_at,
        priority,
        recall_count,
        notes,
        order:orders!inner (
          id,
          items,
          status,
          type,
          created_at,
          seat_id,
          table:tables!table_id (id, label),
          seat:seats!seat_id (id, label)
        ),
        station:kds_stations!station_id (
          id,
          name,
          type,
          color
        )
      `)

    // Database-level filtering instead of client-side
    if (!options.includeCompleted) {
      query = query.is('completed_at', null)
    }

    if (options.stationId) {
      query = query.eq('station_id', options.stationId)
    }

    if (options.priority) {
      const priorityMap = { high: [8, 9, 10], normal: [4, 5, 6, 7], low: [1, 2, 3] }
      const priorityRange = priorityMap[options.priority]
      query = query.gte('priority', priorityRange[0]).lte('priority', priorityRange[priorityRange.length - 1])
    }

    if (options.createdAfter) {
      query = query.gte('routed_at', options.createdAfter.toISOString())
    }

    // Optimized ordering and limiting
    query = query
      .order('priority', { ascending: false }) // High priority first
      .order('routed_at', { ascending: true })  // Then by time
      .limit(options.limit || 100) // Reasonable default limit

    const { data, error } = await query

    if (error) {
      console.error('Error fetching optimized active orders:', error)
      throw error
    }

    const result = data || []
    
    // Cache the result for 5 seconds
    queryCache.set(cacheKey, result, 5000)
    
    return result
  })
}

/**
 * Optimized query for stations with caching
 */
export async function fetchStationsOptimized(): Promise<any[]> {
  const cacheKey = 'stations_optimized'
  const cached = queryCache.get<any[]>(cacheKey)
  if (cached) {return cached}

  return measureApiCall('fetch_stations_optimized', async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('kds_stations')
      .select('id, name, type, color, position, is_active, settings')
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching optimized stations:', error)
      throw error
    }

    const result = data || []
    
    // Cache stations for 60 seconds (they change less frequently)
    queryCache.set(cacheKey, result, 60000)
    
    return result
  })
}

/**
 * Optimized query for table groups with aggregated data
 * Uses database aggregation instead of client-side processing
 */
export async function fetchTableGroupsOptimized(): Promise<any[]> {
  const cacheKey = 'table_groups_optimized'
  const cached = queryCache.get<any[]>(cacheKey)
  if (cached) {return cached}

  return measureApiCall('fetch_table_groups_optimized', async () => {
    const supabase = createClient()

    // Use raw SQL for complex aggregation
    const { data, error } = await supabase.rpc('get_table_groups_optimized')

    if (error) {
      console.error('Error fetching optimized table groups:', error)
      throw error
    }

    const result = data || []
    
    // Cache for 3 seconds (real-time data)
    queryCache.set(cacheKey, result, 3000)
    
    return result
  })
}

/**
 * Batch update operations for better performance
 */
export async function batchUpdateOrders(updates: Array<{
  id: string
  completed_at?: string
  started_at?: string
  priority?: number
  notes?: string
}>): Promise<void> {
  return measureApiCall('batch_update_orders', async () => {
    const supabase = createClient()

    // Clear relevant cache entries
    queryCache.clear()

    // Batch update using upsert
    const { error } = await supabase
      .from('kds_order_routing')
      .upsert(updates, {
        onConflict: 'id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error in batch update:', error)
      throw error
    }
  })
}

/**
 * Optimized order completion with cache invalidation
 */
export async function completeOrderOptimized(orderIds: string[]): Promise<void> {
  if (orderIds.length === 0) {return}

  return measureApiCall('complete_orders_optimized', async () => {
    const supabase = createClient()
    const now = new Date().toISOString()

    // Clear cache before update
    queryCache.clear()

    const { error } = await supabase
      .from('kds_order_routing')
      .update({ completed_at: now })
      .in('id', orderIds)

    if (error) {
      console.error('Error completing orders:', error)
      throw error
    }
  })
}

/**
 * Database function to create optimal indexes
 * Should be run during deployment/migration
 */
export const OPTIMIZATION_SQL = `
-- Indexes for optimal KDS performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_active_orders 
ON kds_order_routing (station_id, completed_at, priority DESC, routed_at ASC) 
WHERE completed_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_table_grouping
ON kds_order_routing (order_id, routed_at)
WHERE completed_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_table_seat
ON orders (table_id, seat_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_stations_active
ON kds_stations (is_active, position)
WHERE is_active = true;

-- Partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_high_priority
ON kds_order_routing (routed_at)
WHERE completed_at IS NULL AND priority >= 8;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_overdue
ON kds_order_routing (routed_at)
WHERE completed_at IS NULL AND routed_at < NOW() - INTERVAL '10 minutes';

-- Function for optimized table groups
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
`;

/**
 * Apply database optimizations
 */
export async function applyDatabaseOptimizations(): Promise<void> {
  return measureApiCall('apply_db_optimizations', async () => {
    const supabase = createClient()

    // Split the SQL into individual statements
    const statements = OPTIMIZATION_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.warn(`Warning applying optimization: ${error.message}`)
        }
      } catch (err) {
        console.warn(`Warning applying optimization statement: ${err}`)
      }
    }
  })
}

// Export cache management
export const cacheManager = {
  clear: () => queryCache.clear(),
  get: <T>(key: string) => queryCache.get<T>(key),
  set: <T>(key: string, data: T, ttl?: number) => queryCache.set(key, data, ttl)
}