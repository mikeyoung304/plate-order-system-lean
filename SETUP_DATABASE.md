# 🚨 DATABASE SETUP REQUIRED!

## The Problem:
Your Supabase database is empty! The tables don't exist yet, which is why:
- You only see Server/Expo options (no role check working)
- Server page crashes (no tables to query)
- WebSocket errors (no tables to watch)

## Quick Fix - Run Migrations:

### Option 1: Via Supabase Dashboard (Easiest)

1. **Open SQL Editor:**
   https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/sql/new

2. **Run each migration in order:**
   
   Copy and paste each file's contents in this exact order:
   
   a) `supabase/migrations/20250511210425_setup_rbac.sql`
   b) `supabase/migrations/20250511222049_user_roles_permission.sql`
   c) `supabase/migrations/20250511222516_user_role_assignment.sql`
   d) `supabase/migrations/20250512164938_tables_seats.sql`
   e) `supabase/migrations/20250512204529_orders.sql`
   f) `supabase/migrations/20250517230648_profiles.sql`
   g) `supabase/migrations/20250527000000_seed_initial_tables.sql`
   h) `supabase/migrations/20250527000001_create_kds_system.sql`

3. **Click "Run" for each one**

### Option 2: All-in-One Script

1. Go to: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/sql/new

2. Copy and paste everything from the file I'm creating below:
   `run-all-migrations.sql`

3. Click "Run"

## After Running Migrations:

1. **Create a test user with admin role:**
   ```sql
   -- Run this after migrations
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
   ```

2. **Enable Realtime (optional):**
   ```sql
   ALTER TABLE orders REPLICA IDENTITY FULL;
   ALTER TABLE tables REPLICA IDENTITY FULL;
   ALTER TABLE seats REPLICA IDENTITY FULL;
   ALTER TABLE kds_order_routing REPLICA IDENTITY FULL;
   ```

3. **Refresh your app** and login again

## You'll Know It Worked When:
- ✅ No more WebSocket errors
- ✅ Dashboard shows all role options
- ✅ Server page loads without crashing
- ✅ Tables appear in floor plan

## Need Help?
The migrations create:
- User roles system (admin, server, cook, resident)
- Tables and seats for floor plan
- Orders system
- Kitchen display system (KDS)
- Initial demo data