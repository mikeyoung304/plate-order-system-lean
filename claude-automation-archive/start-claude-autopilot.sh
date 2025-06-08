#!/bin/bash
# Auto-Pilot Claude Code with MCP Servers and All Configurations
# This combines your start-claude.sh setup with auto-responses for overnight runs

echo "🚀 Starting Claude Code Auto-Pilot with Full MCP Configuration..."
echo "📡 MCP Servers: filesystem, github, postgres, sequential-thinking"
echo "🤖 Auto-responses: Will automatically choose option 1 (proceed)"
echo "⏹️  Press Ctrl+C to stop at any time"
echo ""

# Load environment variables from .env file
set -a
source .env
set +a

# Export the required variables for MCP servers
export NEXT_PUBLIC_SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY
export OPENAI_API_KEY

# Set up Supabase database connection
export SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"

# Test if required variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Supabase environment variables are not set!"
    echo "Please check your .env file"
    exit 1
fi

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "⚠️  Warning: SUPABASE_DB_PASSWORD not set. PostgreSQL MCP server will not work."
    echo "Get it from: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/settings/database"
fi

echo "✅ Environment variables loaded successfully!"
echo "Starting Claude with MCP servers:"
echo "  ✓ sequential-thinking"
echo "  ✓ filesystem"
echo "  ✓ github"
if [ -n "$SUPABASE_DB_PASSWORD" ]; then
    echo "  ✓ postgres"
else
    echo "  ⚠ postgres (missing password)"
fi
echo ""

# Check if expect is available, install if needed
if ! command -v expect &> /dev/null; then
    echo "📦 Installing expect for auto-responses..."
    if command -v brew &> /dev/null; then
        brew install expect
    else
        echo "❌ Please install expect: brew install expect"
        exit 1
    fi
fi

# Create named pipe for responses
RESPONSE_PIPE="/tmp/claude_autopilot_$$"
mkfifo "$RESPONSE_PIPE" 2>/dev/null || true

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Claude Auto-Pilot..."
    kill $FEEDER_PID 2>/dev/null
    rm -f "$RESPONSE_PIPE"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start background process that feeds responses
(
    echo "🔄 Auto-responder started (feeding '1' responses)..."
    while true; do
        echo "1"
        sleep 0.5
    done
) > "$RESPONSE_PIPE" &

FEEDER_PID=$!

echo "🚀 Launching Claude Code with MCP and auto-responses..."
echo "💡 Tip: The system will automatically choose option 1 for all prompts"
echo ""

# Start Claude with all your configurations + auto-response
claude --mcp-debug < "$RESPONSE_PIPE"

# Cleanup
cleanup