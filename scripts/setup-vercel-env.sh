#!/bin/bash

# Script to help set up Vercel environment variables
# Usage: ./scripts/setup-vercel-env.sh

echo "🚀 Plate Order System - Vercel Environment Setup"
echo "=============================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please ensure you have a .env file with your credentials."
    exit 1
fi

# Source the .env file
set -a
source .env
set +a

echo "📋 Found environment variables in .env file"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "Install it with: npm i -g vercel"
    echo ""
    echo "Or add variables manually in Vercel Dashboard:"
    echo "1. Go to your project settings"
    echo "2. Navigate to 'Environment Variables'"
    echo "3. Add these variables:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
    echo "OPENAI_API_KEY=$OPENAI_API_KEY"
    exit 0
fi

echo "✅ Vercel CLI detected"
echo ""
echo "This script will add your environment variables to Vercel."
echo "Make sure you're logged in to Vercel CLI and have selected your project."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Adding environment variables to Vercel..."

# Add each environment variable
echo "1/4 Adding NEXT_PUBLIC_SUPABASE_URL..."
echo "$NEXT_PUBLIC_SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo "2/4 Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo "3/4 Adding SUPABASE_SERVICE_ROLE_KEY..."
echo "$SUPABASE_SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo "4/4 Adding OPENAI_API_KEY..."
echo "$OPENAI_API_KEY" | vercel env add OPENAI_API_KEY production

echo ""
echo "✅ Environment variables added successfully!"
echo ""
echo "Next steps:"
echo "1. Deploy with: vercel --prod"
echo "2. Update Supabase redirect URLs with your Vercel domain"
echo "3. Run guest setup: npm run setup-guest"
echo ""
echo "🎉 Ready to deploy!"