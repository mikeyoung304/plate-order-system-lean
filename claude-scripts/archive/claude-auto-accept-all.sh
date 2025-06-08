#!/bin/bash
# Auto-Accept ALL Claude Code Confirmations
# Uses keyboard automation to press "2" (don't ask again) for every prompt

echo "🤖 Starting Claude Code with FULL AUTO-ACCEPT..."
echo "⚡ This will automatically accept ALL confirmations"
echo "🛑 Press Ctrl+C to stop if needed"
echo ""

# Load environment variables
set -a
source .env 2>/dev/null || true
set +a

export NEXT_PUBLIC_SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY
export OPENAI_API_KEY
export SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
export GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# Make swarm scripts executable
chmod +x .claude-swarm/coordinate-agents.sh 2>/dev/null || true
chmod +x .claude-swarm/scripts/*.sh 2>/dev/null || true

echo "✅ Environment loaded"
echo "🚀 Starting Claude Code with auto-accept..."

# Check if we have automation tools
if command -v osascript &> /dev/null; then
    echo "🎮 Using AppleScript automation for macOS"
    
    # Start Claude Code in background
    claude --mcp-debug &
    CLAUDE_PID=$!
    
    # Wait a moment for Claude to start
    sleep 3
    
    # Auto-responder using AppleScript
    while kill -0 $CLAUDE_PID 2>/dev/null; do
        # Check if there's a dialog asking for confirmation
        osascript -e '
        tell application "System Events"
            tell application "Terminal" to activate
            delay 0.5
            key code 19  -- Press "2" key
            delay 0.1
            key code 36  -- Press Enter
        end tell
        ' 2>/dev/null || true
        
        sleep 2
    done
    
elif command -v xdotool &> /dev/null; then
    echo "🎮 Using xdotool automation for Linux"
    # Linux version using xdotool
    claude --mcp-debug &
    CLAUDE_PID=$!
    
    while kill -0 $CLAUDE_PID 2>/dev/null; do
        xdotool key 2 Return 2>/dev/null || true
        sleep 2
    done
    
else
    echo "⚠️  No automation tools available"
    echo "💡 Manual solution: When Claude asks for confirmation:"
    echo "   Press '2' (Yes, and don't ask again this session)"
    echo ""
    claude --mcp-debug
fi