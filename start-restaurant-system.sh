#!/bin/bash

# 🍽️ Plate Restaurant System - Complete Startup Script
# Starts the dev server with health checks and optional browser opening

echo "🍽️  PLATE RESTAURANT SYSTEM STARTUP"
echo "==================================="
echo "Date: $(date)"
echo ""

# Configuration
PORT=3000
BASE_URL="http://localhost:$PORT"
HEALTH_CHECK_TIMEOUT=30
OPEN_BROWSER=${1:-"yes"}  # Pass "no" as first argument to skip browser

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
    return $?
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    echo "🔍 Checking port $port..."
    
    if check_port $port; then
        echo -e "${YELLOW}⚠️  Port $port is in use. Killing existing processes...${NC}"
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
    local count=0
    echo -n "⏳ Waiting for server to start"
    
    while [ $count -lt $HEALTH_CHECK_TIMEOUT ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" | grep -q "200"; then
            echo -e "\n${GREEN}✅ Server is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        ((count++))
    done
    
    echo -e "\n${RED}❌ Server failed to start within $HEALTH_CHECK_TIMEOUT seconds${NC}"
    return 1
}

# Clean up any existing processes
echo "🧹 Cleaning up existing processes..."
kill_port 3000

# Check dependencies
echo ""
echo "📦 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules not found. Running npm install...${NC}"
    npm install
fi

# Load environment variables
echo ""
echo "🔧 Environment setup..."
if [ -f .env.local ]; then
    echo -e "${GREEN}✅ Found .env.local${NC}"
    # Check for required env vars
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo -e "${GREEN}✅ Supabase configuration found${NC}"
    else
        echo -e "${YELLOW}⚠️  Missing Supabase configuration${NC}"
    fi
else
    echo -e "${RED}❌ No .env.local file found${NC}"
    echo "   Please create .env.local with:"
    echo "   NEXT_PUBLIC_SUPABASE_URL=your_url"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key"
    exit 1
fi

# Start the dev server in background
echo ""
echo "🚀 Starting development server..."
npm run dev > dev.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
if wait_for_server; then
    # Server is ready
    echo ""
    echo -e "${GREEN}🎉 PLATE RESTAURANT SYSTEM IS READY!${NC}"
    echo ""
    echo "📍 Available URLs:"
    echo "   • Landing:    $BASE_URL"
    echo "   • Server:     $BASE_URL/server"
    echo "   • Kitchen:    $BASE_URL/kitchen/kds"
    echo "   • Admin:      $BASE_URL/admin"
    echo "   • Dashboard:  $BASE_URL/dashboard"
    echo ""
    echo "🔐 Guest Login:"
    echo "   • Email:      guest@restaurant.plate"
    echo "   • Password:   guest12345"
    echo ""
    
    # Open browser if requested
    if [ "$OPEN_BROWSER" = "yes" ]; then
        echo "🌐 Opening browser..."
        sleep 2
        open "$BASE_URL"
    fi
    
    echo ""
    echo "📋 Quick Commands:"
    echo "   • View logs:  tail -f dev.log"
    echo "   • Stop:       kill $SERVER_PID"
    echo "   • Restart:    ./start-restaurant-system.sh"
    echo ""
    echo -e "${YELLOW}💡 Server is running in background (PID: $SERVER_PID)${NC}"
    echo -e "${YELLOW}💡 Use 'kill $SERVER_PID' to stop the server${NC}"
    
    # Save PID to file for easy stopping
    echo $SERVER_PID > .server.pid
    echo ""
    echo "✅ PID saved to .server.pid"
    
else
    # Server failed to start
    echo -e "${RED}❌ Failed to start server${NC}"
    echo "📋 Check dev.log for errors:"
    tail -20 dev.log
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Optional: tail logs
echo ""
read -p "Would you like to view the server logs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 Showing server logs (Ctrl+C to exit)..."
    tail -f dev.log
fi