/**
 * Test suite for ResetPasswordPage component
 * Tests form functionality, validation, API integration, and error handling
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ResetPasswordPage from '../auth/ResetPasswordPage';
import { theme } from '../../theme';
import { store } from '../../store';

// Mock the password reset mutation
const mockConfirmPasswordReset = vi.fn();
vi.mock('../../api/endpoints/authEndpoints', () => ({
  useConfirmPasswordResetMutation: () => [
    mockConfirmPasswordReset,
    { isLoading: false },
  ],
}));

// Mock navigation and search params
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

const renderWithProviders = () => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ResetPasswordPage />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirmPasswordReset.mockReset();
    mockSearchParams.set('token', 'valid-reset-token');
  });

  describe('Rendering', () => {
    it('renders the reset password form with token', () => {
      renderWithProviders();

      expect(
        screen.getByRole('heading', { name: /set new password/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/confirm new password/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /reset password/i })
      ).toBeInTheDocument();
    });

    it('shows error when no token is provided', () => {
      mockSearchParams.delete('token');
      renderWithProviders();

      expect(
        screen.getByText(/invalid or missing reset token/i)
      ).toBeInTheDocument();
    });

    it('focuses password input on mount when token is valid', () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      expect(passwordInput).toHaveFocus();
    });
  });

  describe('Password Validation', () => {
    it('shows error for empty passwords', async () => {
      renderWithProviders();

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('New password is required')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Please confirm your password')
        ).toBeInTheDocument();
      });

      expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
    });

    it('shows password strength indicator', async () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'weak' } });

      await waitFor(() => {
        expect(screen.getByText(/password strength/i)).toBeInTheDocument();
        expect(
          screen.getByText(/must be at least 8 characters long/i)
        ).toBeInTheDocument();
      });
    });

    it('validates password strength requirements', async () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'weakpass' } });

      await waitFor(() => {
        expect(
          screen.getByText(/must contain at least one uppercase letter/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/must contain at least one number/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/must contain at least one special character/i)
        ).toBeInTheDocument();
      });
    });

    it('shows error when passwords do not match', async () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, {
        target: { value: 'DifferentPass123!' },
      });

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
    });

    it('enables submit button only with valid strong password', async () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      // Initially disabled
      expect(submitButton).toBeDisabled();

      // Enter strong password
      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid passwords and token', async () => {
      mockConfirmPasswordReset.mockResolvedValue({});
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockConfirmPasswordReset).toHaveBeenCalledWith({
          token: 'valid-reset-token',
          newPassword: 'StrongPass123!',
          confirmPassword: 'StrongPass123!',
        });
      });
    });

    it('shows success message after successful reset', async () => {
      mockConfirmPasswordReset.mockResolvedValue({});
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password reset successfully/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/redirecting to login page/i)
        ).toBeInTheDocument();
      });
    });

    it('redirects to login after successful reset', async () => {
      mockConfirmPasswordReset.mockResolvedValue({});
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      fireEvent.click(submitButton);

      // Wait for the timeout to trigger navigation
      await new Promise(resolve => setTimeout(resolve, 3100));

      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: {
          message:
            'Password reset successfully. Please log in with your new password.',
        },
      });
    });

    it('shows error message on API failure', async () => {
      mockConfirmPasswordReset.mockRejectedValue({
        data: { message: 'Invalid or expired token' },
      });
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Invalid or expired token')
        ).toBeInTheDocument();
      });
    });

    it('clears form after successful submission', async () => {
      mockConfirmPasswordReset.mockResolvedValue({});
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(passwordInput).toHaveValue('');
        expect(confirmInput).toHaveValue('');
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility', () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      const toggleButton = screen.getByLabelText(/show password/i);

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('toggles confirm password visibility independently', () => {
      renderWithProviders();

      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const toggleButton = screen.getByLabelText(/show password confirmation/i);

      expect(confirmInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);
      expect(confirmInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders();

      expect(
        screen.getByRole('form', { name: /reset password form/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/confirm new password/i)
      ).toBeInTheDocument();
    });

    it('focuses error alert when error occurs', async () => {
      mockConfirmPasswordReset.mockRejectedValue({
        data: { message: 'Server error' },
      });
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveFocus();
      });
    });

    it('has proper password strength indicators', async () => {
      renderWithProviders();

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });

      await waitFor(() => {
        expect(
          screen.getByLabelText(/password strength: 4 out of 4/i)
        ).toBeInTheDocument();
      });
    });
  });
});
