# Beta Testing Scripts

## 🚀 Quick Start

```bash
# Run daily morning check
./.claude-swarm/scripts/beta-test-checklist.sh

# Expected output: All checks passed ✅
# If issues found: Fix them before beta testing
```

## 📋 What the Script Checks

### 🔍 **Pre-Flight System Check**

- Node.js installation and version
- NPM dependencies integrity
- Environment variables configuration
- Basic project structure

### 🔧 **Code Quality Checks**

- TypeScript compilation (no errors)
- Production build success
- Bundle size optimization (<500KB limit)
- Code quality standards

### 🚀 **Development Server Check**

- Auto-detects running server (ports 3000-3010)
- Starts server if needed
- Validates server responses
- Tests critical API endpoints

### 📊 **Database Connection Check**

- Supabase connectivity test
- API key validation
- Basic endpoint accessibility
- Connection stability

### 📱 **Performance Check**

- Framer-motion usage detection
- Bundle size analysis
- Build output validation
- Performance regression detection

### 🛡️ **Security Check**

- Exposed secrets detection
- Hardcoded credentials scanning
- Security best practices validation
- Sensitive data exposure prevention

## 🎯 **Usage Scenarios**

### Morning Routine (Before Coding)

```bash
./.claude-swarm/scripts/beta-test-checklist.sh
```

**Expected Result**: All green ✅ = Safe to start development

### Pre-Commit Check

```bash
npm run type-check && ./.claude-swarm/scripts/beta-test-checklist.sh
```

**Expected Result**: All checks pass = Safe to commit

### Beta Testing Validation

```bash
./.claude-swarm/scripts/beta-test-checklist.sh
```

**Expected Result**: All systems go = Beta users can access safely

### Post-Feature Development

```bash
./.claude-swarm/scripts/beta-test-checklist.sh
```

**Expected Result**: No regressions = Feature ready for testing

## 🚨 **Error Handling**

### If Script Fails:

1. **Read the output** - specific issues are highlighted in red ❌
2. **Fix issues** - follow the provided guidance
3. **Re-run script** - until all checks pass ✅
4. **Document fixes** - in daily beta report

### Common Issues & Solutions:

#### TypeScript Errors

```bash
npm run type-check
# Fix all reported errors
```

#### Build Failures

```bash
rm -rf .next
npm ci
npm run build
```

#### Environment Variables Missing

```bash
# Check .env.local file exists
# Verify all required variables set:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Bundle Size Too Large

```bash
# Check for:
# - Unused dependencies
# - Large imports not code-split
# - Missing lazy loading
```

#### Server Won't Start

```bash
# Kill any existing processes
pkill -f "next dev"
# Clear port conflicts
lsof -ti:3000 | xargs kill -9
# Restart
npm run dev
```

## 📊 **Output Interpretation**

### Success Output:

```
✅ ALL CHECKS PASSED - READY FOR BETA TESTING!

🎯 Next steps:
   • Start coding with confidence
   • Beta testers can safely access the system
   • System accessible at: http://localhost:3000
```

### Failure Output:

```
❌ X ISSUES FOUND - FIX BEFORE BETA TESTING

🚨 Required actions:
   • Fix all issues marked with ❌
   • Address warnings marked with ⚠️
   • Re-run this script after fixes
   • Do not allow beta testers until all issues resolved
```

### Warning Output:

```
⚠️ Warning messages indicate potential issues that should be addressed but don't block beta testing
```

## 🔄 **Integration with Daily Workflow**

### Step 1: Morning Check

```bash
# First thing every morning
./.claude-swarm/scripts/beta-test-checklist.sh
```

### Step 2: Feature Development

```bash
# Before changing any feature
echo "What could break if I change [feature]?" | Test Guardian
```

### Step 3: Post-Change Validation

```bash
# After any code changes
npm run type-check
./.claude-swarm/scripts/beta-test-checklist.sh
```

### Step 4: Pre-Commit Check

```bash
# Before git commit
./.claude-swarm/scripts/beta-test-checklist.sh
```

### Step 5: End of Day

```bash
# Final validation
./.claude-swarm/scripts/beta-test-checklist.sh
# Document results in daily beta report
```

## 🛠 **Customization**

### Adding New Checks:

1. Edit `beta-test-checklist.sh`
2. Add new test function
3. Update summary reporting
4. Test thoroughly before deploying

### Modifying Thresholds:

- **Bundle size limit**: Change `500` in line with bundle size check
- **Port range**: Modify port array for server detection
- **Timeout values**: Adjust curl timeout settings

### Environment-Specific Settings:

- **Development**: All checks enabled
- **Staging**: Focus on build and performance
- **Production**: Emphasize security and performance

## 📝 **Logging & Reporting**

### Script Output:

- **Real-time**: Color-coded progress during execution
- **Summary**: Final status with actionable guidance
- **Duration**: Execution time for performance monitoring

### Integration with Daily Reports:

```bash
# Run and capture output for daily report
./.claude-swarm/scripts/beta-test-checklist.sh > daily-check-$(date +%Y%m%d).log 2>&1
```

### Success Metrics:

- **Green Light**: 0 issues found = Beta testing approved
- **Yellow Light**: Warnings only = Proceed with caution
- **Red Light**: Issues found = Fix before beta testing

---

## 🎯 **Quality Assurance**

This script ensures:

- ✅ **Zero downtime** for beta testers
- ✅ **Consistent quality** across development cycles
- ✅ **Early issue detection** before users encounter problems
- ✅ **Automated validation** reducing human error
- ✅ **Performance monitoring** maintaining speed standards

**Remember**: Beta testers depend on a working system. This script is your safety net! 🛡️
