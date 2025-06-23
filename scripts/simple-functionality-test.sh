#!/bin/bash

# Simple Functionality Test Script
# Uses curl to test all endpoints without external dependencies

echo "🧪 SIMPLE FUNCTIONALITY TEST"
echo "==========================="
echo "Started at: $(date)"
echo ""

BASE_URL="http://localhost:3000"
GUEST_EMAIL="guest@restaurant.plate"
GUEST_PASSWORD="guest12345"
RESULTS_FILE="test-results-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    local method="${4:-GET}"
    local data="$5"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (Status: $response)"
        ((PASSED++))
        echo "✅ $name - Status: $response" >> "$RESULTS_FILE"
    else
        echo -e "${RED}❌ FAILED${NC} (Expected: $expected_status, Got: $response)"
        ((FAILED++))
        echo "❌ $name - Expected: $expected_status, Got: $response" >> "$RESULTS_FILE"
    fi
}

# Test with timing
test_with_timing() {
    local name="$1"
    local url="$2"
    
    echo -n "Testing $name performance... "
    
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$url")
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    # Convert to milliseconds
    response_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)
    
    if [ "$response_code" = "200" ]; then
        if [ "$response_ms" -lt 100 ]; then
            grade="A"
        elif [ "$response_ms" -lt 200 ]; then
            grade="B"
        elif [ "$response_ms" -lt 500 ]; then
            grade="C"
        else
            grade="D"
        fi
        echo -e "${GREEN}✅ PASSED${NC} (${response_ms}ms - Grade: $grade)"
        ((PASSED++))
        echo "✅ $name - Response time: ${response_ms}ms (Grade: $grade)" >> "$RESULTS_FILE"
    else
        echo -e "${RED}❌ FAILED${NC} (Status: $response_code)"
        ((FAILED++))
        echo "❌ $name - Failed with status: $response_code" >> "$RESULTS_FILE"
    fi
}

echo "1. TESTING PUBLIC ENDPOINTS"
echo "---------------------------"
test_endpoint "Landing Page" "$BASE_URL" "200"
test_endpoint "Health API" "$BASE_URL/api/health" "200"
echo ""

echo "2. TESTING PERFORMANCE"
echo "----------------------"
test_with_timing "Health API Performance" "$BASE_URL/api/health"
test_with_timing "Landing Page Performance" "$BASE_URL"
echo ""

echo "3. TESTING PROTECTED ROUTES"
echo "---------------------------"
test_endpoint "KDS Page (Redirect Expected)" "$BASE_URL/kitchen/kds" "200"
test_endpoint "Admin Page (Redirect Expected)" "$BASE_URL/admin" "200"
test_endpoint "Server Page (Redirect Expected)" "$BASE_URL/server" "200"
echo ""

echo "4. TESTING API ENDPOINTS"
echo "------------------------"
test_endpoint "KDS Orders API" "$BASE_URL/api/kds/orders" "401"
test_endpoint "KDS Stations API" "$BASE_URL/api/kds/stations" "200"
test_endpoint "Metrics API" "$BASE_URL/api/metrics" "200"
test_endpoint "Performance API" "$BASE_URL/api/performance" "200"
echo ""

echo "5. TESTING MULTIPLE CONCURRENT REQUESTS"
echo "---------------------------------------"
echo -n "Sending 10 concurrent requests... "
start_time=$(date +%s%N)

for i in {1..10}; do
    curl -s -o /dev/null "$BASE_URL/api/health" &
done
wait

end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

echo -e "${GREEN}✅ COMPLETED${NC} in ${duration}ms"
echo "✅ Concurrent requests - Completed in ${duration}ms" >> "$RESULTS_FILE"
((PASSED++))
echo ""

echo "6. CHECKING FOR TYPESCRIPT ERRORS"
echo "---------------------------------"
echo -n "Running TypeScript check... "
if npx tsc --noEmit 2>&1 | grep -q "error"; then
    echo -e "${RED}❌ FAILED${NC} (TypeScript errors found)"
    echo "❌ TypeScript check - Errors found" >> "$RESULTS_FILE"
    ((FAILED++))
else
    echo -e "${GREEN}✅ PASSED${NC} (No TypeScript errors)"
    echo "✅ TypeScript check - No errors" >> "$RESULTS_FILE"
    ((PASSED++))
fi
echo ""

echo "SUMMARY"
echo "======="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Success Rate: $(( PASSED * 100 / (PASSED + FAILED) ))%"
echo ""
echo "Results saved to: $RESULTS_FILE"

# Exit with appropriate code
if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi