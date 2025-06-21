/**
 * Vitest configuration specifically for accessibility tests
 * Runs only accessibility-related test files
 */
import { defineConfig } from 'vitest/config';
import { baseConfig } from './vitest.config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    // Only run accessibility tests
    include: [
      'src/**/*.accessibility.test.{ts,tsx}',
      'src/**/__tests__/**/*.accessibility.{ts,tsx}',
    ],
    // Accessibility-specific setup
    setupFiles: ['src/tests/setupTests.ts'],
    environment: 'jsdom',
    // Extended timeout for axe checks
    testTimeout: 10000,
    // Custom reporter for accessibility results
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './coverage/accessibility-results.json',
    },
  },
});
