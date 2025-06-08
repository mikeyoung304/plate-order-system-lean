#!/usr/bin/env fish
# Setup Plate Restaurant System Aliases for Fish Shell
# Run this once: chmod +x setup-aliases-fish.fish && ./setup-aliases-fish.fish

echo "🎯 Setting up Plate Restaurant System aliases for fish shell..."

# Fish config file
set FISH_CONFIG "$HOME/.config/fish/config.fish"

# Create fish config directory if it doesn't exist
mkdir -p (dirname $FISH_CONFIG)

echo "📝 Adding aliases to $FISH_CONFIG"

# Create backup
cp "$FISH_CONFIG" "$FISH_CONFIG.backup.(date +%Y%m%d_%H%M%S)" 2>/dev/null; or true

# Add aliases block
echo '
# ======================================
# Plate Restaurant System Aliases
# ======================================

# Basic commands
alias plate-start="cd /Users/mike/Plate-Restaurant-System-App && npm run dev"
alias plate-claude="cd /Users/mike/Plate-Restaurant-System-App && claude code"
alias plate-status="cd /Users/mike/Plate-Restaurant-System-App && lsof -i :3000 && git status --short"
alias plate-logs="cd /Users/mike/Plate-Restaurant-System-App && tail -f dev-server.log"
alias plate-clean="cd /Users/mike/Plate-Restaurant-System-App && rm -rf .next node_modules && npm install"
alias plate-commit="cd /Users/mike/Plate-Restaurant-System-App && git add . && git commit -m ✨\ Quick\ update && git push"
alias plate-test="cd /Users/mike/Plate-Restaurant-System-App && npm run lint && npm run type-check"
alias plate-build="cd /Users/mike/Plate-Restaurant-System-App && npm run build"

# Navigation
alias plate="cd /Users/mike/Plate-Restaurant-System-App"
alias plate-open="cd /Users/mike/Plate-Restaurant-System-App && open http://localhost:3000"
alias plate-code="cd /Users/mike/Plate-Restaurant-System-App && code ."

# Automation
alias plate-autopilot="cd /Users/mike/Plate-Restaurant-System-App && python3 ./claude-autopilot.py"
alias plate-auto="cd /Users/mike/Plate-Restaurant-System-App && ./claude-smart-auto.sh"
alias plate-swarm="cd /Users/mike/Plate-Restaurant-System-App && ./.claude-swarm/coordinate-agents.sh"

# Database
alias plate-db-reset="cd /Users/mike/Plate-Restaurant-System-App && npx supabase db reset"
alias plate-db-status="cd /Users/mike/Plate-Restaurant-System-App && npx supabase status"

# Quick functions
function plate-health
    cd /Users/mike/Plate-Restaurant-System-App
    echo "🔍 Plate System Health Check"
    echo "=========================="
    if lsof -i :3000 > /dev/null
        echo "✓ Server: Running on port 3000"
    else
        echo "✓ Server: Not running"
    end
    echo "✓ Git branch: "(git branch --show-current)
    echo "✓ Uncommitted changes: "(git status --porcelain | wc -l | tr -d " ")
    set response_code (curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    echo "✓ App response: $response_code"
    echo "✓ Node version: "(node --version)
    echo "✓ NPM version: "(npm --version)
end

function plate-fix
    cd /Users/mike/Plate-Restaurant-System-App
    echo "🔧 Quick Fix Routine"
    echo "==================="
    echo "Killing any stuck processes..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null; or true
    echo "Clearing Next.js cache..."
    rm -rf .next
    echo "Starting fresh server..."
    npm run dev
end

function plate-morning
    cd /Users/mike/Plate-Restaurant-System-App
    echo "🌅 Morning Startup Routine"
    echo "========================="
    git status --short
    echo "Starting smart development server..."
    npm run dev:smart &
    sleep 3
    echo "Launching Claude automation..."
    ./claude-scripts/production/claude-main.sh &
    sleep 2
    echo "Opening app in browser..."
    open http://localhost:3000
    echo "✅ Development server + Claude automation ready!"
    echo "💡 Use plate-swarm for specialized agent assistance"
end

function plate-deploy-check
    cd /Users/mike/Plate-Restaurant-System-App
    echo "🚀 Pre-deployment Check"
    echo "======================="
    if npm run lint && npm run type-check && npm run build
        echo "✅ Ready for deployment!"
    else
        echo "❌ Fix issues before deployment"
    end
end

# ======================================
# End Plate Restaurant System Aliases
# ======================================
' >> "$FISH_CONFIG"

echo "✅ Aliases added successfully!"
echo ""
echo "🔄 To activate aliases, run:"
echo "   source $FISH_CONFIG"
echo ""
echo "📋 Available commands:"
echo "   plate-start     - Start development server"
echo "   plate-claude    - Start Claude Code"  
echo "   plate-status    - Check system status"
echo "   plate-health    - Complete health check"
echo "   plate-morning   - Morning startup routine"
echo "   plate-fix       - Emergency fix routine"
echo "   plate-logs      - Watch server logs"
echo "   plate-clean     - Clean install"
echo "   plate-commit    - Quick commit and push"
echo "   plate           - Navigate to project"
echo ""
echo "🎯 Run 'plate-health' to test your setup!"

# Auto-source for current session
source "$FISH_CONFIG"
echo "✅ Aliases activated for current session!"

