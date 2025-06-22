-- MINIMAL GUEST USER FIX (Luis-Aligned)
-- Single UPDATE to fix role mismatch: guest_admin → admin

-- Fix guest user role to match database enum (admin, server, cook, resident)
UPDATE public.profiles 
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'guest@restaurant.plate');

-- If guest user profile doesn't exist, create it
INSERT INTO public.profiles (user_id, role, name)
SELECT 
  id,
  'admin',
  'Demo Guest User'
FROM auth.users 
WHERE email = 'guest@restaurant.plate'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.users.id
  );

-- Verify the fix
SELECT 
  u.email,
  p.role,
  p.name,
  'Role matches database enum: admin ✅' as status
FROM auth.users u
JOIN public.profiles p ON u.id = p.user_id  
WHERE u.email = 'guest@restaurant.plate';

-- Expected result: guest@restaurant.plate with role = 'admin'