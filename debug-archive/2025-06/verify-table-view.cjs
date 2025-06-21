#!/usr/bin/env node

/**
 * Verify Table View Configuration
 * Check if KDS defaults to table view and table grouping is active
 */

const fs = require('fs');
const path = require('path');

function verifyTableViewConfiguration() {
  console.log('🔍 Verifying KDS Table View Configuration');
  console.log('=========================================');
  
  const filesToCheck = [
    {
      path: 'lib/hooks/use-kds-state.ts',
      description: 'KDS State Hook - Default view mode',
      pattern: /viewMode:\s*['"]table['"]/
    },
    {
      path: 'components/kds/KDSMainContent.tsx', 
      description: 'KDS Main Content - Default view mode parameter',
      pattern: /viewMode\s*=\s*['"]table['"]/
    },
    {
      path: 'components/kds/KDSMainContent.tsx',
      description: 'KDS Main Content - Table view routing',
      pattern: /actualViewMode\s*===\s*['"]table['"]\s*\?\s*.*TableGroupedView/
    },
    {
      path: 'components/kds/table-group-card.tsx',
      description: 'Table Group Card - Component exists',
      pattern: /export.*TableGroupCard/
    },
    {
      path: 'hooks/use-table-grouped-orders.ts',
      description: 'Table Grouped Orders Hook - Hook exists', 
      pattern: /export.*useTableGroupedOrders/
    }
  ];
  
  let allChecksPass = true;
  
  for (const check of filesToCheck) {
    const fullPath = path.join(__dirname, check.path);
    
    try {
      if (!fs.existsSync(fullPath)) {
        console.log(`❌ ${check.description}: FILE NOT FOUND`);
        allChecksPass = false;
        continue;
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      
      if (check.pattern.test(content)) {
        console.log(`✅ ${check.description}: CONFIGURED CORRECTLY`);
      } else {
        console.log(`⚠️  ${check.description}: PATTERN NOT FOUND`);
        allChecksPass = false;
      }
      
    } catch (error) {
      console.log(`❌ ${check.description}: ERROR - ${error.message}`);
      allChecksPass = false;
    }
  }
  
  console.log('\\n🎯 SUMMARY:');
  console.log('============');
  
  if (allChecksPass) {
    console.log('✅ ALL TABLE VIEW CONFIGURATIONS CORRECT');
    console.log('✅ KDS should default to table grouping view');
    console.log('✅ TableGroupCard and useTableGroupedOrders are available');
    console.log('');
    console.log('💡 If table grouping still not visible:');
    console.log('   1. Check browser dev tools for JavaScript errors');
    console.log('   2. Verify data is loading (check Network tab)');
    console.log('   3. Check CSS styles aren\'t hiding table groups');
    console.log('   4. Clear browser cache and hard refresh');
  } else {
    console.log('❌ SOME CONFIGURATIONS MISSING - needs investigation');
  }
  
  // Additional check: Look for potential view mode override
  console.log('\\n🔍 Checking for view mode overrides...');
  
  const kdsLayoutPath = path.join(__dirname, 'components/kds/KDSLayoutRefactored.tsx');
  if (fs.existsSync(kdsLayoutPath)) {
    const content = fs.readFileSync(kdsLayoutPath, 'utf8');
    
    // Check if view mode is being overridden anywhere
    const overridePatterns = [
      /setViewMode.*['"](?!table)['"]/,
      /viewMode.*=.*['"](?!table)['"]/
    ];
    
    let hasOverrides = false;
    for (const pattern of overridePatterns) {
      if (pattern.test(content)) {
        console.log('⚠️  Potential view mode override found in KDSLayoutRefactored.tsx');
        hasOverrides = true;
      }
    }
    
    if (!hasOverrides) {
      console.log('✅ No view mode overrides found');
    }
  }
}

verifyTableViewConfiguration();