/**
 * Unit tests for PlaceholderCard component
 * Tests rendering, props handling, and accessibility
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import PlaceholderCard from '../PlaceholderCard';
import { theme } from '../../../theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('PlaceholderCard', () => {
  it('renders with required title', () => {
    renderWithTheme(<PlaceholderCard title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Coming soon...')).toBeInTheDocument();
  });

  it('renders with title and subtitle', () => {
    renderWithTheme(
      <PlaceholderCard title="Test Title" subtitle="Test Subtitle" />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Coming soon...')).toBeInTheDocument();
  });

  it('applies custom minHeight', () => {
    const { container } = renderWithTheme(
      <PlaceholderCard title="Test" minHeight={300} />
    );

    const card =
      container.querySelector('[role="img"]')?.parentElement?.parentElement;
    expect(card).toHaveStyle('min-height: 300px');
  });

  it('uses default minHeight when not specified', () => {
    const { container } = renderWithTheme(<PlaceholderCard title="Test" />);

    const card =
      container.querySelector('[role="img"]')?.parentElement?.parentElement;
    expect(card).toHaveStyle('min-height: 200px');
  });

  it('renders construction icon', () => {
    renderWithTheme(<PlaceholderCard title="Test" />);

    const icon =
      screen.getByTestId('ConstructionIcon') ||
      screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme(
      <PlaceholderCard title="Test Widget" subtitle="Test Description" />
    );

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Test Widget');
  });

  it('handles empty subtitle gracefully', () => {
    renderWithTheme(<PlaceholderCard title="Test" subtitle="" />);

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Coming soon...')).toBeInTheDocument();
  });

  it('applies hover styles correctly', () => {
    const { container } = renderWithTheme(<PlaceholderCard title="Test" />);

    const card = container.firstChild;
    expect(card).toHaveStyle('transition: all 0.2s ease-in-out');
  });
});
