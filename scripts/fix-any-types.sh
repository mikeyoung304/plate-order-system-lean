#!/bin/bash

# Script to help identify and fix 'any' types in the codebase
# This creates a report of all 'any' usages for systematic fixing

echo "🔍 Analyzing 'any' type usage in the codebase..."

# Create output directory
mkdir -p .claude/type-fixes

# Find all TypeScript files with 'any' types
echo "Files with 'any' types:" > .claude/type-fixes/any-types-report.md
echo "" >> .claude/type-fixes/any-types-report.md

# Count total
total_count=$(grep -r ": any" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . | wc -l)
echo "Total 'any' types found: $total_count" >> .claude/type-fixes/any-types-report.md
echo "" >> .claude/type-fixes/any-types-report.md

# Group by directory
echo "## By Directory:" >> .claude/type-fixes/any-types-report.md
echo "" >> .claude/type-fixes/any-types-report.md

for dir in components lib hooks app; do
  if [ -d "$dir" ]; then
    count=$(grep -r ": any" --include="*.ts" --include="*.tsx" "$dir" 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
      echo "### $dir ($count occurrences)" >> .claude/type-fixes/any-types-report.md
      grep -r -n ": any" --include="*.ts" --include="*.tsx" "$dir" 2>/dev/null | head -20 >> .claude/type-fixes/any-types-report.md
      echo "" >> .claude/type-fixes/any-types-report.md
    fi
  fi
done

# Common patterns
echo "## Common Patterns:" >> .claude/type-fixes/any-types-report.md
echo "" >> .claude/type-fixes/any-types-report.md

echo "### Event handlers:" >> .claude/type-fixes/any-types-report.md
grep -r "event: any" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . | head -10 >> .claude/type-fixes/any-types-report.md
echo "" >> .claude/type-fixes/any-types-report.md

echo "### Array types:" >> .claude/type-fixes/any-types-report.md
grep -r ": any\[\]" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . | head -10 >> .claude/type-fixes/any-types-report.md
echo "" >> .claude/type-fixes/any-types-report.md

echo "### Function parameters:" >> .claude/type-fixes/any-types-report.md
grep -r "(.*: any" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . | head -10 >> .claude/type-fixes/any-types-report.md
echo "" >> .claude/type-fixes/any-types-report.md

echo "✅ Report generated at .claude/type-fixes/any-types-report.md"
echo "📝 Next steps:"
echo "   1. Review the report"
echo "   2. Import types from @/types/restaurant"
echo "   3. Replace 'any' with specific types"
echo "   4. Use union types for flexible parameters"