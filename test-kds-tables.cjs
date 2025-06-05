#!/usr/bin/env node

// Test if KDS tables exist

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eiipozoogrrfudhjoqms.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function testKDSTables() {
  console.log('🧪 Testing KDS tables...\n');

  try {
    // Test 1: KDS Stations
    console.log('1. Testing kds_stations table...');
    const { data: stations, error: stationsError } = await supabase
      .from('kds_stations')
      .select('*')
      .limit(5);
    
    if (stationsError) {
      console.log('❌ KDS stations error:', stationsError.message);
    } else {
      console.log(`✅ Found ${stations.length} KDS stations`);
      if (stations.length > 0) {
        console.log(`   Sample station: ${stations[0].name} (${stations[0].type})`);
      }
    }

    // Test 2: KDS Order Routing
    console.log('\n2. Testing kds_order_routing table...');
    const { data: routing, error: routingError } = await supabase
      .from('kds_order_routing')
      .select('*')
      .limit(5);
    
    if (routingError) {
      console.log('❌ KDS routing error:', routingError.message);
    } else {
      console.log(`✅ Found ${routing.length} KDS routing entries`);
    }

    // Test 3: KDS Metrics
    console.log('\n3. Testing kds_metrics table...');
    const { data: metrics, error: metricsError } = await supabase
      .from('kds_metrics')
      .select('*')
      .limit(5);
    
    if (metricsError) {
      console.log('❌ KDS metrics error:', metricsError.message);
    } else {
      console.log(`✅ Found ${metrics.length} KDS metrics`);
    }

    // Test 4: KDS Configuration
    console.log('\n4. Testing kds_configuration table...');
    const { data: config, error: configError } = await supabase
      .from('kds_configuration')
      .select('*')
      .limit(5);
    
    if (configError) {
      console.log('❌ KDS configuration error:', configError.message);
    } else {
      console.log(`✅ Found ${config.length} KDS configuration entries`);
    }

    const tablesExist = !stationsError && !routingError && !metricsError && !configError;
    
    if (tablesExist) {
      console.log('\n✅ All KDS tables exist!');
      if (stations.length === 0) {
        console.log('⚠️  But no stations configured - creating default stations...');
        await createDefaultStations();
      }
    } else {
      console.log('\n❌ KDS tables are missing - need to create them');
      console.log('\n📋 SQL to create KDS tables:');
      console.log('Run this in Supabase SQL editor:');
      console.log('🔗 https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/sql\n');
      console.log(getKDSTableSQL());
    }

    return tablesExist;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function createDefaultStations() {
  try {
    const defaultStations = [
      { name: 'Grill Station', type: 'grill', position: 1, color: '#EF4444', is_active: true },
      { name: 'Fryer Station', type: 'fryer', position: 2, color: '#F59E0B', is_active: true },
      { name: 'Salad Station', type: 'salad', position: 3, color: '#10B981', is_active: true },
      { name: 'Expo Station', type: 'expo', position: 4, color: '#8B5CF6', is_active: true },
      { name: 'Bar Station', type: 'bar', position: 5, color: '#06B6D4', is_active: true },
    ];

    const { data, error } = await supabase
      .from('kds_stations')
      .insert(defaultStations)
      .select();

    if (error) {
      console.log('❌ Failed to create default stations:', error.message);
    } else {
      console.log(`✅ Created ${data.length} default KDS stations`);
    }
  } catch (error) {
    console.log('❌ Error creating default stations:', error.message);
  }
}

function getKDSTableSQL() {
  return `
-- KDS Stations table for managing different kitchen stations
CREATE TABLE kds_stations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('grill', 'fryer', 'salad', 'expo', 'bar', 'prep', 'dessert')),
  position INTEGER DEFAULT 1,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KDS Order Routing table for tracking orders through stations
CREATE TABLE kds_order_routing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  station_id UUID REFERENCES kds_stations(id) ON DELETE CASCADE,
  sequence INTEGER DEFAULT 1,
  routed_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  bumped_by UUID REFERENCES profiles(user_id),
  bumped_at TIMESTAMPTZ,
  recalled_at TIMESTAMPTZ,
  recall_count INTEGER DEFAULT 0,
  estimated_prep_time INTEGER,
  actual_prep_time INTEGER,
  notes TEXT,
  priority INTEGER DEFAULT 0,
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
  value_seconds INTEGER,
  value_count INTEGER,
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

-- Enable Row Level Security
ALTER TABLE kds_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_order_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_configuration ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic read access for authenticated users)
CREATE POLICY "Authenticated users can view KDS stations" ON kds_stations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view KDS routing" ON kds_order_routing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Kitchen staff can update KDS routing" ON kds_order_routing FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Kitchen staff can insert KDS routing" ON kds_order_routing FOR INSERT TO authenticated WITH CHECK (true);
`;
}

if (require.main === module) {
  testKDSTables().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testKDSTables;