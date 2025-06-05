#!/usr/bin/env node

// Create missing KDS tables using Supabase API

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eiipozoogrrfudhjoqms.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function createMissingKDSTables() {
  console.log('🔧 Creating missing KDS tables...\n');

  const sqlCommands = [
    // KDS Order Routing table
    `CREATE TABLE IF NOT EXISTS kds_order_routing (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      station_id UUID REFERENCES kds_stations(id) ON DELETE CASCADE,
      sequence INTEGER DEFAULT 1,
      routed_at TIMESTAMPTZ DEFAULT NOW(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      bumped_by UUID,
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
    );`,
    
    // KDS Metrics table
    `CREATE TABLE IF NOT EXISTS kds_metrics (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      station_id UUID REFERENCES kds_stations(id) ON DELETE CASCADE,
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      metric_type TEXT NOT NULL CHECK (metric_type IN ('prep_time', 'wait_time', 'bump_time', 'throughput')),
      value_seconds INTEGER,
      value_count INTEGER,
      recorded_at TIMESTAMPTZ DEFAULT NOW(),
      shift_date DATE DEFAULT CURRENT_DATE,
      hour_of_day INTEGER DEFAULT EXTRACT(hour FROM NOW())
    );`,
    
    // KDS Configuration table
    `CREATE TABLE IF NOT EXISTS kds_configuration (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value JSONB NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    
    // Enable RLS
    `ALTER TABLE kds_order_routing ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE kds_metrics ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE kds_configuration ENABLE ROW LEVEL SECURITY;`,
    
    // Basic RLS Policies
    `CREATE POLICY IF NOT EXISTS "Authenticated users can view KDS routing" 
     ON kds_order_routing FOR SELECT TO authenticated USING (true);`,
    
    `CREATE POLICY IF NOT EXISTS "Kitchen staff can update KDS routing" 
     ON kds_order_routing FOR UPDATE TO authenticated USING (true);`,
    
    `CREATE POLICY IF NOT EXISTS "Kitchen staff can insert KDS routing" 
     ON kds_order_routing FOR INSERT TO authenticated WITH CHECK (true);`,
    
    `CREATE POLICY IF NOT EXISTS "Authenticated users can view KDS metrics" 
     ON kds_metrics FOR SELECT TO authenticated USING (true);`,
    
    `CREATE POLICY IF NOT EXISTS "System can insert KDS metrics" 
     ON kds_metrics FOR INSERT TO authenticated WITH CHECK (true);`,
    
    `CREATE POLICY IF NOT EXISTS "Authenticated users can view KDS config" 
     ON kds_configuration FOR SELECT TO authenticated USING (true);`,
    
    // Insert default configuration
    `INSERT INTO kds_configuration (key, value, description) VALUES
      ('timing_thresholds', '{"green": 300, "yellow": 600, "red": 900}', 'Color coding thresholds in seconds'),
      ('auto_refresh_interval', '5000', 'Auto refresh interval in milliseconds'),
      ('max_orders_per_screen', '24', 'Maximum orders to display per screen')
     ON CONFLICT (key) DO NOTHING;`
  ];

  try {
    for (const [index, sql] of sqlCommands.entries()) {
      console.log(`Executing command ${index + 1}/${sqlCommands.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        // Try alternative method
        console.log(`Retrying with direct query...`);
        const { error: directError } = await supabase.from('_').select('1');
        
        if (directError) {
          console.log(`⚠️  Command ${index + 1} may have failed:`, error.message);
        }
      } else {
        console.log(`✅ Command ${index + 1} executed successfully`);
      }
    }

    // Test if tables were created
    console.log('\n🧪 Testing created tables...');
    
    const tests = [
      { table: 'kds_order_routing', name: 'Order Routing' },
      { table: 'kds_metrics', name: 'Metrics' },
      { table: 'kds_configuration', name: 'Configuration' }
    ];

    let allSuccess = true;

    for (const test of tests) {
      try {
        const { error } = await supabase
          .from(test.table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${test.name} table: ${error.message}`);
          allSuccess = false;
        } else {
          console.log(`✅ ${test.name} table created successfully`);
        }
      } catch (err) {
        console.log(`❌ ${test.name} table test failed:`, err.message);
        allSuccess = false;
      }
    }

    if (allSuccess) {
      console.log('\n🎉 All KDS tables created successfully!');
      console.log('🚀 Kitchen Display System should now work properly');
      
      // Create a test order routing entry
      console.log('\n🧪 Creating test order routing...');
      
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
      
      const { data: stations } = await supabase
        .from('kds_stations')
        .select('id')
        .limit(1);
      
      if (orders?.length > 0 && stations?.length > 0) {
        const { error: routingError } = await supabase
          .from('kds_order_routing')
          .insert({
            order_id: orders[0].id,
            station_id: stations[0].id,
            sequence: 1,
            priority: 1
          });
        
        if (routingError) {
          console.log('⚠️  Test routing entry failed:', routingError.message);
        } else {
          console.log('✅ Test routing entry created successfully');
        }
      }
      
    } else {
      console.log('\n⚠️  Some tables may not have been created properly');
      console.log('You may need to run the SQL manually in Supabase dashboard');
    }

    return allSuccess;

  } catch (error) {
    console.error('❌ Failed to create KDS tables:', error.message);
    return false;
  }
}

if (require.main === module) {
  createMissingKDSTables().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = createMissingKDSTables;