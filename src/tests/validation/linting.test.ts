/**
 * Linting validation tests
 * Ensures code quality standards are met
 */
import { execSync } from 'child_process';

describe('Linting Validation', () => {
  test('ESLint passes without errors', () => {
    expect(() => {
      execSync('npm run lint', { stdio: 'pipe' });
    }).not.toThrow();
  });

  test('Prettier formatting is consistent', () => {
    expect(() => {
      execSync('npm run format:check', { stdio: 'pipe' });
    }).not.toThrow();
  });

  test('TypeScript compilation succeeds', () => {
    expect(() => {
      execSync('npm run typecheck', { stdio: 'pipe' });
    }).not.toThrow();
  });
});
