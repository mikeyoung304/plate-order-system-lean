# Daily Beta Test - Plate Restaurant System

## Quick Health Check (5 minutes)

Run this checklist every day before beta testers access the system.

### 🚀 **Pre-Flight Check**

#### 1. Start System
```bash
# Start development server
npm run dev

# Verify server running (should show port number)
# Expected: ✓ Ready in ~1s on http://localhost:3000+
```

#### 2. Type Safety Check
```bash
# Check for breaking TypeScript errors
npm run type-check

# Expected: No output = all good ✅
# Any errors = STOP and fix immediately 🚨
```

#### 3. Build Validation
```bash
# Ensure production build works
npm run build

# Expected: ✓ Compiled successfully
# Bundle sizes should be under 350KB per route
```

### 🔍 **Critical Path Testing**

#### Test 1: Guest Demo Flow (2 minutes)
1. **Visit**: http://localhost:3000
2. **Click**: "🚀 Try Demo (Auto-Fill & Login)" button
3. **Verify**: 
   - ✅ Credentials auto-fill (`guest@restaurant.plate` / `guest123`)
   - ✅ Login successful
   - ✅ Dashboard loads with server/kitchen/admin options

**❌ STOP IF**: Button doesn't work, blank screen, or login fails

#### Test 2: Server Flow (1 minute)
1. **Navigate**: Click "Server View" from dashboard
2. **Verify**:
   - ✅ Floor plan displays with tables
   - ✅ Tables are clickable (try clicking one)
   - ✅ No console errors in browser dev tools

**❌ STOP IF**: Blank floor plan, unclickable tables, or console errors

#### Test 3: Kitchen Display (1 minute)
1. **Navigate**: Go to /kitchen/kds
2. **Verify**:
   - ✅ Kitchen display loads
   - ✅ "No orders" or order cards visible
   - ✅ Real-time connection indicator shows "connected"

**❌ STOP IF**: Page crashes, infinite loading, or connection failed

#### Test 4: Admin Panel (1 minute)
1. **Navigate**: Go to /admin
2. **Verify**:
   - ✅ Analytics tab loads with mock data
   - ✅ Floor Plan tab shows editor (may take 2-3s to load)
   - ✅ No JavaScript errors in console

**❌ STOP IF**: Admin panel blank, floor plan doesn't load, or errors

### 📱 **Mobile Check** (Optional - 1 minute)
1. **Open**: Chrome DevTools (F12)
2. **Toggle**: Device simulation (phone icon)
3. **Test**: Guest demo on mobile view
4. **Verify**: Responsive layout, buttons work on touch

### 🛠 **Emergency Fixes**

#### If Guest Demo Fails:
```bash
# Check guest account exists
# Run guest setup script
npm run setup-guest

# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### If Database Connection Fails:
```bash
# Check Supabase status
curl -I https://eiipozoogrrfudhjoqms.supabase.co/rest/v1/

# Should return: HTTP/2 200
```

#### If Build Fails:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies if needed
npm ci

# Try build again
npm run build
```

## 📊 **Daily Metrics to Track**

### Performance Metrics
- [ ] **Build Time**: Should be under 30 seconds
- [ ] **Bundle Size**: Admin route should be ~195KB
- [ ] **Load Time**: Pages should load in under 2 seconds
- [ ] **Console Errors**: Should be zero on critical paths

### Functionality Metrics  
- [ ] **Guest Demo**: Works 100% of the time
- [ ] **Server Flow**: Table selection functional
- [ ] **Kitchen Display**: Real-time connection stable
- [ ] **Admin Panel**: All tabs load successfully

### User Experience Metrics
- [ ] **Mobile Responsive**: Buttons and layout work on mobile
- [ ] **Loading States**: No blank screens during data fetch
- [ ] **Error Handling**: Graceful fallbacks for failures
- [ ] **Navigation**: All major routes accessible

## 🚨 **Red Flags - Stop Beta Testing**

### Critical Issues (Fix Immediately):
- **Guest demo button broken** - Beta users can't access system
- **Server page blank** - Core functionality unavailable  
- **Database connection failed** - No data persistence
- **Console errors on load** - Indicates breaking bugs
- **Mobile layout broken** - Unusable on tablets

### Warning Issues (Fix Same Day):
- Slow loading (>3 seconds for any page)
- Kitchen display disconnection issues
- Admin panel components not loading
- Minor UI glitches or alignment issues

## 📝 **Daily Beta Report Template**

```
Date: [YYYY-MM-DD]

🚀 Pre-Flight Check:
- [ ] Dev server started successfully
- [ ] TypeScript compilation clean  
- [ ] Production build successful
- [ ] Bundle sizes within limits

🔍 Critical Path Testing:
- [ ] Guest demo flow: ✅/❌
- [ ] Server view functionality: ✅/❌  
- [ ] Kitchen display: ✅/❌
- [ ] Admin panel: ✅/❌

📱 Mobile Testing:
- [ ] Responsive layout: ✅/❌
- [ ] Touch interactions: ✅/❌

⚠️ Issues Found:
[List any problems discovered]

✅ Ready for Beta Users: YES/NO

🔧 Actions Taken:
[Any fixes applied]

Next Focus:
[Areas needing attention]
```

## 🎯 **Success Criteria**

### Green Light for Beta Testing:
- ✅ All critical paths working
- ✅ No console errors on major routes
- ✅ Guest demo flow 100% functional
- ✅ Mobile responsive layout working
- ✅ Performance metrics within targets

### Quality Standards:
- **Reliability**: 99%+ uptime during beta hours
- **Performance**: <2s page load times
- **Usability**: Zero-click demo access working
- **Mobile**: Tablet-friendly interface confirmed

## 📞 **Emergency Contacts**

### Critical Bug Protocol:
1. **Document**: Screenshot + console errors
2. **Isolate**: Identify affected features
3. **Communicate**: Notify beta users of known issues
4. **Fix**: Deploy hotfix within 2 hours
5. **Verify**: Run full daily test after fix

### Quick Fixes Reference:
- **Guest Login Issues**: Check auth credentials
- **Database Problems**: Verify Supabase connection
- **Build Failures**: Clear cache and rebuild
- **Performance Issues**: Check bundle analyzer

---

## 📋 **Weekly Summary**

Track daily results for weekly pattern analysis:

| Day | Guest Demo | Server View | Kitchen | Admin | Mobile | Issues |
|-----|------------|-------------|---------|-------|--------|--------|
| Mon |     ✅     |      ✅     |    ✅   |   ✅  |   ✅   |   0    |
| Tue |     ✅     |      ✅     |    ✅   |   ✅  |   ✅   |   0    |
| Wed |     ✅     |      ✅     |    ✅   |   ✅  |   ✅   |   0    |
| Thu |     ✅     |      ✅     |    ✅   |   ✅  |   ✅   |   0    |
| Fri |     ✅     |      ✅     |    ✅   |   ✅  |   ✅   |   0    |

**Target**: 100% green across all categories for successful beta week.

---

**Remember**: Beta users trust us to provide a working system. This daily check ensures we never let them down! 🛡️