# RLS Security Reference - Plate Restaurant System

## 🔐 Security Fix Overview

This document provides a comprehensive reference for the Row Level Security (RLS) policies implemented to fix the security vulnerability where anonymous users could access all restaurant data.

## 🚨 Security Issues Fixed

### Before the Fix
- ❌ Anonymous users could read all 12 tables
- ❌ Anonymous users could see all 44 seats
- ❌ Anonymous users could access all 5 orders
- ❌ Complete security bypass for sensitive data
- ❌ No guest role for demo users
- ❌ Inconsistent policy implementations

### After the Fix
- ✅ Anonymous users have limited read-only access to public data only
- ✅ Orders and user profiles are completely protected
- ✅ KDS system secured for kitchen staff only
- ✅ Guest role added for demo functionality
- ✅ Consistent role-based access control
- ✅ Real-time subscriptions secured

## 👥 User Roles and Permissions

### 🔑 Role Hierarchy

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | System administrators | Full access to everything |
| `server` | Wait staff | Orders, tables, seats management |
| `cook` | Kitchen staff | Orders, KDS system, tables (read) |
| `resident` | Restaurant customers | Own orders, table/seat info |
| `guest` | Anonymous demo users | Tables and seats (read-only) |

### 📊 Permission Matrix

| Table | Admin | Server | Cook | Resident | Guest (Anon) |
|-------|-------|--------|------|----------|--------------|
| **tables** | Full | Read/Update | Read | Read | Read |
| **seats** | Full | Read/Update | Read | Read | Read |
| **orders** | Full | Full | Read/Update | Own only | ❌ Blocked |
| **profiles** | Read | Read staff | Read staff | Own only | ❌ Blocked |
| **kds_stations** | Full | ❌ Blocked | Read/Update | ❌ Blocked | ❌ Blocked |
| **kds_order_routing** | Full | ❌ Blocked | Full | ❌ Blocked | ❌ Blocked |
| **kds_metrics** | Full | ❌ Blocked | Read/Insert | ❌ Blocked | ❌ Blocked |
| **kds_configuration** | Full | ❌ Blocked | Read | ❌ Blocked | ❌ Blocked |

## 🔒 RLS Policy Details

### Tables and Seats (Public Layout)
```sql
-- Anonymous users can view restaurant layout for demo
CREATE POLICY "Guests can read tables (demo access)"
  ON public.tables FOR SELECT TO anon USING (true);

-- All authenticated users can read based on their role
CREATE POLICY "Staff can read tables"
  ON public.tables FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles 
                 WHERE user_id = auth.uid() 
                 AND role IN ('server', 'cook', 'admin', 'resident')));
```

### Orders (Sensitive Data)
```sql
-- Residents can only see their own orders
CREATE POLICY "Residents can read their own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles 
                 WHERE user_id = auth.uid() AND role = 'resident')
         AND resident_id = auth.uid());

-- Staff can see all orders based on role
CREATE POLICY "Staff can read orders"
  ON public.orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles 
                 WHERE user_id = auth.uid() 
                 AND role IN ('admin', 'server', 'cook')));
```

### KDS System (Kitchen Only)
```sql
-- Only kitchen staff can access KDS features
CREATE POLICY "Kitchen staff can view KDS stations"
  ON public.kds_stations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles 
                 WHERE user_id = auth.uid() 
                 AND role IN ('cook', 'admin')));
```

## 🧪 Testing and Validation

### Quick Security Check
```bash
# Apply the security fix
./scripts/apply-rls-fix.sh

# Run application-level tests
npx ts-node scripts/test-rls-application.ts

# Run SQL-level tests
psql "$DATABASE_URL" -f test_rls_policies.sql
```

### Manual Testing Checklist

- [ ] **Anonymous Access Test**
  - [ ] Can view tables and seats ✅
  - [ ] Cannot view orders ❌
  - [ ] Cannot view profiles ❌
  - [ ] Cannot view KDS data ❌

- [ ] **Authenticated User Tests**
  - [ ] Admin can access everything ✅
  - [ ] Server can manage orders and tables ✅
  - [ ] Cook can access KDS and orders ✅
  - [ ] Resident can only see own orders ✅

- [ ] **Real-time Subscriptions**
  - [ ] Anonymous can subscribe to table changes ✅
  - [ ] Anonymous cannot subscribe to order changes ❌

## 🚀 Real-time Security

### Secure Subscription Patterns
```typescript
// ✅ SAFE: Anonymous user subscribing to public data
const tablesChannel = supabase
  .channel('tables')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'tables' },
    handleTableChange
  )

// ❌ BLOCKED: Anonymous user trying to subscribe to sensitive data
const ordersChannel = supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    handleOrderChange  // This will fail for anonymous users
  )
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Insufficient permissions" errors**
   - Check if RLS is properly enabled: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'table_name';`
   - Verify user has correct role in profiles table

2. **Anonymous users getting access denied**
   - Ensure anonymous access is granted: `GRANT SELECT ON public.tables TO anon;`
   - Check if policies allow `anon` role

3. **Real-time subscriptions not working**
   - Verify RLS policies allow the subscription
   - Check if user has proper authentication

### Debug Queries
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables t 
JOIN pg_class c ON c.relname = t.tablename 
WHERE schemaname = 'public';

-- List all policies
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Test user role
SELECT role FROM public.profiles WHERE user_id = auth.uid();
```

## 📈 Monitoring and Maintenance

### Regular Security Audits
- Run test scripts monthly
- Monitor for new tables that need RLS
- Review access patterns in application logs
- Update policies when adding new features

### Performance Considerations
- RLS policies add query overhead
- Monitor query performance with EXPLAIN
- Consider indexing on frequently checked columns (user_id, role)
- Use connection pooling for better performance

## 🔗 Related Files

- `fix_rls_security.sql` - Main security fix script
- `test_rls_policies.sql` - SQL-level validation tests
- `scripts/test-rls-application.ts` - Application-level tests
- `scripts/apply-rls-fix.sh` - Automated application script

## 📞 Support

If you encounter issues with the RLS policies:

1. Check the troubleshooting section above
2. Run the test scripts to identify specific issues
3. Review the policy definitions in the SQL files
4. Ensure your application code handles authentication properly

Remember: **Security is a process, not a one-time fix**. Regular testing and monitoring are essential.