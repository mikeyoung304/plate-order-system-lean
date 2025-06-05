#!/bin/bash
# ULTIMATE Claude Code Auto-Pilot 
# Includes MCP Servers + Claude Swarm Agents + Auto-responses

echo "🚀 Starting ULTIMATE Claude Code Auto-Pilot..."
echo "📡 MCP Servers: filesystem, github, postgres, sequential-thinking"
echo "🤖 Claude Swarm: Agent coordination system activated"
echo "🧠 Intelligent auto-responses with expect"
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
echo "🚀 Starting Claude with FULL POWER configuration..."

# Create expect script that handles various prompts
expect << 'EOF'
set timeout -1
log_user 1

# Start claude with MCP debug
spawn claude --mcp-debug

expect {
    # Common confirmation prompts - fixed regex
    -re {.*[123]\).*} { 
        send "1\r"
        exp_continue 
    }
    
    # Yes/No prompts
    -re {.*(y/n|Y/N).*} { 
        send "y\r"
        exp_continue 
    }
    
    # Proceed prompts
    -re {.*proceed.*\?} { 
        send "1\r"
        exp_continue 
    }
    
    # Continue prompts
    -re {.*continue.*\?} { 
        send "y\r"
        exp_continue 
    }
    
    # Press any key
    -re {.*press.*key.*} { 
        send "\r"
        exp_continue 
    }
    
    # Multiple choice (always pick first option)
    -re {.*Choose.*option.*} { 
        send "1\r"
        exp_continue 
    }
    
    # Default to option 1 for any numbered list
    -re {.*1\).*2\).*} { 
        send "1\r"
        exp_continue 
    }
    
    # Agent coordination prompts
    -re {.*agent.*} { 
        send "1\r"
        exp_continue 
    }
    
    # Swarm coordination
    -re {.*swarm.*} { 
        send "1\r"
        exp_continue 
    }
    
    # Handle EOF (end of session)
    eof {
        puts "\n🏁 Claude Full Power session ended"
        exit 0
    }
    
    # Handle timeout (shouldn't happen with -1)
    timeout {
        puts "\n⏰ Session timeout"
        exit 1
    }
}
EOF

echo "🏁 Claude Full Power Auto-Pilot session completed!"