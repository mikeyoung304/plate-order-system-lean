# 🚀 QUICK DATABASE SETUP (5 Minutes)

## You're missing the database tables! Here's the fastest fix:

### Step 1: Open Supabase SQL Editor

Click this link: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/sql/new

### Step 2: Run Combined Migration

1. Open the file: `run-all-migrations.sql` in your project
2. Copy ALL the contents
3. Paste into the SQL Editor
4. Click the green "Run" button

### Step 3: Update Your User Role (Important!)

After migrations complete, run this to make yourself admin:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

### Step 4: Test Your App

1. Go back to http://localhost:3000
2. Log out and log back in
3. You should now see all options: Server, Kitchen, Expo, Admin

## What This Creates:

- ✅ All database tables
- ✅ User roles system
- ✅ Floor plan with demo tables
- ✅ Order management system
- ✅ Kitchen display system

## Still Having Issues?

Check if your Supabase project is active:
https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms

If it says "Paused", click "Restore" first!
