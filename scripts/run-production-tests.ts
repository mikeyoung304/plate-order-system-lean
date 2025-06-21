#!/usr/bin/env tsx
/**
 * Project Helios - Production Readiness Test Runner
 * 
 * Executes comprehensive production validation test suite
 * Generates consolidated report for deployment decision
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  description: string;
  command: string;
  timeout: number;
  critical: boolean;
}

interface TestResult {
  suite: string;
  success: boolean;
  duration: number;
  output: string;
  error?: string;
}

interface ProductionReport {
  timestamp: string;
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  readinessScore: number;
  testResults: TestResult[];
  summary: {
    totalSuites: number;
    passedSuites: number;
    failedSuites: number;
    criticalFailures: number;
  };
  recommendations: string[];
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'Load Testing',
    description: 'Tests system performance under 100+ concurrent users',
    command: 'npm run test -- __tests__/production/load-testing.test.ts',
    timeout: 15 * 60 * 1000, // 15 minutes
    critical: true
  },
  {
    name: 'Stress Testing',
    description: 'Tests failure scenarios and recovery mechanisms',
    command: 'npm run test -- __tests__/production/stress-testing.test.ts',
    timeout: 20 * 60 * 1000, // 20 minutes
    critical: true
  },
  {
    name: 'Security Assessment',
    description: 'Validates security vulnerabilities and compliance',
    command: 'npm run test -- __tests__/production/security-assessment.test.ts',
    timeout: 10 * 60 * 1000, // 10 minutes
    critical: true
  },
  {
    name: 'Integration Testing',
    description: 'Tests all Project Helios features working together',
    command: 'npm run test -- __tests__/production/integration-tests.test.ts',
    timeout: 15 * 60 * 1000, // 15 minutes
    critical: true
  },
  {
    name: 'Regression Testing',
    description: 'Ensures existing functionality remains unaffected',
    command: 'npm run test -- __tests__/production/regression-tests.test.ts',
    timeout: 10 * 60 * 1000, // 10 minutes
    critical: false
  }
];

async function main() {
  console.log('🚀 Starting Project Helios Production Readiness Validation');
  console.log('=' * 60);
  
  const startTime = Date.now();
  const testResults: TestResult[] = [];
  
  // Pre-flight checks
  console.log('🔍 Running pre-flight checks...');
  await performPreflightChecks();
  
  // Execute test suites
  for (const suite of TEST_SUITES) {
    console.log(`\n📋 Executing: ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log(`   Timeout: ${suite.timeout / 1000}s`);
    console.log('   ' + '-'.repeat(50));
    
    const result = await executeTestSuite(suite);
    testResults.push(result);
    
    if (result.success) {
      console.log(`   ✅ ${suite.name} PASSED (${result.duration}ms)`);
    } else {
      console.log(`   ❌ ${suite.name} FAILED (${result.duration}ms)`);
      if (suite.critical) {
        console.log(`   ⚠️  CRITICAL FAILURE - This may block production deployment`);
      }
    }
  }
  
  // Generate comprehensive report
  const totalDuration = Date.now() - startTime;
  const report = generateProductionReport(testResults, totalDuration);
  
  // Save report
  const reportPath = path.join(process.cwd(), 'production-readiness-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Display summary
  displaySummary(report);
  
  // Exit with appropriate code
  const exitCode = report.overallStatus === 'FAIL' ? 1 : 0;
  process.exit(exitCode);
}

async function performPreflightChecks(): Promise<void> {
  const checks = [
    {
      name: 'Node.js Version',
      check: () => {
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        return majorVersion >= 18;
      },
      error: 'Node.js 18+ required'
    },
    {
      name: 'Dependencies Installed',
      check: () => existsSync(path.join(process.cwd(), 'node_modules')),
      error: 'Run npm install first'
    },
    {
      name: 'Environment Configuration',
      check: () => {
        // Check for required environment variables
        return process.env.NODE_ENV !== undefined;
      },
      error: 'Environment variables not configured'
    },
    {
      name: 'Test Directory Structure',
      check: () => existsSync(path.join(process.cwd(), '__tests__', 'production')),
      error: 'Production test directory not found'
    }
  ];
  
  for (const check of checks) {
    try {
      const result = check.check();
      if (result) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ❌ ${check.name}: ${check.error}`);
        process.exit(1);
      }
    } catch (_error) {
      console.log(`   ❌ ${check.name}: ${check._error}`);
      process.exit(1);
    }
  }
  
  console.log('   ✅ All pre-flight checks passed\n');
}

async function executeTestSuite(suite: TestSuite): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log(`   🔄 Running ${suite.name}...`);
    
    const output = execSync(suite.command, {
      timeout: suite.timeout,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    const duration = Date.now() - startTime;
    
    return {
      suite: suite.name,
      success: true,
      duration,
      output: output.toString()
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    return {
      suite: suite.name,
      success: false,
      duration,
      output: error.stdout?.toString() || '',
      error: error.stderr?.toString() || error.message
    };
  }
}

function generateProductionReport(testResults: TestResult[], totalDuration: number): ProductionReport {
  const passedSuites = testResults.filter(r => r.success).length;
  const failedSuites = testResults.filter(r => !r.success).length;
  const totalSuites = testResults.length;
  
  // Calculate critical failures
  const criticalFailures = testResults.filter(r => {
    const suite = TEST_SUITES.find(s => s.name === r.suite);
    return !r.success && suite?.critical;
  }).length;
  
  // Calculate readiness score
  let readinessScore = 100;
  testResults.forEach(result => {
    if (!result.success) {
      const suite = TEST_SUITES.find(s => s.name === result.suite);
      const penalty = suite?.critical ? 25 : 10;
      readinessScore -= penalty;
    }
  });
  readinessScore = Math.max(0, readinessScore);
  
  // Determine overall status
  let overallStatus: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
  if (criticalFailures > 0) {
    overallStatus = 'FAIL';
  } else if (failedSuites > 0) {
    overallStatus = 'WARNING';
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(testResults, readinessScore);
  
  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    readinessScore,
    testResults,
    summary: {
      totalSuites,
      passedSuites,
      failedSuites,
      criticalFailures
    },
    recommendations
  };
}

function generateRecommendations(testResults: TestResult[], score: number): string[] {
  const recommendations: string[] = [];
  
  if (score >= 95) {
    recommendations.push('🟢 System is ready for immediate production deployment');
    recommendations.push('🟢 All critical systems validated and performing within specifications');
    recommendations.push('🟢 Consider implementing enhanced monitoring for first 48 hours');
  } else if (score >= 85) {
    recommendations.push('🟡 System is ready for production with minor observations');
    recommendations.push('🟡 Address non-critical issues during next maintenance window');
    recommendations.push('🟡 Implement enhanced monitoring and alerting');
  } else if (score >= 70) {
    recommendations.push('🟠 System requires attention before production deployment');
    recommendations.push('🟠 Address failed test scenarios before go-live');
    recommendations.push('🟠 Consider phased rollout approach');
  } else {
    recommendations.push('🔴 System is NOT ready for production deployment');
    recommendations.push('🔴 Critical issues must be resolved before deployment');
    recommendations.push('🔴 Re-run validation tests after fixes');
  }
  
  // Add specific recommendations based on test results
  const failedTests = testResults.filter(r => !r.success);
  failedTests.forEach(test => {
    switch (test.suite) {
      case 'Load Testing':
        recommendations.push('📊 Review and optimize performance bottlenecks');
        break;
      case 'Stress Testing':
        recommendations.push('⚡ Implement additional failure recovery mechanisms');
        break;
      case 'Security Assessment':
        recommendations.push('🔒 Address security vulnerabilities before deployment');
        break;
      case 'Integration Testing':
        recommendations.push('🔗 Fix integration issues between system components');
        break;
      case 'Regression Testing':
        recommendations.push('🔄 Ensure backward compatibility with existing features');
        break;
    }
  });
  
  return recommendations;
}

function displaySummary(report: ProductionReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 PRODUCTION READINESS VALIDATION SUMMARY');
  console.log('='.repeat(60));
  
  // Overall status
  const statusIcon = {
    'PASS': '✅',
    'WARNING': '⚠️',
    'FAIL': '❌'
  };
  
  console.log(`\n${statusIcon[report.overallStatus]} Overall Status: ${report.overallStatus}`);
  console.log(`📊 Readiness Score: ${report.readinessScore}/100`);
  
  // Test summary
  console.log(`\n📋 Test Summary:`);
  console.log(`   Total Suites: ${report.summary.totalSuites}`);
  console.log(`   Passed: ${report.summary.passedSuites}`);
  console.log(`   Failed: ${report.summary.failedSuites}`);
  console.log(`   Critical Failures: ${report.summary.criticalFailures}`);
  
  // Individual test results
  console.log(`\n📝 Detailed Results:`);
  report.testResults.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const suite = TEST_SUITES.find(s => s.name === result.suite);
    const critical = suite?.critical ? ' (CRITICAL)' : '';
    console.log(`   ${icon} ${result.suite}${critical} - ${result.duration}ms`);
    
    if (!result.success && result.error) {
      console.log(`      Error: ${result.error.substring(0, 100)}...`);
    }
  });
  
  // Recommendations
  console.log(`\n🎯 Recommendations:`);
  report.recommendations.forEach(rec => {
    console.log(`   ${rec}`);
  });
  
  // Report files generated
  console.log(`\n📄 Reports Generated:`);
  console.log(`   📋 production-readiness-report.json`);
  console.log(`   📋 PRODUCTION_READINESS_CHECKLIST.md`);
  
  // Additional reports from individual test suites
  const possibleReports = [
    'load-test-report.json',
    'stress-test-report.json',
    'security-assessment-report.json',
    'integration-test-report.json',
    'regression-test-report.json'
  ];
  
  possibleReports.forEach(reportFile => {
    if (existsSync(path.join(process.cwd(), reportFile))) {
      console.log(`   📋 ${reportFile}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Final recommendation
  if (report.overallStatus === 'PASS') {
    console.log('🚀 RECOMMENDATION: APPROVED FOR PRODUCTION DEPLOYMENT');
  } else if (report.overallStatus === 'WARNING') {
    console.log('⚠️  RECOMMENDATION: CONDITIONAL APPROVAL - ADDRESS WARNINGS');
  } else {
    console.log('🛑 RECOMMENDATION: NOT APPROVED - CRITICAL ISSUES MUST BE RESOLVED');
  }
  
  console.log('='.repeat(60));
}

// Run the production validation
main().catch(error => {
  console.error('❌ Production validation failed:', error);
  process.exit(1);
});