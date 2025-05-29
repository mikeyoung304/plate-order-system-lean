# 🔧 Fix Supabase RLS & WebSocket Issues

## The Good News:
✅ Your Supabase tables exist!
✅ Your credentials are correct!

## The Issues:
1. **Row Level Security (RLS)** is blocking data access
2. **WebSocket/Realtime** connection failing
3. **User role** might not be set properly

## Quick Fixes:

### 1. Check Your User's Role
First, let's see what role your user has:

```sql
-- Run this in Supabase SQL Editor
-- Replace with your actual email
SELECT 
  u.email,
  p.role,
  p.id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'your-email@example.com';
```

### 2. Update Your Profile Role
If role is null or not 'server'/'admin':

```sql
-- First, make sure profile exists
INSERT INTO profiles (id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';
```

### 3. Fix RLS Policies (Temporary)
For testing, you can temporarily disable RLS:

```sql
-- WARNING: Only for testing! Re-enable in production
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE seats DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

### 4. Enable Realtime
```sql
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE seats;
```

### 5. Check If KDS Tables Exist
The server page might be looking for KDS tables:

```sql
-- Check if these exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'kds%';
```

If they don't exist, run:
`supabase/migrations/20250527000001_create_kds_system.sql`

## After Fixes:

1. **Log out** at http://localhost:3000
2. **Log back in**
3. **Try Server page again**

## Alternative: Simplified Server Page

If still having issues, I can create a simplified server page that:
- Doesn't use realtime
- Has better error handling
- Works without all features initially

Would you like me to create that?