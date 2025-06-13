/**
 * Test suite for LoadingSpinner component
 * Tests different sizes, colors, and accessibility features
 */
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('loading-spinner');
    expect(spinner).toHaveClass('spinner-medium');
    expect(spinner).toHaveClass('spinner-primary');
  });

  test('renders with custom size', () => {
    render(<LoadingSpinner size="large" />);

    const spinner = screen.getByRole('progressbar');
    expect(spinner).toHaveClass('spinner-large');
  });

  test('renders with custom color', () => {
    render(<LoadingSpinner color="secondary" />);

    const spinner = screen.getByRole('progressbar');
    expect(spinner).toHaveClass('spinner-secondary');
  });

  test('renders with message', () => {
    render(<LoadingSpinner message="Loading data..." />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Loading data...'
    );
  });

  test('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);

    const container = screen.getByRole('progressbar').parentElement;
    expect(container).toHaveClass('loading-spinner-container');
    expect(container).toHaveClass('custom-class');
  });
});
