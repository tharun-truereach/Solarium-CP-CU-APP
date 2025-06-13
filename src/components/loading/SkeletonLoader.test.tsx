/**
 * Test suite for SkeletonLoader component
 * Tests different variants, animations, and accessibility features
 */
import { render, screen } from '@testing-library/react';
import SkeletonLoader from './SkeletonLoader';

describe('SkeletonLoader', () => {
  test('renders single skeleton with default props', () => {
    render(<SkeletonLoader />);

    const skeleton = screen.getByRole('progressbar');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('skeleton');
    expect(skeleton).toHaveClass('skeleton-text');
    expect(skeleton).toHaveClass('skeleton-pulse');
  });

  test('renders multiple skeletons', () => {
    render(<SkeletonLoader count={3} />);

    const skeletons = screen.getAllByRole('progressbar');
    expect(skeletons).toHaveLength(3);
  });

  test('renders with different variants', () => {
    const { rerender } = render(<SkeletonLoader variant="rectangular" />);
    expect(screen.getByRole('progressbar')).toHaveClass('skeleton-rectangular');

    rerender(<SkeletonLoader variant="circular" />);
    expect(screen.getByRole('progressbar')).toHaveClass('skeleton-circular');
  });

  test('renders with different animations', () => {
    const { rerender } = render(<SkeletonLoader animation="wave" />);
    expect(screen.getByRole('progressbar')).toHaveClass('skeleton-wave');

    rerender(<SkeletonLoader animation="none" />);
    expect(screen.getByRole('progressbar')).toHaveClass('skeleton-none');
  });

  test('applies custom dimensions', () => {
    render(<SkeletonLoader width={200} height="50px" />);

    const skeleton = screen.getByRole('progressbar');
    expect(skeleton).toHaveStyle({
      width: '200px',
      height: '50px',
    });
  });
});
