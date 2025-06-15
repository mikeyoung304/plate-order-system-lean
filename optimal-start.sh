#!/bin/bash

# 🚀 Optimal Plate Restaurant System Startup Script
# One-click development environment launcher with enhanced features

set -e  # Exit on error

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_FILE="$SCRIPT_DIR/dev.log"
STARTUP_TIMEOUT=15
PORT=3000

# Banner
echo -e "${PURPLE}"
echo "┌─────────────────────────────────────────────────┐"
echo "│     🍽️  PLATE RESTAURANT SYSTEM LAUNCHER  🍽️      │"
echo "│           Optimal Development Setup             │"
echo "└─────────────────────────────────────────────────┘"
echo -e "${NC}"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    local all_good=true
    
    echo -e "${CYAN}🔍 Checking prerequisites...${NC}"
    echo ""
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✅ Node.js${NC} $NODE_VERSION"
    else
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo "   Install from: https://nodejs.org/"
        all_good=false
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        echo -e "${GREEN}✅ npm${NC} v$NPM_VERSION"
    else
        echo -e "${RED}❌ npm is not installed${NC}"
        all_good=false
    fi
    
    # Check for required env files
    if [ -f ".env.local" ]; then
        echo -e "${GREEN}✅ .env.local${NC} found"
    else
        echo -e "${YELLOW}⚠️  .env.local not found${NC}"
        if [ -f ".env.example" ]; then
            echo "   Creating from .env.example..."
            cp .env.example .env.local
            echo -e "${GREEN}   ✅ Created .env.local${NC}"
        else
            echo -e "${RED}   ❌ No .env.example found${NC}"
            all_good=false
        fi
    fi
    
    # Check for node_modules
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✅ Dependencies${NC} installed"
    else
        echo -e "${YELLOW}⚠️  Dependencies not installed${NC}"
        echo "   Installing dependencies..."
        npm install
        echo -e "${GREEN}   ✅ Dependencies installed${NC}"
    fi
    
    echo ""
    
    if [ "$all_good" = false ]; then
        echo -e "${RED}❌ Some prerequisites are missing. Please fix them and try again.${NC}"
        exit 1
    fi
}

# Function to check if port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
    return $?
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔍 Checking port $port...${NC}"
    
    if check_port $port; then
        echo -e "${YELLOW}⚠️  Port $port is in use. Killing existing processes...${NC}"
        
        # Show what's using the port
        echo -e "${CYAN}   Current process:${NC}"
        lsof -i :$port | grep LISTEN | head -n 5
        
        # Kill the processes
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 2
        
        if check_port $port; then
            echo -e "${RED}❌ Failed to free port $port${NC}"
            return 1
        else
            echo -e "${GREEN}✅ Port $port freed successfully${NC}"
        fi
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
    fi
    return 0
}

# Function to wait for server to be ready
wait_for_server() {
    local url=$1
    local max_attempts=$2
    local attempt=0
    
    echo -ne "${CYAN}⏳ Waiting for server to be ready${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -m 2 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -q "200\|302\|304"; then
            echo -e "\r${GREEN}✅ Server is ready!${NC}                    "
            return 0
        fi
        
        echo -ne "\r${CYAN}⏳ Waiting for server to be ready${NC} (${attempt}s/$max_attempts)"
        sleep 1
        ((attempt++))
    done
    
    echo -e "\r${YELLOW}⚠️  Server took longer than expected to start${NC}"
    return 1
}

# Function to open Safari private window directly to the app
open_safari_private() {
    local url="http://localhost:3000"
    
    echo -e "${CYAN}🌐 Opening Safari private window...${NC}"
    
    # Try osascript first, fallback to simple open
    if osascript << EOF 2>/dev/null
tell application "Safari"
    activate
    tell application "System Events"
        keystroke "n" using {command down, shift down}
    end tell
    delay 0.5
    set the URL of the front document to "$url"
end tell
EOF
    then
        echo -e "${GREEN}✅ Safari opened in private mode${NC}"
    else
        echo -e "${YELLOW}⚠️ Opening Safari manually (need to grant permissions)${NC}"
        open -a Safari "$url"
        echo -e "${YELLOW}📝 Please use Safari private mode for best experience${NC}"
    fi
    
    echo -e "${YELLOW}📝 Use these credentials to sign in:${NC}"
    echo "   Email: guest@restaurant.plate"
    echo "   Password: guest12345"
}

# Function to show helpful info
show_info() {
    echo -e "${GREEN}"
    echo "┌─────────────────────────────────────────────────┐"
    echo "│            🎉 SYSTEM READY! 🎉                  │"
    echo "└─────────────────────────────────────────────────┘"
    echo -e "${NC}"
    
    echo -e "${CYAN}📊 DEMO SYSTEM INFO:${NC}"
    echo "├─ User: guest@restaurant.plate"
    echo "├─ Password: guest12345"
    echo "├─ Tables: 6 with 22 seats"
    echo "├─ Active Orders: Check KDS"
    echo "└─ Environment: Production Mode (Optimized)"
    
    echo ""
    echo -e "${CYAN}🔗 QUICK LINKS:${NC}"
    echo "├─ Main App:     http://localhost:3000"
    echo "├─ Server View:  http://localhost:3000/server"
    echo "├─ Kitchen KDS:  http://localhost:3000/kitchen/kds"
    echo "├─ Expo Station: http://localhost:3000/expo"
    echo "└─ Dashboard:    http://localhost:3000/dashboard"
    
    echo ""
    echo -e "${CYAN}🎭 LOADED RESIDENTS:${NC}"
    echo "Mable Meatballs, Waffles Ohulahan, Bernie Bend,"
    echo "Alfonzo Fondu, Chuck & Larry Winstein, Mary Choppins,"
    echo "Theodore Theopson, Angry Sam, Big Betty, and more!"
    
    echo ""
    echo -e "${YELLOW}💡 TIPS:${NC}"
    echo "• Use Ctrl+C to stop the server"
    echo "• Logs are saved to: $LOG_FILE"
    echo "• Run './optimal-start.sh' anytime to restart"
    echo "• Desktop shortcut created (check Desktop)"
    echo ""
}

# Main execution
main() {
    # Start logging
    log "Starting Plate Restaurant System..."
    
    # Check prerequisites
    check_prerequisites
    
    # Clean up ports and processes
    echo -e "${CYAN}🧹 Cleaning up ports and processes...${NC}"
    
    # Kill any remaining Node.js processes that might be hanging
    echo -e "${CYAN}   Killing Node.js processes...${NC}"
    pkill -f "next start" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "node.*3000" 2>/dev/null || true
    
    # Clean up specific ports
    kill_port 3000
    kill_port 3001
    kill_port 3002
    
    # Extra wait to ensure cleanup
    sleep 1
    echo ""
    
    # Final port check
    if check_port 3000; then
        echo -e "${RED}❌ Port 3000 is still in use${NC}"
        echo "Please manually check: lsof -i :3000"
        exit 1
    fi
    
    # Start the production server
    echo -e "${CYAN}🚀 Starting Plate Restaurant System...${NC}"
    echo ""
    
    # Build and start production server for reliability
    echo -e "${CYAN}🔨 Building optimized production build...${NC}"
    
    # Clear build cache to ensure fresh changes
    echo -e "${CYAN}♻️  Clearing build cache...${NC}"
    rm -rf .next
    
    npm run build
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}🚀 Starting production server...${NC}"
    # Start server in background
    npm run start > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to be ready
    if wait_for_server "http://localhost:3000" $STARTUP_TIMEOUT; then
        # Show info
        show_info
        
        # Open Safari private window
        open_safari_private
        
        # Keep server running in foreground
        echo -e "${GREEN}📋 Server logs (press Ctrl+C to stop):${NC}"
        echo "─────────────────────────────────────────"
        
        # Trap Ctrl+C to clean up
        trap "echo -e '\n${YELLOW}Stopping server...${NC}'; kill $SERVER_PID 2>/dev/null; exit" INT
        
        # Show live logs
        tail -f "$LOG_FILE"
    else
        echo -e "${RED}❌ Server failed to start within ${STARTUP_TIMEOUT}s${NC}"
        echo "🔍 Last few log entries:"
        tail -n 10 "$LOG_FILE"
        echo ""
        echo -e "${YELLOW}💡 The server might still be starting. Try:${NC}"
        echo "   - Wait a bit longer and check http://localhost:3000"
        echo "   - Check full logs: tail -f $LOG_FILE"
        echo "   - Or kill and restart: npm run kill-port && npm run dev"
        
        # Don't kill the server - let it continue
        echo -e "${CYAN}🔄 Leaving server running in background...${NC}"
        exit 1
    fi
}

# Run main function
main "$@"