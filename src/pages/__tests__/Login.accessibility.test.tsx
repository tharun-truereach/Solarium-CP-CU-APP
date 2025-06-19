/**
 * Login Page Accessibility Tests
 * Ensures the login form meets WCAG 2.1 AA standards
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import Login from '../Login';
import { theme } from '../../theme';
import { store } from '../../store/store';
import { AuthProvider } from '../../contexts/AuthContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Configure axe for accessibility testing
const axe = configureAxe({
  rules: {
    // Disable color contrast rule for this test as it may vary
    'color-contrast': { enabled: false },
    // Ensure we test other important rules
    label: { enabled: true },
    'button-name': { enabled: true },
    'link-name': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'duplicate-id': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'keyboard-navigation': { enabled: true },
  },
});

const renderLoginWithProviders = (initialRoute = '/login') => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('Login Accessibility Tests', () => {
  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderLoginWithProviders();

      // Wait for component to fully render
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /solarium portal/i })
        ).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      renderLoginWithProviders();

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Solarium Portal');
    });

    it('should have properly labeled form controls', () => {
      renderLoginWithProviders();

      // Check email field
      const emailInput = screen.getByRole('textbox', {
        name: /email address/i,
      });
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autocomplete', 'username');
      expect(emailInput).toHaveAttribute('aria-label', 'Email address');

      // Check password field
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
      expect(passwordInput).toHaveAttribute('aria-label', 'Password');
    });

    it('should have accessible form validation', async () => {
      renderLoginWithProviders();

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Submit form without filling fields
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Check that error messages are associated with fields
        const emailInput = screen.getByRole('textbox', {
          name: /email address/i,
        });
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');

        const passwordInput = screen.getByLabelText(/password/i);
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have accessible password visibility toggle', () => {
      renderLoginWithProviders();

      const toggleButton = screen.getByRole('button', {
        name: /show password/i,
      });
      expect(toggleButton).toBeInTheDocument();

      // Click to show password
      fireEvent.click(toggleButton);

      expect(
        screen.getByRole('button', { name: /hide password/i })
      ).toBeInTheDocument();
    });

    it('should have accessible error alerts', async () => {
      renderLoginWithProviders();

      const emailInput = screen.getByRole('textbox', {
        name: /email address/i,
      });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Enter invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('should support keyboard navigation', () => {
      renderLoginWithProviders();

      const emailInput = screen.getByRole('textbox', {
        name: /email address/i,
      });
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByRole('checkbox', {
        name: /remember me/i,
      });
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      const forgotPasswordLink = screen.getByRole('button', {
        name: /forgot your password/i,
      });

      // Check tab order
      expect(emailInput).toHaveAttribute('tabIndex', '0');
      expect(passwordInput).toHaveAttribute('tabIndex', '0');
      expect(rememberMeCheckbox).toHaveAttribute('tabIndex', '0');
      expect(submitButton).toHaveAttribute('tabIndex', '0');
      expect(forgotPasswordLink).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper focus management', () => {
      renderLoginWithProviders();

      // Email input should be focused on mount
      const emailInput = screen.getByRole('textbox', {
        name: /email address/i,
      });
      expect(emailInput).toHaveFocus();
    });

    it('should have appropriate ARIA attributes', () => {
      renderLoginWithProviders();

      // Check form has proper ARIA label
      const form = screen.getByRole('form', { name: /login form/i });
      expect(form).toBeInTheDocument();

      // Check inputs have proper ARIA attributes
      const emailInput = screen.getByRole('textbox', {
        name: /email address/i,
      });
      expect(emailInput).toHaveAttribute('aria-label', 'Email address');
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('aria-label', 'Password');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('should handle lockout state accessibly', async () => {
      renderLoginWithProviders();

      // Simulate multiple failed attempts (this would normally be controlled by backend)
      // For testing, we'll check the UI handles the state properly
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Mock multiple failed attempts
      for (let i = 0; i < 5; i++) {
        fireEvent.click(submitButton);
        await waitFor(() => {
          // After 5 attempts, should show lockout message
          if (i === 4) {
            const lockoutAlert = screen.getByRole('alert');
            expect(lockoutAlert).toHaveAttribute('aria-live', 'polite');
          }
        });
      }
    });

    it('should provide clear error messages', async () => {
      renderLoginWithProviders();

      const emailInput = screen.getByRole('textbox', {
        name: /email address/i,
      });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Test email validation
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });

      // Test password validation
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.blur(passwordInput);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should have proper autocomplete attributes', () => {
      renderLoginWithProviders();

      const emailInput = screen.getByRole('textbox', {
        name: /email address/i,
      });
      expect(emailInput).toHaveAttribute('autocomplete', 'username');

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    it('should support screen readers with proper announcements', async () => {
      renderLoginWithProviders();

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Submit form to trigger error
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });

  describe('Focus Management', () => {
    it('should focus first error field when validation fails', async () => {
      renderLoginWithProviders();

      const emailInput = screen.getByRole('textbox', {
        name: /email address/i,
      });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Fill password but leave email empty
      fireEvent.change(passwordInput, {
        target: { value: 'ValidPassword123!' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveFocus();
      });
    });

    it('should focus error alert when login fails', async () => {
      renderLoginWithProviders();

      const emailInput = screen.getByRole('textbox', {
        name: /email address/i,
      });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Fill form with valid format but incorrect credentials
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, {
        target: { value: 'ValidPassword123!' },
      });
      fireEvent.click(submitButton);

      // Wait for error to appear and be focused
      await waitFor(
        () => {
          const errorAlert = screen.getByRole('alert');
          expect(errorAlert).toHaveFocus();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Mobile Accessibility', () => {
    it('should be accessible on mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = renderLoginWithProviders();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /solarium portal/i })
        ).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
