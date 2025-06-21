#!/usr/bin/env node

/**
 * Bundle Size Monitoring Script for Project Helios
 * Tracks bundle size changes and generates performance reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleMonitor {
  constructor() {
    this.projectRoot = process.cwd();
    this.nextDir = path.join(this.projectRoot, '.next');
    this.staticDir = path.join(this.nextDir, 'static');
    this.chunksDir = path.join(this.staticDir, 'chunks');
    this.reportsDir = path.join(this.projectRoot, 'bundle-reports');
    this.baseline = {
      totalSize: '386M',
      target: '425M', // 10% increase threshold
      chunks: {
        'vendors': '1.17MB',
        'kds-components': '87.8KB',
        'common': '61.5KB',
        'polyfills': '110KB'
      }
    };
  }

  // Get directory size in MB
  getDirectorySize(dirPath) {
    try {
      const result = execSync(`du -sm "${dirPath}"`, { encoding: 'utf8' });
      return parseInt(result.split('\t')[0]);
    } catch (error) {
      console.warn(`Warning: Could not get size for ${dirPath}`);
      return 0;
    }
  }

  // Get file size in KB
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return Math.round(stats.size / 1024);
    } catch (error) {
      return 0;
    }
  }

  // Analyze chunk files
  analyzeChunks() {
    const chunks = {};
    
    if (!fs.existsSync(this.chunksDir)) {
      console.warn('Chunks directory not found. Run build first.');
      return chunks;
    }

    const files = fs.readdirSync(this.chunksDir);
    
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(this.chunksDir, file);
        const size = this.getFileSize(filePath);
        
        // Categorize chunks
        if (file.includes('vendors')) {
          chunks.vendors = { file, size: `${Math.round(size/1024*10)/10}MB` };
        } else if (file.includes('kds')) {
          chunks.kds = { file, size: `${size}KB` };
        } else if (file.includes('common')) {
          chunks.common = { file, size: `${size}KB` };
        } else if (file.includes('polyfills')) {
          chunks.polyfills = { file, size: `${size}KB` };
        } else if (size > 10) { // Only track chunks >10KB
          chunks[file.split('.')[0]] = { file, size: `${size}KB` };
        }
      }
    });

    return chunks;
  }

  // Generate bundle report
  generateReport() {
    const timestamp = new Date().toISOString();
    const totalSize = this.getDirectorySize(this.nextDir);
    const chunks = this.analyzeChunks();
    
    const report = {
      timestamp,
      bundleSize: {
        current: `${totalSize}M`,
        baseline: this.baseline.totalSize,
        target: this.baseline.target,
        changePercent: ((totalSize - 386) / 386 * 100).toFixed(2)
      },
      chunks,
      status: totalSize <= 425 ? 'PASS' : 'FAIL',
      recommendations: this.generateRecommendations(totalSize, chunks)
    };

    return report;
  }

  // Generate optimization recommendations
  generateRecommendations(totalSize, chunks) {
    const recommendations = [];

    if (totalSize > 425) {
      recommendations.push({
        type: 'CRITICAL',
        message: 'Bundle size exceeds 10% threshold. Immediate optimization required.'
      });
    }

    // Check for large chunks
    Object.entries(chunks).forEach(([key, chunk]) => {
      const sizeNum = parseInt(chunk.size);
      if (key !== 'vendors' && sizeNum > 100) {
        recommendations.push({
          type: 'WARNING',
          message: `Large chunk detected: ${chunk.file} (${chunk.size}). Consider further splitting.`
        });
      }
    });

    // Check vendor chunk size
    if (chunks.vendors) {
      const vendorSize = parseFloat(chunks.vendors.size);
      if (vendorSize > 1.5) {
        recommendations.push({
          type: 'INFO',
          message: 'Vendor chunk is large. Consider analyzing dependencies for optimization.'
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'SUCCESS',
        message: 'Bundle size is optimal. No immediate action required.'
      });
    }

    return recommendations;
  }

  // Save report to file
  saveReport(report) {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }

    const filename = `bundle-report-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    
    return filepath;
  }

  // Display report in console
  displayReport(report) {
    console.log('\n🚀 Project Helios Bundle Monitor Report');
    console.log('=====================================');
    console.log(`📅 Generated: ${report.timestamp}`);
    console.log(`📦 Bundle Size: ${report.bundleSize.current} (${report.bundleSize.changePercent}% change)`);
    console.log(`🎯 Target: ${report.bundleSize.target}`);
    console.log(`✅ Status: ${report.status}`);
    
    console.log('\n📊 Chunk Analysis:');
    Object.entries(report.chunks).forEach(([key, chunk]) => {
      console.log(`  ${key}: ${chunk.size} (${chunk.file})`);
    });

    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      const icon = rec.type === 'CRITICAL' ? '🚨' : 
                   rec.type === 'WARNING' ? '⚠️' : 
                   rec.type === 'SUCCESS' ? '✅' : 'ℹ️';
      console.log(`  ${icon} ${rec.message}`);
    });

    console.log(`\n📄 Report saved to: ${this.saveReport(report)}`);
  }

  // Run analyzer and open reports
  async runAnalyzer() {
    console.log('🔍 Running webpack bundle analyzer...');
    
    try {
      execSync('ANALYZE=true npm run build', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      
      console.log('✅ Bundle analyzer reports generated:');
      console.log(`  Client: ${this.nextDir}/analyze/client.html`);
      console.log(`  Server: ${this.nextDir}/analyze/server.html`);
      
      // Optional: Open reports in browser
      if (process.argv.includes('--open')) {
        const open = require('open');
        await open(path.join(this.nextDir, 'analyze', 'client.html'));
      }
      
    } catch (error) {
      console.error('❌ Failed to run bundle analyzer:', error.message);
    }
  }

  // Main execution
  async run() {
    const command = process.argv[2];
    
    switch (command) {
      case 'analyze':
        await this.runAnalyzer();
        break;
      case 'report':
        const report = this.generateReport();
        this.displayReport(report);
        break;
      case 'monitor':
        // Continuous monitoring mode
        console.log('📊 Starting bundle monitoring...');
        setInterval(() => {
          const report = this.generateReport();
          if (report.status === 'FAIL') {
            console.log('🚨 Bundle size threshold exceeded!');
            this.displayReport(report);
          }
        }, 30000); // Check every 30 seconds
        break;
      default:
        console.log('🚀 Project Helios Bundle Monitor');
        console.log('Usage:');
        console.log('  node bundle-monitor.js analyze     # Run webpack analyzer');
        console.log('  node bundle-monitor.js report      # Generate size report');
        console.log('  node bundle-monitor.js monitor     # Continuous monitoring');
        console.log('\nOptions:');
        console.log('  --open                             # Open analyzer reports in browser');
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const monitor = new BundleMonitor();
  monitor.run().catch(console.error);
}

module.exports = BundleMonitor;