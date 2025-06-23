/**
 * Coverage report generator and verification
 * Ensures project meets coverage requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Coverage thresholds
const COVERAGE_THRESHOLDS = {
  overall: 80,
  businessLogic: 85,
  api: 80,
  components: 75,
  newCode: 85,
};

// Paths for different code categories
const CODE_CATEGORIES = {
  businessLogic: [
    'src/hooks/',
    'src/utils/',
    'src/store/slices/',
    'src/api/endpoints/',
  ],
  api: ['src/api/'],
  components: ['src/components/', 'src/pages/'],
  newCode: [
    'src/components/settings/',
    'src/hooks/useAuditLogs.ts',
    'src/api/endpoints/settingsEndpoints.ts',
    'src/store/slices/settingsSlice.ts',
    'src/types/settings.types.ts',
  ],
};

/**
 * Run coverage analysis
 */
function runCoverageAnalysis() {
  console.log('📊 Running coverage analysis...\n');

  try {
    // Run tests with coverage
    const coverageOutput = execSync(
      'npm run test:coverage -- --reporter=json',
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );

    // Parse coverage report
    const coverageData = JSON.parse(
      fs.readFileSync('coverage/coverage-summary.json', 'utf8')
    );

    return analyzeCoverage(coverageData);
  } catch (error) {
    console.error('❌ Failed to run coverage analysis:', error.message);
    process.exit(1);
  }
}

/**
 * Analyze coverage data against thresholds
 */
function analyzeCoverage(coverageData) {
  const analysis = {
    overall: calculateOverallCoverage(coverageData),
    categories: {},
    violations: [],
    summary: {},
  };

  // Analyze each category
  Object.entries(CODE_CATEGORIES).forEach(([category, paths]) => {
    const categoryCoverage = calculateCategoryCoverage(coverageData, paths);
    analysis.categories[category] = categoryCoverage;

    const threshold = COVERAGE_THRESHOLDS[category];
    if (categoryCoverage.statements.pct < threshold) {
      analysis.violations.push({
        category,
        actual: categoryCoverage.statements.pct,
        required: threshold,
        deficit: threshold - categoryCoverage.statements.pct,
      });
    }
  });

  // Overall coverage check
  if (analysis.overall.statements.pct < COVERAGE_THRESHOLDS.overall) {
    analysis.violations.push({
      category: 'overall',
      actual: analysis.overall.statements.pct,
      required: COVERAGE_THRESHOLDS.overall,
      deficit: COVERAGE_THRESHOLDS.overall - analysis.overall.statements.pct,
    });
  }

  // Generate summary
  analysis.summary = {
    totalFiles: Object.keys(coverageData).length,
    overallCoverage: analysis.overall.statements.pct,
    violationCount: analysis.violations.length,
    passed: analysis.violations.length === 0,
  };

  return analysis;
}

/**
 * Calculate overall coverage
 */
function calculateOverallCoverage(coverageData) {
  const totals = Object.values(coverageData).reduce(
    (acc, file) => {
      acc.statements.total += file.statements.total;
      acc.statements.covered += file.statements.covered;
      acc.branches.total += file.branches.total;
      acc.branches.covered += file.branches.covered;
      acc.functions.total += file.functions.total;
      acc.functions.covered += file.functions.covered;
      acc.lines.total += file.lines.total;
      acc.lines.covered += file.lines.covered;
      return acc;
    },
    {
      statements: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      lines: { total: 0, covered: 0 },
    }
  );

  // Calculate percentages
  Object.keys(totals).forEach(key => {
    const { total, covered } = totals[key];
    totals[key].pct = total > 0 ? Math.round((covered / total) * 100) : 100;
  });

  return totals;
}

/**
 * Calculate coverage for specific category
 */
function calculateCategoryCoverage(coverageData, paths) {
  const relevantFiles = Object.entries(coverageData).filter(([filePath]) =>
    paths.some(categoryPath => filePath.includes(categoryPath))
  );

  if (relevantFiles.length === 0) {
    return {
      statements: { pct: 100, total: 0, covered: 0 },
      branches: { pct: 100, total: 0, covered: 0 },
      functions: { pct: 100, total: 0, covered: 0 },
      lines: { pct: 100, total: 0, covered: 0 },
    };
  }

  const totals = relevantFiles.reduce(
    (acc, [, file]) => {
      acc.statements.total += file.statements.total;
      acc.statements.covered += file.statements.covered;
      acc.branches.total += file.branches.total;
      acc.branches.covered += file.branches.covered;
      acc.functions.total += file.functions.total;
      acc.functions.covered += file.functions.covered;
      acc.lines.total += file.lines.total;
      acc.lines.covered += file.lines.covered;
      return acc;
    },
    {
      statements: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      lines: { total: 0, covered: 0 },
    }
  );

  // Calculate percentages
  Object.keys(totals).forEach(key => {
    const { total, covered } = totals[key];
    totals[key].pct = total > 0 ? Math.round((covered / total) * 100) : 100;
  });

  return totals;
}

/**
 * Generate coverage report
 */
function generateReport(analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    passed: analysis.summary.passed,
    summary: analysis.summary,
    thresholds: COVERAGE_THRESHOLDS,
    coverage: {
      overall: analysis.overall,
      categories: analysis.categories,
    },
    violations: analysis.violations,
    recommendations: generateRecommendations(analysis),
  };

  // Write detailed report
  fs.writeFileSync(
    'coverage/coverage-analysis.json',
    JSON.stringify(report, null, 2)
  );

  return report;
}

/**
 * Generate improvement recommendations
 */
function generateRecommendations(analysis) {
  const recommendations = [];

  analysis.violations.forEach(violation => {
    if (violation.category === 'newCode') {
      recommendations.push({
        priority: 'high',
        category: violation.category,
        message: `New Settings code requires ${violation.deficit.toFixed(1)}% more coverage`,
        files: CODE_CATEGORIES.newCode,
      });
    } else if (violation.category === 'businessLogic') {
      recommendations.push({
        priority: 'high',
        category: violation.category,
        message: `Business logic coverage is critical - add ${violation.deficit.toFixed(1)}% more tests`,
        files: CODE_CATEGORIES.businessLogic,
      });
    } else {
      recommendations.push({
        priority: 'medium',
        category: violation.category,
        message: `Increase ${violation.category} coverage by ${violation.deficit.toFixed(1)}%`,
      });
    }
  });

  return recommendations;
}

/**
 * Display coverage results
 */
function displayResults(report) {
  console.log('📊 Coverage Analysis Results\n');
  console.log('='.repeat(50));

  // Overall results
  console.log(
    `Overall Coverage: ${report.coverage.overall.statements.pct}% (Required: ${COVERAGE_THRESHOLDS.overall}%)`
  );
  console.log(`Total Files: ${report.summary.totalFiles}`);
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}\n`);

  // Category breakdown
  console.log('Category Breakdown:');
  console.log('-'.repeat(30));
  Object.entries(report.coverage.categories).forEach(([category, coverage]) => {
    const threshold = COVERAGE_THRESHOLDS[category];
    const status = coverage.statements.pct >= threshold ? '✅' : '❌';
    console.log(
      `${status} ${category}: ${coverage.statements.pct}% (Required: ${threshold}%)`
    );
  });

  // Violations
  if (report.violations.length > 0) {
    console.log('\n❌ Coverage Violations:');
    console.log('-'.repeat(30));
    report.violations.forEach(violation => {
      console.log(
        `${violation.category}: ${violation.actual}% (need ${violation.required}%, deficit: ${violation.deficit.toFixed(1)}%)`
      );
    });
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    console.log('-'.repeat(30));
    report.recommendations.forEach(rec => {
      console.log(`${rec.priority.toUpperCase()}: ${rec.message}`);
    });
  }

  console.log('\n' + '='.repeat(50));

  if (!report.passed) {
    console.log('❌ Coverage requirements not met. Please add more tests.');
    process.exit(1);
  } else {
    console.log('✅ All coverage requirements met!');
  }
}

/**
 * Main execution
 */
function main() {
  const analysis = runCoverageAnalysis();
  const report = generateReport(analysis);
  displayResults(report);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runCoverageAnalysis,
  analyzeCoverage,
  generateReport,
  COVERAGE_THRESHOLDS,
};
