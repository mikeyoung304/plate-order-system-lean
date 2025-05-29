#!/bin/bash

# Load environment variables from .env file
set -a
source .env
set +a

# Export the required variables for MCP servers
export NEXT_PUBLIC_SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY
export OPENAI_API_KEY

# Test if required variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: Supabase environment variables are not set!"
    echo "Please check your .env file"
    exit 1
fi

echo "Environment variables loaded successfully!"
echo "Starting Claude with all MCP servers..."

# Start Claude with MCP debug mode
claude --mcp-debug "$@"