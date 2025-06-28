/**
 * Unit tests for 403 forbidden error handler
 */

import {
  initializeForbiddenHandler,
  cleanupForbiddenHandler,
  triggerForbiddenError,
} from '../forbiddenHandler';

// Mock window.location
const mockLocation = {
  href: '',
  assign: jest.fn(),
  reload: jest.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock console methods
const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  log: jest.spyOn(console, 'log').mockImplementation(),
};

describe('Forbidden Handler', () => {
  beforeEach(() => {
    // Reset location mock
    mockLocation.href = '';

    // Clear console spy calls
    consoleSpy.warn.mockClear();
    consoleSpy.log.mockClear();

    // Cleanup any existing handler
    cleanupForbiddenHandler();
  });

  afterEach(() => {
    cleanupForbiddenHandler();
  });

  it('should initialize handler without errors', () => {
    expect(() => {
      initializeForbiddenHandler();
    }).not.toThrow();

    expect((window as any).__FORBIDDEN_HANDLER_INITIALIZED__).toBe(true);
  });

  it('should not initialize handler multiple times', () => {
    initializeForbiddenHandler();
    initializeForbiddenHandler();

    // Should only be called once
    expect((window as any).__FORBIDDEN_HANDLER_INITIALIZED__).toBe(true);
  });

  it('should handle forbidden error events', done => {
    initializeForbiddenHandler();

    const errorDetail = {
      endpoint: '/api/v1/leads',
      error: { status: 403 },
      message: 'Access denied',
    };

    // Trigger the error
    triggerForbiddenError(errorDetail);

    // Check that console.warn was called
    setTimeout(() => {
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '🚫 403 Forbidden Access Detected:',
        expect.objectContaining({
          endpoint: '/api/v1/leads',
          message: 'Access denied',
        })
      );
      done();
    }, 100);
  });

  it('should redirect to access denied page after delay', done => {
    initializeForbiddenHandler();

    const errorDetail = {
      endpoint: '/api/v1/leads',
      error: { status: 403 },
      message: 'Access denied',
    };

    triggerForbiddenError(errorDetail);

    // Check redirect after delay
    setTimeout(() => {
      expect(mockLocation.href).toBe('/403');
      done();
    }, 1100); // Slightly longer than the 1000ms delay
  });

  it('should cleanup handler properly', () => {
    initializeForbiddenHandler();
    expect((window as any).__FORBIDDEN_HANDLER_INITIALIZED__).toBe(true);

    cleanupForbiddenHandler();
    expect((window as any).__FORBIDDEN_HANDLER_INITIALIZED__).toBeUndefined();
  });
});
