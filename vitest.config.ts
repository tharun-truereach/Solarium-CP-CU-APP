/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  // Path resolution for absolute imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/pages': resolve(__dirname, 'src/pages'),
      '@/layouts': resolve(__dirname, 'src/layouts'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/store': resolve(__dirname, 'src/store'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/tests': resolve(__dirname, 'src/tests'),
      '@/hooks': resolve(__dirname, 'src/hooks'),
      '@/routes': resolve(__dirname, 'src/routes'),
      '@/theme': resolve(__dirname, 'src/theme'),
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],

    // Global test configuration
    globals: true,

    // Coverage configuration for SonarQube compliance
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',

      // Note: Coverage thresholds are enforced via scripts/coverage-threshold.js

      // Include all source files for accurate coverage
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.stories.{ts,tsx}',
        '!src/main.tsx',
        '!src/vite-env.d.ts',
      ],

      // Exclude test files and generated code
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/**',
        '**/test-utils/**',
        'src/setupTests.ts',
        'src/test-utils/',
        '**/*.d.ts',
        'vite.config.ts',
        'vitest.config.ts',
      ],

      // Coverage reporting configuration
      reportOnFailure: true,

      // Watermarks for coverage visualization
      watermarks: {
        statements: [70, 85],
        functions: [70, 85],
        branches: [65, 80],
        lines: [70, 85],
      },
    },

    // Test execution configuration
    testTimeout: 30000,
    hookTimeout: 30000,

    // Retry failed tests once
    retry: 1,

    // Concurrent execution for faster tests
    maxConcurrency: 5,

    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}',
    ],

    // Mock configuration
    deps: {
      inline: ['@testing-library/user-event'],
    },

    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      VITE_ENVIRONMENT: 'TEST',
      VITE_API_BASE_URL: 'http://localhost:3001/api/v1',
      VITE_CRYPTO_SECRET: 'test-secret-key-for-testing-32chars-long',
    },

    // Reporter configuration
    reporters: ['verbose', 'json', 'html'],

    // Output configuration
    outputFile: {
      json: './coverage/test-results.json',
      html: './coverage/test-report.html',
    },
  },
});
