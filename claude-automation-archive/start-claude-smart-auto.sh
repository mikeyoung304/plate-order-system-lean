#!/bin/bash
# Smart Claude Code Auto-Pilot 
# Only auto-responds to specific prompts, allows normal typing

echo "🚀 Starting SMART Claude Code Auto-Pilot..."
echo "📡 MCP Servers: filesystem, github, postgres, sequential-thinking"
echo "🤖 Claude Swarm: Available for coordination"
echo "💬 Normal chat: You can type normally"
echo "🤖 Auto-responses: Only for confirmation prompts"
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

# Make sure swarm scripts are executable
chmod +x .claude-swarm/coordinate-agents.sh
chmod +x .claude-swarm/scripts/*.sh 2>/dev/null || true

# Validate environment
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Supabase environment variables missing!"
    exit 1
fi

# Check/install expect
if ! command -v expect &> /dev/null; then
    echo "📦 Installing expect..."
    brew install expect || {
        echo "❌ Failed to install expect. Please run: brew install expect"
        exit 1
    }
fi

echo "✅ Environment loaded. Starting Claude with smart auto-responses..."
echo "💡 You can chat normally. Auto-responses only activate for:"
echo "   • 'Do you want to proceed? 1) Yes 2) No'"
echo "   • 'Continue? (y/n)'"
echo "   • 'Press 1 to continue, 2 to stop'"
echo ""

# Create expect script that only responds to specific prompts
expect << 'EOF'
set timeout -1
log_user 1

# Start claude with MCP debug
spawn claude --mcp-debug

expect {
    # SPECIFIC auto-response patterns - only for confirmation prompts
    -re {Do you want to proceed.*[123]\)} { 
        puts "\n🤖 Auto-responding: 1 (proceed)"
        send "1\r"
        exp_continue 
    }
    
    -re {Continue.*\(y/n\)} { 
        puts "\n🤖 Auto-responding: y (yes)"
        send "y\r"
        exp_continue 
    }
    
    -re {Press.*1.*continue.*2.*stop} { 
        puts "\n🤖 Auto-responding: 1 (continue)"
        send "1\r"
        exp_continue 
    }
    
    -re {.*1\).*Yes.*2\).*No} { 
        puts "\n🤖 Auto-responding: 1 (Yes)"
        send "1\r"
        exp_continue 
    }
    
    -re {.*proceed.*1\).*2\)} { 
        puts "\n🤖 Auto-responding: 1 (proceed)"
        send "1\r"
        exp_continue 
    }
    
    # Handle EOF (end of session)
    eof {
        puts "\n🏁 Claude session ended"
        exit 0
    }
    
    # Handle timeout - let user interact normally
    timeout {
        interact
    }
}

# If we get here, switch to interactive mode
interact
EOF

echo "🏁 Claude Smart Auto-Pilot session completed!"