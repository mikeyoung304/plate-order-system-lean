#!/bin/bash
echo "🧪 PLATE RESTAURANT BETA TEST CHECKLIST"
echo "======================================"
echo ""
echo "1. GUEST ACCESS TEST"
echo "   [ ] Click 'Sign in as Guest' - Works?"
echo "   [ ] See welcome screen - Displays?"
echo "   [ ] See dashboard - All cards visible?"
echo ""
echo "2. SERVER INTERFACE TEST"
echo "   [ ] Navigate to Server - No errors?"
echo "   [ ] See floor plan - TABLES VISIBLE?"
echo "   [ ] Click a table - Modal opens?"
echo "   [ ] Place order - Reaches kitchen?"
echo ""
echo "3. KITCHEN DISPLAY TEST"
echo "   [ ] Navigate to Kitchen - Loads?"
echo "   [ ] See orders - Display correctly?"
echo "   [ ] Update status - Works?"
echo ""
echo "4. ADMIN FLOOR PLAN TEST"
echo "   [ ] Open floor plan editor - NO CRASH?"
echo "   [ ] Drag a table - Moves smoothly?"
echo "   [ ] Save changes - Persists?"
echo ""
echo "5. PERFORMANCE TEST"
echo "   [ ] All pages load <3 seconds?"
echo "   [ ] Console shows 0 errors?"
echo "   [ ] Animations smooth?"
echo ""
read -p "Run automated checks? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npm run type-check
    echo "✅ TypeScript check complete"
    echo "🚀 Starting automated system validation..."
    echo ""
fi

# Beta Test Checklist - Plate Restaurant System
# Run this every morning before coding and before commits

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emojis for better UX
CHECK="✅"
CROSS="❌" 
WARNING="⚠️"
ROCKET="🚀"
SHIELD="🛡️"

echo -e "${BLUE}${SHIELD} Daily Beta Test Checklist - Plate Restaurant System${NC}"
echo "=============================================================="
echo ""

# Track results
ISSUES_FOUND=0
START_TIME=$(date +%s)

# Function to log results
log_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}${CHECK} $2${NC}"
    else
        echo -e "${RED}${CROSS} $2${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
}

log_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if server is running
check_server() {
    local port=$1
    curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/ 2>/dev/null || echo "000"
}

echo "🔍 Pre-Flight System Check"
echo "-------------------------"

# 1. Check Node.js and npm
echo -n "Checking Node.js installation... "
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    log_result 0 "Node.js $NODE_VERSION installed"
else
    log_result 1 "Node.js not found"
fi

# 2. Check dependencies
echo -n "Checking dependencies... "
if [ -f package.json ] && [ -f package-lock.json ]; then
    if npm ls >/dev/null 2>&1; then
        log_result 0 "Dependencies installed correctly"
    else
        log_result 1 "Dependencies missing or corrupted"
        log_info "Run: npm ci"
    fi
else
    log_result 1 "package.json or package-lock.json missing"
fi

# 3. Environment variables check
echo -n "Checking environment variables... "
ENV_ISSUES=0

# Source environment files if they exist
if [ -f .env.local ]; then
    source .env.local
elif [ -f .env ]; then
    source .env
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    log_warning "NEXT_PUBLIC_SUPABASE_URL not set"
    ENV_ISSUES=$((ENV_ISSUES + 1))
fi
if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    log_warning "NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
    ENV_ISSUES=$((ENV_ISSUES + 1))
fi
if [ $ENV_ISSUES -eq 0 ]; then
    log_result 0 "Environment variables configured"
else
    log_result 1 "$ENV_ISSUES environment variables missing"
    log_info "Check your .env.local or .env file"
fi

echo ""
echo "🔧 Code Quality Checks"
echo "----------------------"

# 4. TypeScript compilation
echo -n "Running TypeScript check... "
if npm run type-check >/dev/null 2>&1; then
    log_result 0 "TypeScript compilation clean"
else
    log_result 1 "TypeScript errors found"
    log_info "Run: npm run type-check for details"
fi

# 5. Build test
echo -n "Testing production build... "
if npm run build >/dev/null 2>&1; then
    log_result 0 "Production build successful"
    
    # Check bundle sizes (tablet-optimized target: 1MB = 1024KB)
    echo -n "Checking bundle sizes... "
    if [ -d ".next" ]; then
        LARGEST_BUNDLE=$(find .next -name "*.js" -type f -exec du -k {} + | sort -nr | head -1 | cut -f1)
        if [ "$LARGEST_BUNDLE" -lt 1024 ]; then  # 1MB tablet target
            log_result 0 "Bundle sizes within tablet limits (<1MB)"
        else
            log_result 1 "Bundle size too large for tablets (${LARGEST_BUNDLE}KB)"
            log_info "Target: <1MB for smooth tablet performance"
        fi
    else
        log_warning "Build output not found"
    fi
else
    log_result 1 "Production build failed"
    log_info "Run: npm run build for details"
fi

echo ""
echo "🚀 Development Server Check"
echo "---------------------------"

# 6. Start development server (if not already running)
echo -n "Checking development server... "
SERVER_PORT=""
for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010; do
    RESPONSE=$(check_server $port)
    if [ "$RESPONSE" != "000" ]; then
        SERVER_PORT=$port
        break
    fi
done

if [ -n "$SERVER_PORT" ]; then
    log_result 0 "Server running on port $SERVER_PORT"
    SERVER_URL="http://localhost:$SERVER_PORT"
else
    log_warning "No server detected, attempting to start..."
    # Try to start server in background
    npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 5
    
    # Check if it started
    for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010; do
        RESPONSE=$(check_server $port)
        if [ "$RESPONSE" != "000" ]; then
            SERVER_PORT=$port
            SERVER_URL="http://localhost:$SERVER_PORT"
            break
        fi
    done
    
    if [ -n "$SERVER_PORT" ]; then
        log_result 0 "Server started successfully on port $SERVER_PORT"
    else
        log_result 1 "Failed to start development server"
        if [ -n "$SERVER_PID" ]; then
            kill $SERVER_PID 2>/dev/null || true
        fi
    fi
fi

echo ""
echo "🎯 Critical Path Testing"
echo "------------------------"

if [ -n "$SERVER_URL" ]; then
    # 7. Test main routes
    echo -n "Testing main page... "
    MAIN_RESPONSE=$(check_server $SERVER_PORT)
    if [ "$MAIN_RESPONSE" = "200" ]; then
        log_result 0 "Main page accessible"
    else
        log_result 1 "Main page returned HTTP $MAIN_RESPONSE"
    fi

    # 8. Test critical API endpoints
    echo -n "Testing auth API... "
    AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/api/auth-check" 2>/dev/null || echo "000")
    if [ "$AUTH_RESPONSE" = "200" ] || [ "$AUTH_RESPONSE" = "401" ]; then
        log_result 0 "Auth API responding"
    else
        log_result 1 "Auth API issues (HTTP $AUTH_RESPONSE)"
    fi

else
    log_warning "Skipping route tests - no server running"
fi

echo ""
echo "📊 Database Connection Check"
echo "----------------------------"

# 9. Test Supabase connection
echo -n "Testing Supabase connection... "
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    SUPABASE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" 2>/dev/null || echo "000")
    if [ "$SUPABASE_RESPONSE" = "200" ]; then
        log_result 0 "Supabase connection successful"
    else
        log_result 1 "Supabase connection failed (HTTP $SUPABASE_RESPONSE)"
    fi
else
    log_result 1 "Supabase URL not configured"
fi

echo ""
echo "📱 Performance Check"
echo "--------------------"

# 10. Check for common performance issues
echo -n "Checking for framer-motion usage... "
FRAMER_COUNT=$(grep -r "from 'framer-motion'" . --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | wc -l)
if [ "$FRAMER_COUNT" -eq 0 ]; then
    log_result 0 "No framer-motion imports found"
else
    log_warning "$FRAMER_COUNT framer-motion imports found"
    log_info "Consider replacing with CSS animations"
fi

# 11. Check bundle directory size
if [ -d ".next" ]; then
    echo -n "Checking build output size... "
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    log_info "Build directory size: $BUILD_SIZE"
fi

echo ""
echo "🛡️ Security Check"
echo "------------------"

# 12. Check for sensitive data exposure
echo -n "Checking for exposed secrets... "
SECRET_ISSUES=0
if grep -r "sk_" . --include="*.tsx" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules >/dev/null; then
    log_warning "Potential secret keys found in code"
    SECRET_ISSUES=$((SECRET_ISSUES + 1))
fi
if grep -r "password.*=" . --include="*.tsx" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules | grep -v "placeholder\|example\|demo" >/dev/null; then
    log_warning "Hardcoded passwords potentially found"
    SECRET_ISSUES=$((SECRET_ISSUES + 1))
fi
if [ $SECRET_ISSUES -eq 0 ]; then
    log_result 0 "No obvious security issues found"
else
    log_result 1 "$SECRET_ISSUES potential security issues"
fi

echo ""
echo "📋 Summary Report"
echo "=================="

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Test completed in ${DURATION} seconds"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}${CHECK} ALL CHECKS PASSED - READY FOR BETA TESTING!${NC}"
    echo ""
    echo "🎯 Next steps:"
    echo "   • Start coding with confidence"
    echo "   • Beta testers can safely access the system"
    if [ -n "$SERVER_URL" ]; then
        echo "   • System accessible at: $SERVER_URL"
    fi
    echo ""
    exit 0
else
    echo -e "${RED}${CROSS} $ISSUES_FOUND ISSUES FOUND - FIX BEFORE BETA TESTING${NC}"
    echo ""
    echo "🚨 Required actions:"
    echo "   • Fix all issues marked with ❌"
    echo "   • Address warnings marked with ⚠️"
    echo "   • Re-run this script after fixes"
    echo "   • Do not allow beta testers until all issues resolved"
    echo ""
    exit 1
fi