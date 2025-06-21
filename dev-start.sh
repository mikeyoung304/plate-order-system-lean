#!/bin/bash

# 🚀 ONE SIMPLE STARTUP SCRIPT FOR PLATE RESTAURANT SYSTEM
# This is the ONLY script you need to remember: ./dev-start.sh

set -e  # Exit on error

# Colors for clear output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "┌─────────────────────────────────────────────────┐"
echo "│     🍽️  PLATE RESTAURANT SYSTEM STARTUP  🍽️      │"
echo "│                 ONE SIMPLE COMMAND              │"
echo "└─────────────────────────────────────────────────┘"
echo -e "${NC}"

# Function to kill processes on port 3000
cleanup_port() {
    echo -e "${YELLOW}🧹 Cleaning up port 3000...${NC}"
    
    if lsof -ti:3000 >/dev/null 2>&1; then
        echo -e "${YELLOW}   Found process on port 3000 - killing it...${NC}"
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 1
        
        # Double check
        if lsof -ti:3000 >/dev/null 2>&1; then
            echo -e "${RED}   ❌ Failed to free port 3000${NC}"
            echo -e "${YELLOW}   Try manually: lsof -i :3000 then kill -9 <PID>${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Port 3000 is ready${NC}"
}

# Function to check environment
check_environment() {
    echo -e "${YELLOW}🔍 Checking environment...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm v$(npm -v)${NC}"
    
    # Check .env.local
    if [ ! -f ".env.local" ]; then
        echo -e "${RED}❌ .env.local file not found${NC}"
        echo "This file contains database credentials and is required."
        exit 1
    fi
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
    
    # Check dependencies
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        npm install
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${GREEN}✅ Dependencies ready${NC}"
    fi
}

# Main execution
main() {
    # Step 1: Clean up any processes on port 3000
    cleanup_port
    echo ""
    
    # Step 2: Check environment
    check_environment
    echo ""
    
    # Step 3: Start the development server
    echo -e "${GREEN}🚀 Starting development server...${NC}"
    echo ""
    echo -e "${CYAN}📝 Your app will be available at:${NC}"
    echo "   🌐 Main App: http://localhost:3000"
    echo "   👨‍💼 Server View: http://localhost:3000/server"
    echo "   👨‍🍳 Kitchen KDS: http://localhost:3000/kitchen/kds"
    echo "   📊 Dashboard: http://localhost:3000/dashboard"
    echo ""
    echo -e "${CYAN}🔑 Demo Credentials:${NC}"
    echo "   📧 Email: guest@restaurant.plate"
    echo "   🔒 Password: guest12345"
    echo ""
    echo -e "${YELLOW}💡 Press Ctrl+C to stop the server${NC}"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Start Next.js development server
    next dev -p 3000
}

# Error handler
trap 'echo -e "\n${RED}❌ Startup failed! Check the error messages above.${NC}"' ERR

# Run main function
main