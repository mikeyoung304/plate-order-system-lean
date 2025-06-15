#!/bin/bash

# ================================================================
# PLATE RESTAURANT SYSTEM - RLS Security Fix Application Script
# ================================================================

set -e  # Exit on any error

echo "🔐 Applying RLS Security Fix for Plate Restaurant System"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required files exist
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    echo "Please ensure you have the database connection configured."
    exit 1
fi

if [ ! -f "fix_rls_security.sql" ]; then
    echo -e "${RED}❌ Error: fix_rls_security.sql file not found${NC}"
    echo "Please ensure the RLS fix script is in the current directory."
    exit 1
fi

# Source environment variables
source .env.local

# Check if database URL is set
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo -e "${RED}❌ Error: Database URL not set${NC}"
    echo "Please set DATABASE_URL or SUPABASE_DB_URL in .env.local"
    exit 1
fi

# Use appropriate database URL
DB_URL="${DATABASE_URL:-$SUPABASE_DB_URL}"

echo -e "${BLUE}📊 Step 1: Backing up current policies...${NC}"
mkdir -p backups
pg_dump "${DB_URL}" --schema-only --table="pg_policies" > "backups/policies_backup_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null || echo "Warning: Could not backup policies (might not exist yet)"

echo -e "${BLUE}🔧 Step 2: Applying RLS security fixes...${NC}"
if command -v psql >/dev/null 2>&1; then
    # Use psql if available
    psql "${DB_URL}" -f fix_rls_security.sql
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ RLS security fix applied successfully${NC}"
    else
        echo -e "${RED}❌ Failed to apply RLS security fix${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  psql not found. Please apply fix_rls_security.sql manually${NC}"
    echo "You can use: psql '${DB_URL}' -f fix_rls_security.sql"
    exit 1
fi

echo -e "${BLUE}🧪 Step 3: Running SQL validation tests...${NC}"
if [ -f "test_rls_policies.sql" ]; then
    psql "${DB_URL}" -f test_rls_policies.sql > rls_test_results.txt 2>&1
    echo -e "${GREEN}✅ SQL test results saved to rls_test_results.txt${NC}"
else
    echo -e "${YELLOW}⚠️  test_rls_policies.sql not found, skipping SQL tests${NC}"
fi

echo -e "${BLUE}🔍 Step 4: Running application-level tests...${NC}"
if [ -f "scripts/test-rls-application.ts" ]; then
    if command -v npm >/dev/null 2>&1; then
        # Check if ts-node is available
        if npm list -g ts-node >/dev/null 2>&1 || npm list ts-node >/dev/null 2>&1; then
            npx ts-node scripts/test-rls-application.ts
        else
            echo "Installing ts-node..."
            npm install -D ts-node @types/node
            npx ts-node scripts/test-rls-application.ts
        fi
    else
        echo -e "${YELLOW}⚠️  npm not found, skipping application tests${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Application test script not found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 RLS Security Fix Complete!${NC}"
echo "========================================="
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Review the test results above"
echo "2. Check rls_test_results.txt for detailed SQL test output"
echo "3. Test your application with different user roles"
echo "4. Monitor the application for any access issues"
echo ""
echo -e "${BLUE}🔒 Security Summary:${NC}"
echo "• Anonymous users (guests) can now only view tables and seats"
echo "• Orders and user profiles are protected from anonymous access"
echo "• KDS system is secured for kitchen staff only"
echo "• Real-time subscriptions respect RLS policies"
echo "• All sensitive tables now have Row Level Security enabled"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "• Test thoroughly with your actual user accounts"
echo "• Monitor for any unexpected access issues"
echo "• Consider running the tests periodically"