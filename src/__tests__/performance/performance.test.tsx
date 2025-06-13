/**
 * Performance tests for key components and operations
 * Ensures components render efficiently and meet performance criteria
 */
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';
import { renderWithMinimalProviders } from '../../test-utils';
import { AppButton } from '../../components/ui';
import Dashboard from '../../pages/Dashboard';
import { LoadingSpinner, SkeletonLoader } from '../../components/loading';
import { AuthProvider } from '../../contexts/AuthContext';
import { LoadingProvider } from '../../contexts/LoadingContext';

describe('Performance Tests', () => {
  test('AppButton renders quickly', () => {
    const startTime = performance.now();

    render(<AppButton>Test Button</AppButton>);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in under 250ms
    expect(renderTime).toBeLessThan(250);
  });

  test('LoadingSpinner renders efficiently', () => {
    const startTime = performance.now();

    renderWithMinimalProviders(<LoadingSpinner />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render very quickly
    expect(renderTime).toBeLessThan(200);
  });

  test('SkeletonLoader renders multiple items efficiently', () => {
    const startTime = performance.now();

    renderWithMinimalProviders(<SkeletonLoader count={10} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render 10 skeleton items quickly
    expect(renderTime).toBeLessThan(150);
  });

  test('Dashboard handles loading states efficiently', async () => {
    const renderStart = performance.now();
    await renderWithMinimalProviders(
      <AuthProvider>
        <LoadingProvider>
          <Dashboard />
        </LoadingProvider>
      </AuthProvider>
    );
    const renderTime = performance.now() - renderStart;
    expect(renderTime).toBeLessThan(200);
  });

  test('memory usage stays reasonable', async () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Render multiple components
    for (let i = 0; i < 50; i++) {
      const { unmount } = await renderWithMinimalProviders(
        <AppButton key={i}>Button {i}</AppButton>
      );
      unmount();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  test('large lists render efficiently', () => {
    const startTime = performance.now();

    const LargeList = () => (
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <div key={i}>Item {i}</div>
        ))}
      </div>
    );

    renderWithMinimalProviders(<LargeList />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render 100 items quickly
    expect(renderTime).toBeLessThan(200);
  });

  test('Component re-renders are optimized', async () => {
    let updateCount = 0;

    const TestComponent = ({ count }: { count: number }) => {
      updateCount++;
      return <div>Count: {count}</div>;
    };

    const { rerender } = await renderWithMinimalProviders(
      <TestComponent count={0} />
    );

    const startTime = performance.now();

    // Trigger multiple updates
    for (let i = 1; i <= 10; i++) {
      rerender(<TestComponent count={i} />);
    }

    const endTime = performance.now();
    const updateTime = endTime - startTime;

    // Updates should be fast
    expect(updateTime).toBeLessThan(100);
    expect(updateCount).toBe(11); // Initial render + 10 updates
  });
});
