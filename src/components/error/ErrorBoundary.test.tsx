/**
 * Test suite for ErrorBoundary component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import { errorLogger } from '@/services/errorLogger.service';
import userEvent from '@testing-library/user-event';

// Mock the error logger
jest.mock('@/services/errorLogger.service', () => ({
  errorLogger: {
    logError: jest.fn().mockReturnValue('test-error-id-123'),
  },
}));

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = true,
}) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error thrown</div>;
};

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;

beforeAll(() => {
  console.error = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.group = originalConsoleGroup;
  console.groupEnd = originalConsoleGroupEnd;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ErrorBoundary Component', () => {
  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/No error thrown/i)).toBeInTheDocument();
  });

  test('renders error fallback when child component throws error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/we're sorry, but something unexpected happened/i)
    ).toBeInTheDocument();
  });

  test('displays error ID when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/error id:/i)).toBeInTheDocument();
    expect(screen.getByText('test-error-id-123')).toBeInTheDocument();
  });

  test('calls error logger when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(errorLogger.logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  test('calls custom onError handler when provided', () => {
    const mockOnError = jest.fn();

    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  test('provides Try Again button that resets error state', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Wait for error state
    await waitFor(
      () => {
        const errorElements = screen.getAllByText((_, element) => {
          return (
            element?.textContent?.includes('Something went wrong') ?? false
          );
        });
        expect(errorElements.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );

    // Click Try Again
    const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
    await user.click(tryAgainButton);

    // Re-render without error
    rerender(
      <ErrorBoundary>
        <div>No error thrown</div>
      </ErrorBoundary>
    );

    // Wait for the error state to be reset and normal content to appear
    await waitFor(
      () => {
        const successElements = screen.getAllByText((_, element) => {
          return element?.textContent?.includes('No error thrown') ?? false;
        });
        expect(successElements.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  test('provides Reload Page and Go to Home buttons', () => {
    // Mock window methods
    Object.defineProperty(window, 'location', {
      value: {
        reload: jest.fn(),
        href: '',
      },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Reload Page')).toBeInTheDocument();
    expect(screen.getByText('Go to Home')).toBeInTheDocument();
  });

  test('uses custom fallback component when provided', () => {
    const CustomFallback: React.FC = () => <div>Custom error fallback</div>;

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  test('applies isolation wrapper when isolate prop is true', () => {
    const { container } = render(
      <ErrorBoundary isolate={true}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(
      container.querySelector('.error-boundary-isolate')
    ).toBeInTheDocument();
  });

  test('shows technical details in development mode', () => {
    // Set NODE_ENV to development
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/technical details/i)).toBeInTheDocument();

    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });
});
