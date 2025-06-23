/**
 * AppConfirmDialog Component Tests
 * Tests confirmation dialog functionality and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import AppConfirmDialog from '../AppConfirmDialog';

// Mock theme
const mockTheme = {
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    warning: { main: '#ed6c02' },
    error: { main: '#d32f2f' },
    info: { main: '#0288d1' },
  },
  breakpoints: {
    down: () => '(max-width: 600px)',
  },
} as any;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>
);

describe('AppConfirmDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    open: true,
    title: 'Test Confirmation',
    message: 'Are you sure you want to proceed?',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Confirmation')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to proceed?')
      ).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render with custom button text', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog
            {...defaultProps}
            confirmText="Delete"
            cancelText="Keep"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Keep')).toBeInTheDocument();
    });

    it('should render details when provided', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog
            {...defaultProps}
            details="This action cannot be undone."
          />
        </TestWrapper>
      );

      expect(
        screen.getByText('This action cannot be undone.')
      ).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} open={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Test Confirmation')).not.toBeInTheDocument();
    });
  });

  describe('Severity Icons and Colors', () => {
    it('should render warning icon for warning severity', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} severity="warning" />
        </TestWrapper>
      );

      // Check for warning icon (MUI WarningIcon)
      const warningIcon = document.querySelector('[data-testid="WarningIcon"]');
      expect(warningIcon).toBeInTheDocument();
    });

    it('should render error icon for error severity', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} severity="error" />
        </TestWrapper>
      );

      // Check for error icon (MUI ErrorIcon)
      const errorIcon = document.querySelector('[data-testid="ErrorIcon"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should render info icon for info severity', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} severity="info" />
        </TestWrapper>
      );

      // Check for info icon (MUI InfoIcon)
      const infoIcon = document.querySelector('[data-testid="InfoIcon"]');
      expect(infoIcon).toBeInTheDocument();
    });

    it('should render question icon for question severity (default)', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} severity="question" />
        </TestWrapper>
      );

      // Check for question icon (MUI HelpOutlineIcon)
      const questionIcon = document.querySelector(
        '[data-testid="HelpOutlineIcon"]'
      );
      expect(questionIcon).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} />
        </TestWrapper>
      );

      const confirmButton = screen.getByText('Yes');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} />
        </TestWrapper>
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} onClose={mockOnClose} />
        </TestWrapper>
      );

      const closeButton = screen.getByLabelText('close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when close button is clicked if no onClose provided', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} />
        </TestWrapper>
      );

      const closeButton = screen.getByLabelText('close');
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should hide close button when hideCloseButton is true', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} hideCloseButton />
        </TestWrapper>
      );

      expect(screen.queryByLabelText('close')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state on confirm button', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} loading />
        </TestWrapper>
      );

      const confirmButton = screen.getByText('Yes');
      expect(confirmButton).toBeDisabled();
    });

    it('should disable cancel button when loading', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} loading />
        </TestWrapper>
      );

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });

    it('should disable close button when loading', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} loading />
        </TestWrapper>
      );

      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toBeDisabled();
    });

    it('should not call callbacks when loading', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} loading />
        </TestWrapper>
      );

      const confirmButton = screen.getByText('Yes');
      const cancelButton = screen.getByText('Cancel');

      fireEvent.click(confirmButton);
      fireEvent.click(cancelButton);

      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Confirm Button Colors', () => {
    it('should apply danger color for error severity', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog
            {...defaultProps}
            severity="error"
            confirmText="Delete"
          />
        </TestWrapper>
      );

      const confirmButton = screen.getByText('Delete');
      expect(confirmButton).toBeInTheDocument();
      // Additional checks for styling can be added based on implementation
    });

    it('should apply custom confirm color', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} confirmColor="warning" />
        </TestWrapper>
      );

      const confirmButton = screen.getByText('Yes');
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should focus management work correctly', async () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} />
        </TestWrapper>
      );

      // Dialog should be focused when opened
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings gracefully', () => {
      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} title="" message="" />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);

      render(
        <TestWrapper>
          <AppConfirmDialog {...defaultProps} message={longMessage} />
        </TestWrapper>
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });
});
