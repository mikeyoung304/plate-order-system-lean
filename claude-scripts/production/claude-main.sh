#!/bin/bash
# WORKING Claude Code Full Power - No Input Issues
# MCP + Swarm + Selective Auto-responses

echo "🚀 Starting Claude Code Full Power (WORKING VERSION)..."
echo "📡 MCP Servers: All connected"
echo "🤖 Claude Swarm: Available"
echo "💬 Input: Works normally"
echo "🤖 Auto-mode: Activate when needed"
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
export GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# Make sure swarm scripts are executable
chmod +x .claude-swarm/coordinate-agents.sh 2>/dev/null || true
chmod +x .claude-swarm/scripts/*.sh 2>/dev/null || true

echo "✅ Environment loaded"
echo "🤖 Claude Swarm agents ready:"
echo "  ✓ Bug Detection Agent (.claude-swarm/coordinate-agents.sh)"
echo "  ✓ Performance Optimization Agent"
echo "  ✓ UI/UX Polish Agent"  
echo "  ✓ Testing Coordination Agent"
echo ""
echo "📡 MCP Servers will connect:"
echo "  ✓ filesystem (project access)"
echo "  ✓ github (repository access)"
echo "  ✓ postgres (database access)"
echo "  ✓ sequential-thinking (reasoning)"
echo ""
echo "🎮 Usage Instructions:"
echo "  1. Chat normally - type your prompts"
echo "  2. For auto-mode, tell Claude:"
echo "     'Please proceed automatically, choose option 1 for all confirmations'"
echo "  3. Claude will then work autonomously"
echo ""
echo "🚀 Starting Claude Code with --mcp-debug..."
echo ""

# Start Claude normally with MCP debug
# This preserves normal input handling
claude --mcp-debug