/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export const baseConfig = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/tests/setupTests.ts'],
    css: true,
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.d.ts',
        'coverage/',
        'dist/',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});

export default baseConfig;
