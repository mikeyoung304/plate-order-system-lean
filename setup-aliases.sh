#!/bin/bash
# Setup Plate Restaurant System Aliases
# Run this once: chmod +x setup-aliases.sh && ./setup-aliases.sh

echo "🎯 Setting up Plate Restaurant System aliases..."

# Detect shell
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_RC="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then
    SHELL_RC="$HOME/.bashrc"
else
    echo "⚠️  Unsupported shell. Please add aliases manually to your shell config."
    exit 1
fi

echo "📝 Adding aliases to $SHELL_RC"

# Create backup
cp "$SHELL_RC" "$SHELL_RC.backup.$(date +%Y%m%d_%H%M%S)"

# Add aliases block
cat >> "$SHELL_RC" << 'EOF'

# ======================================
# Plate Restaurant System Aliases
# ======================================

# Basic commands
alias plate-start="cd /Users/mike/Plate-Restaurant-System-App && npm run dev"
alias plate-claude="cd /Users/mike/Plate-Restaurant-System-App && claude code"
alias plate-status="cd /Users/mike/Plate-Restaurant-System-App && lsof -i :3000 && git status --short"
alias plate-logs="cd /Users/mike/Plate-Restaurant-System-App && tail -f dev-server.log"
alias plate-clean="cd /Users/mike/Plate-Restaurant-System-App && rm -rf .next node_modules && npm install"
alias plate-commit="cd /Users/mike/Plate-Restaurant-System-App && git add . && git commit -m '✨ Quick update' && git push"
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
plate-health() {
    cd /Users/mike/Plate-Restaurant-System-App
    echo "🔍 Plate System Health Check"
    echo "=========================="
    echo "✓ Server: $(lsof -i :3000 > /dev/null && echo "Running on port 3000" || echo "Not running")"
    echo "✓ Git branch: $(git branch --show-current)"
    echo "✓ Uncommitted changes: $(git status --porcelain | wc -l | tr -d ' ')"
    echo "✓ App response: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
    echo "✓ Node version: $(node --version)"
    echo "✓ NPM version: $(npm --version)"
}

plate-fix() {
    cd /Users/mike/Plate-Restaurant-System-App
    echo "🔧 Quick Fix Routine"
    echo "==================="
    echo "Killing any stuck processes..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    echo "Clearing Next.js cache..."
    rm -rf .next
    echo "Starting fresh server..."
    npm run dev
}

plate-morning() {
    cd /Users/mike/Plate-Restaurant-System-App
    ./morning
}

morning() {
    cd /Users/mike/Plate-Restaurant-System-App
    ./morning
}

plate-deploy-check() {
    cd /Users/mike/Plate-Restaurant-System-App
    echo "🚀 Pre-deployment Check"
    echo "======================="
    npm run lint && npm run type-check && npm run build && echo "✅ Ready for deployment!" || echo "❌ Fix issues before deployment"
}

# ======================================
# End Plate Restaurant System Aliases
# ======================================
EOF

echo "✅ Aliases added successfully!"
echo ""
echo "🔄 To activate aliases, run:"
echo "   source $SHELL_RC"
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

# Auto-source if possible
if [[ -n "$ZSH_VERSION" ]]; then
    source "$SHELL_RC"
    echo "✅ Aliases activated for current session!"
elif [[ -n "$BASH_VERSION" ]]; then
    source "$SHELL_RC" 
    echo "✅ Aliases activated for current session!"
fi