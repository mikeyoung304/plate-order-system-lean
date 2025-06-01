# Bug Detection Scripts Guide

## 🐛 **Available Scripts**

### **1. Quick Bug Check** (Recommended Daily)
```bash
./.claude-swarm/scripts/quick-bug-check.sh
```
**Purpose**: Fast 5-second check for critical issues only  
**Focus**: Hardcoded secrets, unsafe useState, canvas operations

### **2. Comprehensive Bug Detection** (Weekly)
```bash
./.claude-swarm/scripts/detect-common-bugs.sh
```
**Purpose**: Full analysis of 15+ bug categories  
**Focus**: Complete code quality audit with examples

## 🎯 **Quick Bug Check Results**

### ✅ **Green Light (Safe for Beta)**
```
🟢 SAFE FOR BETA TESTING
No critical issues detected
```
**Action**: Proceed with confidence

### 🔴 **Red Light (Fix Required)**  
```
🔴 FIX CRITICAL ISSUES BEFORE BETA
X critical problems found
```
**Action**: Stop and fix critical issues immediately

## 📊 **What Each Script Checks**

### **Critical Issues (Block Beta Testing)**
- **Hardcoded Secrets**: API keys, passwords in source code
- **Unsafe useState**: `useState()` without default values
- **Canvas Crashes**: Canvas operations without null checks

### **High Priority Warnings**
- **Array Safety**: `.map()/.filter()` without null checks
- **Error Boundaries**: Components that can throw without protection
- **Memory Leaks**: Event listeners without cleanup

### **Performance Issues**
- **Bundle Size**: Large/inefficient imports
- **Loading States**: Missing loading indicators
- **Framer Motion**: Performance-impacting animations

### **Security Vulnerabilities**
- **SQL Injection**: String concatenation in queries
- **XSS Prevention**: Unsafe property access patterns
- **Input Validation**: Missing sanitization

### **Accessibility Issues**
- **Alt Text**: Images without screen reader support
- **Button Labels**: Inaccessible interactive elements
- **Keyboard Navigation**: Missing ARIA labels

## 🚀 **Integration with Daily Workflow**

### **Morning Routine**
```bash
# Quick 5-second check
./.claude-swarm/scripts/quick-bug-check.sh

# If green: start coding
# If red: fix critical issues first
```

### **Before Feature Changes**
```bash
# Know what could break
./.claude-swarm/scripts/quick-bug-check.sh
```

### **After Code Changes**
```bash
# Verify no new critical issues
./.claude-swarm/scripts/quick-bug-check.sh
```

### **Pre-Commit Validation**
```bash
# Full validation before committing
./.claude-swarm/scripts/detect-common-bugs.sh
```

### **Weekly Deep Dive**
```bash
# Complete analysis with examples
./.claude-swarm/scripts/detect-common-bugs.sh > weekly-bug-report.txt
```

## 🔧 **Understanding Results**

### **Critical Bug Examples**
```bash
🚨 CRITICAL: 2 hardcoded secrets found
# Fix: Move to environment variables

🚨 CRITICAL: 5 useState() without defaults  
# Fix: useState(defaultValue)
```

### **Warning Examples**
```bash
⚠️  HIGH: 50 potentially unsafe array operations
# Fix: Use array?.map() or array || []

⚠️  MEDIUM: 20 components may need error boundaries
# Fix: Wrap with <ErrorBoundary>
```

### **Safe Results**
```bash
✅ No hardcoded secrets
✅ All useState have defaults
✅ Canvas operations protected
```

## 🛠 **Customization**

### **Adjusting Thresholds**
Edit the scripts to modify what triggers warnings:

```bash
# In quick-bug-check.sh
if [ "$UNSAFE_ARRAYS" -gt 50 ]; then  # Adjust threshold
```

### **Adding New Checks**
Add new patterns to `detect-common-bugs.sh`:

```bash
# Example: Check for console.log in production
CONSOLE_LOGS=$(grep -r "console\.log" . --include="*.tsx" | wc -l)
```

### **Excluding False Positives**
Add patterns to exclude known safe code:

```bash
grep -v "// SAFE:" # Exclude lines marked as safe
```

## 📋 **Common Issues & Solutions**

### **Issue**: Too many array operation warnings
**Solution**: 
```typescript
// Before (unsafe)
items.map(item => ...)

// After (safe)  
items?.map(item => ...) || []
```

### **Issue**: Missing error boundaries
**Solution**:
```tsx
// Wrap risky components
<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>
```

### **Issue**: Memory leak warnings
**Solution**:
```typescript
useEffect(() => {
  const handler = () => {}
  element.addEventListener('event', handler)
  
  return () => {
    element.removeEventListener('event', handler) // Cleanup
  }
}, [])
```

## 🎯 **Success Metrics**

### **Target Results**
- **Critical Issues**: 0 (always)
- **High Warnings**: <10 (manageable level)  
- **Medium Warnings**: <20 (acceptable for beta)
- **Performance Issues**: <5 (optimized)

### **Beta Readiness**
```bash
# This result = ready for beta testing
🟢 SAFE FOR BETA TESTING
No critical issues detected
```

## 🚨 **Emergency Response**

### **If Critical Issues Found**
1. **Stop beta testing immediately**
2. **Fix critical issues first**
3. **Re-run quick check**
4. **Only proceed when green**

### **If Many Warnings**
1. **Assess impact on beta users**
2. **Prioritize user-facing issues**
3. **Create fix plan for next iteration**
4. **Document known issues**

---

## 📞 **Quick Reference**

### **Daily Commands**
```bash
# Morning check (5 seconds)
./.claude-swarm/scripts/quick-bug-check.sh

# Full analysis (2 minutes)  
./.claude-swarm/scripts/detect-common-bugs.sh
```

### **Result Interpretation**
- **🟢 Green**: Safe to proceed
- **🔴 Red**: Stop and fix critical issues
- **⚠️ Yellow**: Address when possible

### **Critical vs Warning**
- **Critical**: Blocks beta testing (crashes, security)
- **Warning**: Improve when possible (UX, performance)

**Remember**: Beta testers depend on a stable system. These scripts are your safety net! 🛡️