#!/bin/bash
# ULTIMATE Claude Code Auto-Pilot - FIXED VERSION
# Handles MCP failures gracefully + Claude Swarm + Auto-responses

echo "🚀 Starting ULTIMATE Claude Code Auto-Pilot (FIXED)..."
echo "📡 MCP Servers: Checking connections..."
echo "🤖 Claude Swarm: Agent coordination system"
echo "🧠 Intelligent auto-responses with expect"
echo "⏹️  Press Ctrl+C to stop"
echo ""

# Load environment variables from .env file
set -a
source .env 2>/dev/null || echo "⚠️  No .env file found, using existing environment"
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

# Create a temporary MCP config with only working servers
MCP_CONFIG=".mcp-temp.json"

# Start with basic servers that usually work
cat > "$MCP_CONFIG" << EOF
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/mike/Plate-Restaurant-System-App"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
EOF

# Add GitHub server if token exists
if [ -n "$GITHUB_TOKEN" ] && [ "$GITHUB_TOKEN" != "" ]; then
    echo "  ✓ GitHub MCP server (token found)"
    cat >> "$MCP_CONFIG" << EOF
    ,
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
EOF
else
    echo "  ⚠ GitHub MCP server (no token, skipping)"
fi

# Add Postgres server if password exists
if [ -n "$SUPABASE_DB_PASSWORD" ] && [ "$SUPABASE_DB_PASSWORD" != "" ] && [ ${#SUPABASE_DB_PASSWORD} -gt 5 ]; then
    echo "  ✓ Postgres MCP server (password found)"
    cat >> "$MCP_CONFIG" << EOF
    ,
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://postgres.eiipozoogrrfudhjoqms:${SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"]
    }
EOF
else
    echo "  ⚠ Postgres MCP server (no password, skipping)"
    echo "    Get password from: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/settings/database"
fi

# Close the JSON
cat >> "$MCP_CONFIG" << EOF
  }
}
EOF

echo "✅ MCP Configuration created"
echo "🤖 Claude Swarm agents available:"
echo "  ✓ Bug Detection Agent"
echo "  ✓ Performance Optimization Agent"
echo "  ✓ UI/UX Polish Agent"
echo "  ✓ Testing Coordination Agent"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    rm -f "$MCP_CONFIG"
    exit 0
}
trap cleanup EXIT

# Check/install expect
if ! command -v expect &> /dev/null; then
    echo "📦 Installing expect..."
    brew install expect || {
        echo "❌ Failed to install expect. Please run: brew install expect"
        exit 1
    }
fi

echo "🚀 Starting Claude with FULL POWER configuration..."

# Create expect script that handles various prompts
expect << 'EOF'
set timeout -1
log_user 1

# Start claude with temporary MCP config
spawn claude --mcp-config .mcp-temp.json

expect {
    # Common confirmation prompts
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