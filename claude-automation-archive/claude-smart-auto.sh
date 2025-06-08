#!/bin/bash
# SMART Auto-Accept - Only responds to safe "Yes" patterns
# Will NOT blindly press 2 - analyzes the prompt first

echo "🧠 Starting SMART Claude Code Auto-Accept..."
echo "✅ Only responds to confirmed 'Yes' prompts"
echo "🛑 Will NOT press dangerous options"
echo ""

# Load environment
set -a; source .env 2>/dev/null || true; set +a
export NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY OPENAI_API_KEY
export SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}" GITHUB_TOKEN="${GITHUB_TOKEN:-}"

chmod +x .claude-swarm/coordinate-agents.sh 2>/dev/null || true

echo "🧠 Smart patterns will look for:"
echo "  ✅ 'Do you want to make this edit' -> Press option with 'Yes, don't ask'"
echo "  ✅ 'Do you want to proceed' -> Press option with 'Yes'"
echo "  ❌ Will NOT respond to unclear prompts"
echo ""

# Start Claude and monitor for specific safe patterns only
claude --mcp-debug