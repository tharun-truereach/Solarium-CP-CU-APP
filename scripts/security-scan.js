/**
 * Security scanning script for Settings functionality
 * Runs ESLint security plugin and custom security checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Files to scan for security issues
const settingsFiles = [
  'src/components/settings/**/*.{ts,tsx}',
  'src/hooks/useAuditLogs.ts',
  'src/api/endpoints/settingsEndpoints.ts',
  'src/types/settings.types.ts',
];

// Security patterns to check
const securityPatterns = {
  dangerous: [
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /document\.write/gi,
    /innerHTML\s*=/gi,
    /javascript:/gi,
    /data:.*javascript/gi,
  ],
  sensitive: [
    /console\.log\([^)]*(?:token|password|secret|auth)/gi,
    /localStorage\.setItem\([^)]*(?:token|password)/gi,
    /sessionStorage\.setItem\([^)]*(?:token|password)/gi,
  ],
  injection: [
    /\$\{[^}]*\}/g, // Template literal injection
    /\+\s*user/gi, // String concatenation with user input
    /innerHTML\s*\+=?/gi,
  ],
};

/**
 * Check file for security patterns
 */
function checkFileForPatterns(filePath, content) {
  const issues = [];

  Object.entries(securityPatterns).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            file: filePath,
            category,
            pattern: pattern.source,
            match: match.trim(),
            line: getLineNumber(content, match),
          });
        });
      }
    });
  });

  return issues;
}

/**
 * Get line number for a match
 */
function getLineNumber(content, match) {
  const lines = content.substring(0, content.indexOf(match)).split('\n');
  return lines.length;
}

/**
 * Run ESLint security scan
 */
function runEslintSecurity() {
  console.log('🔍 Running ESLint security scan...');

  try {
    const result = execSync(
      `npx eslint ${settingsFiles.join(' ')} --ext .ts,.tsx --format json --no-eslintrc --config .eslintrc.security.json`,
      { encoding: 'utf8' }
    );

    const eslintResults = JSON.parse(result);
    const securityIssues = eslintResults
      .filter(file => file.messages.length > 0)
      .flatMap(file =>
        file.messages.filter(
          msg => msg.ruleId && msg.ruleId.includes('security')
        )
      );

    return securityIssues;
  } catch (error) {
    console.warn('ESLint security scan failed:', error.message);
    return [];
  }
}

/**
 * Scan files for security issues
 */
function scanFiles() {
  console.log('🔒 Scanning settings files for security issues...');

  const allIssues = [];

  // Expand glob patterns and scan files
  settingsFiles.forEach(pattern => {
    const files = execSync(`find src -name "*.ts" -o -name "*.tsx"`, {
      encoding: 'utf8',
    })
      .split('\n')
      .filter(file => file.trim() && file.includes('settings'));

    files.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const issues = checkFileForPatterns(filePath, content);
        allIssues.push(...issues);
      }
    });
  });

  return allIssues;
}

/**
 * Generate security report
 */
function generateReport(issues, eslintIssues) {
  const report = {
    timestamp: new Date().toISOString(),
    totalIssues: issues.length + eslintIssues.length,
    customPatternIssues: issues.length,
    eslintSecurityIssues: eslintIssues.length,
    issues: {
      customPatterns: issues,
      eslintSecurity: eslintIssues,
    },
    summary: {
      dangerous: issues.filter(i => i.category === 'dangerous').length,
      sensitive: issues.filter(i => i.category === 'sensitive').length,
      injection: issues.filter(i => i.category === 'injection').length,
    },
  };

  // Write report to file
  fs.writeFileSync('security-report.json', JSON.stringify(report, null, 2));

  return report;
}

/**
 * Main security scan function
 */
function runSecurityScan() {
  console.log('🛡️  Starting security scan for Settings functionality...\n');

  // Run custom pattern checks
  const customIssues = scanFiles();

  // Run ESLint security plugin
  const eslintIssues = runEslintSecurity();

  // Generate report
  const report = generateReport(customIssues, eslintIssues);

  // Display results
  console.log('📊 Security Scan Results:');
  console.log(`   Total Issues: ${report.totalIssues}`);
  console.log(`   Dangerous Patterns: ${report.summary.dangerous}`);
  console.log(`   Sensitive Data Exposure: ${report.summary.sensitive}`);
  console.log(`   Injection Vulnerabilities: ${report.summary.injection}`);
  console.log(`   ESLint Security Issues: ${report.eslintSecurityIssues}`);

  if (report.totalIssues > 0) {
    console.log(
      '\n❌ Security issues found! Check security-report.json for details.'
    );

    // Show first few issues
    [...customIssues, ...eslintIssues].slice(0, 5).forEach(issue => {
      console.log(
        `   - ${issue.file}:${issue.line || '?'} - ${issue.category || issue.ruleId}: ${issue.match || issue.message}`
      );
    });

    process.exit(1);
  } else {
    console.log('\n✅ No security issues found in Settings functionality!');
  }
}

// Create ESLint security config
const eslintSecurityConfig = {
  extends: ['plugin:security/recommended'],
  plugins: ['security'],
  rules: {
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-object-injection': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
  },
};

// Write ESLint security config
fs.writeFileSync(
  '.eslintrc.security.json',
  JSON.stringify(eslintSecurityConfig, null, 2)
);

// Run the scan
if (require.main === module) {
  runSecurityScan();
}

module.exports = { runSecurityScan, checkFileForPatterns };
