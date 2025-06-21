/**
 * Generate coverage badges from coverage summary
 * Creates SVG badges for README documentation
 */
const fs = require('fs');
const path = require('path');

// Coverage summary file path
const coverageSummaryPath = path.join(
  __dirname,
  '../coverage/coverage-summary.json'
);

// Badge colors based on coverage percentage
const getBadgeColor = percentage => {
  if (percentage >= 90) return 'brightgreen';
  if (percentage >= 80) return 'green';
  if (percentage >= 70) return 'yellow';
  if (percentage >= 60) return 'orange';
  return 'red';
};

// Generate badge URL
const generateBadgeUrl = (label, value, color) => {
  const encodedLabel = encodeURIComponent(label);
  const encodedValue = encodeURIComponent(`${value}%`);
  return `https://img.shields.io/badge/${encodedLabel}-${encodedValue}-${color}`;
};

// Main function
function generateCoverageBadges() {
  try {
    if (!fs.existsSync(coverageSummaryPath)) {
      console.warn(
        'Coverage summary not found. Run tests with coverage first.'
      );
      return;
    }

    const coverageSummary = JSON.parse(
      fs.readFileSync(coverageSummaryPath, 'utf8')
    );
    const totalCoverage = coverageSummary.total;

    const badges = {
      lines: {
        percentage: Math.round(totalCoverage.lines.pct),
        color: getBadgeColor(totalCoverage.lines.pct),
      },
      statements: {
        percentage: Math.round(totalCoverage.statements.pct),
        color: getBadgeColor(totalCoverage.statements.pct),
      },
      functions: {
        percentage: Math.round(totalCoverage.functions.pct),
        color: getBadgeColor(totalCoverage.functions.pct),
      },
      branches: {
        percentage: Math.round(totalCoverage.branches.pct),
        color: getBadgeColor(totalCoverage.branches.pct),
      },
    };

    // Calculate overall coverage
    const overallPercentage = Math.round(
      (totalCoverage.lines.pct +
        totalCoverage.statements.pct +
        totalCoverage.functions.pct +
        totalCoverage.branches.pct) /
        4
    );

    badges.coverage = {
      percentage: overallPercentage,
      color: getBadgeColor(overallPercentage),
    };

    // Generate badge markdown
    const badgeMarkdown = [
      '## Test Coverage',
      '',
      `![Coverage Badge](${generateBadgeUrl('coverage', badges.coverage.percentage, badges.coverage.color)})`,
      `![Statements](${generateBadgeUrl('statements', badges.statements.percentage, badges.statements.color)})`,
      `![Branches](${generateBadgeUrl('branches', badges.branches.percentage, badges.branches.color)})`,
      `![Functions](${generateBadgeUrl('functions', badges.functions.percentage, badges.functions.color)})`,
      `![Lines](${generateBadgeUrl('lines', badges.lines.percentage, badges.lines.color)})`,
      '',
      '### Coverage Details',
      `- **Overall Coverage**: ${badges.coverage.percentage}%`,
      `- **Statements**: ${badges.statements.percentage}%`,
      `- **Branches**: ${badges.branches.percentage}%`,
      `- **Functions**: ${badges.functions.percentage}%`,
      `- **Lines**: ${badges.lines.percentage}%`,
      '',
    ].join('\n');

    // Write badges to file
    const badgesPath = path.join(__dirname, '../coverage/badges.md');
    fs.writeFileSync(badgesPath, badgeMarkdown);

    // Update main README
    const readmePath = path.join(__dirname, '../README.md');
    if (fs.existsSync(readmePath)) {
      let readme = fs.readFileSync(readmePath, 'utf8');

      // Replace existing badges section
      const badgeSection = /## Test Coverage[\s\S]*?(?=##|$)/;
      if (badgeSection.test(readme)) {
        readme = readme.replace(badgeSection, badgeMarkdown + '\n');
      } else {
        // Add badges section after main heading
        readme = readme.replace(/(# .*\n\n)/, `$1${badgeMarkdown}\n`);
      }

      fs.writeFileSync(readmePath, readme);
    }

    console.log('✅ Coverage badges generated successfully');
    console.log(`📊 Overall Coverage: ${badges.coverage.percentage}%`);
    console.log(`📈 Statements: ${badges.statements.percentage}%`);
    console.log(`🌳 Branches: ${badges.branches.percentage}%`);
    console.log(`🔧 Functions: ${badges.functions.percentage}%`);
    console.log(`📝 Lines: ${badges.lines.percentage}%`);

    // Check if coverage meets requirements
    const meetsRequirements = Object.values(badges).every(
      badge => badge.percentage >= 80
    );
    if (!meetsRequirements) {
      console.warn('⚠️  Coverage does not meet 80% requirement');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error generating coverage badges:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateCoverageBadges();
}

module.exports = { generateCoverageBadges };
