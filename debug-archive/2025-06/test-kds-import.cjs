#!/usr/bin/env node

/**
 * Test KDS Component Import
 * Check if the dynamic import path is working correctly
 */

const fs = require('fs');
const path = require('path');

function testKDSImport() {
  console.log('🔍 Testing KDS Component Import Path');
  console.log('====================================');
  
  // Test 1: Check if files exist
  const kdsIndexPath = path.join(__dirname, 'components/kds/index.ts');
  const kdsLayoutPath = path.join(__dirname, 'components/kds/KDSLayoutRefactored.tsx');
  const kdsHeaderPath = path.join(__dirname, 'components/kds/KDSHeader.tsx');
  
  console.log('\n📁 File Existence Check:');
  console.log(`✅ index.ts: ${fs.existsSync(kdsIndexPath)}`);
  console.log(`✅ KDSLayoutRefactored.tsx: ${fs.existsSync(kdsLayoutPath)}`);
  console.log(`✅ KDSHeader.tsx: ${fs.existsSync(kdsHeaderPath)}`);
  
  // Test 2: Check exports in index.ts
  if (fs.existsSync(kdsIndexPath)) {
    const indexContent = fs.readFileSync(kdsIndexPath, 'utf8');
    console.log('\n📤 Index.ts Exports:');
    const exportLines = indexContent.split('\n').filter(line => line.includes('export'));
    exportLines.forEach(line => console.log(`  ${line.trim()}`));
    
    if (indexContent.includes('KDSLayoutRefactored as KDSLayout')) {
      console.log('✅ KDSLayout export alias found');
    } else {
      console.log('❌ KDSLayout export alias NOT found');
    }
  }
  
  // Test 3: Check KDSLayoutRefactored for obvious issues
  if (fs.existsSync(kdsLayoutPath)) {
    const layoutContent = fs.readFileSync(kdsLayoutPath, 'utf8');
    console.log('\n🧩 KDSLayoutRefactored Analysis:');
    
    // Check for export
    if (layoutContent.includes('export') && layoutContent.includes('KDSLayoutRefactored')) {
      console.log('✅ Component properly exported');
    } else {
      console.log('❌ Component export issue');
    }
    
    // Check for React imports
    if (layoutContent.includes("import") && layoutContent.includes("react")) {
      console.log('✅ React imports present');
    } else {
      console.log('❌ Missing React imports');
    }
    
    // Check for syntax errors (basic)
    const braceCount = (layoutContent.match(/{/g) || []).length - (layoutContent.match(/}/g) || []).length;
    if (braceCount === 0) {
      console.log('✅ Balanced braces');
    } else {
      console.log(`❌ Unbalanced braces: ${braceCount}`);
    }
  }
  
  // Test 4: Check KDSHeader for Table icon
  if (fs.existsSync(kdsHeaderPath)) {
    const headerContent = fs.readFileSync(kdsHeaderPath, 'utf8');
    console.log('\n🔲 KDSHeader Table Button Check:');
    
    if (headerContent.includes('Table') && headerContent.includes('lucide-react')) {
      console.log('✅ Table icon imported from lucide-react');
    } else {
      console.log('❌ Table icon import missing');
    }
    
    if (headerContent.includes('viewMode') && headerContent.includes('table')) {
      console.log('✅ Table view mode logic present');
    } else {
      console.log('❌ Table view mode logic missing');
    }
    
    // Check if ViewModeControls is being rendered
    if (headerContent.includes('ViewModeControls') && headerContent.includes('<ViewModeControls')) {
      console.log('✅ ViewModeControls component rendered');
    } else {
      console.log('❌ ViewModeControls component NOT rendered');
    }
  }
  
  console.log('\n🎯 DIAGNOSIS:');
  console.log('=============');
  console.log('If all checks pass but you still don\'t see table view button:');
  console.log('1. The KDSHeader component might not be rendering');
  console.log('2. The showHeader prop might be false');
  console.log('3. CSS might be hiding the buttons');
  console.log('4. There might be a JavaScript runtime error');
  console.log('5. The page might be loading a cached version');
}

testKDSImport();