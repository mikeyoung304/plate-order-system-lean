#!/bin/bash

# OPT-004: Quick automated cleanup of obvious unused imports
# Conservative approach - only remove clearly unused imports

# Fix app/layout.tsx
echo "Fixing app/layout.tsx..."
sed -i '' '/import { createClient } from/d' app/layout.tsx
sed -i '' '/import { headers } from/d' app/layout.tsx  
sed -i '' '/import { SecurityPerformanceInit } from/d' app/layout.tsx

# Fix app/page.tsx
echo "Fixing app/page.tsx..."
sed -i '' '/import { redirect } from/d' app/page.tsx
sed -i '' '/import { createClient } from/d' app/page.tsx

# Fix app/auth/actions.ts - replace 'let _session' with 'const _session'
echo "Fixing app/auth/actions.ts..."
sed -i '' 's/let _session =/const _session =/g' app/layout.tsx

# Fix components/auth/AuthForm.tsx unused React hooks
echo "Fixing components/auth/AuthForm.tsx..."
sed -i '' 's/useEffect, useState, //g' components/auth/AuthForm.tsx
sed -i '' 's/, useEffect, useState//g' components/auth/AuthForm.tsx

# Fix floor-plan components with duplicate react import
echo "Fixing floor-plan components..."
sed -i '' '5d' components/floor-plan-view.tsx  # Remove duplicate react import line 5

# Fix KDS Header unused import
echo "Fixing components/kds/KDSHeader.tsx..."
sed -i '' 's/AlertCircle, //g' components/kds/KDSHeader.tsx
sed -i '' 's/, AlertCircle//g' components/kds/KDSHeader.tsx

echo "Cleanup completed. Please review changes and commit."