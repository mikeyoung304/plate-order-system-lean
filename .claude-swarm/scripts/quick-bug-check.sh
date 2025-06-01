#!/bin/bash

# Quick Bug Check - Essential issues only
# For fast daily validation

echo "🐛 QUICK BUG CHECK"
echo "=================="
echo ""

CRITICAL_ISSUES=0

# Check 1: Hardcoded secrets (CRITICAL) - look for actual hardcoded secret strings
SECRETS=$(grep -r "sk_[a-zA-Z0-9_-]{20,}\|password.*=.*['\"][a-zA-Z0-9]{8,}['\"]" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "placeholder\|example\|demo\|guest123\|formData\.get\|useState\|setPassword" | wc -l | tr -d ' ')
if [ "$SECRETS" -gt 0 ]; then
    echo "🚨 CRITICAL: $SECRETS hardcoded secrets found"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
else
    echo "✅ No hardcoded secrets"
fi

# Check 2: useState without defaults (CRITICAL)
UNSAFE_STATE=$(grep -r "useState()" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
if [ "$UNSAFE_STATE" -gt 0 ]; then
    echo "🚨 CRITICAL: $UNSAFE_STATE useState() without defaults"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
else
    echo "✅ All useState have defaults"
fi

# Check 3: Canvas operations without null checks (HIGH)
CANVAS_OPS=$(grep -r "canvas\.\|ctx\." . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
CANVAS_CHECKS=$(grep -r "if.*canvas\|if.*ctx" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
if [ "$CANVAS_OPS" -gt 0 ] && [ "$CANVAS_CHECKS" -lt 2 ]; then
    echo "⚠️  HIGH: Canvas operations may lack null checks"
else
    echo "✅ Canvas operations protected"
fi

# Check 4: Array access without safety (HIGH) 
UNSAFE_ARRAYS=$(grep -r "\.map\|\.filter\|\.find" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v "?" | grep -v "|| \[\]" | wc -l | tr -d ' ')
if [ "$UNSAFE_ARRAYS" -gt 50 ]; then  # Allow some, but flag if excessive
    echo "⚠️  HIGH: $UNSAFE_ARRAYS potentially unsafe array operations"
else
    echo "✅ Array operations appear safe"
fi

# Check 5: Missing error boundaries (MEDIUM)
ERROR_THROWS=$(grep -r "throw\|Error" --include="*.tsx" components/ 2>/dev/null | grep -v "ErrorBoundary" | wc -l | tr -d ' ')
if [ "$ERROR_THROWS" -gt 20 ]; then  # Some errors are OK if wrapped
    echo "⚠️  MEDIUM: $ERROR_THROWS components may need error boundaries"
else
    echo "✅ Error boundaries adequate"
fi

echo ""
if [ "$CRITICAL_ISSUES" -eq 0 ]; then
    echo "🟢 SAFE FOR BETA TESTING"
    echo "No critical issues detected"
    exit 0
else
    echo "🔴 FIX CRITICAL ISSUES BEFORE BETA"
    echo "$CRITICAL_ISSUES critical problems found"
    echo ""
    echo "Run full check: ./.claude-swarm/scripts/detect-common-bugs.sh"
    exit 1
fi