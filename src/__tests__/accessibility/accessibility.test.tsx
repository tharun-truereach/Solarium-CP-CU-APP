/**
 * Accessibility tests for key components
 * Ensures components meet basic accessibility requirements
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { theme } from '../../theme';
import { AuthProvider } from '../../contexts/AuthContext';
import { LoadingProvider } from '../../contexts/LoadingContext';
import Login from '../../pages/Login';
import Dashboard from '../../pages/Dashboard';
import NotFound from '../../pages/NotFound';
import AccessDenied from '../../pages/AccessDenied';
import { AppButton, AppModal, AppTextField } from '../../components/ui';

expect.extend(toHaveNoViolations);

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <LoadingProvider>{component}</LoadingProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('Accessibility Tests', () => {
  test('Login page has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Login />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Dashboard page has no accessibility violations', async () => {
    // Mock authenticated user
    const mockUser = {
      id: '1',
      email: 'admin@test.com',
      role: 'admin' as const,
      name: 'Admin User',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    const { container } = renderWithProviders(<Dashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('NotFound page has no accessibility violations', async () => {
    const { container } = renderWithProviders(<NotFound />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('AccessDenied page has no accessibility violations', async () => {
    const { container } = renderWithProviders(<AccessDenied />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('AppButton has no accessibility violations', async () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <AppButton>Test Button</AppButton>
      </ThemeProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('AppTextField has no accessibility violations', async () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <AppTextField label="Test Field" />
      </ThemeProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('AppModal has no accessibility violations', async () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <AppModal
          open={true}
          onClose={() => {
            /* noop */
          }}
          title="Test Modal"
        >
          <div>Modal content</div>
        </AppModal>
      </ThemeProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('components have proper ARIA labels', () => {
    renderWithProviders(<Login />);

    // Check for proper form labels
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Check for proper button roles
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  test('navigation elements have proper structure', () => {
    const mockUser = {
      id: '1',
      email: 'admin@test.com',
      role: 'admin' as const,
      name: 'Admin User',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    renderWithProviders(<Dashboard />);

    // Check for proper heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    // Check for main landmark
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('keyboard navigation works correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <AppButton>Test Button</AppButton>
      </ThemeProvider>
    );

    const button = screen.getByRole('button');

    // Button should be focusable
    button.focus();
    expect(button).toHaveFocus();
  });
});
