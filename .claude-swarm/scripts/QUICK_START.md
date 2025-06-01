# 🚀 Beta Test Script - Quick Start

## One-Liner Usage

```bash
# Run every morning before coding
./.claude-swarm/scripts/beta-test-checklist.sh
```

## Expected Output

### ✅ **Success (Ready for Beta)**
```
🛡️ Daily Beta Test Checklist - Plate Restaurant System
=======================================================

🔍 Pre-Flight System Check
✅ Node.js v24.1.0 installed
✅ Dependencies installed correctly  
✅ Environment variables configured

🔧 Code Quality Checks
✅ TypeScript compilation clean
✅ Production build successful
✅ Bundle sizes within tablet limits (<1MB)

🚀 Development Server Check
✅ Server running on port 3010

🎯 Critical Path Testing
✅ Main page accessible
✅ Auth API responding

📊 Database Connection Check
✅ Supabase connection successful

📱 Performance Check
✅ No framer-motion imports found

🛡️ Security Check
✅ No obvious security issues found

📋 Summary Report
==================
Test completed in 12 seconds

✅ ALL CHECKS PASSED - READY FOR BETA TESTING!

🎯 Next steps:
   • Start coding with confidence
   • Beta testers can safely access the system
   • System accessible at: http://localhost:3010
```

### ❌ **Failure (Fix Before Beta)**
```
❌ 3 ISSUES FOUND - FIX BEFORE BETA TESTING

🚨 Required actions:
   • Fix all issues marked with ❌
   • Address warnings marked with ⚠️  
   • Re-run this script after fixes
   • Do not allow beta testers until all issues resolved
```

## Integration with Your Daily Routine

### 1. **Morning (Before Coding)**
```bash
./.claude-swarm/scripts/beta-test-checklist.sh
```
- ✅ Pass = Start coding
- ❌ Fail = Fix issues first

### 2. **Before Each Feature**
Activate Test Guardian:
> "Check what could break if I change [feature]"

### 3. **After Each Change**
```bash
npm run type-check
# Test in browser
# Check console for errors
```

### 4. **Before Commit**
```bash
./.claude-swarm/scripts/beta-test-checklist.sh
# Must pass before git commit
```

### 5. **End of Day**
```bash
./.claude-swarm/scripts/beta-test-checklist.sh
# Document results
```

## What It Checks

- ✅ **System Health**: Node, dependencies, environment
- ✅ **Code Quality**: TypeScript, builds, bundle size
- ✅ **Server Status**: Development server running
- ✅ **Database**: Supabase connectivity
- ✅ **Performance**: Bundle optimization
- ✅ **Security**: No exposed secrets

## Quick Fixes

### TypeScript Errors
```bash
npm run type-check
# Fix reported errors
```

### Build Failures
```bash
rm -rf .next && npm run build
```

### Server Issues
```bash
pkill -f "next dev" && npm run dev
```

### Environment Problems
```bash
# Check .env file exists and has required variables
```

---

**Remember**: Green = Go, Red = Stop and fix! 🛡️