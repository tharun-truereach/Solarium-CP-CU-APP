/**
 * Custom test runner for validation
 * Runs comprehensive validation checks
 */
import { execSync } from 'child_process';

interface ValidationResult {
  category: string;
  test: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

class ValidationRunner {
  private results: ValidationResult[] = [];

  async runValidation(): Promise<void> {
    console.log('🚀 Starting Foundation Validation Suite...\n');

    // Run different categories of validation
    await this.runLintingValidation();
    await this.runBuildValidation();
    await this.runTestValidation();
    await this.runCoverageValidation();
    await this.runPerformanceValidation();
    await this.runAccessibilityValidation();

    // Print summary
    this.printSummary();
  }

  private async runLintingValidation(): Promise<void> {
    console.log('📝 Running Linting Validation...');

    await this.runTest('Linting', 'ESLint Check', () => {
      execSync('npm run lint', { stdio: 'pipe' });
    });

    await this.runTest('Linting', 'Prettier Check', () => {
      execSync('npm run format:check', { stdio: 'pipe' });
    });

    await this.runTest('Linting', 'TypeScript Check', () => {
      execSync('npm run typecheck', { stdio: 'pipe' });
    });
  }

  private async runBuildValidation(): Promise<void> {
    console.log('🏗️ Running Build Validation...');

    await this.runTest('Build', 'Development Build', () => {
      execSync('npm run build:development', { stdio: 'pipe' });
    });

    await this.runTest('Build', 'Production Build', () => {
      execSync('npm run build:production', { stdio: 'pipe' });
    });

    await this.runTest('Build', 'Bundle Size Check', () => {
      const output = execSync('du -sb dist', { encoding: 'utf8' });
      const sizeBytes = parseInt(output.split('\t')[0]!);
      const sizeMB = sizeBytes / (1024 * 1024);

      if (sizeMB > 5) {
        throw new Error(`Bundle size ${sizeMB.toFixed(2)}MB exceeds 5MB limit`);
      }
    });
  }

  private async runTestValidation(): Promise<void> {
    console.log('🧪 Running Test Validation...');

    await this.runTest('Testing', 'Unit Tests', () => {
      execSync('npm run test:ci', { stdio: 'pipe' });
    });

    await this.runTest('Testing', 'Integration Tests', () => {
      execSync('npm run test -- --testPathPattern=integration', {
        stdio: 'pipe',
      });
    });
  }

  private async runCoverageValidation(): Promise<void> {
    console.log('📊 Running Coverage Validation...');

    await this.runTest('Coverage', 'Coverage Report', () => {
      const output = execSync('npm run test:coverage -- --silent', {
        encoding: 'utf8',
      });

      // Parse coverage from output (basic check)
      if (!output.includes('All files')) {
        throw new Error('Coverage report not generated');
      }
    });

    await this.runTest('Coverage', 'Coverage Threshold', () => {
      // This will throw if coverage is below threshold set in jest.config.cjs
      execSync('npm run test:coverage -- --silent --passWithNoTests', {
        stdio: 'pipe',
      });
    });
  }

  private async runPerformanceValidation(): Promise<void> {
    console.log('⚡ Running Performance Validation...');

    await this.runTest('Performance', 'Build Time Check', () => {
      const start = Date.now();
      execSync('npm run build:production', { stdio: 'pipe' });
      const duration = Date.now() - start;

      // Build should complete within 2 minutes
      if (duration > 120000) {
        throw new Error(`Build took ${duration}ms, exceeding 120s limit`);
      }
    });
  }

  private async runAccessibilityValidation(): Promise<void> {
    console.log('♿ Running Accessibility Validation...');

    await this.runTest('Accessibility', 'A11y Tests', () => {
      execSync('npm run test -- --testPathPattern=accessibility', {
        stdio: 'pipe',
      });
    });
  }

  private async runTest(
    category: string,
    testName: string,
    testFn: () => void
  ): Promise<void> {
    const start = Date.now();

    try {
      testFn();
      const duration = Date.now() - start;
      this.results.push({
        category,
        test: testName,
        passed: true,
        duration,
      });
      console.log(`  ✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      this.results.push({
        category,
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      console.log(
        `  ❌ ${testName} (${duration}ms): ${error instanceof Error ? error.message : error}`
      );
    }
  }

  private printSummary(): void {
    console.log('\n📋 Validation Summary:');
    console.log('========================');

    const categories = [...new Set(this.results.map(r => r.category))];

    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.passed).length;
      const total = categoryResults.length;
      const avgDuration = Math.round(
        categoryResults.reduce((sum, r) => sum + (r.duration || 0), 0) / total
      );

      console.log(`\n${category}:`);
      console.log(`  Passed: ${passed}/${total}`);
      console.log(`  Average Duration: ${avgDuration}ms`);

      if (passed < total) {
        console.log('  Failed Tests:');
        categoryResults
          .filter(r => !r.passed)
          .forEach(r => console.log(`    - ${r.test}: ${r.error}`));
      }
    });

    const totalPassed = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    const successRate = Math.round((totalPassed / totalTests) * 100);

    console.log(
      `\n🎯 Overall Success Rate: ${successRate}% (${totalPassed}/${totalTests})`
    );

    if (totalPassed === totalTests) {
      console.log('🎉 All validations passed! Foundation is solid.');
    } else {
      console.log('⚠️  Some validations failed. Please review and fix issues.');
      process.exit(1);
    }
  }
}

// Export for use in tests or as standalone runner
export { ValidationRunner };

// Run if called directly
if (require.main === module) {
  const runner = new ValidationRunner();
  runner.runValidation().catch(error => {
    console.error('Validation runner failed:', error);
    process.exit(1);
  });
}
