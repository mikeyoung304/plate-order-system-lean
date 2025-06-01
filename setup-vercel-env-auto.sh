#!/bin/bash

# Automated Vercel Environment Variable Setup
echo "🚀 Setting up Vercel environment variables..."

# Export environment variables from .env file
source .env

# Add environment variables to Vercel (production)
echo "$NEXT_PUBLIC_SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "$SUPABASE_SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "$OPENAI_API_KEY" | vercel env add OPENAI_API_KEY production
echo "$NEXT_PUBLIC_APP_URL" | vercel env add NEXT_PUBLIC_APP_URL production
echo "$NEXT_PUBLIC_BETA_MODE" | vercel env add NEXT_PUBLIC_BETA_MODE production

echo "✅ Vercel environment variables configured!"
echo "📋 Environment variables added:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" 
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - OPENAI_API_KEY"
echo "   - NEXT_PUBLIC_APP_URL"
echo "   - NEXT_PUBLIC_BETA_MODE"

echo ""
echo "🎯 Next: Connect Git integration via Vercel Dashboard"
echo "   1. Go to: https://vercel.com/mikeyoung304-gmailcoms-projects/plate-restaurant-app/settings/git"
echo "   2. Connect GitHub repository: mikeyoung304/plate-order-system-lean"
echo "   3. Set Production Branch: main"
echo "   4. Enable auto-deployments"