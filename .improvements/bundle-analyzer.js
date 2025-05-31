#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Bundle analysis tool for optimization opportunities
function analyzeBundles() {
  const results = {
    pages: [],
    chunks: [],
    recommendations: []
  };

  try {
    // Read build manifest
    const buildManifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), '.next/build-manifest.json'), 'utf8')
    );

    // Read app build manifest
    const appManifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), '.next/app-build-manifest.json'), 'utf8')
    );

    // Analyze static files
    const staticDir = path.join(process.cwd(), '.next/static');
    
    // Get chunk sizes
    function getChunkSizes(dir) {
      const chunks = [];
      if (!fs.existsSync(dir)) return chunks;
      
      const files = fs.readdirSync(dir, { recursive: true });
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && file.endsWith('.js')) {
          chunks.push({
            file,
            size: stats.size,
            sizeKB: Math.round(stats.size / 1024 * 100) / 100
          });
        }
      }
      
      return chunks.sort((a, b) => b.size - a.size);
    }

    const chunks = getChunkSizes(staticDir);
    results.chunks = chunks.slice(0, 20); // Top 20 largest chunks

    // Bundle size analysis
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const totalSizeKB = Math.round(totalSize / 1024 * 100) / 100;
    const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;

    console.log('\n📦 BUNDLE ANALYSIS REPORT');
    console.log('========================');
    console.log(`\n📊 Overview:`);
    console.log(`   Total JavaScript: ${totalSizeKB} KB (${totalSizeMB} MB)`);
    console.log(`   Total chunks: ${chunks.length}`);
    
    console.log(`\n🔍 Largest Chunks:`);
    results.chunks.slice(0, 10).forEach((chunk, i) => {
      const percentage = Math.round((chunk.size / totalSize) * 100);
      console.log(`   ${i + 1}. ${chunk.file} - ${chunk.sizeKB} KB (${percentage}%)`);
    });

    // Generate recommendations
    const recommendations = [];
    
    // Large chunk recommendations
    const largeChunks = chunks.filter(chunk => chunk.size > 100 * 1024); // > 100KB
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'bundle-splitting',
        priority: 'high',
        description: `${largeChunks.length} chunks are larger than 100KB`,
        action: 'Consider code splitting and lazy loading'
      });
    }

    // Third-party dependency analysis
    const vendorChunks = chunks.filter(chunk => 
      chunk.file.includes('vendor') || 
      chunk.file.includes('node_modules') ||
      chunk.file.includes('webpack-')
    );
    
    if (vendorChunks.length > 0) {
      const vendorSize = vendorChunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const vendorPercentage = Math.round((vendorSize / totalSize) * 100);
      
      recommendations.push({
        type: 'vendor-optimization',
        priority: vendorPercentage > 40 ? 'high' : 'medium',
        description: `Vendor bundles account for ${vendorPercentage}% of total size`,
        action: 'Review third-party dependencies for tree-shaking opportunities'
      });
    }

    // Framework chunk analysis
    const frameworkChunks = chunks.filter(chunk => 
      chunk.file.includes('framework') || 
      chunk.file.includes('main-') ||
      chunk.file.includes('react')
    );

    console.log(`\n📚 Framework Analysis:`);
    frameworkChunks.forEach(chunk => {
      console.log(`   ${chunk.file}: ${chunk.sizeKB} KB`);
    });

    console.log(`\n💡 Recommendations:`);
    recommendations.forEach((rec, i) => {
      const priority = rec.priority === 'high' ? '🔴' : 
                     rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`   ${i + 1}. ${priority} ${rec.description}`);
      console.log(`      → ${rec.action}`);
    });

    // Performance impact assessment
    console.log(`\n⚡ Performance Impact:`);
    if (totalSizeMB > 2) {
      console.log(`   🔴 Large bundle size (${totalSizeMB} MB) may impact loading performance`);
    } else if (totalSizeMB > 1) {
      console.log(`   🟡 Moderate bundle size (${totalSizeMB} MB) - optimization recommended`);
    } else {
      console.log(`   🟢 Good bundle size (${totalSizeMB} MB)`);
    }

    // Save detailed results
    results.recommendations = recommendations;
    results.summary = {
      totalSize: totalSizeKB,
      totalSizeMB,
      chunkCount: chunks.length,
      largeChunkCount: largeChunks.length
    };

    return results;

  } catch (error) {
    console.error('Error analyzing bundles:', error.message);
    return { error: error.message };
  }
}

// Run analysis if called directly
if (require.main === module) {
  analyzeBundles();
}

module.exports = { analyzeBundles };