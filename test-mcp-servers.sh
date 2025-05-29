#!/bin/bash

echo "🧪 Testing MCP Server Availability"
echo "================================="

# Load environment
set -a
source .env 2>/dev/null || echo "⚠️  No .env file found"
set +a

# Test sequential-thinking
echo -n "1. Sequential Thinking: "
if npx -y @modelcontextprotocol/server-sequential-thinking --version 2>/dev/null; then
    echo "✅ Available"
else
    echo "❌ Not available"
fi

# Test filesystem
echo -n "2. Filesystem: "
if npx -y @modelcontextprotocol/server-filesystem --version 2>/dev/null; then
    echo "✅ Available"
else
    echo "❌ Not available"
fi

# Test desktop-commander
echo -n "3. Desktop Commander: "
if npx -y @wonderwhy-er/desktop-commander --version 2>/dev/null; then
    echo "✅ Available"
else
    echo "❌ Not available"
fi

# Test supabase
echo -n "4. Supabase: "
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "✅ Configured"
else
    echo "❌ Missing environment variables"
fi

# Test postgres
echo -n "5. PostgreSQL: "
if [ -n "$SUPABASE_DB_PASSWORD" ]; then
    echo "✅ Configured"
else
    echo "⚠️  Missing SUPABASE_DB_PASSWORD"
    echo "   Get it from: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/settings/database"
fi

echo ""
echo "Next steps:"
echo "1. Add SUPABASE_DB_PASSWORD to your .env file"
echo "2. Run: ./start-claude.sh"
echo "3. All MCP servers will be available in Claude"