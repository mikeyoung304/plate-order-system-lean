#!/bin/bash
# Simple but reliable Claude Code Auto-Pilot
# Uses your full MCP configuration with basic auto-responses

echo "🚀 Starting Simple Claude Code Auto-Pilot..."
echo "📡 MCP Servers: filesystem, github, postgres, sequential-thinking"
echo "🤖 Simple auto-responses (feeds '1' continuously)"
echo "⏹️  Press Ctrl+C to stop"
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

# Validate environment
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Supabase environment variables missing!"
    exit 1
fi

echo "✅ Environment loaded. Starting Claude with simple auto-responses..."

# Simple approach using yes command
(while true; do echo "1"; sleep 1; done) | claude --mcp-debug

echo "🏁 Claude Auto-Pilot session completed!"