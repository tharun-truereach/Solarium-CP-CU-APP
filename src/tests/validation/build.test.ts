/**
 * Build validation tests
 * Ensures build process works correctly for all environments
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Build Validation', () => {
  afterEach(() => {
    // Clean up build artifacts
    try {
      execSync('npm run clean', { stdio: 'pipe' });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('development build succeeds', () => {
    expect(() => {
      execSync('npm run build:development', { stdio: 'pipe' });
    }).not.toThrow();

    // Check if build output exists
    expect(fs.existsSync(path.join(process.cwd(), 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'dist/index.html'))).toBe(
      true
    );
  });

  test('production build succeeds', () => {
    expect(() => {
      execSync('npm run build:production', { stdio: 'pipe' });
    }).not.toThrow();

    // Check if build output exists
    expect(fs.existsSync(path.join(process.cwd(), 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'dist/index.html'))).toBe(
      true
    );
  });

  test('build output is optimized', () => {
    execSync('npm run build:production', { stdio: 'pipe' });

    const distPath = path.join(process.cwd(), 'dist');
    const files = fs.readdirSync(distPath, { recursive: true });

    // Check for expected file types
    const jsFiles = files.filter(file => file.toString().endsWith('.js'));
    const cssFiles = files.filter(file => file.toString().endsWith('.css'));

    expect(jsFiles.length).toBeGreaterThan(0);
    expect(cssFiles.length).toBeGreaterThan(0);

    // Check for minification (files should have hash in name)
    const hashedFiles = jsFiles.filter(file => file.toString().includes('-'));
    expect(hashedFiles.length).toBeGreaterThan(0);
  });

  test('build size is reasonable', () => {
    execSync('npm run build:production', { stdio: 'pipe' });

    const distPath = path.join(process.cwd(), 'dist');
    const stats = execSync(`du -sb ${distPath}`, { encoding: 'utf8' });
    const sizeBytes = parseInt(stats.split('\t')[0]!);
    const sizeMB = sizeBytes / (1024 * 1024);

    // Build should be under 5MB (generous limit for initial foundation)
    expect(sizeMB).toBeLessThan(5);
  });
});
