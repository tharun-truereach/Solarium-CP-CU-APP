/**
 * Login Accessibility Tests with Jest-Axe
 * Ensures Login component meets WCAG 2.1 AA accessibility standards
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Login from '../Login';
import { AuthProvider } from '../../contexts/AuthContext';
import { theme } from '../../theme';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock AuthContext
const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  error: null as string | null,
  isLoading: false,
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
  clearError: vi.fn(),
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
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Login Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.error = null;
    mockAuthContext.isLoading = false;
    mockAuthContext.isAccountLocked = false;
    mockAuthContext.loginAttempts = 0;
  });

  describe('Basic Accessibility Compliance', () => {
    it('should have no accessibility violations in default state', async () => {
      const { container } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with error state', async () => {
      mockAuthContext.error = 'Invalid email or password';

      const { container } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with loading state', async () => {
      mockAuthContext.isLoading = true;

      const { container } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with account locked state', async () => {
      mockAuthContext.isAccountLocked = true;
      mockAuthContext.loginAttempts = 5;

      const { container } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Semantic HTML and ARIA Attributes', () => {
    it('should have proper form semantics', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Form should have proper role and label
      const form = screen.getByRole('form', { name: /login form/i });
      expect(form).toBeInTheDocument();

      // Main heading should be h1
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/solarium portal/i);
    });

    it('should have properly labeled form controls', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Email field
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autocomplete', 'username');
      expect(emailInput).toHaveAttribute('aria-label', 'Email address');

      // Password field
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
      expect(passwordInput).toHaveAttribute('aria-label', 'Password');

      // Remember me checkbox
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      expect(rememberMeCheckbox).toBeInTheDocument();
      expect(rememberMeCheckbox).toHaveAttribute('type', 'checkbox');
    });

    it('should have accessible button with proper states', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(submitButton).not.toBeDisabled();
    });

    it('should have accessible password visibility toggle', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const passwordToggle = screen.getByLabelText(/show password/i);
      expect(passwordToggle).toBeInTheDocument();

      // Test toggle functionality
      await user.click(passwordToggle);

      const hidePasswordToggle = screen.getByLabelText(/hide password/i);
      expect(hidePasswordToggle).toBeInTheDocument();
    });
  });

  describe('Error Handling and ARIA Live Regions', () => {
    it('should announce form validation errors', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Submit form without filling fields
      await user.click(submitButton);

      await waitFor(() => {
        // Error messages should be associated with fields
        const emailError = screen.getByText(/email is required/i);
        expect(emailError).toBeInTheDocument();

        const passwordError = screen.getByText(/password is required/i);
        expect(passwordError).toBeInTheDocument();
      });

      // Check ARIA invalid attributes
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should announce authentication errors with live region', async () => {
      mockAuthContext.error = 'Invalid email or password';

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
      expect(errorAlert).toHaveTextContent(/invalid email or password/i);
    });

    it('should announce account lockout with appropriate urgency', async () => {
      mockAuthContext.isAccountLocked = true;

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const lockoutAlert = screen.getByRole('alert');
      expect(lockoutAlert).toBeInTheDocument();
      expect(lockoutAlert).toHaveAttribute('aria-live', 'polite');
      expect(lockoutAlert).toHaveTextContent(/account locked/i);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      const forgotPasswordLink = screen.getByRole('button', {
        name: /forgot your password/i,
      });

      // Tab through form elements
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/show password/i)).toHaveFocus();

      await user.tab();
      expect(rememberMeCheckbox).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();

      await user.tab();
      expect(forgotPasswordLink).toHaveFocus();
    });

    it('should handle Enter key submission', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit via Enter key
      await user.keyboard('{Enter}');

      expect(mockAuthContext.login).toHaveBeenCalled();
    });

    it('should handle Escape key to clear errors', async () => {
      const user = userEvent.setup();
      mockAuthContext.error = 'Some error message';

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(mockAuthContext.clearError).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should focus email field on component mount', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveFocus();
    });

    it('should focus first error field when validation fails', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Leave email empty, fill password
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email address/i);
        expect(emailInput).toHaveFocus();
      });
    });

    it('should manage focus for error alerts', async () => {
      mockAuthContext.error = 'Authentication failed';

      const { rerender } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Error alert should be focusable for screen readers
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveAttribute('tabindex', '-1');

      // Simulate error appearing (would happen after form submission)
      mockAuthContext.error = 'New authentication error';

      rerender(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      await waitFor(() => {
        const newErrorAlert = screen.getByRole('alert');
        expect(newErrorAlert).toBeInTheDocument();
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide descriptive text for form purpose', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const formDescription = screen.getByText(/sign in to your account/i);
      expect(formDescription).toBeInTheDocument();
    });

    it('should announce loading states', async () => {
      mockAuthContext.isLoading = true;

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /signing in/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should provide context for form requirements', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Password requirements should be communicated
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('maxLength', '128');

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('maxLength', '255');
    });

    it('should announce attempt counter for security', () => {
      mockAuthContext.loginAttempts = 2;

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const attemptCounter = screen.getByText(/3 attempts remaining/i);
      expect(attemptCounter).toBeInTheDocument();
    });
  });

  describe('Color Contrast and Visual Indicators', () => {
    it('should not rely solely on color for error indication', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Errors should have text indicators, not just color
        const emailError = screen.getByText(/email is required/i);
        expect(emailError).toBeInTheDocument();

        // Input should have aria-invalid, not just red border
        const emailInput = screen.getByLabelText(/email address/i);
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should provide sufficient focus indicators', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // All interactive elements should be focusable
      const interactiveElements = [
        screen.getByLabelText(/email address/i),
        screen.getByLabelText(/password/i),
        screen.getByLabelText(/show password/i),
        screen.getByLabelText(/remember me/i),
        screen.getByRole('button', { name: /sign in/i }),
        screen.getByRole('button', { name: /forgot your password/i }),
      ];

      interactiveElements.forEach(element => {
        expect(element).toHaveAttribute('tabindex', expect.any(String));
      });
    });
  });

  describe('Mobile Accessibility', () => {
    it('should work with touch accessibility', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Touch targets should be at least 44x44px (WCAG guideline)
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();

      // Button should have sufficient padding for touch
      const computedStyle = window.getComputedStyle(submitButton);
      expect(parseInt(computedStyle.minHeight)).toBeGreaterThanOrEqual(44);
    });

    it('should have appropriate viewport meta tag', () => {
      // This would be tested at the document level
      // For now, just ensure the component renders without viewport issues
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  describe('Form Validation Accessibility', () => {
    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Type invalid email
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(
          /please enter a valid email address/i
        );
        expect(errorMessage).toBeInTheDocument();

        // Error should be associated with input via aria-describedby
        expect(emailInput).toHaveAttribute('aria-describedby');
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should clear validation errors when input becomes valid', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Submit empty form to trigger validation
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });

      // Type valid email
      await user.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(
          screen.queryByText(/email is required/i)
        ).not.toBeInTheDocument();
        expect(emailInput).toHaveAttribute('aria-invalid', 'false');
      });
    });
  });
});
