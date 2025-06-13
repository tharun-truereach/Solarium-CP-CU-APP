/**
 * Foundation metrics validation
 * Measures and validates key performance indicators
 */
import path from 'path';
import { execSync } from 'child_process';

describe('Foundation Metrics Validation', () => {
  test('bundle size meets requirements', () => {
    // Build production version
    execSync('npm run build:production', { stdio: 'pipe' });

    const distPath = path.join(process.cwd(), 'dist');
    const stats = execSync(`du -sb ${distPath}`, { encoding: 'utf8' });
    const sizeBytes = parseInt(stats.split('\t')[0]!);
    const sizeMB = sizeBytes / (1024 * 1024);

    console.log(`Bundle size: ${sizeMB.toFixed(2)}MB`);

    // Should be under 1MB initial load as per acceptance criteria
    expect(sizeMB).toBeLessThan(1);
  });

  test('code coverage meets minimum threshold', () => {
    const coverageReport = execSync('npm run test:coverage -- --silent', {
      encoding: 'utf8',
    });

    // Extract coverage percentages (this is a simplified check)
    const coverageMatch = coverageReport.match(/All files.*?(\d+\.?\d*)/);
    if (coverageMatch && coverageMatch[1]) {
      const coverage = parseFloat(coverageMatch[1]);
      console.log(`Code coverage: ${coverage}%`);

      // Should meet 50% threshold as per jest config
      expect(coverage).toBeGreaterThanOrEqual(50);
    }
  });

  test('build time is reasonable', () => {
    const start = Date.now();
    execSync('npm run build:production', { stdio: 'pipe' });
    const buildTime = Date.now() - start;

    console.log(`Build time: ${buildTime}ms`);

    // Should build within 2 minutes for initial foundation
    expect(buildTime).toBeLessThan(120000);
  });

  test('test execution time is reasonable', () => {
    const start = Date.now();
    execSync('npm run test:ci', { stdio: 'pipe' });
    const testTime = Date.now() - start;

    console.log(`Test execution time: ${testTime}ms`);

    // Should complete tests within 1 minute
    expect(testTime).toBeLessThan(60000);
  });

  test('linting time is reasonable', () => {
    const start = Date.now();
    execSync('npm run lint', { stdio: 'pipe' });
    const lintTime = Date.now() - start;

    console.log(`Lint time: ${lintTime}ms`);

    // Should complete linting within 30 seconds
    expect(lintTime).toBeLessThan(30000);
  });
});
