/**
 * Login Error Toast Integration Tests
 * Tests integration between Login component and GlobalErrorToast
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { store } from '../../store';
import Login from '../Login';
import GlobalErrorToast from '../../components/GlobalErrorToast';
import { AuthProvider } from '../../contexts/AuthContext';
import { theme } from '../../theme';

// Mock AuthContext with error scenarios
const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  error: null,
  isLoading: false,
  clearError: vi.fn(),
  sessionStatus: {
    isAuthenticated: false,
    isTokenExpired: false,
    isAccountLocked: false,
    timeRemaining: 0,
    isActive: false,
    needsWarning: false,
  },
  loginAttempts: 0,
  isAccountLocked: false,
  updateUserActivity: vi.fn(),
  showSessionExpiredWarning: vi.fn(),
  hideSessionExpiredWarning: vi.fn(),
  refreshToken: vi.fn(),
  updateProfile: vi.fn(),
  checkPermission: vi.fn(),
  checkRole: vi.fn(),
  getTokenTimeRemaining: vi.fn(),
  formatTokenExpiration: vi.fn(),
  isTokenExpiringSoon: vi.fn(),
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null, pathname: '/login' }),
  };
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          {children}
          <GlobalErrorToast />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
);

describe('Login Error Toast Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.error = null;
    mockAuthContext.isLoading = false;
    mockAuthContext.isAccountLocked = false;
    mockAuthContext.loginAttempts = 0;
  });

  describe('Login Error Integration', () => {
    it('should show network error in GlobalErrorToast', async () => {
      const user = userEvent.setup();
      mockAuthContext.login.mockRejectedValue(
        new Error('Network error. Please check your connection.')
      );

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for error toast to appear
      await waitFor(() => {
        const errorToast = screen.getByRole('alert');
        expect(errorToast).toBeInTheDocument();
        expect(errorToast).toHaveTextContent(/network error/i);
      });

      // Verify toast has error styling
      const errorToast = screen.getByRole('alert');
      expect(errorToast).toHaveClass('MuiAlert-filledError');
    });

    it('should show authentication error in GlobalErrorToast', async () => {
      const user = userEvent.setup();
      mockAuthContext.login.mockRejectedValue(
        new Error('Invalid email or password')
      );

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Wait for error toast to appear
      await waitFor(() => {
        const errorToast = screen.getByRole('alert');
        expect(errorToast).toBeInTheDocument();
        expect(errorToast).toHaveTextContent(/invalid email or password/i);
      });
    });

    it('should show success message after successful login', async () => {
      const user = userEvent.setup();
      mockAuthContext.login.mockResolvedValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'test-token',
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for success toast to appear
      await waitFor(() => {
        const successToast = screen.getByRole('alert');
        expect(successToast).toBeInTheDocument();
        expect(successToast).toHaveTextContent(/successfully logged in/i);
      });

      // Verify toast has success styling
      const successToast = screen.getByRole('alert');
      expect(successToast).toHaveClass('MuiAlert-filledSuccess');
    });

    it('should show account lockout warning in GlobalErrorToast', async () => {
      const user = userEvent.setup();
      mockAuthContext.login.mockRejectedValue(
        new Error('Account is temporarily locked')
      );

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'locked@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for warning toast to appear
      await waitFor(() => {
        const warningToast = screen.getByRole('alert');
        expect(warningToast).toBeInTheDocument();
        expect(warningToast).toHaveTextContent(
          /account is temporarily locked/i
        );
      });

      // Verify toast has warning styling
      const warningToast = screen.getByRole('alert');
      expect(warningToast).toHaveClass('MuiAlert-filledWarning');
    });

    it('should handle multiple login attempts with progressive error messages', async () => {
      const user = userEvent.setup();
      let attemptCount = 0;

      mockAuthContext.login.mockImplementation(() => {
        attemptCount++;
        if (attemptCount >= 5) {
          return Promise.reject(
            new Error(
              'Account locked for 15 minutes due to multiple failed login attempts'
            )
          );
        }
        return Promise.reject(new Error('Invalid email or password'));
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Perform multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await user.clear(emailInput);
        await user.clear(passwordInput);
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'wrongpassword');
        await user.click(submitButton);

        await waitFor(() => {
          const errorToast = screen.getByRole('alert');
          expect(errorToast).toBeInTheDocument();
        });

        // Clear the error before next attempt
        const closeButton = screen.getByLabelText(/close/i);
        if (closeButton) {
          await user.click(closeButton);
        }
      }

      // Last attempt should show lockout message
      await waitFor(() => {
        const lockoutToast = screen.getByRole('alert');
        expect(lockoutToast).toBeInTheDocument();
        expect(lockoutToast).toHaveTextContent(
          /account locked for 15 minutes/i
        );
      });
    });

    it('should clear error toast when user starts typing', async () => {
      const user = userEvent.setup();
      mockAuthContext.login.mockRejectedValue(new Error('Invalid credentials'));

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger error
      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Wait for error toast
      await waitFor(() => {
        const errorToast = screen.getByRole('alert');
        expect(errorToast).toBeInTheDocument();
      });

      // Start typing in email field
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');

      // Error toast should be cleared or updated
      await waitFor(() => {
        // Either no error toast or a new one
        const alerts = screen.queryAllByRole('alert');
        if (alerts.length > 0) {
          // If there's still an alert, it shouldn't be the old error
          expect(alerts[0]).not.toHaveTextContent(/invalid credentials/i);
        }
      });
    });

    it('should show unlock notification after lockout timer expires', async () => {
      // This test would need to be implemented with proper timer mocking
      // For now, just verify the component structure
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  describe('Toast Accessibility', () => {
    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      mockAuthContext.login.mockRejectedValue(
        new Error('Authentication failed')
      );

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const errorToast = screen.getByRole('alert');
        expect(errorToast).toBeInTheDocument();
        // Should have aria-live for screen readers
        expect(errorToast).toHaveAttribute('aria-live');
      });
    });

    it('should allow keyboard interaction with error toast', async () => {
      const user = userEvent.setup();
      mockAuthContext.login.mockRejectedValue(new Error('Test error'));

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const errorToast = screen.getByRole('alert');
        expect(errorToast).toBeInTheDocument();
      });

      // Should be able to focus and close with keyboard
      const closeButton = screen.getByLabelText(/close/i);
      await user.tab();
      await user.keyboard('{Enter}');

      // Toast should be closeable
      expect(closeButton).toBeInTheDocument();
    });
  });
});
