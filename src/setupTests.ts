/**
 * Enhanced Jest setup file for React Testing Library
 * Provides comprehensive testing utilities and mocks
 */
import '@testing-library/jest-dom';

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

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  reload: jest.fn(),
  assign: jest.fn(),
  replace: jest.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock console methods for testing
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillMount') ||
        args[0].includes('componentWillReceiveProps'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
// @ts-expect-error: Add testUtils to global for test utilities
global.testUtils = {
  mockLocalStorage: () => {
    const mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
    return mockStorage;
  },

  mockSessionStorage: () => {
    const mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage,
      writable: true,
    });
    return mockStorage;
  },
};

// Extend Jest matchers
declare global {
  interface JestMatchers<R> {
    toBeInTheDocument(): R;
    toHaveClass(className: string): R;
    toHaveStyle(style: Record<string, any>): R;
  }

  // Use let instead of var for testUtils
  let testUtils: {
    mockLocalStorage: () => any;
    mockSessionStorage: () => any;
  };
}
