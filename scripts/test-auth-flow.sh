#!/bin/bash

echo "🔐 TESTING AUTHENTICATION FLOW"
echo "============================="
echo ""

BASE_URL="http://localhost:3000"
SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Load env vars
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "1. Testing Guest Login via Supabase API"
echo "---------------------------------------"

# Attempt to login via Supabase API
response=$(curl -s -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guest@restaurant.plate",
    "password": "guest12345"
  }')

# Check if we got an access token
if echo "$response" | grep -q "access_token"; then
    echo "✅ Guest login successful!"
    
    # Extract access token
    access_token=$(echo "$response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    
    echo ""
    echo "2. Testing Authenticated API Access"
    echo "-----------------------------------"
    
    # Test KDS orders with auth
    kds_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      "${BASE_URL}/api/kds/orders" \
      -H "Authorization: Bearer ${access_token}")
    
    http_status=$(echo "$kds_response" | grep "HTTP_STATUS" | cut -d':' -f2)
    body=$(echo "$kds_response" | sed '$d')
    
    echo "KDS Orders API Status: $http_status"
    
    if [ "$http_status" = "200" ]; then
        echo "✅ Authenticated API access successful"
        
        # Check if we got data
        if echo "$body" | grep -q "orders"; then
            echo "✅ Successfully retrieved order data"
        else
            echo "⚠️  No order data returned (might be empty)"
        fi
    else
        echo "❌ Failed to access authenticated API"
        echo "Response: $body"
    fi
    
else
    echo "❌ Guest login failed!"
    echo "Response: $response"
    
    # Check if user exists
    echo ""
    echo "Checking database for guest user..."
    
    # We'll need to check via the app's API
    health_response=$(curl -s "${BASE_URL}/api/health")
    echo "Health check response received"
fi

echo ""
echo "3. Testing Browser-Based Auth Flow"
echo "----------------------------------"
echo "To test the full auth flow with UI:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Login with guest@restaurant.plate / guest12345"
echo "3. Check if you're redirected to /dashboard or /admin"
echo "4. Navigate to http://localhost:3000/kitchen/kds"
echo ""
echo "Manual verification required for UI flow"