-- Kitchen Display System (KDS) Migration
-- Create comprehensive KDS tables for the revolutionary kitchen display system

-- KDS Stations table for managing different kitchen stations
CREATE TABLE kds_stations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('grill', 'fryer', 'salad', 'expo', 'bar', 'prep', 'dessert')),
  position INTEGER DEFAULT 1,
  color TEXT DEFAULT '#3B82F6', -- Station color for UI
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- Station-specific settings like auto-bump timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KDS Order Routing table for tracking orders through stations
CREATE TABLE kds_order_routing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  station_id UUID REFERENCES kds_stations(id) ON DELETE CASCADE,
  sequence INTEGER DEFAULT 1, -- Order of stations for this order
  routed_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ, -- When prep started
  completed_at TIMESTAMPTZ, -- When marked ready/bumped
  bumped_by UUID REFERENCES profiles(id),
  bumped_at TIMESTAMPTZ,
  recalled_at TIMESTAMPTZ, -- For order recall functionality
  recall_count INTEGER DEFAULT 0,
  estimated_prep_time INTEGER, -- AI estimated prep time in seconds
  actual_prep_time INTEGER, -- Actual time taken
  notes TEXT, -- Special instructions for this station
  priority INTEGER DEFAULT 0, -- Higher numbers = higher priority
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_order_station UNIQUE(order_id, station_id)
);

-- KDS Performance Metrics table for analytics
CREATE TABLE kds_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID REFERENCES kds_stations(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('prep_time', 'wait_time', 'bump_time', 'throughput')),
  value_seconds INTEGER, -- Time-based metrics in seconds
  value_count INTEGER, -- Count-based metrics
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  shift_date DATE DEFAULT CURRENT_DATE,
  hour_of_day INTEGER DEFAULT EXTRACT(hour FROM NOW())
);

-- KDS Configuration table for system settings
CREATE TABLE kds_configuration (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default KDS stations
INSERT INTO kds_stations (name, type, position, color, settings) VALUES
  ('Grill Station', 'grill', 1, '#EF4444', '{"auto_bump_time": 900, "max_orders": 12}'),
  ('Fryer Station', 'fryer', 2, '#F59E0B', '{"auto_bump_time": 480, "max_orders": 8}'),
  ('Salad Station', 'salad', 3, '#10B981', '{"auto_bump_time": 300, "max_orders": 15}'),
  ('Expo Station', 'expo', 4, '#8B5CF6', '{"auto_bump_time": 120, "max_orders": 20}'),
  ('Bar Station', 'bar', 5, '#06B6D4', '{"auto_bump_time": 180, "max_orders": 10}');

-- Insert default KDS configuration
INSERT INTO kds_configuration (key, value, description) VALUES
  ('timing_thresholds', '{"green": 300, "yellow": 600, "red": 900}', 'Color coding thresholds in seconds'),
  ('voice_commands_enabled', 'true', 'Enable voice command functionality'),
  ('auto_refresh_interval', '5000', 'Auto refresh interval in milliseconds'),
  ('max_orders_per_screen', '24', 'Maximum orders to display per screen'),
  ('sound_alerts_enabled', 'true', 'Enable sound alerts for new orders'),
  ('prediction_model_enabled', 'true', 'Enable AI prep time predictions');

-- Create indexes for performance
CREATE INDEX idx_kds_order_routing_order_station ON kds_order_routing(order_id, station_id);
CREATE INDEX idx_kds_order_routing_station_active ON kds_order_routing(station_id) WHERE completed_at IS NULL;
CREATE INDEX idx_kds_order_routing_routed_at ON kds_order_routing(routed_at);
CREATE INDEX idx_kds_metrics_station_date ON kds_metrics(station_id, shift_date);
CREATE INDEX idx_kds_metrics_recorded_at ON kds_metrics(recorded_at);

-- Enable Row Level Security
ALTER TABLE kds_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_order_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_configuration ENABLE ROW LEVEL SECURITY;

-- RLS Policies for KDS stations
CREATE POLICY "Users can view all KDS stations" ON kds_stations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage KDS stations" ON kds_stations
  FOR ALL TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    )
  );

-- RLS Policies for order routing
CREATE POLICY "Kitchen staff can view order routing" ON kds_order_routing
  FOR SELECT TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('cook', 'admin')
    )
  );

CREATE POLICY "Kitchen staff can update order routing" ON kds_order_routing
  FOR UPDATE TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('cook', 'admin')
    )
  );

CREATE POLICY "Kitchen staff can insert order routing" ON kds_order_routing
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('cook', 'admin')
    )
  );

-- RLS Policies for metrics
CREATE POLICY "Kitchen staff can view metrics" ON kds_metrics
  FOR SELECT TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('cook', 'admin')
    )
  );

CREATE POLICY "System can insert metrics" ON kds_metrics
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for configuration
CREATE POLICY "Kitchen staff can view KDS configuration" ON kds_configuration
  FOR SELECT TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('cook', 'admin')
    )
  );

CREATE POLICY "Admins can manage KDS configuration" ON kds_configuration
  FOR ALL TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    )
  );

-- Create function to automatically route new orders to appropriate stations
CREATE OR REPLACE FUNCTION auto_route_order_to_stations()
RETURNS trigger AS $$
BEGIN
  -- Route food orders to grill, then expo
  IF NEW.type = 'food' THEN
    INSERT INTO kds_order_routing (order_id, station_id, sequence)
    SELECT NEW.id, id, 1 FROM kds_stations WHERE type = 'grill' AND is_active = true;
    
    INSERT INTO kds_order_routing (order_id, station_id, sequence)
    SELECT NEW.id, id, 2 FROM kds_stations WHERE type = 'expo' AND is_active = true;
  END IF;
  
  -- Route beverage orders to bar
  IF NEW.type = 'beverage' THEN
    INSERT INTO kds_order_routing (order_id, station_id, sequence)
    SELECT NEW.id, id, 1 FROM kds_stations WHERE type = 'bar' AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-routing
CREATE TRIGGER trigger_auto_route_orders
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_route_order_to_stations();

-- Create function to calculate prep time metrics
CREATE OR REPLACE FUNCTION calculate_prep_time_metrics()
RETURNS trigger AS $$
BEGIN
  -- Calculate actual prep time when order is completed
  IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
    -- Insert prep time metric
    INSERT INTO kds_metrics (station_id, order_id, metric_type, value_seconds)
    VALUES (
      NEW.station_id,
      NEW.order_id,
      'prep_time',
      EXTRACT(EPOCH FROM (NEW.completed_at - NEW.routed_at))::INTEGER
    );
    
    -- Update the actual prep time in routing table
    NEW.actual_prep_time := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.routed_at))::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for metrics calculation
CREATE TRIGGER trigger_calculate_prep_metrics
  BEFORE UPDATE ON kds_order_routing
  FOR EACH ROW
  EXECUTE FUNCTION calculate_prep_time_metrics();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER trigger_kds_stations_updated_at
  BEFORE UPDATE ON kds_stations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_kds_order_routing_updated_at
  BEFORE UPDATE ON kds_order_routing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_kds_configuration_updated_at
  BEFORE UPDATE ON kds_configuration
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();