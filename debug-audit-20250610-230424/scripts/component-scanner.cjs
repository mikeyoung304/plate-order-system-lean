const fs = require('fs');
const path = require('path');

const issues = {
  broken_imports: [],
  missing_auth: [],
  expecting_context: [],
  form_pattern_mismatch: [],
  orphaned_features: [],
  using_protected_route: [],
  client_side_auth: []
};

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const filename = path.relative(process.cwd(), filePath);
  
  // Check for deleted imports
  if (content.includes('from "@/lib/demo"') || 
      content.includes('from "@/lib/modassembly/supabase/auth/auth-context"') ||
      content.includes('from "@/lib/modassembly/supabase/auth/enterprise-auth-context"')) {
    issues.broken_imports.push(filename);
  }
  
  // Check for auth hooks
  if (content.match(/useAuth\(\)|useUser\(\)|useRole\(\)|useIsRole\(\)/)) {
    issues.missing_auth.push(filename);
  }
  
  // Check for context expectations
  if (content.includes('AuthProvider') || content.includes('AuthContext')) {
    issues.expecting_context.push(filename);
  }
  
  // Check form patterns (client-side vs server actions)
  if (content.includes('form') && content.includes('onSubmit') && !content.includes('action=')) {
    issues.form_pattern_mismatch.push(filename);
  }
  
  // Check for ProtectedRoute usage
  if (content.includes('<ProtectedRoute') || content.includes('ProtectedRoute>')) {
    issues.using_protected_route.push(filename);
  }
  
  // Check for client-side auth patterns
  if (content.includes("'use client'") && (content.includes('supabase.auth') || content.includes('getSession'))) {
    issues.client_side_auth.push(filename);
  }
}

// Scan all TypeScript files
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && !file.includes('debug-audit')) {
      scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      try {
        scanFile(filePath);
      } catch (e) {
        console.error('Error scanning', filePath, e.message);
      }
    }
  });
}

console.log('Starting component scan...');
scanDirectory('./app');
scanDirectory('./components');
scanDirectory('./lib');

// Generate summary
const summary = {
  total_issues: Object.values(issues).flat().length,
  by_category: {}
};

Object.entries(issues).forEach(([category, files]) => {
  summary.by_category[category] = files.length;
});

// Save results
fs.writeFileSync('./debug-audit-20250610-230424/findings/component-scan-results.json', JSON.stringify({
  scan_date: new Date().toISOString(),
  issues,
  summary
}, null, 2));

console.log('Component scan complete.');
console.log('Total issues found:', summary.total_issues);
console.log('Results saved to component-scan-results.json');