#\!/bin/bash
# Emergency Deployment Fix
echo "🚨 FIXING DEPLOYMENT SPAZZING..."

# Fix Next.js config
npm install @next/bundle-analyzer
echo "✅ Bundle analyzer installed"

# Clear Vercel cache  
rm -rf .vercel .next node_modules/.cache
echo "✅ Cache cleared"

echo "🚀 Ready for: vercel --prod"
