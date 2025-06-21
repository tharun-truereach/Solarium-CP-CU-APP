/**
 * Accessibility test suite for ForgotPasswordPage component
 * Uses jest-axe to ensure WCAG 2.1 AA compliance
 */
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';

import ForgotPasswordPage from '../auth/ForgotPasswordPage';
import { theme } from '../../theme';
import { store } from '../../store';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the password reset mutation
vi.mock('../../api/endpoints/authEndpoints', () => ({
  useRequestPasswordResetMutation: () => [vi.fn(), { isLoading: false }],
}));

// Mock navigation
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return {
    ...actual,
    useNavigate: () => vi.fn(),
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

describe('ForgotPasswordPage Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = renderWithProviders();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    const { container } = renderWithProviders();

    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Reset Password');
    expect(headings[0]?.tagName).toBe('H1');
  });

  it('should have proper form labels', () => {
    const { container } = renderWithProviders();

    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      const label = container.querySelector(`label[for="${input.id}"]`);
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');

      expect(label || ariaLabel || ariaLabelledBy).toBeTruthy();
    });
  });

  it('should have proper focus management', () => {
    const { container } = renderWithProviders();

    const emailInput = container.querySelector('input[type="email"]');
    expect(emailInput).toHaveFocus();
  });

  it('should have proper button roles and labels', () => {
    const { container } = renderWithProviders();

    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button).toBeVisible();
      expect(
        button.textContent || button.getAttribute('aria-label')
      ).toBeTruthy();
    });
  });

  it('should have proper color contrast', async () => {
    const { container } = renderWithProviders();

    // Test with axe color-contrast rule specifically
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should be keyboard navigable', () => {
    const { container } = renderWithProviders();

    const focusableElements = container.querySelectorAll(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );

    expect(focusableElements.length).toBeGreaterThan(0);

    focusableElements.forEach(element => {
      expect(element).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('should have proper ARIA live regions', () => {
    const { container } = renderWithProviders();

    // Check for aria-live attributes on alert regions
    const liveRegions = container.querySelectorAll('[aria-live]');
    expect(liveRegions.length).toBeGreaterThan(0);
  });

  it('should have semantic HTML structure', () => {
    const { container } = renderWithProviders();

    // Check for proper semantic elements
    expect(
      container.querySelector('main, section, article, form')
    ).toBeTruthy();
    expect(container.querySelector('form')).toHaveAttribute('aria-label');
  });

  it('should have proper required field indicators', () => {
    const { container } = renderWithProviders();

    const requiredInputs = container.querySelectorAll('input[required]');
    expect(requiredInputs.length).toBeGreaterThan(0);

    requiredInputs.forEach(input => {
      // Check for required attribute or aria-required
      expect(
        input.hasAttribute('required') ||
          input.getAttribute('aria-required') === 'true'
      ).toBeTruthy();
    });
  });

  it('should have descriptive error messages', async () => {
    const { container } = renderWithProviders();

    // Check that error-related elements have proper descriptions
    const errorElements = container.querySelectorAll('[role="alert"]');
    errorElements.forEach(element => {
      expect(element).toHaveAttribute('aria-live');
    });
  });
});
