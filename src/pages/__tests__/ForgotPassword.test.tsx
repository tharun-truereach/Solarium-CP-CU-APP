/**
 * Test suite for ForgotPasswordPage component
 * Tests form functionality, validation, API integration, and error handling
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ForgotPasswordPage from '../auth/ForgotPasswordPage';
import { theme } from '../../theme';
import { store } from '../../store';

// Mock the password reset mutation
const mockRequestPasswordReset = vi.fn();
const mockRequestPasswordResetWithUnwrap = vi.fn(() => ({
  unwrap: mockRequestPasswordReset,
}));

vi.mock('../../api/endpoints/authEndpoints', () => ({
  useRequestPasswordResetMutation: () => [
    mockRequestPasswordResetWithUnwrap,
    { isLoading: false },
  ],
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithProviders = () => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestPasswordReset.mockReset();
    mockRequestPasswordResetWithUnwrap.mockReset();
    mockRequestPasswordResetWithUnwrap.mockReturnValue({
      unwrap: mockRequestPasswordReset,
    });
  });

  describe('Rendering', () => {
    it('renders the forgot password form', () => {
      renderWithProviders();

      expect(
        screen.getByRole('heading', { name: /reset password/i })
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/email address for password reset/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /send reset link/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /back to login/i })
      ).toBeInTheDocument();
    });

    // Note: Focus testing skipped as it's not reliable in jsdom environment
    // The focus functionality is tested in the component but not in unit tests
  });

  describe('Form Validation', () => {
    it('shows error for empty email', async () => {
      renderWithProviders();

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      expect(mockRequestPasswordResetWithUnwrap).not.toHaveBeenCalled();
    });

    it('shows error for invalid email format', async () => {
      renderWithProviders();

      const emailInput = screen.getByLabelText(
        /email address for password reset/i
      );
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid email address')
        ).toBeInTheDocument();
      });

      expect(mockRequestPasswordResetWithUnwrap).not.toHaveBeenCalled();
    });

    it('shows error for email too long', async () => {
      renderWithProviders();

      const longEmail = 'a'.repeat(250) + '@example.com'; // > 255 chars
      const emailInput = screen.getByLabelText(
        /email address for password reset/i
      );
      fireEvent.change(emailInput, { target: { value: longEmail } });

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Email must be less than 255 characters')
        ).toBeInTheDocument();
      });

      expect(mockRequestPasswordResetWithUnwrap).not.toHaveBeenCalled();
    });

    it('clears validation errors when user starts typing', async () => {
      renderWithProviders();

      // Trigger validation error
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      // Start typing to clear error
      const emailInput = screen.getByLabelText(
        /email address for password reset/i
      );
      fireEvent.change(emailInput, { target: { value: 't' } });

      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid email', async () => {
      mockRequestPasswordReset.mockResolvedValue({});
      renderWithProviders();

      const emailInput = screen.getByLabelText(
        /email address for password reset/i
      );
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRequestPasswordResetWithUnwrap).toHaveBeenCalledWith({
          email: 'test@example.com',
        });
      });
    });

    it('shows success message after successful submission', async () => {
      mockRequestPasswordReset.mockResolvedValue({});
      renderWithProviders();

      const emailInput = screen.getByLabelText(
        /email address for password reset/i
      );
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reset link sent/i)).toBeInTheDocument();
        expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
      });
    });

    it('clears form after successful submission', async () => {
      mockRequestPasswordReset.mockResolvedValue({});
      renderWithProviders();

      const emailInput = screen.getByLabelText(
        /email address for password reset/i
      );
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveValue('');
      });
    });

    it('shows error message on API failure', async () => {
      mockRequestPasswordReset.mockRejectedValue({
        data: { message: 'Server error' },
      });
      renderWithProviders();

      const emailInput = screen.getByLabelText(
        /email address for password reset/i
      );
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });

    it('trims and lowercases email before submission', async () => {
      mockRequestPasswordReset.mockResolvedValue({});
      renderWithProviders();

      const emailInput = screen.getByLabelText(
        /email address for password reset/i
      );
      fireEvent.change(emailInput, {
        target: { value: '  TEST@EXAMPLE.COM  ' },
      });

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRequestPasswordResetWithUnwrap).toHaveBeenCalledWith({
          email: 'test@example.com',
        });
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back to login when back button is clicked', () => {
      renderWithProviders();

      const backButton = screen.getByRole('button', { name: /back to login/i });
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('navigates to contact support when contact link is clicked', () => {
      renderWithProviders();

      const contactLink = screen.getByLabelText(/contact support/i);
      fireEvent.click(contactLink);

      expect(mockNavigate).toHaveBeenCalledWith('/contact');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders();

      expect(
        screen.getByRole('form', { name: /forgot password form/i })
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/email address for password reset/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /send reset link/i })
      ).toBeInTheDocument();
    });

    it('focuses error alert when error occurs', async () => {
      mockRequestPasswordReset.mockRejectedValue({
        data: { message: 'Server error' },
      });
      renderWithProviders();

      const emailInput = screen.getByLabelText(
        /email address for password reset/i
      );
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveFocus();
      });
    });

    it('focuses success alert when success occurs', async () => {
      mockRequestPasswordReset.mockResolvedValue({});
      renderWithProviders();

      const emailInput = screen.getByLabelText(
        /email address for password reset/i
      );
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const successAlert = screen.getByRole('alert');
        expect(successAlert).toHaveFocus();
      });
    });
  });
});
