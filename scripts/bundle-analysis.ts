#!/usr/bin/env tsx

/**
 * Bundle Size Analysis Script
 * Analyzes the Next.js build output for performance insights
 */

import { readFileSync, statSync, readdirSync } from 'fs'
import { join } from 'path'

interface BundleInfo {
  file: string
  size: number
  sizeKB: number
  sizeMB: number
  type: 'chunk' | 'vendor' | 'common' | 'app'
}

function getBundleType(filename: string): BundleInfo['type'] {
  if (filename.includes('vendor')) return 'vendor'
  if (filename.includes('common')) return 'common'
  if (filename.includes('app')) return 'app'
  return 'chunk'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function analyzeBundle() {
  console.log('📦 Bundle Analysis Report')
  console.log('========================\n')

  const buildDir = '.next/static/chunks'
  const files = readdirSync(buildDir)
  
  const bundles: BundleInfo[] = files
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = join(buildDir, file)
      const stats = statSync(filePath)
      
      return {
        file,
        size: stats.size,
        sizeKB: Math.round(stats.size / 1024 * 100) / 100,
        sizeMB: Math.round(stats.size / 1024 / 1024 * 100) / 100,
        type: getBundleType(file)
      }
    })
    .sort((a, b) => b.size - a.size)

  // Calculate totals
  const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0)
  const vendorSize = bundles.filter(b => b.type === 'vendor').reduce((sum, b) => sum + b.size, 0)
  const appSize = bundles.filter(b => b.type === 'app').reduce((sum, b) => sum + b.size, 0)
  const chunkSize = bundles.filter(b => b.type === 'chunk').reduce((sum, b) => sum + b.size, 0)
  
  console.log('📊 Bundle Size Summary:')
  console.log(`Total Bundle Size: ${formatSize(totalSize)}`)
  console.log(`Vendor Bundles: ${formatSize(vendorSize)} (${((vendorSize/totalSize)*100).toFixed(1)}%)`)
  console.log(`App Bundles: ${formatSize(appSize)} (${((appSize/totalSize)*100).toFixed(1)}%)`)
  console.log(`Code Chunks: ${formatSize(chunkSize)} (${((chunkSize/totalSize)*100).toFixed(1)}%)`)
  
  console.log('\n🔍 Largest Bundles:')
  bundles.slice(0, 10).forEach((bundle, index) => {
    const emoji = bundle.size > 500000 ? '🔴' : bundle.size > 100000 ? '🟡' : '🟢'
    console.log(`${index + 1}. ${emoji} ${bundle.file} - ${formatSize(bundle.size)} (${bundle.type})`)
  })

  console.log('\n📈 Performance Analysis:')
  
  // Check for potential issues
  const largeChunks = bundles.filter(b => b.size > 100000)
  if (largeChunks.length > 0) {
    console.log(`⚠️  ${largeChunks.length} chunks larger than 100KB detected`)
    largeChunks.forEach(chunk => {
      console.log(`   - ${chunk.file}: ${formatSize(chunk.size)}`)
    })
  }

  const veryLargeChunks = bundles.filter(b => b.size > 500000)
  if (veryLargeChunks.length > 0) {
    console.log(`🚨 ${veryLargeChunks.length} chunks larger than 500KB detected`)
    veryLargeChunks.forEach(chunk => {
      console.log(`   - ${chunk.file}: ${formatSize(chunk.size)}`)
    })
  }

  // Analyze vendor bundle efficiency
  const vendorBundles = bundles.filter(b => b.type === 'vendor')
  if (vendorBundles.length > 0) {
    console.log(`\n📚 Vendor Bundle Analysis:`)
    vendorBundles.forEach(vendor => {
      console.log(`   ${vendor.file}: ${formatSize(vendor.size)}`)
    })
  }

  // Check code splitting effectiveness
  const appChunks = bundles.filter(b => b.type === 'chunk' || b.type === 'app')
  console.log(`\n⚡ Code Splitting Analysis:`)
  console.log(`   Total App Chunks: ${appChunks.length}`)
  console.log(`   Average Chunk Size: ${formatSize(appChunks.reduce((sum, chunk) => sum + chunk.size, 0) / appChunks.length)}`)
  
  const smallChunks = appChunks.filter(chunk => chunk.size < 10000)
  const mediumChunks = appChunks.filter(chunk => chunk.size >= 10000 && chunk.size < 50000)
  const largeAppChunks = appChunks.filter(chunk => chunk.size >= 50000)
  
  console.log(`   Small chunks (<10KB): ${smallChunks.length}`)
  console.log(`   Medium chunks (10-50KB): ${mediumChunks.length}`)
  console.log(`   Large chunks (>50KB): ${largeAppChunks.length}`)

  // Performance recommendations
  console.log('\n💡 Performance Recommendations:')
  
  if (totalSize > 2000000) {
    console.log('   🔴 Total bundle size is quite large (>2MB). Consider:')
    console.log('      - Dynamic imports for heavy components')
    console.log('      - Tree shaking optimization')
    console.log('      - Bundle analyzer to identify large dependencies')
  } else if (totalSize > 1000000) {
    console.log('   🟡 Bundle size is moderate (>1MB). Monitor growth and consider:')
    console.log('      - Code splitting for route-based chunks')
    console.log('      - Lazy loading for non-critical components')
  } else {
    console.log('   🟢 Bundle size is well optimized (<1MB)')
  }

  if (vendorSize > totalSize * 0.7) {
    console.log('   ⚠️  Vendor bundles are >70% of total. Consider:')
    console.log('      - Reviewing large dependencies')
    console.log('      - Using lighter alternatives')
    console.log('      - Excluding unused features from libraries')
  }

  return {
    totalSize,
    bundleCount: bundles.length,
    largeChunks: largeChunks.length,
    vendorRatio: vendorSize / totalSize,
    avgChunkSize: totalSize / bundles.length
  }
}

// Performance benchmarks comparison
function compareBenchmarks() {
  console.log('\n📏 Performance Benchmarks Comparison:')
  console.log('=====================================')
  
  // Industry standard benchmarks
  const benchmarks = {
    'Small App': { total: 500000, vendor: 300000 },
    'Medium App': { total: 1000000, vendor: 600000 },
    'Large App': { total: 2000000, vendor: 1200000 },
    'Enterprise App': { total: 5000000, vendor: 3000000 }
  }
  
  const buildDir = '.next/static/chunks'
  const files = readdirSync(buildDir)
  const totalSize = files
    .filter(file => file.endsWith('.js'))
    .reduce((sum, file) => {
      const stats = statSync(join(buildDir, file))
      return sum + stats.size
    }, 0)

  Object.entries(benchmarks).forEach(([category, sizes]) => {
    const status = totalSize <= sizes.total ? '✅' : '❌'
    console.log(`${status} ${category}: ${formatSize(sizes.total)} (Current: ${formatSize(totalSize)})`)
  })
}

function main() {
  try {
    const analysis = analyzeBundle()
    compareBenchmarks()
    
    console.log('\n✅ Bundle analysis completed!')
    
    // Return analysis for further processing
    return analysis
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error)
    process.exit(1)
  }
}

main()