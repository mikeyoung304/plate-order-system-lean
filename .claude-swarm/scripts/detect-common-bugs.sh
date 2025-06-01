#!/bin/bash

# Detect Common Bugs - Plate Restaurant System
# Scans for patterns that commonly cause crashes and issues

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Emojis for better UX
BUG="🐛"
CHECK="✅"
WARNING="⚠️"
SEARCH="🔍"
SHIELD="🛡️"
FIRE="🔥"

echo -e "${PURPLE}${SEARCH} Detecting Common Bugs - Plate Restaurant System${NC}"
echo "=============================================================="
echo ""

BUGS_FOUND=0
WARNINGS_FOUND=0

# Function to report bugs
report_bug() {
    echo -e "${RED}${BUG} $1${NC}"
    BUGS_FOUND=$((BUGS_FOUND + 1))
}

report_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
    WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
}

report_safe() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

report_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "🔍 Scanning for React & Next.js Common Issues"
echo "---------------------------------------------"

# 1. Check for useState without default values
echo -n "Checking for useState without defaults... "
UNSAFE_USESTATE=$(grep -r "useState()" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
if [ "$UNSAFE_USESTATE" -gt 0 ]; then
    report_bug "Found $UNSAFE_USESTATE useState() calls without default values"
    report_info "These can cause undefined errors. Fix: useState(defaultValue)"
else
    report_safe "All useState calls have default values"
fi

# 2. Check for missing dependency arrays in useEffect
echo -n "Checking for useEffect without dependencies... "
MISSING_DEPS=$(grep -r "useEffect.*{" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v "\[\]" | grep -v "\[.*\]" | wc -l | tr -d ' ')
if [ "$MISSING_DEPS" -gt 0 ]; then
    report_warning "Found $MISSING_DEPS useEffect calls potentially missing dependency arrays"
    report_info "This can cause infinite re-renders or stale closures"
else
    report_safe "All useEffect calls have proper dependency arrays"
fi

# 3. Check for direct state mutations
echo -n "Checking for direct state mutations... "
DIRECT_MUTATIONS=$(grep -r "\.push\|\.pop\|\.splice\|\.sort" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v "// OK" | wc -l | tr -d ' ')
if [ "$DIRECT_MUTATIONS" -gt 0 ]; then
    report_warning "Found $DIRECT_MUTATIONS potential direct state mutations"
    report_info "Use spread operator or immutable patterns instead"
else
    report_safe "No direct state mutations detected"
fi

# 4. Check for memory leaks (event listeners not cleaned up)
echo -n "Checking for potential memory leaks... "
ADD_LISTENERS=$(grep -r "addEventListener\|addListener" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
REMOVE_LISTENERS=$(grep -r "removeEventListener\|removeListener" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
if [ "$ADD_LISTENERS" -gt "$REMOVE_LISTENERS" ]; then
    LEAK_POTENTIAL=$((ADD_LISTENERS - REMOVE_LISTENERS))
    report_warning "Potential memory leak: $LEAK_POTENTIAL more add than remove listeners"
    report_info "Ensure cleanup in useEffect return functions"
else
    report_safe "Event listener cleanup appears balanced"
fi

echo ""
echo "🔍 Scanning for Authentication & Security Issues"
echo "-----------------------------------------------"

# 5. Check for hardcoded credentials or secrets
echo -n "Checking for hardcoded secrets... "
SECRET_PATTERNS=0
if grep -r "password.*=" . --include="*.tsx" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules | grep -v "placeholder\|example\|demo\|guest123" >/dev/null; then
    SECRET_PATTERNS=$((SECRET_PATTERNS + 1))
fi
if grep -r "api.*key.*=" . --include="*.tsx" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules | grep -v "placeholder\|example" >/dev/null; then
    SECRET_PATTERNS=$((SECRET_PATTERNS + 1))
fi
if grep -r "sk_\|pk_" . --include="*.tsx" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules >/dev/null; then
    SECRET_PATTERNS=$((SECRET_PATTERNS + 1))
fi

if [ "$SECRET_PATTERNS" -gt 0 ]; then
    report_bug "Found $SECRET_PATTERNS potential hardcoded secrets"
    report_info "Move secrets to environment variables"
else
    report_safe "No hardcoded secrets detected"
fi

# 6. Check for unsafe data access patterns
echo -n "Checking for unsafe property access... "
UNSAFE_ACCESS=$(grep -r "\.[a-zA-Z]*\." . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v "\\?\\." | grep -v "&&" | wc -l | tr -d ' ')
# This is a rough check, so we'll be more lenient
if [ "$UNSAFE_ACCESS" -gt 1000 ]; then
    report_warning "Many property accesses detected without safe navigation"
    report_info "Consider using optional chaining (?.) for safer access"
else
    report_safe "Property access patterns appear safe"
fi

echo ""
echo "🔍 Scanning for Database & API Issues"
echo "------------------------------------"

# 7. Check for missing error handling in API calls
echo -n "Checking for API calls without error handling... "
API_CALLS=$(grep -r "fetch\|axios\|supabase\." . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
TRY_CATCH=$(grep -r "try.*{" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
CATCH_BLOCKS=$(grep -r "catch.*{" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')

if [ "$API_CALLS" -gt 0 ] && [ "$CATCH_BLOCKS" -lt 5 ]; then
    report_warning "Found $API_CALLS API calls but only $CATCH_BLOCKS catch blocks"
    report_info "Add try-catch or .catch() for better error handling"
else
    report_safe "API error handling appears adequate"
fi

# 8. Check for SQL injection vulnerabilities (if any raw SQL)
echo -n "Checking for SQL injection risks... "
SQL_CONCAT=$(grep -r "SELECT.*+\|INSERT.*+\|UPDATE.*+" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
if [ "$SQL_CONCAT" -gt 0 ]; then
    report_bug "Found $SQL_CONCAT potential SQL injection vulnerabilities"
    report_info "Use parameterized queries or Supabase client methods"
else
    report_safe "No SQL injection vulnerabilities detected"
fi

echo ""
echo "🔍 Scanning for Performance Issues"
echo "---------------------------------"

# 9. Check for large bundle imports
echo -n "Checking for inefficient imports... "
LARGE_IMPORTS=0
if grep -r "import.*from.*'react'" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v "import.*{" >/dev/null; then
    LARGE_IMPORTS=$((LARGE_IMPORTS + 1))
fi
if grep -r "import.*\*.*from" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ' | grep -v "^0$" >/dev/null; then
    WILDCARD_IMPORTS=$(grep -r "import.*\*.*from" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
    LARGE_IMPORTS=$((LARGE_IMPORTS + WILDCARD_IMPORTS))
fi

if [ "$LARGE_IMPORTS" -gt 0 ]; then
    report_warning "Found $LARGE_IMPORTS potentially inefficient imports"
    report_info "Use specific imports: import { specific } from 'library'"
else
    report_safe "Import patterns appear optimized"
fi

# 10. Check for missing loading states
echo -n "Checking for missing loading states... "
ASYNC_OPERATIONS=$(grep -r "async.*=>\|async function" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
LOADING_STATES=$(grep -r "loading\|isLoading" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')

if [ "$ASYNC_OPERATIONS" -gt "$LOADING_STATES" ]; then
    report_warning "More async operations ($ASYNC_OPERATIONS) than loading states ($LOADING_STATES)"
    report_info "Add loading indicators for better UX"
else
    report_safe "Loading states appear well implemented"
fi

echo ""
echo "🔍 Scanning for Accessibility Issues"
echo "-----------------------------------"

# 11. Check for missing alt text on images
echo -n "Checking for images without alt text... "
IMG_WITHOUT_ALT=$(grep -r "<img" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v "alt=" | wc -l | tr -d ' ')
if [ "$IMG_WITHOUT_ALT" -gt 0 ]; then
    report_warning "Found $IMG_WITHOUT_ALT images without alt text"
    report_info "Add alt attributes for screen readers"
else
    report_safe "All images have alt text"
fi

# 12. Check for buttons without aria-labels or text
echo -n "Checking for inaccessible buttons... "
BUTTONS_WITHOUT_TEXT=$(grep -r "<button" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v "aria-label\|>" | wc -l | tr -d ' ')
if [ "$BUTTONS_WITHOUT_TEXT" -gt 0 ]; then
    report_warning "Found $BUTTONS_WITHOUT_TEXT buttons potentially without accessible text"
    report_info "Add aria-label or visible text for screen readers"
else
    report_safe "Buttons appear accessible"
fi

echo ""
echo "🔍 Scanning for Critical App-Specific Issues"
echo "--------------------------------------------"

# Additional critical checks from user requirements
echo -n "Checking for undefined access patterns... "
UNSAFE_ARRAY_ACCESS=$(grep -r "\.map\|\.filter\|\.find" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v "?" | grep -v "|| \[\]" | wc -l | tr -d ' ')
if [ "$UNSAFE_ARRAY_ACCESS" -gt 0 ]; then
    report_warning "Found $UNSAFE_ARRAY_ACCESS potentially unsafe array operations"
    report_info "Use optional chaining: array?.map() or array || []"
    echo -e "${BLUE}Examples found:${NC}"
    grep -r "\.map\|\.filter\|\.find" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v "?" | grep -v "|| \[\]" | head -3
else
    report_safe "Array operations appear safe"
fi

echo -n "Checking for missing error boundaries... "
THROWS_WITHOUT_BOUNDARIES=$(grep -r "throw\|Error" --include="*.tsx" components/ 2>/dev/null | grep -v "ErrorBoundary" | wc -l | tr -d ' ')
if [ "$THROWS_WITHOUT_BOUNDARIES" -gt 0 ]; then
    report_warning "Found $THROWS_WITHOUT_BOUNDARIES components with errors but no error boundaries"
    report_info "Wrap components with ErrorBoundary for better crash recovery"
    echo -e "${BLUE}Examples found:${NC}"
    grep -r "throw\|Error" --include="*.tsx" components/ 2>/dev/null | grep -v "ErrorBoundary" | head -3
else
    report_safe "Error boundaries appear well implemented"
fi

echo -n "Checking for missing loading states... "
LOADING_USAGE=$(grep -r "isLoading\|loading" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v "return" | wc -l | tr -d ' ')
ASYNC_USAGE=$(grep -r "useEffect\|async" --include="*.tsx" . 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
if [ "$ASYNC_USAGE" -gt "$LOADING_USAGE" ]; then
    report_warning "More async operations than loading states"
    report_info "Add loading indicators for better UX"
else
    report_safe "Loading states well implemented"
fi

echo -n "Checking for potential memory leaks... "
EVENT_LISTENERS=$(grep -r "addEventListener\|setInterval\|setTimeout" --include="*.tsx" . 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
CLEANUP_CALLS=$(grep -r "removeEventListener\|clearInterval\|clearTimeout" --include="*.tsx" . 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
if [ "$EVENT_LISTENERS" -gt "$CLEANUP_CALLS" ] && [ "$EVENT_LISTENERS" -gt 0 ]; then
    report_warning "Potential memory leaks: $EVENT_LISTENERS listeners vs $CLEANUP_CALLS cleanup calls"
    report_info "Ensure cleanup in useEffect return functions"
    echo -e "${BLUE}Examples found:${NC}"
    grep -r "addEventListener\|setInterval\|setTimeout" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v "removeEventListener\|clearInterval\|clearTimeout" | head -3
else
    report_safe "Memory leak prevention appears adequate"
fi

echo ""
echo "🔍 Scanning for Additional App Issues"
echo "------------------------------------"

# 13. Check for framer-motion usage (performance issue)
echo -n "Checking for framer-motion usage... "
FRAMER_USAGE=$(grep -r "from 'framer-motion'" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v "// REMOVED\|// ELIMINATED" | wc -l | tr -d ' ')
if [ "$FRAMER_USAGE" -gt 0 ]; then
    report_warning "Found $FRAMER_USAGE active framer-motion imports"
    report_info "Replace with CSS animations for better performance"
else
    report_safe "No framer-motion usage detected"
fi

# 14. Check for missing table data validation
echo -n "Checking for table data safety... "
TABLE_ACCESS=$(grep -r "tables\[" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
TABLE_LENGTH_CHECK=$(grep -r "tables\.length" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')

if [ "$TABLE_ACCESS" -gt 0 ] && [ "$TABLE_LENGTH_CHECK" -eq 0 ]; then
    report_warning "Table array access without length checks detected"
    report_info "Check tables.length before accessing array elements"
else
    report_safe "Table data access appears safe"
fi

# 15. Check for canvas operations without null checks
echo -n "Checking for unsafe canvas operations... "
CANVAS_OPS=$(grep -r "canvas\.\|ctx\.\|getContext" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
CANVAS_CHECKS=$(grep -r "if.*canvas\|if.*ctx" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')

if [ "$CANVAS_OPS" -gt 0 ] && [ "$CANVAS_CHECKS" -lt 2 ]; then
    report_warning "Canvas operations without adequate null checks"
    report_info "Always check if canvas and context exist before operations"
else
    report_safe "Canvas operations appear protected"
fi

echo ""
echo "📊 Summary Report"
echo "=================="

if [ "$BUGS_FOUND" -eq 0 ] && [ "$WARNINGS_FOUND" -eq 0 ]; then
    echo -e "${GREEN}${SHIELD} EXCELLENT! No common bugs detected${NC}"
    echo ""
    echo "✅ Your code follows best practices"
    echo "✅ No security vulnerabilities found"
    echo "✅ Performance patterns look good"
    echo "✅ Accessibility considerations present"
    echo ""
    echo -e "${GREEN}Safe for beta testing!${NC}"
elif [ "$BUGS_FOUND" -eq 0 ]; then
    echo -e "${YELLOW}${WARNING} $WARNINGS_FOUND warnings found, but no critical bugs${NC}"
    echo ""
    echo "🎯 Address warnings when possible for better quality"
    echo -e "${YELLOW}Proceed with caution for beta testing${NC}"
else
    echo -e "${RED}${FIRE} $BUGS_FOUND critical bugs and $WARNINGS_FOUND warnings found${NC}"
    echo ""
    echo "🚨 STOP: Fix critical bugs before beta testing"
    echo "⚠️  Address warnings for better reliability"
    echo ""
    echo -e "${RED}NOT SAFE for beta testing until issues resolved${NC}"
fi

echo ""
echo "🔧 Quick Fix Commands"
echo "-------------------"
echo "npm run type-check    # Find TypeScript errors"
echo "npm run lint --fix    # Auto-fix linting issues"
echo "npm run build         # Test production build"

if [ "$BUGS_FOUND" -gt 0 ]; then
    exit 1
else
    exit 0
fi