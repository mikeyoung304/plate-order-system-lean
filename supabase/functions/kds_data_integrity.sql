-- KDS Data Integrity Functions for Project Helios
-- Maintains data consistency, validation, and anomaly detection

-- ==============================
-- 1. AUTO-CALCULATE PREP TIMES TRIGGER FUNCTION
-- ==============================

-- Enhanced prep time calculation with anomaly detection
CREATE OR REPLACE FUNCTION auto_calculate_prep_time()
RETURNS trigger AS $$
DECLARE
  prep_seconds INTEGER;
  avg_prep_time INTEGER;
  station_threshold INTEGER;
BEGIN
  -- Only calculate when order moves from incomplete to complete
  IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
    -- Calculate actual prep time in seconds
    prep_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - COALESCE(NEW.started_at, NEW.routed_at)))::INTEGER;
    
    -- Update actual prep time
    NEW.actual_prep_time := prep_seconds;
    
    -- Get station's historical average for comparison
    SELECT AVG(actual_prep_time)::INTEGER INTO avg_prep_time
    FROM kds_order_routing 
    WHERE station_id = NEW.station_id 
      AND actual_prep_time IS NOT NULL 
      AND completed_at > NOW() - INTERVAL '30 days';
    
    -- Get station threshold from settings (default 900 seconds = 15 minutes)
    SELECT COALESCE((settings->>'anomaly_threshold')::INTEGER, 900) INTO station_threshold
    FROM kds_stations 
    WHERE id = NEW.station_id;
    
    -- Record metrics
    INSERT INTO kds_metrics (station_id, order_id, metric_type, value_seconds, shift_date, hour_of_day)
    VALUES (
      NEW.station_id,
      NEW.order_id,
      'prep_time',
      prep_seconds,
      CURRENT_DATE,
      EXTRACT(hour FROM NOW())::INTEGER
    );
    
    -- Check for anomaly (prep time > station threshold OR 3x average)
    IF prep_seconds > station_threshold OR 
       (avg_prep_time IS NOT NULL AND prep_seconds > avg_prep_time * 3) THEN
      -- Insert anomaly record
      INSERT INTO kds_metrics (station_id, order_id, metric_type, value_seconds, shift_date, hour_of_day)
      VALUES (
        NEW.station_id,
        NEW.order_id,
        'anomaly_detected',
        prep_seconds,
        CURRENT_DATE,
        EXTRACT(hour FROM NOW())::INTEGER
      );
      
      -- Log to system notifications if table exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_notifications') THEN
        INSERT INTO system_notifications (type, title, message, metadata, created_at)
        VALUES (
          'anomaly',
          'Long Prep Time Detected',
          format('Order %s took %s minutes at %s station (threshold: %s minutes)', 
                 NEW.order_id, 
                 ROUND(prep_seconds / 60.0, 1), 
                 (SELECT name FROM kds_stations WHERE id = NEW.station_id),
                 ROUND(station_threshold / 60.0, 1)),
          jsonb_build_object(
            'order_id', NEW.order_id,
            'station_id', NEW.station_id,
            'prep_time_seconds', prep_seconds,
            'threshold_seconds', station_threshold,
            'average_prep_time', avg_prep_time
          ),
          NOW()
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_auto_calculate_prep_time ON kds_order_routing;
CREATE TRIGGER trigger_auto_calculate_prep_time
  BEFORE UPDATE ON kds_order_routing
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_prep_time();

-- ==============================
-- 2. ORDER VALIDATION FUNCTION
-- ==============================

CREATE OR REPLACE FUNCTION validate_order_data()
RETURNS trigger AS $$
DECLARE
  table_exists BOOLEAN;
  seat_exists BOOLEAN;
  resident_exists BOOLEAN;
  server_exists BOOLEAN;
BEGIN
  -- Validate table exists and is active
  SELECT EXISTS(SELECT 1 FROM tables WHERE id = NEW.table_id AND is_active = true) INTO table_exists;
  IF NOT table_exists THEN
    RAISE EXCEPTION 'Invalid or inactive table_id: %', NEW.table_id;
  END IF;
  
  -- Validate seat exists and belongs to the table
  SELECT EXISTS(
    SELECT 1 FROM seats s 
    JOIN tables t ON s.table_id = t.id 
    WHERE s.id = NEW.seat_id AND t.id = NEW.table_id
  ) INTO seat_exists;
  IF NOT seat_exists THEN
    RAISE EXCEPTION 'Seat % does not belong to table %', NEW.seat_id, NEW.table_id;
  END IF;
  
  -- Validate resident exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = NEW.resident_id) INTO resident_exists;
  IF NOT resident_exists THEN
    RAISE EXCEPTION 'Invalid resident_id: %', NEW.resident_id;
  END IF;
  
  -- Validate server exists and has server role
  SELECT EXISTS(
    SELECT 1 FROM profiles p 
    WHERE p.user_id = NEW.server_id AND p.role IN ('server', 'admin')
  ) INTO server_exists;
  IF NOT server_exists THEN
    RAISE EXCEPTION 'Invalid server_id or user does not have server role: %', NEW.server_id;
  END IF;
  
  -- Validate order items JSON structure
  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) != 'array' THEN
    RAISE EXCEPTION 'Order items must be a valid JSON array';
  END IF;
  
  -- Validate status values
  IF NEW.status NOT IN ('new', 'confirmed', 'preparing', 'ready', 'served', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status: %', NEW.status;
  END IF;
  
  -- Validate type values  
  IF NEW.type NOT IN ('food', 'beverage', 'appetizer', 'dessert', 'special') THEN
    RAISE EXCEPTION 'Invalid order type: %', NEW.type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger to orders
DROP TRIGGER IF EXISTS trigger_validate_order_data ON orders;
CREATE TRIGGER trigger_validate_order_data
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_data();

-- ==============================
-- 3. STATION ASSIGNMENT VALIDATION
-- ==============================

CREATE OR REPLACE FUNCTION validate_station_assignment()
RETURNS trigger AS $$
DECLARE
  station_active BOOLEAN;
  station_type TEXT;
  order_type TEXT;
  duplicate_count INTEGER;
BEGIN
  -- Validate station exists and is active
  SELECT is_active, type INTO station_active, station_type
  FROM kds_stations 
  WHERE id = NEW.station_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Station does not exist: %', NEW.station_id;
  END IF;
  
  IF NOT station_active THEN
    RAISE EXCEPTION 'Cannot route to inactive station: %', NEW.station_id;
  END IF;
  
  -- Get order type for validation
  SELECT type INTO order_type FROM orders WHERE id = NEW.order_id;
  
  -- Validate station-order type compatibility
  CASE 
    WHEN order_type = 'beverage' AND station_type NOT IN ('bar', 'expo') THEN
      RAISE EXCEPTION 'Beverage orders can only be routed to bar or expo stations';
    WHEN order_type IN ('food', 'appetizer') AND station_type NOT IN ('grill', 'fryer', 'salad', 'prep', 'expo') THEN
      RAISE EXCEPTION 'Food orders can only be routed to cooking or expo stations';
    WHEN order_type = 'dessert' AND station_type NOT IN ('dessert', 'expo') THEN  
      RAISE EXCEPTION 'Dessert orders can only be routed to dessert or expo stations';
    ELSE
      -- Valid combination
      NULL;
  END CASE;
  
  -- Prevent duplicate active routing (one order can only be at one station at a time for same sequence)
  SELECT COUNT(*) INTO duplicate_count
  FROM kds_order_routing 
  WHERE order_id = NEW.order_id 
    AND sequence = NEW.sequence 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND completed_at IS NULL;
    
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Order already has active routing for sequence %', NEW.sequence;
  END IF;
  
  -- Validate sequence numbers are positive
  IF NEW.sequence <= 0 THEN
    RAISE EXCEPTION 'Sequence must be a positive integer';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply station assignment validation
DROP TRIGGER IF EXISTS trigger_validate_station_assignment ON kds_order_routing;
CREATE TRIGGER trigger_validate_station_assignment
  BEFORE INSERT OR UPDATE ON kds_order_routing
  FOR EACH ROW
  EXECUTE FUNCTION validate_station_assignment();

-- ==============================
-- 4. ANOMALY DETECTION TRIGGER
-- ==============================

CREATE OR REPLACE FUNCTION detect_prep_time_anomalies()
RETURNS trigger AS $$
DECLARE
  station_name TEXT;
  avg_station_time INTEGER;
  threshold_multiplier NUMERIC := 2.5;
BEGIN
  -- Only process completed orders
  IF NEW.completed_at IS NULL OR NEW.actual_prep_time IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get station info
  SELECT name INTO station_name FROM kds_stations WHERE id = NEW.station_id;
  
  -- Calculate recent average for this station (last 100 completed orders)
  SELECT AVG(actual_prep_time)::INTEGER INTO avg_station_time
  FROM kds_order_routing 
  WHERE station_id = NEW.station_id 
    AND actual_prep_time IS NOT NULL 
    AND completed_at IS NOT NULL
    AND completed_at > NOW() - INTERVAL '7 days'
  LIMIT 100;
  
  -- Check for anomaly conditions
  IF avg_station_time IS NOT NULL AND NEW.actual_prep_time > (avg_station_time * threshold_multiplier) THEN
    -- Record anomaly metric
    INSERT INTO kds_metrics (
      station_id, 
      order_id, 
      metric_type, 
      value_seconds, 
      shift_date, 
      hour_of_day
    ) VALUES (
      NEW.station_id,
      NEW.order_id,
      'prep_time_anomaly',
      NEW.actual_prep_time,
      CURRENT_DATE,
      EXTRACT(hour FROM NOW())::INTEGER
    );
    
    -- Log detailed anomaly information
    RAISE NOTICE 'ANOMALY DETECTED: Order % at % station took % seconds (avg: % seconds)', 
      NEW.order_id, station_name, NEW.actual_prep_time, avg_station_time;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create anomaly detection trigger
DROP TRIGGER IF EXISTS trigger_detect_prep_anomalies ON kds_order_routing;
CREATE TRIGGER trigger_detect_prep_anomalies
  AFTER UPDATE ON kds_order_routing
  FOR EACH ROW
  EXECUTE FUNCTION detect_prep_time_anomalies();

-- ==============================
-- 5. ORPHANED ROUTING CLEANUP FUNCTION
-- ==============================

CREATE OR REPLACE FUNCTION cleanup_orphaned_routing_records()
RETURNS TABLE(cleaned_count INTEGER, details JSONB) AS $$
DECLARE
  orphaned_routing_count INTEGER;
  orphaned_metrics_count INTEGER;
  old_routing_count INTEGER;
  cleanup_details JSONB;
BEGIN
  -- Clean up routing records for non-existent orders
  DELETE FROM kds_order_routing 
  WHERE order_id NOT IN (SELECT id FROM orders);
  GET DIAGNOSTICS orphaned_routing_count = ROW_COUNT;
  
  -- Clean up metrics for non-existent orders or stations
  DELETE FROM kds_metrics 
  WHERE order_id NOT IN (SELECT id FROM orders) 
     OR station_id NOT IN (SELECT id FROM kds_stations);
  GET DIAGNOSTICS orphaned_metrics_count = ROW_COUNT;
  
  -- Clean up old completed routing records (older than 90 days)
  DELETE FROM kds_order_routing 
  WHERE completed_at IS NOT NULL 
    AND completed_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS old_routing_count = ROW_COUNT;
  
  -- Build details JSON
  cleanup_details := jsonb_build_object(
    'orphaned_routing_records', orphaned_routing_count,
    'orphaned_metrics_records', orphaned_metrics_count,
    'old_routing_records', old_routing_count,
    'cleanup_timestamp', NOW()
  );
  
  RETURN QUERY SELECT 
    (orphaned_routing_count + orphaned_metrics_count + old_routing_count)::INTEGER as cleaned_count,
    cleanup_details as details;
END;
$$ LANGUAGE plpgsql;

-- ==============================
-- 6. HELPER FUNCTIONS FOR DATA INTEGRITY
-- ==============================

-- Function to validate KDS system health
CREATE OR REPLACE FUNCTION validate_kds_system_health()
RETURNS TABLE(check_name TEXT, status TEXT, details JSONB) AS $$
BEGIN
  -- Check for active stations
  RETURN QUERY
  SELECT 'active_stations'::TEXT as check_name,
         CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END as status,
         jsonb_build_object('active_count', COUNT(*)) as details
  FROM kds_stations WHERE is_active = true;
  
  -- Check for stuck orders (routed but not started after 30 minutes)
  RETURN QUERY
  SELECT 'stuck_orders'::TEXT as check_name,
         CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ALERT' END as status,
         jsonb_build_object('stuck_count', COUNT(*), 'order_ids', array_agg(order_id)) as details
  FROM kds_order_routing 
  WHERE routed_at < NOW() - INTERVAL '30 minutes'
    AND started_at IS NULL 
    AND completed_at IS NULL;
    
  -- Check for orders without routing
  RETURN QUERY
  SELECT 'unrouted_orders'::TEXT as check_name,
         CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END as status,
         jsonb_build_object('unrouted_count', COUNT(*), 'order_ids', array_agg(o.id)) as details
  FROM orders o
  LEFT JOIN kds_order_routing kor ON o.id = kor.order_id
  WHERE o.status IN ('new', 'confirmed', 'preparing')
    AND kor.id IS NULL
    AND o.created_at > NOW() - INTERVAL '1 hour';
    
  -- Check metrics collection health
  RETURN QUERY
  SELECT 'metrics_collection'::TEXT as check_name,
         CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END as status,
         jsonb_build_object('recent_metrics_count', COUNT(*)) as details
  FROM kds_metrics 
  WHERE recorded_at > NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate station performance statistics
CREATE OR REPLACE FUNCTION recalculate_station_stats(station_uuid UUID DEFAULT NULL)
RETURNS TABLE(station_id UUID, avg_prep_time INTEGER, total_orders INTEGER, anomaly_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kor.station_id,
    AVG(kor.actual_prep_time)::INTEGER as avg_prep_time,
    COUNT(*)::INTEGER as total_orders,
    COUNT(CASE WHEN km.metric_type = 'prep_time_anomaly' THEN 1 END)::INTEGER as anomaly_count
  FROM kds_order_routing kor
  LEFT JOIN kds_metrics km ON kor.order_id = km.order_id AND kor.station_id = km.station_id
  WHERE kor.actual_prep_time IS NOT NULL
    AND kor.completed_at > NOW() - INTERVAL '30 days'
    AND (station_uuid IS NULL OR kor.station_id = station_uuid)
  GROUP BY kor.station_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================
-- 7. AUTOMATED CLEANUP SCHEDULE
-- ==============================

-- Create a function that can be called by a cron job or scheduled task
CREATE OR REPLACE FUNCTION daily_kds_maintenance()
RETURNS JSONB AS $$
DECLARE
  cleanup_result RECORD;
  maintenance_log JSONB;
BEGIN
  -- Run orphaned record cleanup
  SELECT * INTO cleanup_result FROM cleanup_orphaned_routing_records();
  
  -- Update station statistics
  UPDATE kds_stations SET 
    settings = settings || jsonb_build_object(
      'last_maintenance', NOW(),
      'avg_prep_time', (
        SELECT AVG(actual_prep_time)::INTEGER 
        FROM kds_order_routing 
        WHERE station_id = kds_stations.id 
          AND actual_prep_time IS NOT NULL 
          AND completed_at > NOW() - INTERVAL '7 days'
      )
    );
    
  -- Build maintenance log
  maintenance_log := jsonb_build_object(
    'timestamp', NOW(),
    'cleanup_results', cleanup_result.details,
    'stations_updated', (SELECT COUNT(*) FROM kds_stations WHERE is_active = true)
  );
  
  -- Log the maintenance activity
  INSERT INTO kds_metrics (station_id, metric_type, value_count, recorded_at)
  SELECT id, 'maintenance_run', 1, NOW()
  FROM kds_stations 
  WHERE is_active = true
  LIMIT 1;
  
  RETURN maintenance_log;
END;
$$ LANGUAGE plpgsql;

-- ==============================
-- 8. PERFORMANCE OPTIMIZATION INDEXES
-- ==============================

-- Additional indexes for data integrity functions
CREATE INDEX IF NOT EXISTS idx_kds_order_routing_completed_cleanup 
  ON kds_order_routing(completed_at) 
  WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kds_metrics_anomaly_detection 
  ON kds_metrics(station_id, metric_type, recorded_at) 
  WHERE metric_type IN ('prep_time_anomaly', 'anomaly_detected');

CREATE INDEX IF NOT EXISTS idx_orders_status_type 
  ON orders(status, type, created_at);

-- Partial index for active routing records
CREATE INDEX IF NOT EXISTS idx_kds_routing_active_orders 
  ON kds_order_routing(station_id, routed_at) 
  WHERE completed_at IS NULL;

-- Comments for documentation
COMMENT ON FUNCTION auto_calculate_prep_time() IS 'Automatically calculates prep times and detects anomalies when orders complete';
COMMENT ON FUNCTION validate_order_data() IS 'Validates order data integrity before insert/update';
COMMENT ON FUNCTION validate_station_assignment() IS 'Ensures station assignments are valid and prevents routing conflicts';
COMMENT ON FUNCTION detect_prep_time_anomalies() IS 'Detects and logs prep time anomalies based on station averages';
COMMENT ON FUNCTION cleanup_orphaned_routing_records() IS 'Removes orphaned routing and metrics records';
COMMENT ON FUNCTION validate_kds_system_health() IS 'Performs comprehensive health checks on the KDS system';
COMMENT ON FUNCTION daily_kds_maintenance() IS 'Daily maintenance routine for KDS data integrity';