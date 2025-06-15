#!/bin/bash

# Supabase configuration
SUPABASE_URL="https://eiipozoogrrfudhjoqms.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaXBvem9vZ3JyZnVkaGpvcW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDIwNzI3OSwiZXhwIjoyMDU5NzgzMjc5fQ.p7DodpQaPooDVFQTAkXKWRdp0ZGMzzXib9cfxGauLko"

echo "Testing Supabase REST API Connection..."
echo "======================================="
echo ""

# Test 1: List all tables (using pg_tables)
echo "1. Testing table listing via pg_tables:"
echo "--------------------------------------"
curl -X GET \
  "${SUPABASE_URL}/rest/v1/pg_tables?select=*&schemaname=eq.public" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  2>/dev/null | jq '.' || echo "Failed to parse JSON"

echo ""
echo ""

# Test 2: Query orders table
echo "2. Testing orders table query:"
echo "-----------------------------"
curl -X GET \
  "${SUPABASE_URL}/rest/v1/orders?select=*&limit=5" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  2>/dev/null | jq '.' || echo "Failed to parse JSON"

echo ""
echo ""

# Test 3: Get table schema using columns endpoint
echo "3. Testing columns information:"
echo "------------------------------"
curl -X GET \
  "${SUPABASE_URL}/rest/v1/columns?table_name=eq.orders&table_schema=eq.public" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  2>/dev/null | jq '.' || echo "Failed to parse JSON"

echo ""
echo ""

# Test 4: Try RPC call to get schema
echo "4. Testing RPC for schema information:"
echo "-------------------------------------"
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/get_schema_info" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' \
  2>/dev/null | jq '.' || echo "Failed to parse JSON"

echo ""
echo ""

# Test 5: Query menu_items table
echo "5. Testing menu_items table query:"
echo "---------------------------------"
curl -X GET \
  "${SUPABASE_URL}/rest/v1/menu_items?select=*&limit=5" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  2>/dev/null | jq '.' || echo "Failed to parse JSON"

echo ""
echo ""

# Test 6: Query residents table
echo "6. Testing residents table query:"
echo "--------------------------------"
curl -X GET \
  "${SUPABASE_URL}/rest/v1/residents?select=*&limit=5" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  2>/dev/null | jq '.' || echo "Failed to parse JSON"

echo ""
echo ""

# Test 7: Check available endpoints
echo "7. Testing root endpoint:"
echo "------------------------"
curl -X GET \
  "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  2>/dev/null | jq '.' || echo "Failed to parse JSON"

echo ""
echo "======================================="
echo "REST API Tests Complete"