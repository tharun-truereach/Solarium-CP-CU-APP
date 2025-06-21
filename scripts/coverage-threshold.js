#!/usr/bin/env node

/**
 * Coverage threshold validation script for SonarQube compliance
 * Validates that code coverage meets minimum requirements before deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Coverage threshold configuration for SonarQube compliance
 * Ensures minimum coverage requirements are met
 */

const coverageThresholds = {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  // Specific thresholds for critical components
  'src/routes/ProtectedRoute.tsx': {
    branches: 100,
    functions: 100,
    lines: 95,
    statements: 95,
  },
  'src/utils/security.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  'src/layout/Sidebar.tsx': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
  // Component categories
  'src/components/**/*.tsx': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
  'src/store/**/*.ts': {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  'src/utils/**/*.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
};

// File patterns for different layer categorization
const LAYER_PATTERNS = {
  businessLogic: [
    'src/store/slices/**/*.ts',
    'src/utils/**/*.ts',
    'src/hooks/**/*.ts',
    'src/contexts/**/*.tsx',
  ],
  apiLayer: ['src/api/**/*.ts', 'src/services/**/*.ts'],
  uiLayer: [
    'src/components/**/*.tsx',
    'src/pages/**/*.tsx',
    'src/layout/**/*.tsx',
  ],
};

/**
 * Load coverage summary from file
 */
function loadCoverageSummary() {
  const coveragePath = path.join(
    process.cwd(),
    'coverage',
    'coverage-summary.json'
  );

  if (!fs.existsSync(coveragePath)) {
    console.error(
      '❌ Coverage summary file not found. Run tests with coverage first.'
    );
    console.error(`Expected: ${coveragePath}`);
    process.exit(1);
  }

  try {
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    return coverageData;
  } catch (error) {
    console.error('❌ Failed to parse coverage summary:', error.message);
    process.exit(1);
  }
}

/**
 * Check if file matches any pattern
 */
function matchesPattern(filePath, patterns) {
  return patterns.some(pattern => {
    const regex = new RegExp(pattern.replace('**', '.*').replace('*', '[^/]*'));
    return regex.test(filePath);
  });
}

/**
 * Categorize files by layer
 */
function categorizeFiles(coverage) {
  const layers = {
    businessLogic: {},
    apiLayer: {},
    uiLayer: {},
    other: {},
  };

  Object.keys(coverage).forEach(filePath => {
    if (filePath === 'total') return;

    const relativePath = filePath.replace(process.cwd(), '').replace(/^\//, '');

    if (matchesPattern(relativePath, LAYER_PATTERNS.businessLogic)) {
      layers.businessLogic[filePath] = coverage[filePath];
    } else if (matchesPattern(relativePath, LAYER_PATTERNS.apiLayer)) {
      layers.apiLayer[filePath] = coverage[filePath];
    } else if (matchesPattern(relativePath, LAYER_PATTERNS.uiLayer)) {
      layers.uiLayer[filePath] = coverage[filePath];
    } else {
      layers.other[filePath] = coverage[filePath];
    }
  });

  return layers;
}

/**
 * Calculate layer coverage averages
 */
function calculateLayerCoverage(layerFiles) {
  if (Object.keys(layerFiles).length === 0) {
    return {
      statements: { pct: 100 },
      branches: { pct: 100 },
      functions: { pct: 100 },
      lines: { pct: 100 },
    };
  }

  const totals = {
    statements: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 },
  };

  Object.values(layerFiles).forEach(file => {
    ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
      totals[metric].covered += file[metric].covered;
      totals[metric].total += file[metric].total;
    });
  });

  const coverage = {};
  ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
    coverage[metric] = {
      pct:
        totals[metric].total > 0
          ? Math.round((totals[metric].covered / totals[metric].total) * 100)
          : 100,
    };
  });

  return coverage;
}

/**
 * Validate coverage against thresholds
 */
function validateCoverage(coverage, thresholds, layerName) {
  const failures = [];

  ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
    const actual = coverage[metric].pct;
    const required = thresholds[metric];

    if (actual < required) {
      failures.push({
        metric,
        actual,
        required,
        difference: required - actual,
      });
    }
  });

  return failures;
}

/**
 * Format coverage report
 */
function formatCoverageReport(layerName, coverage, failures) {
  const status = failures.length === 0 ? '✅' : '❌';

  console.log(`\n${status} ${layerName} Coverage:`);
  console.log('┌─────────────┬─────────┬─────────┬────────┐');
  console.log('│ Metric      │ Actual  │ Required│ Status │');
  console.log('├─────────────┼─────────┼─────────┼────────┤');

  ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
    const actual = coverage[metric].pct;
    const required =
      metric === 'businessLogic'
        ? THRESHOLDS.businessLogic[metric]
        : metric === 'apiLayer'
          ? THRESHOLDS.apiLayer[metric]
          : THRESHOLDS.overall[metric];
    const status = actual >= required ? '✅' : '❌';

    console.log(
      `│ ${metric.padEnd(11)} │ ${actual.toString().padStart(6)}% │ ${required.toString().padStart(6)}% │ ${status}      │`
    );
  });

  console.log('└─────────────┴─────────┴─────────┴────────┘');

  if (failures.length > 0) {
    console.log('\n⚠️  Coverage failures:');
    failures.forEach(failure => {
      console.log(
        `   • ${failure.metric}: ${failure.actual}% (needs ${failure.difference}% more)`
      );
    });
  }
}

/**
 * Generate SonarQube compatible report
 */
function generateSonarReport(overallCoverage, layerCoverages) {
  const sonarReport = {
    timestamp: new Date().toISOString(),
    overall: overallCoverage.total,
    layers: {
      businessLogic: layerCoverages.businessLogic,
      apiLayer: layerCoverages.apiLayer,
      uiLayer: layerCoverages.uiLayer,
    },
    thresholds: THRESHOLDS,
    status: 'PASSED', // Will be updated if failures occur
  };

  // Save SonarQube report
  const sonarReportPath = path.join(
    process.cwd(),
    'coverage',
    'sonar-report.json'
  );
  fs.writeFileSync(sonarReportPath, JSON.stringify(sonarReport, null, 2));

  return sonarReport;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Validating code coverage thresholds...\n');

  // Load coverage data
  const coverage = loadCoverageSummary();

  // Categorize files by layer
  const layers = categorizeFiles(coverage);

  // Calculate layer coverages
  const layerCoverages = {
    businessLogic: calculateLayerCoverage(layers.businessLogic),
    apiLayer: calculateLayerCoverage(layers.apiLayer),
    uiLayer: calculateLayerCoverage(layers.uiLayer),
  };

  // Validate overall coverage
  const overallFailures = validateCoverage(
    coverage.total,
    THRESHOLDS.overall,
    'Overall'
  );

  // Validate business logic coverage
  const businessLogicFailures = validateCoverage(
    layerCoverages.businessLogic,
    THRESHOLDS.businessLogic,
    'Business Logic'
  );

  // Validate API layer coverage
  const apiLayerFailures = validateCoverage(
    layerCoverages.apiLayer,
    THRESHOLDS.apiLayer,
    'API Layer'
  );

  // Format reports
  formatCoverageReport('Overall', coverage.total, overallFailures);
  formatCoverageReport(
    'Business Logic',
    layerCoverages.businessLogic,
    businessLogicFailures
  );
  formatCoverageReport('API Layer', layerCoverages.apiLayer, apiLayerFailures);

  // Generate SonarQube report
  const sonarReport = generateSonarReport(coverage, layerCoverages);

  // Check for any failures
  const totalFailures =
    overallFailures.length +
    businessLogicFailures.length +
    apiLayerFailures.length;

  if (totalFailures > 0) {
    console.log(
      `\n❌ Coverage validation failed: ${totalFailures} threshold(s) not met`
    );
    console.log('\n💡 Tips to improve coverage:');
    console.log('   • Add unit tests for uncovered functions');
    console.log('   • Test error handling paths');
    console.log('   • Add integration tests for API endpoints');
    console.log('   • Test edge cases and boundary conditions');

    sonarReport.status = 'FAILED';
    fs.writeFileSync(
      path.join(process.cwd(), 'coverage', 'sonar-report.json'),
      JSON.stringify(sonarReport, null, 2)
    );

    process.exit(1);
  }

  console.log('\n✅ All coverage thresholds met!');
  console.log(`📊 SonarQube report generated: coverage/sonar-report.json`);

  process.exit(0);
}

// Handle uncaught errors
process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

// Run main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  validateCoverage,
  calculateLayerCoverage,
  categorizeFiles,
  coverageThresholds,
};

export const THRESHOLDS = coverageThresholds;

export const collectCoverageFrom = [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/main.tsx',
  '!src/vite-env.d.ts',
  '!src/**/*.test.{ts,tsx}',
  '!src/**/__tests__/**',
  '!src/test-utils/**',
];

export const coverageReporters = ['text', 'lcov', 'html', 'json-summary'];

export const coverageDirectory = 'coverage';
export const collectCoverage = true;
