-- Add function to bulk bump orders for a table
CREATE OR REPLACE FUNCTION bulk_bump_table_orders(
  p_table_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Update all uncompleted orders for the table
  UPDATE kds_order_routing
  SET 
    completed_at = NOW(),
    bumped_by = p_user_id,
    bumped_at = NOW(),
    updated_at = NOW()
  WHERE 
    order_id IN (
      SELECT id FROM orders WHERE table_id = p_table_id
    )
    AND completed_at IS NULL;
  
  -- Get the count of updated rows
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Record metrics for each bumped order
  INSERT INTO kds_metrics (station_id, order_id, metric_type, value_seconds)
  SELECT 
    kor.station_id,
    kor.order_id,
    'prep_time',
    EXTRACT(EPOCH FROM (NOW() - kor.routed_at))::INTEGER
  FROM kds_order_routing kor
  INNER JOIN orders o ON o.id = kor.order_id
  WHERE 
    o.table_id = p_table_id
    AND kor.completed_at = NOW()
    AND kor.bumped_by = p_user_id;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add index for table-based queries
CREATE INDEX IF NOT EXISTS idx_orders_table_created ON orders(table_id, created_at);

-- Add view for table-grouped orders with timing
CREATE OR REPLACE VIEW kds_table_summary AS
SELECT 
  t.id as table_id,
  t.label as table_label,
  COUNT(DISTINCT o.id) as order_count,
  COUNT(DISTINCT o.seat_id) as seat_count,
  MIN(kor.routed_at) as earliest_order_time,
  MAX(kor.routed_at) as latest_order_time,
  SUM(CASE WHEN kor.completed_at IS NULL THEN 1 ELSE 0 END) as pending_orders,
  SUM(CASE WHEN kor.started_at IS NOT NULL AND kor.completed_at IS NULL THEN 1 ELSE 0 END) as preparing_orders,
  SUM(CASE WHEN kor.completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed_orders,
  MAX(kor.priority) as max_priority,
  SUM(kor.recall_count) as total_recalls,
  MAX(EXTRACT(EPOCH FROM (NOW() - kor.routed_at))::INTEGER) as max_elapsed_seconds
FROM tables t
INNER JOIN orders o ON o.table_id = t.id
INNER JOIN kds_order_routing kor ON kor.order_id = o.id
WHERE 
  o.created_at >= NOW() - INTERVAL '4 hours' -- Only recent orders
GROUP BY t.id, t.label
HAVING SUM(CASE WHEN kor.completed_at IS NULL THEN 1 ELSE 0 END) > 0 -- Has active orders
ORDER BY MIN(kor.routed_at);

-- Grant permissions
GRANT EXECUTE ON FUNCTION bulk_bump_table_orders(UUID, UUID) TO authenticated;
GRANT SELECT ON kds_table_summary TO authenticated;