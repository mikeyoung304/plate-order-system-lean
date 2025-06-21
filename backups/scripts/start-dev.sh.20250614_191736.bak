#!/bin/bash

# Smart Dev Server Starter
# Ensures port 3000 is always available and starts the dev server

echo "🚀 Starting Plate Restaurant System Development Server"
echo "=============================================="

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
        echo "⚠️  Port $port is in use. Killing existing processes..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 2
        
        if check_port $port; then
            echo "❌ Failed to free port $port"
            return 1
        else
            echo "✅ Port $port freed successfully"
        fi
    else
        echo "✅ Port $port is available"
    fi
    return 0
}

# Clean up common dev server ports
echo ""
echo "🧹 Cleaning up ports..."
kill_port 3000
kill_port 3001
kill_port 3002

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed or not in PATH"
    exit 1
fi

# Load environment variables
echo ""
echo "🔧 Loading environment variables..."
if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
    echo "✅ Environment variables loaded from .env.local"
else
    echo "⚠️  No .env.local file found - some features may not work"
fi

# Verify critical environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_URL not set"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
fi

# Final port check
echo ""
echo "🔍 Final port 3000 check..."
if check_port 3000; then
    echo "❌ Port 3000 is still in use. You may need to manually check:"
    echo "   lsof -i :3000"
    echo "   kill -9 <PID>"
    exit 1
fi

# Start the development server
echo ""
echo "🎯 Starting Next.js development server on http://localhost:3000"
echo "   - Server view: http://localhost:3000/server"
echo "   - Kitchen KDS: http://localhost:3000/kitchen/kds" 
echo "   - Expo station: http://localhost:3000/expo"
echo "   - Dashboard: http://localhost:3000/dashboard"
echo ""
echo "💡 Use Ctrl+C to stop the server"
echo "💡 If port issues persist, run: npm run dev:clean"
echo ""

# Start the server (force port 3000)
exec npm run dev

# Note: exec replaces the shell process with npm, so anything after this won't run