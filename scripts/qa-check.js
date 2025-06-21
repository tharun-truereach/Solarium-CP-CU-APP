#!/usr/bin/env node

/**
 * Comprehensive Quality Assurance Check Script
 * Performs linting, security checks, dependency audit, and coverage validation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const QA_CONFIG = {
  lint: {
    enabled: true,
    failOnWarnings: true,
  },
  typeCheck: {
    enabled: true,
  },
  security: {
    enabled: true,
    auditLevel: 'moderate', // low, moderate, high, critical
  },
  coverage: {
    enabled: true,
    enforceThresholds: true,
  },
  xssLint: {
    enabled: true,
  },
};

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

/**
 * Execute command and return result
 */
function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || '',
      code: error.status,
    };
  }
}

/**
 * Log with color
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Run ESLint check
 */
function runLintCheck() {
  log('\n🔍 Running ESLint check...', 'blue');

  const result = execCommand('npm run lint', { silent: false });

  if (result.success) {
    log('✅ ESLint check passed', 'green');
    return true;
  } else {
    log(`❌ ESLint check failed: ${result.error}`, 'red');
    return QA_CONFIG.lint.failOnWarnings ? false : true;
  }
}

/**
 * Run TypeScript type checking
 */
function runTypeCheck() {
  log('\n🔍 Running TypeScript type check...', 'blue');

  const result = execCommand('npm run type-check', { silent: false });

  if (result.success) {
    log('✅ TypeScript type check passed', 'green');
    return true;
  } else {
    log(`❌ TypeScript type check failed: ${result.error}`, 'red');
    return false;
  }
}

/**
 * Run security audit
 */
function runSecurityAudit() {
  log('\n🔍 Running npm security audit...', 'blue');

  // First, check for high/critical vulnerabilities
  const auditResult = execCommand(
    `npm audit --audit-level=${QA_CONFIG.security.auditLevel}`,
    { silent: true }
  );

  if (auditResult.success) {
    log('✅ No high/critical security vulnerabilities found', 'green');
  } else {
    log('⚠️  Security vulnerabilities detected:', 'yellow');

    // Get detailed audit info
    const auditDetailResult = execCommand('npm audit --json', { silent: true });

    if (auditDetailResult.success) {
      try {
        const auditData = JSON.parse(auditDetailResult.output);

        const vulnerabilities = auditData.vulnerabilities || {};
        const summary = auditData.metadata || {};

        if (summary.vulnerabilities) {
          log(
            `  • Total vulnerabilities: ${summary.vulnerabilities.total}`,
            'yellow'
          );
          log(`  • High: ${summary.vulnerabilities.high || 0}`, 'red');
          log(
            `  • Moderate: ${summary.vulnerabilities.moderate || 0}`,
            'yellow'
          );
          log(`  • Low: ${summary.vulnerabilities.low || 0}`, 'blue');
        }

        // Check if any critical/high vulnerabilities
        const criticalCount = summary.vulnerabilities?.critical || 0;
        const highCount = summary.vulnerabilities?.high || 0;

        if (criticalCount > 0 || highCount > 0) {
          log(
            `❌ Found ${criticalCount + highCount} critical/high severity vulnerabilities`,
            'red'
          );
          log(
            '   Run "npm audit fix" to resolve automatically fixable issues',
            'yellow'
          );
          return false;
        } else {
          log('✅ No critical/high severity vulnerabilities', 'green');
        }
      } catch (parseError) {
        log(
          `⚠️  Could not parse audit results: ${parseError.message}`,
          'yellow'
        );
      }
    }
  }

  return true;
}

/**
 * Run XSS linting checks
 */
function runXssLint() {
  log('\n🔍 Running XSS security lint...', 'blue');

  // Check for dangerous patterns in code
  const dangerousPatterns = [
    {
      pattern: /dangerouslySetInnerHTML/g,
      file: 'src/**/*.{ts,tsx}',
      message: 'Found dangerouslySetInnerHTML usage',
    },
    {
      pattern: /innerHTML\s*=/g,
      file: 'src/**/*.{ts,tsx}',
      message: 'Found innerHTML assignment',
    },
    {
      pattern: /eval\s*\(/g,
      file: 'src/**/*.{ts,tsx}',
      message: 'Found eval() usage',
    },
    {
      pattern: /Function\s*\(/g,
      file: 'src/**/*.{ts,tsx}',
      message: 'Found Function constructor usage',
    },
  ];

  let xssIssuesFound = false;

  for (const check of dangerousPatterns) {
    const grepResult = execCommand(
      `grep -r "${check.pattern.source}" src/ --include="*.ts" --include="*.tsx" || true`,
      { silent: true }
    );

    if (grepResult.output && grepResult.output.trim()) {
      log(`⚠️  ${check.message}:`, 'yellow');
      console.log(grepResult.output);
      xssIssuesFound = true;
    }
  }

  if (!xssIssuesFound) {
    log('✅ No XSS-prone patterns found', 'green');
  }

  // Check for proper CSP implementation
  const cspCheckResult = execCommand(
    'grep -r "Content-Security-Policy" docker/ vite.config.ts || true',
    { silent: true }
  );

  if (cspCheckResult.output && cspCheckResult.output.trim()) {
    log('✅ Content Security Policy found in configuration', 'green');
  } else {
    log('⚠️  Content Security Policy not found in configuration', 'yellow');
    xssIssuesFound = true;
  }

  return !xssIssuesFound;
}

/**
 * Run coverage validation
 */
function runCoverageCheck() {
  log('\n🔍 Running coverage validation...', 'blue');

  // First run tests with coverage
  const testResult = execCommand('npm run test:coverage', { silent: false });

  if (!testResult.success) {
    log('❌ Tests failed', 'red');
    return false;
  }

  // Then validate coverage thresholds
  const coverageResult = execCommand('node scripts/coverage-threshold.js', {
    silent: false,
  });

  if (coverageResult.success) {
    log('✅ Coverage thresholds met', 'green');
    return true;
  } else {
    log('❌ Coverage thresholds not met', 'red');
    return false;
  }
}

/**
 * Generate QA report
 */
function generateQAReport(results) {
  const reportPath = path.join(process.cwd(), 'qa-report.json');

  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r.passed).length,
      failed: Object.values(results).filter(r => !r.passed).length,
    },
    environment: {
      node: process.version,
      npm: execCommand('npm --version', { silent: true }).output?.trim(),
      platform: process.platform,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`📊 QA report generated: ${reportPath}`, 'blue');

  return report;
}

/**
 * Main QA check execution
 */
function main() {
  log('🔍 Starting comprehensive QA checks...', 'blue');
  log('=====================================\n');

  const results = {};
  let allPassed = true;

  // Run linting
  if (QA_CONFIG.lint.enabled) {
    const passed = runLintCheck();
    results.lint = { passed, timestamp: new Date().toISOString() };
    allPassed = allPassed && passed;
  }

  // Run type checking
  if (QA_CONFIG.typeCheck.enabled) {
    const passed = runTypeCheck();
    results.typeCheck = { passed, timestamp: new Date().toISOString() };
    allPassed = allPassed && passed;
  }

  // Run security audit
  if (QA_CONFIG.security.enabled) {
    const passed = runSecurityAudit();
    results.securityAudit = { passed, timestamp: new Date().toISOString() };
    allPassed = allPassed && passed;
  }

  // Run XSS lint
  if (QA_CONFIG.xssLint.enabled) {
    const passed = runXssLint();
    results.xssLint = { passed, timestamp: new Date().toISOString() };
    allPassed = allPassed && passed;
  }

  // Run coverage check
  if (QA_CONFIG.coverage.enabled) {
    const passed = runCoverageCheck();
    results.coverage = { passed, timestamp: new Date().toISOString() };
    allPassed = allPassed && passed;
  }

  // Generate report
  const report = generateQAReport(results);

  // Final summary
  log('\n📋 QA Check Summary:', 'blue');
  log('==================');

  Object.entries(results).forEach(([check, result]) => {
    const status = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${status} ${check}`, color);
  });

  log(
    `\n📊 Results: ${report.summary.passed}/${report.summary.total} checks passed`
  );

  if (allPassed) {
    log('\n🎉 All QA checks passed! Ready for deployment.', 'green');
    process.exit(0);
  } else {
    log(
      '\n❌ Some QA checks failed. Please fix issues before deployment.',
      'red'
    );
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', error => {
  log(`❌ Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  log(`❌ Unhandled rejection: ${reason}`, 'red');
  process.exit(1);
});

// Execute main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  runLintCheck,
  runTypeCheck,
  runSecurityAudit,
  runXssLint,
  runCoverageCheck,
  QA_CONFIG,
};
