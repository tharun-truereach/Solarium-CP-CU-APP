/**
 * Test suite for useLoadingState hook
 * Tests component-level loading state management
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoadingProvider } from '../contexts/LoadingContext';
import { useLoadingState } from './useLoadingState';

const TestComponent = ({
  globalLoading = false,
}: {
  globalLoading?: boolean;
}) => {
  const { isLoading, startLoading, stopLoading, withLoading } = useLoadingState(
    {
      globalLoading,
      loadingMessage: 'Test loading...',
    }
  );

  const handleWithLoading = () => {
    withLoading(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'Success';
    }, 'Async operation...');
  };

  return (
    <div>
      <div data-testid="loading-state">
        {isLoading ? 'Loading' : 'Not Loading'}
      </div>
      <button onClick={() => startLoading()}>Start Loading</button>
      <button onClick={stopLoading}>Stop Loading</button>
      <button onClick={handleWithLoading}>With Loading</button>
    </div>
  );
};

describe('useLoadingState', () => {
  test('manages local loading state', () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    expect(screen.getByTestId('loading-state')).toHaveTextContent(
      'Not Loading'
    );

    fireEvent.click(screen.getByText('Start Loading'));
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');

    fireEvent.click(screen.getByText('Stop Loading'));
    expect(screen.getByTestId('loading-state')).toHaveTextContent(
      'Not Loading'
    );
  });

  test('withLoading function works correctly', async () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    fireEvent.click(screen.getByText('With Loading'));

    // Should show loading during async operation
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');

    // Should stop loading after operation completes
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent(
        'Not Loading'
      );
    });
  });

  test('works with global loading option', () => {
    render(
      <LoadingProvider>
        <TestComponent globalLoading={true} />
      </LoadingProvider>
    );

    // With global loading, local state should always be false
    fireEvent.click(screen.getByText('Start Loading'));
    expect(screen.getByTestId('loading-state')).toHaveTextContent(
      'Not Loading'
    );
  });
});
