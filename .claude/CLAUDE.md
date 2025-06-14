# Plate Restaurant

## Commands
npm run dev:clean
npm run test:quick
npm run build

## Auth Pattern
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth')

## Fix These
- Bundle: 289MB → <100MB
- Missing: @playwright/test
- TODO: server-client.tsx:410