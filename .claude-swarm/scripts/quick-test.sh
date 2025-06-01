#!/bin/bash
echo "🧪 QUICK BETA TEST"
echo "================="
echo ""

# Just the essentials
echo "1. Checking build..."
npm run type-check 2>&1 | tail -5

echo ""
echo "2. Checking for critical issues..."
grep -r "BETA_MODE" . --include="*.tsx" 2>/dev/null | wc -l | xargs echo "BETA_MODE references:"

echo ""
echo "3. Bundle check..."
if [ -d ".next" ]; then
    du -sh .next | cut -f1 | xargs echo "Bundle size:"
else
    echo "No build found"
fi

echo ""
echo "✅ Quick test complete!"
echo ""
echo "Now manually test:"
echo "- Guest login works?"
echo "- Tables visible?"
echo "- Floor plan opens?"