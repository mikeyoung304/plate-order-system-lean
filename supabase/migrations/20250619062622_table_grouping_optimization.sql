-- Table Grouping Optimization Migration for Project Helios
-- Purpose: Enhance KDS with efficient table grouping capabilities for 50+ tables
-- Created: 2025-06-19
-- Features: Optimized views, group management functions, performance indexes, analytics, real-time triggers

-- ==============================================================================
-- TABLE GROUP MANAGEMENT TABLE
-- ==============================================================================
-- Stores table grouping configurations and preferences
CREATE TABLE IF NOT EXISTS kds_table_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  table_ids UUID[] NOT NULL DEFAULT '{}',
  position INTEGER DEFAULT 0, -- Display position in KDS
  color TEXT DEFAULT '#3B82F6', -- Visual grouping color
  priority INTEGER DEFAULT 0, -- Group priority for rush management
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- Group-specific settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_group_name UNIQUE(name)
);

-- ==============================================================================
-- OPTIMIZED TABLE GROUPING VIEW
-- ==============================================================================
-- Main view for KDS table grouping with efficient joins and aggregations
CREATE OR REPLACE VIEW kds_active_table_groups AS
WITH active_orders AS (
  -- Get all active orders with their routing status
  SELECT DISTINCT
    o.id,
    o.table_id,
    o.seat_id,
    o.status AS order_status,
    o.type AS order_type,
    o.created_at,
    o.items,
    t.label AS table_label,
    t.type AS table_type,
    s.label AS seat_label,
    kr.station_id,
    kr.routed_at,
    kr.started_at,
    kr.completed_at,
    kr.priority AS routing_priority,
    kr.recall_count,
    kr.estimated_prep_time,
    kr.actual_prep_time,
    kr.sequence,
    -- Calculate wait time in seconds
    EXTRACT(EPOCH FROM (COALESCE(kr.started_at, NOW()) - kr.routed_at))::INTEGER AS wait_time,
    -- Calculate prep progress percentage
    CASE 
      WHEN kr.completed_at IS NOT NULL THEN 100
      WHEN kr.started_at IS NOT NULL AND kr.estimated_prep_time > 0 THEN 
        LEAST(100, (EXTRACT(EPOCH FROM (NOW() - kr.started_at)) / kr.estimated_prep_time * 100)::INTEGER)
      ELSE 0
    END AS prep_progress
  FROM orders o
  INNER JOIN tables t ON o.table_id = t.id
  INNER JOIN seats s ON o.seat_id = s.id
  LEFT JOIN kds_order_routing kr ON o.id = kr.order_id
  WHERE o.status NOT IN ('completed', 'cancelled')
    AND (kr.completed_at IS NULL OR kr.id IS NULL)
),
table_aggregates AS (
  -- Aggregate orders by table
  SELECT 
    table_id,
    table_label,
    table_type,
    COUNT(DISTINCT id) AS order_count,
    COUNT(DISTINCT seat_id) AS active_seats,
    MIN(created_at) AS earliest_order_time,
    MAX(created_at) AS latest_order_time,
    ARRAY_AGG(DISTINCT order_type) AS order_types,
    MAX(routing_priority) AS max_priority,
    SUM(recall_count) AS total_recalls,
    AVG(wait_time)::INTEGER AS avg_wait_time,
    AVG(prep_progress)::INTEGER AS avg_prep_progress,
    -- Time-based urgency score (older orders = higher urgency)
    EXTRACT(EPOCH FROM (NOW() - MIN(created_at)))::INTEGER AS table_wait_seconds,
    -- Aggregate order details for display
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'order_id', id,
        'seat_label', seat_label,
        'order_type', order_type,
        'created_at', created_at,
        'items', items,
        'station_id', station_id,
        'routing_priority', routing_priority,
        'prep_progress', prep_progress,
        'wait_time', wait_time
      ) ORDER BY created_at
    ) AS orders_detail
  FROM active_orders
  GROUP BY table_id, table_label, table_type
),
grouped_tables AS (
  -- Add group information to tables
  SELECT 
    ta.*,
    tg.id AS group_id,
    tg.name AS group_name,
    tg.color AS group_color,
    tg.priority AS group_priority,
    tg.position AS group_position,
    -- Calculate composite urgency score
    (
      ta.table_wait_seconds * 0.4 + -- Age weight
      ta.order_count * 60 * 0.3 + -- Order count weight
      COALESCE(ta.max_priority, 0) * 100 * 0.2 + -- Priority weight
      ta.total_recalls * 300 * 0.1 -- Recall weight
    )::INTEGER AS urgency_score
  FROM table_aggregates ta
  LEFT JOIN kds_table_groups tg 
    ON tg.is_active = true 
    AND ta.table_id = ANY(tg.table_ids)
)
SELECT 
  -- Table information
  table_id,
  table_label,
  table_type,
  -- Group information
  group_id,
  group_name,
  group_color,
  group_priority,
  group_position,
  -- Order statistics
  order_count,
  active_seats,
  earliest_order_time,
  latest_order_time,
  order_types,
  -- Performance metrics
  max_priority,
  total_recalls,
  avg_wait_time,
  avg_prep_progress,
  table_wait_seconds,
  urgency_score,
  -- Detailed order information
  orders_detail,
  -- Visual indicators
  CASE 
    WHEN table_wait_seconds > 1800 THEN 'critical' -- > 30 min
    WHEN table_wait_seconds > 900 THEN 'warning'  -- > 15 min
    WHEN table_wait_seconds > 300 THEN 'normal'   -- > 5 min
    ELSE 'new'
  END AS urgency_level
FROM grouped_tables
ORDER BY 
  COALESCE(group_position, 999),
  urgency_score DESC,
  table_label;

-- ==============================================================================
-- TABLE GROUP MANAGEMENT FUNCTIONS
-- ==============================================================================

-- Function to create or update a table group
CREATE OR REPLACE FUNCTION manage_table_group(
  p_name TEXT,
  p_table_ids UUID[],
  p_color TEXT DEFAULT '#3B82F6',
  p_priority INTEGER DEFAULT 0,
  p_position INTEGER DEFAULT 0,
  p_group_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_group_id UUID;
BEGIN
  IF p_group_id IS NOT NULL THEN
    -- Update existing group
    UPDATE kds_table_groups
    SET 
      name = p_name,
      table_ids = p_table_ids,
      color = p_color,
      priority = p_priority,
      position = p_position,
      updated_at = NOW()
    WHERE id = p_group_id
    RETURNING id INTO v_group_id;
  ELSE
    -- Create new group
    INSERT INTO kds_table_groups (name, table_ids, color, priority, position, created_by)
    VALUES (p_name, p_table_ids, p_color, p_priority, p_position, auth.uid())
    RETURNING id INTO v_group_id;
  END IF;
  
  -- Trigger real-time update
  PERFORM pg_notify('table_group_changed', 
    json_build_object(
      'action', CASE WHEN p_group_id IS NULL THEN 'created' ELSE 'updated' END,
      'group_id', v_group_id
    )::text
  );
  
  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-group adjacent tables
CREATE OR REPLACE FUNCTION auto_group_adjacent_tables(
  p_table_range_start INTEGER,
  p_table_range_end INTEGER,
  p_group_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_table_ids UUID[];
  v_group_name TEXT;
BEGIN
  -- Get table IDs in the specified range
  SELECT ARRAY_AGG(id ORDER BY label)
  INTO v_table_ids
  FROM tables
  WHERE label >= p_table_range_start 
    AND label <= p_table_range_end
    AND type = 'standard'; -- Only group standard tables
  
  -- Generate group name if not provided
  v_group_name := COALESCE(
    p_group_name, 
    FORMAT('Tables %s-%s', p_table_range_start, p_table_range_end)
  );
  
  -- Create the group
  RETURN manage_table_group(
    p_name := v_group_name,
    p_table_ids := v_table_ids,
    p_position := p_table_range_start -- Use start as position for ordering
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table group suggestions based on patterns
CREATE OR REPLACE FUNCTION suggest_table_groups()
RETURNS TABLE (
  suggested_name TEXT,
  table_ids UUID[],
  reason TEXT
) AS $$
BEGIN
  -- Suggest grouping for bar tables
  RETURN QUERY
  SELECT 
    'Bar Area' AS suggested_name,
    ARRAY_AGG(id ORDER BY label) AS table_ids,
    'Group all bar tables together' AS reason
  FROM tables
  WHERE type = 'bar'
  GROUP BY type
  HAVING COUNT(*) > 1;
  
  -- Suggest grouping for booth tables
  RETURN QUERY
  SELECT 
    'Booth Section' AS suggested_name,
    ARRAY_AGG(id ORDER BY label) AS table_ids,
    'Group all booth tables together' AS reason
  FROM tables
  WHERE type = 'booth'
  GROUP BY type
  HAVING COUNT(*) > 1;
  
  -- Suggest grouping for high-top tables
  RETURN QUERY
  SELECT 
    'High-Top Section' AS suggested_name,
    ARRAY_AGG(id ORDER BY label) AS table_ids,
    'Group all high-top tables together' AS reason
  FROM tables
  WHERE type = 'high-top'
  GROUP BY type
  HAVING COUNT(*) > 1;
  
  -- Suggest grouping tables in ranges of 10
  RETURN QUERY
  SELECT 
    FORMAT('Tables %s-%s', (label / 10) * 10 + 1, (label / 10 + 1) * 10) AS suggested_name,
    ARRAY_AGG(id ORDER BY label) AS table_ids,
    'Group tables by number range for easier management' AS reason
  FROM tables
  WHERE type = 'standard'
  GROUP BY label / 10
  HAVING COUNT(*) > 3;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- PERFORMANCE INDEXES FOR TABLE GROUPING
-- ==============================================================================

-- Index for fast table group lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_table_groups_active 
ON kds_table_groups(is_active, position) 
WHERE is_active = true;

-- GIN index for efficient table_ids array searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_table_groups_table_ids_gin 
ON kds_table_groups USING GIN (table_ids);

-- Composite index for table grouping queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_table_status_created 
ON orders(table_id, status, created_at DESC)
WHERE status NOT IN ('completed', 'cancelled');

-- Index for seat aggregation in table groups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_table_seat_status 
ON orders(table_id, seat_id, status)
WHERE status NOT IN ('completed', 'cancelled');

-- Index for routing join performance in grouping
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kds_routing_order_completed 
ON kds_order_routing(order_id, completed_at)
WHERE completed_at IS NULL;

-- ==============================================================================
-- GROUP ANALYTICS VIEWS
-- ==============================================================================

-- View for table utilization analytics
CREATE OR REPLACE VIEW kds_table_utilization_analytics AS
WITH hourly_stats AS (
  SELECT 
    DATE_TRUNC('hour', o.created_at) AS hour,
    t.id AS table_id,
    t.label AS table_label,
    t.type AS table_type,
    COUNT(DISTINCT o.id) AS order_count,
    COUNT(DISTINCT o.seat_id) AS unique_seats_used,
    AVG(EXTRACT(EPOCH FROM (
      COALESCE(
        (SELECT MIN(kr.completed_at) 
         FROM kds_order_routing kr 
         WHERE kr.order_id = o.id),
        NOW()
      ) - o.created_at
    )))::INTEGER AS avg_order_duration_seconds
  FROM orders o
  INNER JOIN tables t ON o.table_id = t.id
  WHERE o.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY DATE_TRUNC('hour', o.created_at), t.id, t.label, t.type
)
SELECT 
  hour,
  table_id,
  table_label,
  table_type,
  order_count,
  unique_seats_used,
  avg_order_duration_seconds,
  -- Calculate table turnover rate
  CASE 
    WHEN avg_order_duration_seconds > 0 
    THEN (3600.0 / avg_order_duration_seconds)::NUMERIC(4,2)
    ELSE 0
  END AS hourly_turnover_rate
FROM hourly_stats
ORDER BY hour DESC, table_label;

-- View for group performance metrics
CREATE OR REPLACE VIEW kds_group_performance_analytics AS
WITH group_metrics AS (
  SELECT 
    tg.id AS group_id,
    tg.name AS group_name,
    tg.position AS group_position,
    COUNT(DISTINCT o.id) AS total_orders,
    COUNT(DISTINCT o.table_id) AS active_tables,
    AVG(EXTRACT(EPOCH FROM (NOW() - o.created_at)))::INTEGER AS avg_order_age_seconds,
    MAX(kr.priority) AS max_priority,
    SUM(kr.recall_count) AS total_recalls,
    AVG(kr.actual_prep_time)::INTEGER AS avg_actual_prep_time,
    -- Performance score calculation
    CASE 
      WHEN COUNT(DISTINCT o.id) > 0 THEN
        (
          (1.0 - (AVG(EXTRACT(EPOCH FROM (NOW() - o.created_at))) / 1800.0)) * 40 + -- Age factor
          (1.0 - (COALESCE(SUM(kr.recall_count), 0) / COUNT(DISTINCT o.id)::FLOAT)) * 30 + -- Recall factor
          (COUNT(DISTINCT o.table_id)::FLOAT / ARRAY_LENGTH(tg.table_ids, 1)::FLOAT) * 30 -- Utilization factor
        )::INTEGER
      ELSE 100
    END AS performance_score
  FROM kds_table_groups tg
  LEFT JOIN orders o ON o.table_id = ANY(tg.table_ids) 
    AND o.status NOT IN ('completed', 'cancelled')
  LEFT JOIN kds_order_routing kr ON kr.order_id = o.id 
    AND kr.completed_at IS NULL
  WHERE tg.is_active = true
  GROUP BY tg.id, tg.name, tg.position, tg.table_ids
)
SELECT *
FROM group_metrics
ORDER BY group_position, group_name;

-- ==============================================================================
-- REAL-TIME TRIGGERS FOR TABLE GROUP MANAGEMENT
-- ==============================================================================

-- Function to maintain group statistics in real-time
CREATE OR REPLACE FUNCTION update_table_group_stats()
RETURNS trigger AS $$
BEGIN
  -- Notify listeners about table group changes
  IF TG_OP = 'INSERT' THEN
    PERFORM pg_notify('table_group_stats', 
      json_build_object(
        'action', 'order_added',
        'table_id', NEW.table_id,
        'order_id', NEW.id
      )::text
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM pg_notify('table_group_stats', 
      json_build_object(
        'action', 'order_status_changed',
        'table_id', NEW.table_id,
        'order_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order changes affecting table groups
CREATE TRIGGER trigger_table_group_stats_update
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_table_group_stats();

-- Function to auto-assign tables to groups based on patterns
CREATE OR REPLACE FUNCTION auto_assign_table_to_group()
RETURNS trigger AS $$
DECLARE
  v_group_id UUID;
BEGIN
  -- Check if table should be auto-assigned to a group based on type
  IF NEW.type IN ('bar', 'booth', 'high-top') THEN
    -- Find or create group for this table type
    SELECT id INTO v_group_id
    FROM kds_table_groups
    WHERE name = FORMAT('%s Tables', INITCAP(NEW.type))
      AND is_active = true
    LIMIT 1;
    
    IF v_group_id IS NULL THEN
      -- Create new group for this type
      INSERT INTO kds_table_groups (name, table_ids, color, position)
      VALUES (
        FORMAT('%s Tables', INITCAP(NEW.type)),
        ARRAY[NEW.id],
        CASE NEW.type
          WHEN 'bar' THEN '#06B6D4'
          WHEN 'booth' THEN '#8B5CF6'
          WHEN 'high-top' THEN '#F59E0B'
          ELSE '#3B82F6'
        END,
        CASE NEW.type
          WHEN 'bar' THEN 100
          WHEN 'booth' THEN 200
          WHEN 'high-top' THEN 300
          ELSE 400
        END
      );
    ELSE
      -- Add table to existing group
      UPDATE kds_table_groups
      SET table_ids = ARRAY_APPEND(table_ids, NEW.id)
      WHERE id = v_group_id
        AND NOT (NEW.id = ANY(table_ids));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-grouping new tables
CREATE TRIGGER trigger_auto_assign_table_group
  AFTER INSERT ON tables
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_table_to_group();

-- ==============================================================================
-- PERMISSIONS AND ROW LEVEL SECURITY
-- ==============================================================================

-- Enable RLS on new tables
ALTER TABLE kds_table_groups ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON kds_table_groups TO authenticated;
GRANT INSERT, UPDATE, DELETE ON kds_table_groups TO authenticated;
GRANT SELECT ON kds_active_table_groups TO authenticated;
GRANT SELECT ON kds_table_utilization_analytics TO authenticated;
GRANT SELECT ON kds_group_performance_analytics TO authenticated;

-- RLS Policies for table groups
CREATE POLICY "Users can view table groups" ON kds_table_groups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage table groups" ON kds_table_groups
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'server', 'cook')
    )
  );

-- ==============================================================================
-- UTILITY FUNCTIONS FOR KDS UI
-- ==============================================================================

-- Function to get optimal table layout for KDS display
CREATE OR REPLACE FUNCTION get_kds_table_layout(
  p_max_columns INTEGER DEFAULT 6
) RETURNS TABLE (
  row_number INTEGER,
  column_number INTEGER,
  table_id UUID,
  table_label INTEGER,
  group_id UUID,
  group_color TEXT,
  urgency_score INTEGER
) AS $$
WITH ranked_tables AS (
  SELECT 
    table_id,
    table_label,
    group_id,
    group_color,
    urgency_score,
    ROW_NUMBER() OVER (ORDER BY 
      COALESCE(group_position, 999),
      urgency_score DESC,
      table_label
    ) AS position
  FROM kds_active_table_groups
)
SELECT 
  ((position - 1) / p_max_columns) + 1 AS row_number,
  ((position - 1) % p_max_columns) + 1 AS column_number,
  table_id,
  table_label,
  group_id,
  group_color,
  urgency_score
FROM ranked_tables
ORDER BY position;
$$ LANGUAGE sql STABLE;

-- ==============================================================================
-- COMMENTS FOR MAINTENANCE
-- ==============================================================================

COMMENT ON TABLE kds_table_groups IS 
'Stores table grouping configurations for KDS display optimization';

COMMENT ON VIEW kds_active_table_groups IS 
'Real-time view of active table groups with order aggregations and urgency scoring';

COMMENT ON FUNCTION manage_table_group IS 
'Creates or updates table groups with real-time notifications';

COMMENT ON FUNCTION auto_group_adjacent_tables IS 
'Automatically groups sequential tables by number range';

COMMENT ON VIEW kds_table_utilization_analytics IS 
'Analytics view for table usage patterns and turnover rates';

COMMENT ON VIEW kds_group_performance_analytics IS 
'Performance metrics for table groups including utilization and efficiency scores';

-- ==============================================================================
-- INITIAL DATA SETUP
-- ==============================================================================

-- Create default table groups based on common restaurant layouts
DO $$
BEGIN
  -- Check if we need to create default groups
  IF NOT EXISTS (SELECT 1 FROM kds_table_groups LIMIT 1) THEN
    -- Auto-group tables by ranges of 10
    PERFORM auto_group_adjacent_tables(1, 10, 'Section A (1-10)');
    PERFORM auto_group_adjacent_tables(11, 20, 'Section B (11-20)');
    PERFORM auto_group_adjacent_tables(21, 30, 'Section C (21-30)');
    PERFORM auto_group_adjacent_tables(31, 40, 'Section D (31-40)');
    PERFORM auto_group_adjacent_tables(41, 50, 'Section E (41-50)');
    
    RAISE NOTICE 'Default table groups created for sections A-E';
  END IF;
END $$;

-- ==============================================================================
-- PERFORMANCE MONITORING
-- ==============================================================================

DO $$ 
BEGIN
  RAISE NOTICE 'Table Grouping Optimization Migration Applied - %', NOW();
  RAISE NOTICE 'Features: Optimized views, group management, performance indexes, analytics, real-time triggers';
  RAISE NOTICE 'Expected Performance: Handles 50+ tables with real-time updates';
  RAISE NOTICE 'Next Steps: Configure table groups in KDS settings';
END $$;