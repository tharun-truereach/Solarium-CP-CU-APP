/**
 * Test suite for LoadingContext
 * Tests loading state management and methods
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LoadingProvider, useLoading } from './LoadingContext';

const TestComponent = () => {
  const { loading, startLoading, stopLoading, isGlobalLoading } = useLoading();

  return (
    <div>
      <div data-testid="loading-state">
        {loading.isLoading ? 'Loading' : 'Not Loading'}
      </div>
      <div data-testid="global-loading">
        {isGlobalLoading ? 'Global Loading' : 'Not Global Loading'}
      </div>
      <div data-testid="loading-message">
        {loading.loadingMessage || 'No Message'}
      </div>
      <div data-testid="loading-type">{loading.loadingType || 'No Type'}</div>
      <button onClick={() => startLoading('Test message', 'data')}>
        Start Loading
      </button>
      <button onClick={stopLoading}>Stop Loading</button>
    </div>
  );
};

describe('LoadingContext', () => {
  test('provides initial state', () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    expect(screen.getByTestId('loading-state')).toHaveTextContent(
      'Not Loading'
    );
    expect(screen.getByTestId('global-loading')).toHaveTextContent(
      'Not Global Loading'
    );
    expect(screen.getByTestId('loading-message')).toHaveTextContent(
      'No Message'
    );
  });

  test('startLoading updates state correctly', () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Start Loading'));
    });

    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    expect(screen.getByTestId('loading-message')).toHaveTextContent(
      'Test message'
    );
    expect(screen.getByTestId('loading-type')).toHaveTextContent('data');
  });

  test('stopLoading updates state correctly', () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Start Loading'));
    });

    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');

    act(() => {
      fireEvent.click(screen.getByText('Stop Loading'));
    });

    expect(screen.getByTestId('loading-state')).toHaveTextContent(
      'Not Loading'
    );
  });

  test('isGlobalLoading works correctly', () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    // Start with global type
    act(() => {
      fireEvent.click(screen.getByText('Start Loading'));
    });

    // Should not be global loading since we started with 'data' type
    expect(screen.getByTestId('global-loading')).toHaveTextContent(
      'Not Global Loading'
    );
  });

  test('throws error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    });

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useLoading must be used within a LoadingProvider');

    consoleError.mockRestore();
  });
});
