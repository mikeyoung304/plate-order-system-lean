# Database Test Credentials

## Test User Accounts

### Admin Account
- **Email**: guest@restaurant.plate
- **Password**: guestpassword123
- **Role**: admin
- **Access**: Full system access, floor plan management

### Server Account  
- **Email**: testserver@restaurant.plate
- **Password**: testpassword123
- **Role**: server
- **Access**: Take orders, view tables, access voice ordering

### Resident Accounts
- **Email**: john.doe@resident.plate
- **Password**: resident123
- **Role**: resident
- **Name**: John Doe

- **Email**: jane.smith@resident.plate
- **Password**: resident123
- **Role**: resident
- **Name**: Jane Smith

- **Email**: bob.johnson@resident.plate
- **Password**: resident123
- **Role**: resident
- **Name**: Bob Johnson

## Database Status

✅ **Connection**: Functional
✅ **Tables**: 6 tables with 30 seats total
✅ **Residents**: 5 resident profiles available
✅ **Authentication**: Working with RLS policies
✅ **fetchTables Function**: Fixed and functional
✅ **Server Page Data**: Ready to load

## Quick Test

To test the database connection:

1. Navigate to the server page: `/server`
2. Login with admin or server credentials
3. Tables should load and be visible on the floor plan
4. Residents should be available for selection when placing orders

## Issues Resolved

1. ✅ Fixed `floor_plan_id` column reference in useServerPageData hook
2. ✅ Fixed table schema mapping (label vs name, type vs shape)
3. ✅ Seeded database with tables and seats
4. ✅ Created test users with proper roles
5. ✅ Verified RLS policies are working correctly