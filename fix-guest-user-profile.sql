-- ===============================================
-- CRITICAL FIX: Add Guest User Profile
-- This fixes the RLS access issue after authentication
-- ===============================================

-- Add guest user profile with admin role for demo access
INSERT INTO public.profiles (user_id, role, name, created_at, updated_at) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'guest@restaurant.plate'),
  'admin',
  'Demo Guest User',
  NOW(),
  NOW()
) 
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'admin',
  name = 'Demo Guest User',
  updated_at = NOW();

-- Verify the guest user profile was created
SELECT 
  p.user_id,
  p.role,
  p.name,
  u.email,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'guest@restaurant.plate';

-- Expected result: One row showing guest user with admin role