/**
 * Test utilities for coverage and testing scenarios
 * Provides helpers for mocking, testing edge cases, and coverage scenarios
 */

/**
 * Mock implementation for localStorage in tests
 */
export const createMockStorage = () => {
  let storage: Record<string, string> = {};

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      storage = {};
    },
    key: (index: number) => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(storage).length;
    },
  };
};

/**
 * Mock implementation for crypto operations in tests
 */
export const createMockCrypto = () => ({
  randomUUID: () => `test-uuid-${Math.random().toString(36).substr(2, 9)}`,
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
});

/**
 * Create a mock user for testing with different roles
 */
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'kam',
  permissions: ['leads:read', 'quotations:read'],
  territories: ['North', 'South'],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Create mock API responses for testing
 */
export const createMockApiResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

/**
 * Create mock error responses for testing error scenarios
 */
export const createMockApiError = (
  message: string,
  status = 500,
  code?: string
) => ({
  response: {
    data: { message, code },
    status,
    statusText: status === 404 ? 'Not Found' : 'Internal Server Error',
    headers: {},
  },
  message,
  code,
  isAxiosError: true,
});

/**
 * Test helper to simulate async operations with delays
 */
export const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test helper to trigger coverage for error boundaries
 */
export const ThrowError: React.FC<{
  shouldThrow?: boolean;
  message?: string;
}> = ({ shouldThrow = true, message = 'Test error for coverage' }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return null;
};

/**
 * Test helper to simulate different window sizes for responsive testing
 */
export const mockWindowSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

/**
 * Test helper to mock intersection observer
 */
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

/**
 * Test helper to mock matchMedia for responsive components
 */
export const mockMatchMedia = (query: string, matches = false) => {
  const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  });

  return mockMatchMedia;
};

/**
 * Coverage helper to test all branches of conditional logic
 */
export const testAllBranches = <T>(
  testFunction: (input: T) => any,
  inputs: T[]
) => {
  return inputs.map(input => {
    try {
      return { input, result: testFunction(input), error: null };
    } catch (error) {
      return { input, result: null, error };
    }
  });
};

/**
 * Helper to generate test data for edge cases
 */
export const generateEdgeCaseData = () => ({
  emptyString: '',
  emptyArray: [],
  emptyObject: {},
  nullValue: null,
  undefinedValue: undefined,
  zeroNumber: 0,
  negativeNumber: -1,
  largeNumber: Number.MAX_SAFE_INTEGER,
  specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  longString: 'a'.repeat(1000),
  unicodeString: '🚀🔒✅❌⚠️',
  sqlInjection: "'; DROP TABLE users; --",
  xssAttempt: '<script>alert("xss")</script>',
  pathTraversal: '../../../etc/passwd',
});
