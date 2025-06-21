# Plate Restaurant System

## 🚀 Quick Commands
npm run dev:clean       # Fresh development start
npm run test:quick      # Fast validation (unit + lint + types)
npm run build          # Production build
npm run demo:setup     # Demo environment
npm run analyze        # Bundle analysis

## 🔒 Critical Patterns
SERVER-FIRST AUTH ONLY:
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth')
```
NEVER: getSession(), client-side auth, AuthContext

## 📁 Architecture
lib/modassembly/supabase/  # Use these modules ONLY
├── auth/                  # Server-side auth
├── database/              # Domain operations
├── server.ts             # Server client
└── middleware.ts         # Session handling

components/               # Organized by domain
├── ui/                  # Reusable primitives
├── kds/                 # Kitchen display
├── voice/               # Voice ordering
└── floor-plan/          # Table management

## ⚡ Performance
- Bundle: Currently 289MB → Target <100MB
- Render: <500ms for 100 orders
- Real-time: <200ms latency
- Component limit: 200 lines max

## 🧪 Testing
- Coverage: 80% minimum (90% critical paths)
- Fix needed: npm install @playwright/test
- Strategy: Unit → Integration → E2E → Performance

## 🎯 Current Focus
- [ ] Fix test infrastructure
- [ ] Optimize bundle size
- [ ] Complete order creation in server
- [ ] Break down 4 oversized components