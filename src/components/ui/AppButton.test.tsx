/**
 * Test suite for AppButton component
 * Tests different variants, loading states, and interactions
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import AppButton from './AppButton';
import { theme } from '../../theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('AppButton', () => {
  test('renders with default props', () => {
    renderWithTheme(<AppButton>Click me</AppButton>);

    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    renderWithTheme(<AppButton onClick={handleClick}>Click me</AppButton>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    renderWithTheme(<AppButton loading>Loading</AppButton>);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('renders different variants', () => {
    const { rerender } = renderWithTheme(
      <AppButton variant="primary">Primary</AppButton>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <AppButton variant="secondary">Secondary</AppButton>
      </ThemeProvider>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <AppButton variant="outline">Outline</AppButton>
      </ThemeProvider>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('renders with icons', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;

    renderWithTheme(
      <AppButton icon={<TestIcon />} iconPosition="start">
        With Icon
      </AppButton>
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  test('disables button when disabled prop is true', () => {
    renderWithTheme(<AppButton disabled>Disabled</AppButton>);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
