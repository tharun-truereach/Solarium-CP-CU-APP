/**
 * Unit tests for NotificationBadge component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NotificationBadge from '../NotificationBadge';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('NotificationBadge', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('should render with zero count hidden by default', () => {
    renderWithTheme(
      <NotificationBadge unreadCount={0} onClick={mockOnClick} />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should show badge when unread count is greater than 0', () => {
    renderWithTheme(
      <NotificationBadge unreadCount={5} onClick={mockOnClick} />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show 99+ for counts over maxCount', () => {
    renderWithTheme(
      <NotificationBadge
        unreadCount={150}
        onClick={mockOnClick}
        maxCount={99}
      />
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    renderWithTheme(
      <NotificationBadge unreadCount={3} onClick={mockOnClick} />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithTheme(
      <NotificationBadge unreadCount={3} onClick={mockOnClick} disabled />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should show loading state', () => {
    renderWithTheme(
      <NotificationBadge unreadCount={3} onClick={mockOnClick} isLoading />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('Mui-disabled');
  });

  it('should show zero count when showZeroCount is true', () => {
    renderWithTheme(
      <NotificationBadge unreadCount={0} onClick={mockOnClick} showZeroCount />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
