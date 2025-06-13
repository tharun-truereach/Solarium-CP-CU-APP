/**
 * Test suite for FeatureErrorBoundary component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeatureErrorBoundary from './FeatureErrorBoundary';

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = true,
}) => {
  if (shouldThrow) {
    throw new Error('Feature test error');
  }
  return <div>Feature working correctly</div>;
};

// Mock console methods
beforeAll(() => {
  console.error = jest.fn();
});

describe('FeatureErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when there is no error', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ThrowError shouldThrow={false} />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText(/Feature working correctly/i)).toBeInTheDocument();
  });

  test('renders feature-specific error message when error occurs', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ThrowError />
      </FeatureErrorBoundary>
    );

    expect(
      screen.getByText('Test Feature is temporarily unavailable')
    ).toBeInTheDocument();
  });

  test('displays custom fallback message when provided', () => {
    const customMessage =
      'This feature is being updated. Please check back later.';

    render(
      <FeatureErrorBoundary
        featureName="Test Feature"
        fallbackMessage={customMessage}
      >
        <ThrowError />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('provides Try Again functionality', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ThrowError />
      </FeatureErrorBoundary>
    );

    // Wait for error state
    await waitFor(
      () => {
        const errorElements = screen.getAllByText((_, element) => {
          return (
            element?.textContent?.includes(
              'Test Feature is temporarily unavailable'
            ) ?? false
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
      <FeatureErrorBoundary featureName="Test Feature">
        <div>Feature working correctly</div>
      </FeatureErrorBoundary>
    );

    // Wait for the error state to be reset and normal content to appear
    await waitFor(
      () => {
        const successElements = screen.getAllByText((_, element) => {
          return (
            element?.textContent?.includes('Feature working correctly') ?? false
          );
        });
        expect(successElements.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });
});
