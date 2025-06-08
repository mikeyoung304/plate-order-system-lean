#!/bin/bash

# Load environment variables from .env file
set -a
source .env
set +a

# Export the required variables for MCP servers
export NEXT_PUBLIC_SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY
export OPENAI_API_KEY

# Set up Supabase database connection
# Note: You'll need to add SUPABASE_DB_PASSWORD to your .env file
# Get it from: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/settings/database
export SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"

# Test if required variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: Supabase environment variables are not set!"
    echo "Please check your .env file"
    exit 1
fi

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "Warning: SUPABASE_DB_PASSWORD not set. PostgreSQL MCP server will not work."
    echo "Get it from: https://supabase.com/dashboard/project/eiipozoogrrfudhjoqms/settings/database"
fi

echo "Environment variables loaded successfully!"
echo "Starting Claude with MCP servers:"
echo "  ✓ sequential-thinking"
echo "  ✓ filesystem"
echo "  ✓ desktop-commander"
if [ -n "$SUPABASE_DB_PASSWORD" ]; then
    echo "  ✓ postgres"
else
    echo "  ⚠ postgres (missing password)"
fi

# Start Claude with MCP debug mode
claude --mcp-debug "$@"