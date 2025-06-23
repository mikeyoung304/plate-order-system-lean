#!/bin/bash

echo "📸 TAKING SCREENSHOTS OF RUNNING APP"
echo "===================================="
echo ""

# Create screenshots directory
mkdir -p test-screenshots

# Function to take screenshot
take_screenshot() {
    local name="$1"
    local url="$2"
    local wait_time="${3:-3}"
    
    echo "Opening $name..."
    
    # Open URL in default browser
    open "$url"
    
    # Wait for page to load
    sleep "$wait_time"
    
    # Take screenshot
    screencapture -x "test-screenshots/${name}.png"
    
    echo "✅ Screenshot saved: test-screenshots/${name}.png"
}

echo "Starting screenshot capture..."
echo "(Browser will open automatically)"
echo ""

# Take screenshots of main pages
take_screenshot "01-landing-page" "http://localhost:3000" 3
take_screenshot "02-health-api" "http://localhost:3000/api/health" 2
take_screenshot "03-kitchen-kds" "http://localhost:3000/kitchen/kds" 4
take_screenshot "04-admin-page" "http://localhost:3000/admin" 3
take_screenshot "05-server-page" "http://localhost:3000/server" 3

echo ""
echo "Screenshots completed!"
echo "Check the test-screenshots/ directory"
ls -la test-screenshots/