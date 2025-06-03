# Supabase Setup Guide (#heyluis Backend Operations)

## Complete Supabase Configuration for Plate Restaurant System

This guide covers the complete setup and configuration of the Supabase backend infrastructure for the Plate Restaurant System.

## Project Information

- **Supabase Project ID**: `eiipozoogrrfudhjoqms`
- **Database**: PostgreSQL 15 with real-time enabled
- **Authentication**: Supabase Auth with custom roles
- **Storage**: Configured for audio files (voice recordings)

## Initial Setup

### 1. Environment Variables

```bash
# .env.local (required for development)
NEXT_PUBLIC_SUPABASE_URL=https://eiipozoogrrfudhjoqms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Additional for direct PostgreSQL access
SUPABASE_DB_PASSWORD=your_database_password
```

### 2. Database Connection Information

```bash
# Direct PostgreSQL connection (for advanced operations)
Host: db.eiipozoogrrfudhjoqms.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [from Supabase dashboard]
```

## Database Schema Setup

### Core Tables Migration

Run these migrations in the Supabase SQL editor:

```sql
-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 2. Create custom types
CREATE TYPE app_role AS ENUM ('admin', 'server', 'cook', 'resident');

-- 3. Core tables
CREATE TABLE profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role app_role NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE tables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id text UNIQUE NOT NULL,
  label text NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'available',
  position_x numeric DEFAULT 100,
  position_y numeric DEFAULT 100,
  width numeric DEFAULT 100,
  height numeric DEFAULT 80,
  rotation numeric DEFAULT 0,
  z_index integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE seats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id uuid REFERENCES tables(id) ON DELETE CASCADE,
  seat_id text UNIQUE NOT NULL,
  label text NOT NULL,
  resident_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  position_x numeric DEFAULT 0,
  position_y numeric DEFAULT 0,
  is_occupied boolean DEFAULT false,
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id uuid REFERENCES tables(id) ON DELETE CASCADE,
  seat_id uuid REFERENCES seats(id) ON DELETE CASCADE,
  resident_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  server_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  items jsonb NOT NULL,
  transcript text,
  special_requests text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'ready', 'delivered', 'cancelled')),
  type text NOT NULL CHECK (type IN ('food', 'beverage', 'dessert')),
  estimated_time integer,
  actual_time integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### KDS System Tables

```sql
-- Kitchen Display System
CREATE TABLE kds_stations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text CHECK (type IN ('grill','fryer','salad','expo','bar','prep','dessert')),
  position integer DEFAULT 1,
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE kds_order_routing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  station_id uuid REFERENCES kds_stations(id) ON DELETE CASCADE,
  sequence integer DEFAULT 1,
  routed_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  bumped_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  bumped_at timestamptz,
  recalled_at timestamptz,
  recall_count integer DEFAULT 0,
  estimated_prep_time integer,
  actual_prep_time integer,
  notes text,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_order_station UNIQUE(order_id, station_id)
);

CREATE TABLE kds_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id uuid REFERENCES kds_stations(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  value_seconds integer,
  recorded_at timestamptz DEFAULT now()
);
```

### Database Triggers and Functions

```sql
-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kds_routing_updated_at BEFORE UPDATE ON kds_order_routing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-route orders to KDS stations
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

CREATE TRIGGER trigger_auto_route_orders
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_route_order_to_stations();
```

## Performance Indexes

```sql
-- Core performance indexes
CREATE INDEX CONCURRENTLY orders_status_created_at ON orders(status, created_at);
CREATE INDEX CONCURRENTLY orders_type_status ON orders(type, status);
CREATE INDEX CONCURRENTLY orders_table_seat_status ON orders(table_id, seat_id, status);
CREATE INDEX CONCURRENTLY orders_items_gin ON orders USING GIN (items);
CREATE INDEX CONCURRENTLY orders_resident_created_at ON orders(resident_id, created_at) WHERE resident_id IS NOT NULL;

-- KDS system indexes
CREATE INDEX CONCURRENTLY idx_kds_order_routing_order_station ON kds_order_routing(order_id, station_id);
CREATE INDEX CONCURRENTLY idx_kds_order_routing_station_active ON kds_order_routing(station_id) WHERE completed_at IS NULL;
CREATE INDEX CONCURRENTLY idx_kds_order_routing_routed_at ON kds_order_routing(routed_at);
CREATE INDEX CONCURRENTLY idx_kds_routing_priority_routed ON kds_order_routing(priority DESC, routed_at ASC) WHERE completed_at IS NULL;

-- Table and seat indexes
CREATE INDEX CONCURRENTLY idx_tables_status_occupied ON tables(status) WHERE status = 'occupied';
CREATE INDEX CONCURRENTLY idx_seats_table_id ON seats(table_id);
CREATE INDEX CONCURRENTLY idx_seats_resident_id ON seats(resident_id) WHERE resident_id IS NOT NULL;
```

## Row Level Security (RLS) Setup

### Enable RLS on all tables

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_order_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE kds_metrics ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

```sql
-- Profiles: Users can read all, update own
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage profiles" ON profiles
  FOR ALL TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
  );

-- Tables: Public read, admin write
CREATE POLICY "Users can view all tables" ON tables
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage tables" ON tables
  FOR ALL TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
  );

-- Seats: Public read, admin write
CREATE POLICY "Users can view all seats" ON seats
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage seats" ON seats
  FOR ALL TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
  );

-- Orders: Role-based access
CREATE POLICY "Staff can view orders" ON orders
  FOR SELECT TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'server', 'cook')
    )
  );

CREATE POLICY "Servers can create orders" ON orders
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'server')
    )
  );

CREATE POLICY "Staff can update orders" ON orders
  FOR UPDATE TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'server', 'cook')
    )
  );

-- KDS: Kitchen staff access
CREATE POLICY "Kitchen staff can access KDS stations" ON kds_stations
  FOR ALL TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'cook')
    )
  );

CREATE POLICY "Kitchen staff can access KDS routing" ON kds_order_routing
  FOR ALL TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'cook')
    )
  );

CREATE POLICY "Kitchen staff can access KDS metrics" ON kds_metrics
  FOR ALL TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'cook')
    )
  );
```

## Real-time Configuration

### Enable Real-time for Tables

```sql
-- Enable real-time replication
ALTER publication supabase_realtime ADD TABLE orders;
ALTER publication supabase_realtime ADD TABLE kds_order_routing;
ALTER publication supabase_realtime ADD TABLE tables;
ALTER publication supabase_realtime ADD TABLE seats;
```

### Real-time Security

```sql
-- Add real-time RLS policies
CREATE POLICY "Real-time orders access" ON orders
  FOR SELECT TO authenticated USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role IN ('admin', 'server', 'cook')
    )
  );
```

## Authentication Setup

### Custom Claims and Roles

```sql
-- Function to set user role after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'server')::app_role,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Demo User Setup

```sql
-- Create demo users (run in Supabase dashboard)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'admin@restaurant.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "admin", "name": "Admin User"}'::jsonb
);
```

## Storage Configuration

### Audio Files Bucket

```sql
-- Create storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', false);

-- Storage policies
CREATE POLICY "Audio upload for authenticated users" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audio-recordings');

CREATE POLICY "Audio access for authenticated users" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'audio-recordings');
```

## Monitoring and Maintenance

### Performance Monitoring Queries

```sql
-- Monitor query performance
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Monitor active connections
SELECT
  state,
  COUNT(*)
FROM pg_stat_activity
GROUP BY state;

-- Monitor table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup Strategy

```bash
# Daily backup script
pg_dump -h db.eiipozoogrrfudhjoqms.supabase.co \
        -U postgres \
        -d postgres \
        --clean --if-exists \
        > backup_$(date +%Y%m%d).sql

# Point-in-time recovery (available via Supabase dashboard)
# - Automatic backups every 4 hours
# - 30-day retention period
```

## Troubleshooting

### Common Issues

1. **Connection Issues**

```bash
# Test connection
psql -h db.eiipozoogrrfudhjoqms.supabase.co -U postgres -d postgres

# Check connection limits
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

2. **RLS Policy Debug**

```sql
-- Test RLS policies
SET role authenticated;
SELECT * FROM orders; -- Should respect RLS
RESET role;
```

3. **Real-time Issues**

```sql
-- Check real-time publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Add table to real-time
ALTER publication supabase_realtime ADD TABLE your_table;
```

### Performance Optimization

```sql
-- Analyze table statistics
ANALYZE orders;
ANALYZE kds_order_routing;

-- Vacuum maintenance
VACUUM ANALYZE orders;
VACUUM ANALYZE kds_order_routing;

-- Reindex if needed
REINDEX INDEX CONCURRENTLY orders_status_created_at;
```

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Policies tested for each role
- [ ] Service role key secured
- [ ] Database password rotated
- [ ] Storage policies configured
- [ ] Real-time security verified
- [ ] Backup encryption enabled
- [ ] Connection limits configured

## Environment-Specific Configuration

### Development

- Use anon key for client connections
- Enable statement logging
- Relaxed connection limits

### Production

- Secure service role key storage
- Enable connection pooling
- Monitor performance metrics
- Regular security audits
