/**
 * Accessibility validation tests
 * Ensures basic accessibility standards are met
 */
import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SolariumThemeProvider } from '../../theme/ThemeProvider';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from '../../pages/Login';
import Dashboard from '../../pages/Dashboard';
import NotFound from '../../pages/NotFound';
import AccessDenied from '../../pages/AccessDenied';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <SolariumThemeProvider>
        <AuthProvider>{component}</AuthProvider>
      </SolariumThemeProvider>
    </BrowserRouter>
  );
};

describe('Accessibility Validation', () => {
  test('login page has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Login />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('dashboard page has no accessibility violations', async () => {
    // Mock authenticated user
    localStorage.setItem('solarium_token', 'mock_token');
    localStorage.setItem(
      'solarium_user',
      JSON.stringify({
        id: '1',
        email: 'admin@solarium.com',
        name: 'Test Admin',
        role: 'admin',
        isActive: true,
      })
    );

    const { container } = renderWithProviders(<Dashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('404 page has no accessibility violations', async () => {
    const { container } = renderWithProviders(<NotFound />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('403 page has no accessibility violations', async () => {
    const { container } = renderWithProviders(<AccessDenied />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  afterEach(() => {
    localStorage.clear();
  });
});
