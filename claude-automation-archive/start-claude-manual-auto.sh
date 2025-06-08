#!/bin/bash
# Manual Claude Code with Auto-Response Option
# Start normally, but you can activate auto-mode when needed

echo "🚀 Starting Claude Code with Manual/Auto Toggle..."
echo "📡 MCP Servers: filesystem, github, postgres, sequential-thinking"
echo "🤖 Claude Swarm: Available for coordination"
echo ""
echo "🎮 How to use:"
echo "   1. Chat normally - type your prompts"
echo "   2. When Claude asks for confirmation, you can:"
echo "      • Answer manually (1, 2, y, n)"
echo "      • OR type 'AUTO' to activate auto-responses"
echo ""

# Load environment variables from .env file
set -a
source .env
set +a

# Export the required variables for MCP servers
export NEXT_PUBLIC_SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY
export OPENAI_API_KEY
export SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"

# Make sure swarm scripts are executable
chmod +x .claude-swarm/coordinate-agents.sh
chmod +x .claude-swarm/scripts/*.sh 2>/dev/null || true

# Validate environment
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Supabase environment variables missing!"
    exit 1
fi

echo "✅ Environment loaded."
echo "🤖 Claude Swarm agents available:"
echo "  ✓ Bug Detection Agent"
echo "  ✓ Performance Optimization Agent"  
echo "  ✓ UI/UX Polish Agent"
echo "  ✓ Testing Coordination Agent"
echo "📡 MCP Servers ready:"
echo "  ✓ sequential-thinking"
echo "  ✓ filesystem"
echo "  ✓ github"
if [ -n "$SUPABASE_DB_PASSWORD" ]; then
    echo "  ✓ postgres"
else
    echo "  ⚠ postgres (missing password)"
fi
echo ""
echo "🚀 Starting Claude Code normally..."
echo "💡 Tip: When you want to go full auto, just tell Claude to proceed with everything!"
echo ""

# Start Claude normally with all MCP servers
claude --mcp-debug "$@"