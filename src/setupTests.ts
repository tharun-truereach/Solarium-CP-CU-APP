/**
 * Test setup configuration for Vitest and React Testing Library
 * Configures jsdom environment and extends matchers for enhanced testing
 */

import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Set up test environment variables
process.env.REACT_APP_ENVIRONMENT = 'DEV';
process.env.REACT_APP_API_BASE_URL = 'http://localhost:3001';
process.env.REACT_APP_API_TIMEOUT = '30000';
process.env.REACT_APP_SESSION_TIMEOUT_MIN = '30';
process.env.REACT_APP_SESSION_WARNING_MIN = '5';
process.env.REACT_APP_ENABLE_DEBUG_TOOLS = 'true';
process.env.REACT_APP_ENABLE_MOCK_AUTH = 'true';
process.env.REACT_APP_ENABLE_SERVICE_WORKER = 'false';
process.env.REACT_APP_BUILD_NUMBER = 'test-build';
process.env.REACT_APP_VERSION = '1.0.0-test';
process.env.REACT_APP_LOG_LEVEL = 'debug';
process.env.REACT_APP_SHOW_REDUX_DEVTOOLS = 'true';

// Set up Vite environment variables for tests
process.env.VITE_ENVIRONMENT = 'DEV';
process.env.VITE_API_BASE_URL = 'http://localhost:3001';

// Mock window.matchMedia for Material-UI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock crypto for secure operations
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

console.log('✅ Test setup configured with jsdom and jest-axe');

declare global {
  const vi: any;
}
