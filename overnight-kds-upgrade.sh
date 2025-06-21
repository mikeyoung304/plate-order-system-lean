#!/bin/bash
# Overnight KDS Upgrade Automation Script
# This script can run independently without user interaction

set -e  # Exit on any error

echo "🌙 Starting overnight KDS upgrade process..."
echo "Start time: $(date)"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Keep development server running
log "Ensuring development server is running..."
if ! lsof -ti:3001 > /dev/null; then
    log "Starting development server on port 3001..."
    npm run dev -- -p 3001 > dev-server.log 2>&1 &
    sleep 5
fi

# Run any build processes
log "Running build checks..."
npm run build 2>&1 | tee build-output.log

# Run tests if they exist
log "Running test suite..."
npm test 2>&1 | tee test-output.log || true

# Database integrity checks
log "Checking database integrity..."
node comprehensive-kds-check.cjs 2>&1 | tee db-check.log || true

log "Overnight process setup complete. Check logs for details."
echo "End time: $(date)"