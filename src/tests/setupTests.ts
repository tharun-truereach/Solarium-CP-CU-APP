/**
 * Vitest setup file for Solarium Web Portal tests
 * Configures testing library and global test utilities
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables for testing
process.env.REACT_APP_ENVIRONMENT = 'TEST';
process.env.REACT_APP_API_BASE_URL = 'http://localhost:3000';
process.env.REACT_APP_SESSION_TIMEOUT_MIN = '30';

// Global test utilities
export const testUtils = {
  /**
   * Helper to create mock environment variables
   */
  mockEnvironment: (overrides: Record<string, string> = {}) => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      REACT_APP_ENVIRONMENT: 'TEST',
      REACT_APP_API_BASE_URL: 'http://localhost:3000',
      REACT_APP_SESSION_TIMEOUT_MIN: '30',
      ...overrides,
    };
    return () => {
      process.env = originalEnv;
    };
  },

  /**
   * Helper to wait for async operations in tests
   */
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};
