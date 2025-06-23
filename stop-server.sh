#!/bin/bash

# 🛑 Stop Plate Restaurant System Server

echo "🛑 STOPPING PLATE RESTAURANT SYSTEM"
echo "==================================="

# Check if PID file exists
if [ -f .server.pid ]; then
    PID=$(cat .server.pid)
    echo "📋 Found server PID: $PID"
    
    # Check if process is running
    if ps -p $PID > /dev/null; then
        echo "🔍 Stopping server process..."
        kill $PID
        sleep 2
        
        # Check if stopped
        if ps -p $PID > /dev/null; then
            echo "⚠️  Process still running, forcing stop..."
            kill -9 $PID
        fi
        
        echo "✅ Server stopped"
        rm .server.pid
    else
        echo "⚠️  Server process not found (PID: $PID)"
        rm .server.pid
    fi
else
    echo "📋 No .server.pid file found"
    echo "🔍 Checking for processes on port 3000..."
    
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo "Found processes on port 3000:"
        lsof -i :3000
        echo ""
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        echo "✅ Killed all processes on port 3000"
    else
        echo "✅ No processes found on port 3000"
    fi
fi

echo ""
echo "✅ Cleanup complete"