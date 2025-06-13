/**
 * Quality Assurance Check Script
 * Runs comprehensive quality checks on the codebase
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Starting Quality Assurance Checks...\n');

const runCommand = (command, description) => {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} passed\n`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} failed`);
    console.log(error.stdout || error.message);
    console.log('');
    return { success: false, error };
  }
};

const checks = [
  {
    command: 'npm run type-check',
    description: 'TypeScript Type Checking',
  },
  {
    command: 'npm run lint',
    description: 'ESLint Code Quality',
  },
  {
    command: 'npm run format:check',
    description: 'Prettier Code Formatting',
  },
  {
    command: 'npm run test:unit',
    description: 'Unit Tests',
  },
  {
    command: 'npm run test:integration',
    description: 'Integration Tests',
  },
  {
    command: 'npm run test:accessibility',
    description: 'Accessibility Tests',
  },
  {
    command: 'npm run test:performance',
    description: 'Performance Tests',
  },
  {
    command: 'npm run build:prod',
    description: 'Production Build',
  },
  {
    command: 'npm run size-check',
    description: 'Bundle Size Check',
  },
];

let allPassed = true;
const results = [];

for (const check of checks) {
  const result = runCommand(check.command, check.description);
  results.push({ ...check, ...result });
  if (!result.success) {
    allPassed = false;
  }
}

// Generate coverage report summary
const checkCoverage = () => {
  const coveragePath = path.join(
    __dirname,
    '../coverage/coverage-summary.json'
  );
  if (fs.existsSync(coveragePath)) {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    console.log('📊 Test Coverage Summary:');
    console.log(`   Lines: ${coverage.total.lines.pct}%`);
    console.log(`   Functions: ${coverage.total.functions.pct}%`);
    console.log(`   Branches: ${coverage.total.branches.pct}%`);
    console.log(`   Statements: ${coverage.total.statements.pct}%\n`);

    const minCoverage = 50;
    if (coverage.total.lines.pct < minCoverage) {
      console.log(`❌ Coverage below minimum threshold (${minCoverage}%)\n`);
      allPassed = false;
    } else {
      console.log(`✅ Coverage meets minimum threshold (${minCoverage}%)\n`);
    }
  }
};

checkCoverage();

// Check bundle size
const checkBundleSize = () => {
  const distPath = path.join(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    console.log('📦 Bundle Size Analysis:');
    const jsFiles = fs
      .readdirSync(path.join(distPath, 'assets'))
      .filter(file => file.endsWith('.js'));

    let totalSize = 0;
    jsFiles.forEach(file => {
      const filePath = path.join(distPath, 'assets', file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   ${file}: ${sizeKB} KB`);
      totalSize += stats.size;
    });

    const totalSizeKB = Math.round(totalSize / 1024);
    console.log(`   Total JS: ${totalSizeKB} KB`);

    const maxSizeKB = 1024; // 1MB limit
    if (totalSizeKB > maxSizeKB) {
      console.log(`❌ Bundle size exceeds limit (${maxSizeKB} KB)\n`);
      allPassed = false;
    } else {
      console.log(`✅ Bundle size within limit (${maxSizeKB} KB)\n`);
    }
  }
};

checkBundleSize();

// Final summary
console.log('🏁 Quality Assurance Summary:');
console.log('================================');

results.forEach(result => {
  const status = result.success ? '✅' : '❌';
  console.log(`${status} ${result.description}`);
});

console.log('================================');

if (allPassed) {
  console.log('🎉 All quality checks passed!');
  process.exit(0);
} else {
  console.log('💥 Some quality checks failed!');
  process.exit(1);
}
