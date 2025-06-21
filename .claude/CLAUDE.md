# Plate Restaurant

## Commands
npm run dev:clean
npm run test:quick
npm run build

## Auth Pattern
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth')

## ✅ COMPLETED
- Bundle: 289MB → 15.5MB (excludes dev cache)
- Missing: @playwright/test (added)
- TODO: server-client.tsx:410 (order creation implemented)
- Guest selection error (fixed)
- Voice recording loop error (fixed)

## Current Status
- Core functionality: ✅ Working
- Test infrastructure: ✅ Restored  
- Bundle optimization: ✅ Under target
- Order placement: ✅ Both manual & voice
- Error handling: ✅ Improved