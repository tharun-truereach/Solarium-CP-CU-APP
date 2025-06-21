/**
 * Unit tests for QuickActionTile component
 * Tests rendering, interaction, and accessibility
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { People } from '@mui/icons-material';
import QuickActionTile from '../QuickActionTile';
import { theme } from '../../../theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('QuickActionTile', () => {
  const mockOnClick = jest.fn();
  const defaultProps = {
    label: 'Test Action',
    icon: <People />,
    onClick: mockOnClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with label and icon', () => {
    renderWithTheme(<QuickActionTile {...defaultProps} />);

    expect(screen.getByText('Test Action')).toBeInTheDocument();
    expect(
      screen.getByTestId('PeopleIcon') ||
        screen.getByRole('img', { hidden: true })
    ).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    renderWithTheme(<QuickActionTile {...defaultProps} />);

    const button = screen.getByRole('button', { name: /test action/i });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('is accessible as a button', () => {
    renderWithTheme(<QuickActionTile {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAccessibleName('Test Action');
  });

  it('is full width by default', () => {
    renderWithTheme(<QuickActionTile {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle('width: 100%');
  });

  it('applies custom props', () => {
    renderWithTheme(
      <QuickActionTile {...defaultProps} disabled data-testid="custom-tile" />
    );

    const button = screen.getByTestId('custom-tile');
    expect(button).toBeDisabled();
  });

  it('has proper styling classes', () => {
    renderWithTheme(<QuickActionTile {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle('text-transform: none');
    expect(button).toHaveStyle('justify-content: flex-start');
  });

  it('handles keyboard navigation', () => {
    renderWithTheme(<QuickActionTile {...defaultProps} />);

    const button = screen.getByRole('button');
    button.focus();

    expect(button).toHaveFocus();

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('prevents onClick when disabled', () => {
    renderWithTheme(<QuickActionTile {...defaultProps} disabled />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
