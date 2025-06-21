-- ================================================================================
-- ANOMALY DETECTION SYSTEM MIGRATION
-- Project Helios - Comprehensive anomaly detection and monitoring infrastructure
-- ================================================================================

-- Create anomaly_types reference table with severity levels
CREATE TABLE anomaly_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g., 'DUPLICATE_ORDER', 'DIETARY_VIOLATION'
  name TEXT NOT NULL,
  description TEXT,
  severity_level INTEGER NOT NULL CHECK (severity_level BETWEEN 1 AND 5), -- 1=info, 5=critical
  category TEXT NOT NULL CHECK (category IN ('order', 'capacity', 'timing', 'dietary', 'system', 'security')),
  auto_resolve BOOLEAN DEFAULT false, -- Can be auto-resolved by system
  notification_required BOOLEAN DEFAULT true, -- Should trigger notifications
  default_threshold JSONB DEFAULT '{}', -- Default thresholds for detection
  resolution_actions JSONB DEFAULT '[]', -- Suggested resolution actions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create main order_anomalies table with comprehensive tracking
CREATE TABLE order_anomalies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anomaly_type_id UUID REFERENCES anomaly_types(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  seat_id UUID REFERENCES seats(id) ON DELETE SET NULL,
  kds_station_id UUID REFERENCES kds_stations(id) ON DELETE SET NULL,
  
  -- Anomaly details
  severity_override INTEGER CHECK (severity_override BETWEEN 1 AND 5), -- Override default severity
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Flexible data storage for anomaly-specific info
  
  -- Detection information  
  detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  detected_by_system BOOLEAN DEFAULT true,
  detected_by_user UUID REFERENCES auth.users ON DELETE SET NULL,
  detection_rule TEXT, -- Rule or algorithm that detected this anomaly
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0.00 AND 1.00), -- AI confidence 0-1
  
  -- Resolution tracking
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive', 'ignored')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users ON DELETE SET NULL,
  resolution_method TEXT, -- 'manual', 'auto', 'system'
  resolution_notes TEXT,
  resolution_actions_taken JSONB DEFAULT '[]',
  
  -- Impact assessment
  impact_level TEXT DEFAULT 'unknown' CHECK (impact_level IN ('none', 'low', 'medium', 'high', 'critical')),
  customer_impact BOOLEAN DEFAULT false,
  revenue_impact_cents INTEGER DEFAULT 0, -- Financial impact in cents
  time_impact_seconds INTEGER DEFAULT 0, -- Time delay impact
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure we don't duplicate the same anomaly for the same order
  CONSTRAINT unique_anomaly_per_order UNIQUE(anomaly_type_id, order_id, detected_at)
);

-- Create anomaly_patterns table for learning and prediction
CREATE TABLE anomaly_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_name TEXT UNIQUE NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('temporal', 'sequential', 'volume', 'behavioral')),
  detection_query TEXT NOT NULL, -- SQL query to detect this pattern
  threshold_config JSONB NOT NULL, -- Configuration for thresholds
  active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  run_frequency_minutes INTEGER DEFAULT 5, -- How often to check
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create views for anomaly reporting and analysis
CREATE VIEW anomaly_dashboard AS
SELECT 
  oa.id,
  oa.title,
  oa.description,
  at.name as anomaly_type,
  at.category,
  COALESCE(oa.severity_override, at.severity_level) as severity,
  oa.status,
  oa.impact_level,
  oa.detected_at,
  oa.resolved_at,
  o.id as order_id,
  t.label as table_number,
  s.label as seat_number,
  ks.name as station_name,
  EXTRACT(EPOCH FROM (COALESCE(oa.resolved_at, NOW()) - oa.detected_at))::INTEGER as duration_seconds
FROM order_anomalies oa
JOIN anomaly_types at ON oa.anomaly_type_id = at.id
LEFT JOIN orders o ON oa.order_id = o.id
LEFT JOIN tables t ON oa.table_id = t.id
LEFT JOIN seats s ON oa.seat_id = s.id
LEFT JOIN kds_stations ks ON oa.kds_station_id = ks.id
ORDER BY oa.detected_at DESC;

-- Create view for anomaly statistics
CREATE VIEW anomaly_statistics AS
SELECT 
  at.category,
  at.name as anomaly_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE oa.status = 'open') as open_count,
  COUNT(*) FILTER (WHERE oa.status = 'resolved') as resolved_count,
  COUNT(*) FILTER (WHERE oa.customer_impact = true) as customer_impact_count,
  AVG(EXTRACT(EPOCH FROM (COALESCE(oa.resolved_at, NOW()) - oa.detected_at))) as avg_resolution_time_seconds,
  SUM(oa.revenue_impact_cents) as total_revenue_impact_cents,
  DATE_TRUNC('day', oa.detected_at) as detection_date
FROM order_anomalies oa
JOIN anomaly_types at ON oa.anomaly_type_id = at.id
WHERE oa.detected_at >= NOW() - INTERVAL '30 days'
GROUP BY at.category, at.name, DATE_TRUNC('day', oa.detected_at)
ORDER BY detection_date DESC, total_count DESC;

-- Create view for real-time anomaly monitoring
CREATE VIEW active_anomalies AS
SELECT 
  oa.*,
  at.name as anomaly_type,
  at.category,
  at.severity_level,
  o.status as order_status,
  t.label as table_number,
  s.label as seat_number,
  EXTRACT(EPOCH FROM (NOW() - oa.detected_at))::INTEGER as age_seconds
FROM order_anomalies oa
JOIN anomaly_types at ON oa.anomaly_type_id = at.id
LEFT JOIN orders o ON oa.order_id = o.id
LEFT JOIN tables t ON oa.table_id = t.id
LEFT JOIN seats s ON oa.seat_id = s.id
WHERE oa.status IN ('open', 'investigating')
ORDER BY COALESCE(oa.severity_override, at.severity_level) DESC, oa.detected_at ASC;

-- Insert default anomaly types
INSERT INTO anomaly_types (code, name, description, severity_level, category, auto_resolve, notification_required, default_threshold) VALUES
-- Order anomalies
('DUPLICATE_ORDER', 'Duplicate Order', 'Multiple identical orders detected for same table/seat', 3, 'order', false, true, '{"time_window_minutes": 5}'),
('RAPID_FIRE_ORDERS', 'Rapid Fire Orders', 'Too many orders placed in quick succession', 2, 'order', false, true, '{"max_orders_per_minute": 10}'),
('ORPHANED_ORDER', 'Orphaned Order', 'Order without valid table or seat assignment', 4, 'order', false, true, '{}'),
('INCOMPLETE_ORDER_DATA', 'Incomplete Order Data', 'Order missing required information', 3, 'order', false, true, '{}'),
('UNUSUAL_ORDER_SIZE', 'Unusual Order Size', 'Order significantly larger than typical', 2, 'order', false, false, '{"max_items": 20, "max_value_cents": 50000}'),

-- Dietary anomalies
('DIETARY_VIOLATION', 'Dietary Restriction Violation', 'Order conflicts with known dietary restrictions', 4, 'dietary', false, true, '{}'),
('ALLERGEN_WARNING', 'Allergen Warning', 'Potential allergen exposure detected', 5, 'dietary', false, true, '{}'),
('DIETARY_INCONSISTENCY', 'Dietary Inconsistency', 'Order pattern inconsistent with dietary preferences', 2, 'dietary', false, false, '{}'),

-- Capacity anomalies
('TABLE_OVERCAPACITY', 'Table Over Capacity', 'More orders than seats at table', 3, 'capacity', false, true, '{}'),
('KITCHEN_OVERLOAD', 'Kitchen Overload', 'Too many orders in kitchen queue', 3, 'capacity', false, true, '{"max_pending_orders": 50}'),
('STATION_BOTTLENECK', 'Station Bottleneck', 'Specific kitchen station overwhelmed', 3, 'capacity', false, true, '{"max_station_orders": 15}'),

-- Timing anomalies
('ORDER_TIMEOUT', 'Order Timeout', 'Order taking longer than expected', 3, 'timing', false, true, '{"timeout_minutes": 45}'),
('RUSH_HOUR_SPIKE', 'Rush Hour Spike', 'Unusual order volume during peak hours', 2, 'timing', false, false, '{"spike_threshold": 2.0}'),
('OFF_HOURS_ACTIVITY', 'Off-Hours Activity', 'Unexpected activity outside normal hours', 2, 'timing', false, true, '{}'),
('PREP_TIME_ANOMALY', 'Prep Time Anomaly', 'Prep time significantly different from normal', 2, 'timing', false, false, '{"deviation_threshold": 2.0}'),

-- System anomalies
('KDS_SYNC_ERROR', 'KDS Sync Error', 'Kitchen display system synchronization issue', 4, 'system', true, true, '{}'),
('DATA_CONSISTENCY_ERROR', 'Data Consistency Error', 'Database inconsistency detected', 4, 'system', false, true, '{}'),
('PERFORMANCE_DEGRADATION', 'Performance Degradation', 'System performance below threshold', 3, 'system', false, true, '{"response_time_ms": 5000}'),

-- Security anomalies
('UNAUTHORIZED_ACCESS', 'Unauthorized Access', 'Suspicious access pattern detected', 5, 'security', false, true, '{}'),
('PRIVILEGE_ESCALATION', 'Privilege Escalation', 'User accessing resources beyond their role', 5, 'security', false, true, '{}'),
('UNUSUAL_LOGIN_PATTERN', 'Unusual Login Pattern', 'Login from unexpected location or time', 3, 'security', false, true, '{}');

-- Insert default anomaly detection patterns
INSERT INTO anomaly_patterns (pattern_name, pattern_type, detection_query, threshold_config, run_frequency_minutes) VALUES
('duplicate_orders_5min', 'temporal', 
 'SELECT o1.id, o2.id FROM orders o1 JOIN orders o2 ON o1.table_id = o2.table_id AND o1.seat_id = o2.seat_id AND o1.items = o2.items WHERE o1.id != o2.id AND o1.created_at > NOW() - INTERVAL ''5 minutes'' AND o2.created_at > NOW() - INTERVAL ''5 minutes''',
 '{"time_window_minutes": 5}', 5),

('kitchen_overload_check', 'volume',
 'SELECT COUNT(*) as pending_count FROM orders WHERE status IN (''new'', ''preparing'') HAVING COUNT(*) > 50',
 '{"max_pending_orders": 50}', 2),

('table_overcapacity_check', 'sequential',
 'SELECT o.table_id, COUNT(DISTINCT o.seat_id) as unique_seats, COUNT(*) as total_orders FROM orders o JOIN tables t ON o.table_id = t.id WHERE o.created_at > NOW() - INTERVAL ''1 hour'' GROUP BY o.table_id HAVING COUNT(*) > COUNT(DISTINCT o.seat_id) * 3',
 '{"max_orders_per_seat": 3}', 10),

('prep_time_anomaly_check', 'behavioral',
 'SELECT kor.id, kor.actual_prep_time, AVG(kor2.actual_prep_time) as avg_prep_time FROM kds_order_routing kor JOIN kds_order_routing kor2 ON kor.station_id = kor2.station_id WHERE kor.completed_at > NOW() - INTERVAL ''1 hour'' AND kor2.completed_at > NOW() - INTERVAL ''7 days'' AND kor.actual_prep_time > 0 GROUP BY kor.id, kor.actual_prep_time HAVING kor.actual_prep_time > AVG(kor2.actual_prep_time) * 2',
 '{"deviation_multiplier": 2.0}', 15);

-- Create comprehensive indexes for performance
CREATE INDEX idx_order_anomalies_detected_at ON order_anomalies(detected_at);
CREATE INDEX idx_order_anomalies_status ON order_anomalies(status);
CREATE INDEX idx_order_anomalies_severity ON order_anomalies(COALESCE(severity_override, (SELECT severity_level FROM anomaly_types WHERE id = anomaly_type_id)));
CREATE INDEX idx_order_anomalies_order_id ON order_anomalies(order_id);
CREATE INDEX idx_order_anomalies_table_id ON order_anomalies(table_id);
CREATE INDEX idx_order_anomalies_type_category ON order_anomalies(anomaly_type_id) WHERE status IN ('open', 'investigating');
CREATE INDEX idx_order_anomalies_impact ON order_anomalies(impact_level, customer_impact);
CREATE INDEX idx_order_anomalies_resolution ON order_anomalies(resolved_at, resolution_method) WHERE resolved_at IS NOT NULL;

CREATE INDEX idx_anomaly_types_category ON anomaly_types(category);
CREATE INDEX idx_anomaly_types_severity ON anomaly_types(severity_level);
CREATE INDEX idx_anomaly_types_active ON anomaly_types(id) WHERE notification_required = true;

CREATE INDEX idx_anomaly_patterns_active ON anomaly_patterns(id) WHERE active = true;
CREATE INDEX idx_anomaly_patterns_frequency ON anomaly_patterns(run_frequency_minutes, last_run_at);

-- Create trigger functions for automatic anomaly detection

-- Function to detect duplicate orders
CREATE OR REPLACE FUNCTION detect_duplicate_orders()
RETURNS TRIGGER AS $$
DECLARE
  duplicate_count INTEGER;
  anomaly_type_id UUID;
BEGIN
  -- Check for duplicate orders in the last 5 minutes
  SELECT COUNT(*) INTO duplicate_count
  FROM orders o
  WHERE o.table_id = NEW.table_id 
    AND o.seat_id = NEW.seat_id
    AND o.items = NEW.items
    AND o.id != NEW.id
    AND o.created_at > NOW() - INTERVAL '5 minutes';
  
  -- If duplicates found, create anomaly
  IF duplicate_count > 0 THEN
    SELECT id INTO anomaly_type_id FROM anomaly_types WHERE code = 'DUPLICATE_ORDER';
    
    INSERT INTO order_anomalies (
      anomaly_type_id, order_id, table_id, seat_id,
      title, description, metadata, confidence_score
    ) VALUES (
      anomaly_type_id, NEW.id, NEW.table_id, NEW.seat_id,
      'Duplicate Order Detected',
      format('Found %s similar orders in the last 5 minutes', duplicate_count),
      jsonb_build_object('duplicate_count', duplicate_count, 'detection_window_minutes', 5),
      0.95
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to detect table overcapacity
CREATE OR REPLACE FUNCTION detect_table_overcapacity()
RETURNS TRIGGER AS $$
DECLARE
  seat_count INTEGER;
  order_count INTEGER;
  anomaly_type_id UUID;
BEGIN
  -- Count seats at this table
  SELECT COUNT(*) INTO seat_count FROM seats WHERE table_id = NEW.table_id;
  
  -- Count recent orders at this table
  SELECT COUNT(*) INTO order_count 
  FROM orders 
  WHERE table_id = NEW.table_id 
    AND created_at > NOW() - INTERVAL '2 hours'
    AND status NOT IN ('completed', 'cancelled');
  
  -- Check if orders exceed reasonable capacity (3x seat count)
  IF order_count > seat_count * 3 THEN
    SELECT id INTO anomaly_type_id FROM anomaly_types WHERE code = 'TABLE_OVERCAPACITY';
    
    INSERT INTO order_anomalies (
      anomaly_type_id, order_id, table_id,
      title, description, metadata, confidence_score,
      customer_impact
    ) VALUES (
      anomaly_type_id, NEW.id, NEW.table_id,
      'Table Over Capacity',
      format('Table has %s orders for %s seats', order_count, seat_count),
      jsonb_build_object('seat_count', seat_count, 'order_count', order_count, 'capacity_ratio', order_count::DECIMAL / seat_count),
      0.90,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to detect kitchen overload
CREATE OR REPLACE FUNCTION detect_kitchen_overload()
RETURNS TRIGGER AS $$
DECLARE
  pending_orders INTEGER;
  anomaly_type_id UUID;
BEGIN
  -- Count pending orders in kitchen
  SELECT COUNT(*) INTO pending_orders
  FROM orders 
  WHERE status IN ('new', 'preparing')
    AND created_at > NOW() - INTERVAL '4 hours';
  
  -- Check if exceeds threshold
  IF pending_orders > 50 THEN
    SELECT id INTO anomaly_type_id FROM anomaly_types WHERE code = 'KITCHEN_OVERLOAD';
    
    INSERT INTO order_anomalies (
      anomaly_type_id, order_id,
      title, description, metadata, confidence_score,
      impact_level, customer_impact
    ) VALUES (
      anomaly_type_id, NEW.id,
      'Kitchen Overload Warning',
      format('Kitchen has %s pending orders', pending_orders),
      jsonb_build_object('pending_orders', pending_orders, 'threshold', 50),
      0.85,
      'high', true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate order data completeness
CREATE OR REPLACE FUNCTION detect_incomplete_order_data()
RETURNS TRIGGER AS $$
DECLARE
  anomaly_type_id UUID;
  issues TEXT[] := '{}';
BEGIN
  -- Check for missing required data
  IF NEW.items IS NULL OR jsonb_array_length(NEW.items) = 0 THEN
    issues := array_append(issues, 'empty_items');
  END IF;
  
  IF NEW.resident_id IS NULL THEN
    issues := array_append(issues, 'missing_resident');
  END IF;
  
  IF NEW.server_id IS NULL THEN
    issues := array_append(issues, 'missing_server');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM tables WHERE id = NEW.table_id) THEN
    issues := array_append(issues, 'invalid_table');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM seats WHERE id = NEW.seat_id) THEN
    issues := array_append(issues, 'invalid_seat');
  END IF;
  
  -- Create anomaly if issues found
  IF array_length(issues, 1) > 0 THEN
    SELECT id INTO anomaly_type_id FROM anomaly_types WHERE code = 'INCOMPLETE_ORDER_DATA';
    
    INSERT INTO order_anomalies (
      anomaly_type_id, order_id, table_id, seat_id,
      title, description, metadata, confidence_score,
      impact_level
    ) VALUES (
      anomaly_type_id, NEW.id, NEW.table_id, NEW.seat_id,
      'Incomplete Order Data',
      format('Order has %s data issues', array_length(issues, 1)),
      jsonb_build_object('issues', issues, 'severity', 'data_integrity'),
      1.00,
      'medium'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to detect timing anomalies for KDS orders
CREATE OR REPLACE FUNCTION detect_kds_timing_anomalies()
RETURNS TRIGGER AS $$
DECLARE
  avg_prep_time INTEGER;
  anomaly_type_id UUID;
  station_name TEXT;
BEGIN
  -- Only check when order is completed
  IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL AND NEW.actual_prep_time IS NOT NULL THEN
    
    -- Get average prep time for this station over last 7 days
    SELECT AVG(actual_prep_time)::INTEGER INTO avg_prep_time
    FROM kds_order_routing 
    WHERE station_id = NEW.station_id 
      AND actual_prep_time IS NOT NULL
      AND completed_at > NOW() - INTERVAL '7 days';
    
    -- Check if current prep time is significantly different (2x threshold)
    IF avg_prep_time IS NOT NULL AND NEW.actual_prep_time > avg_prep_time * 2 THEN
      SELECT name INTO station_name FROM kds_stations WHERE id = NEW.station_id;
      SELECT id INTO anomaly_type_id FROM anomaly_types WHERE code = 'PREP_TIME_ANOMALY';
      
      INSERT INTO order_anomalies (
        anomaly_type_id, order_id, kds_station_id,
        title, description, metadata, confidence_score,
        impact_level, time_impact_seconds
      ) VALUES (
        anomaly_type_id, NEW.order_id, NEW.station_id,
        'Prep Time Anomaly',
        format('Order took %s seconds vs average %s seconds at %s', NEW.actual_prep_time, avg_prep_time, station_name),
        jsonb_build_object(
          'actual_prep_time', NEW.actual_prep_time,
          'average_prep_time', avg_prep_time,
          'deviation_ratio', NEW.actual_prep_time::DECIMAL / avg_prep_time,
          'station_name', station_name
        ),
        0.80,
        'medium',
        NEW.actual_prep_time - avg_prep_time
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic anomaly detection
CREATE TRIGGER trigger_detect_duplicate_orders
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION detect_duplicate_orders();

CREATE TRIGGER trigger_detect_table_overcapacity
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION detect_table_overcapacity();

CREATE TRIGGER trigger_detect_kitchen_overload
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION detect_kitchen_overload();

CREATE TRIGGER trigger_detect_incomplete_order_data
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION detect_incomplete_order_data();

CREATE TRIGGER trigger_detect_kds_timing_anomalies
  AFTER UPDATE ON kds_order_routing
  FOR EACH ROW
  EXECUTE FUNCTION detect_kds_timing_anomalies();

-- Function for anomaly resolution tracking
CREATE OR REPLACE FUNCTION resolve_anomaly(
  anomaly_id UUID,
  resolution_method TEXT DEFAULT 'manual',
  resolution_notes TEXT DEFAULT NULL,
  resolved_by_user UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE order_anomalies 
  SET 
    status = 'resolved',
    resolved_at = NOW(),
    resolved_by = COALESCE(resolved_by_user, auth.uid()),
    resolution_method = resolve_anomaly.resolution_method,
    resolution_notes = resolve_anomaly.resolution_notes,
    updated_at = NOW()
  WHERE id = anomaly_id AND status != 'resolved';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for bulk anomaly resolution
CREATE OR REPLACE FUNCTION resolve_anomalies_by_type(
  anomaly_type_code TEXT,
  resolution_method TEXT DEFAULT 'bulk_auto',
  resolution_notes TEXT DEFAULT NULL,
  max_age_hours INTEGER DEFAULT 24
) RETURNS INTEGER AS $$
DECLARE
  resolved_count INTEGER;
BEGIN
  UPDATE order_anomalies 
  SET 
    status = 'resolved',
    resolved_at = NOW(),
    resolved_by = auth.uid(),
    resolution_method = resolve_anomalies_by_type.resolution_method,
    resolution_notes = resolve_anomalies_by_type.resolution_notes,
    updated_at = NOW()
  WHERE anomaly_type_id = (SELECT id FROM anomaly_types WHERE code = anomaly_type_code)
    AND status IN ('open', 'investigating')
    AND detected_at > NOW() - (max_age_hours || ' hours')::INTERVAL;
  
  GET DIAGNOSTICS resolved_count = ROW_COUNT;
  RETURN resolved_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get anomaly summary for dashboard
CREATE OR REPLACE FUNCTION get_anomaly_summary(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  category TEXT,
  severity_level INTEGER,
  total_count BIGINT,
  open_count BIGINT,
  resolved_count BIGINT,
  avg_resolution_time_hours NUMERIC,
  customer_impact_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    at.category,
    at.severity_level,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE oa.status IN ('open', 'investigating')) as open_count,
    COUNT(*) FILTER (WHERE oa.status = 'resolved') as resolved_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (oa.resolved_at - oa.detected_at)) / 3600), 2) as avg_resolution_time_hours,
    COUNT(*) FILTER (WHERE oa.customer_impact = true) as customer_impact_count
  FROM order_anomalies oa
  JOIN anomaly_types at ON oa.anomaly_type_id = at.id
  WHERE oa.detected_at > NOW() - (days_back || ' days')::INTERVAL
  GROUP BY at.category, at.severity_level
  ORDER BY at.severity_level DESC, total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for anomaly tables
CREATE TRIGGER trigger_order_anomalies_updated_at
  BEFORE UPDATE ON order_anomalies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_anomaly_types_updated_at
  BEFORE UPDATE ON anomaly_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_anomaly_patterns_updated_at
  BEFORE UPDATE ON anomaly_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE anomaly_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anomaly system
CREATE POLICY "Kitchen staff and admins can view anomaly types" ON anomaly_types
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'cook', 'server')
    )
  );

CREATE POLICY "Admins can manage anomaly types" ON anomaly_types
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Kitchen staff can view order anomalies" ON order_anomalies
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'cook', 'server')
    )
  );

CREATE POLICY "Kitchen staff can update order anomalies" ON order_anomalies
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'cook', 'server')
    )
  );

CREATE POLICY "System can create order anomalies" ON order_anomalies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage anomaly patterns" ON anomaly_patterns
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON anomaly_types TO authenticated;
GRANT SELECT, INSERT, UPDATE ON order_anomalies TO authenticated;
GRANT SELECT ON anomaly_patterns TO authenticated;
GRANT SELECT ON anomaly_dashboard TO authenticated;
GRANT SELECT ON anomaly_statistics TO authenticated;
GRANT SELECT ON active_anomalies TO authenticated;

-- Create notification function for critical anomalies
CREATE OR REPLACE FUNCTION notify_critical_anomaly()
RETURNS TRIGGER AS $$
DECLARE
  anomaly_severity INTEGER;
  notification_payload JSONB;
BEGIN
  -- Get severity level
  SELECT COALESCE(NEW.severity_override, at.severity_level) INTO anomaly_severity
  FROM anomaly_types at WHERE at.id = NEW.anomaly_type_id;
  
  -- Only notify for high severity anomalies (4-5)
  IF anomaly_severity >= 4 THEN
    notification_payload := jsonb_build_object(
      'anomaly_id', NEW.id,
      'title', NEW.title,
      'severity', anomaly_severity,
      'order_id', NEW.order_id,
      'table_id', NEW.table_id,
      'detected_at', NEW.detected_at
    );
    
    -- Send notification via PostgreSQL NOTIFY
    PERFORM pg_notify('critical_anomaly', notification_payload::TEXT);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for critical anomaly notifications
CREATE TRIGGER trigger_notify_critical_anomaly
  AFTER INSERT ON order_anomalies
  FOR EACH ROW
  EXECUTE FUNCTION notify_critical_anomaly();

-- ================================================================================
-- END ANOMALY DETECTION SYSTEM MIGRATION
-- ================================================================================