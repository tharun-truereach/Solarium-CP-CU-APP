/**
 * Test utilities for consistent testing setup
 * Provides reusable test helpers and providers
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { LoadingProvider } from '../contexts/LoadingContext';
import { theme } from '../theme';
import { SolariumThemeProvider } from '../theme/ThemeProvider';
import { act } from 'react-dom/test-utils';

// Set up test environment variables
beforeAll(() => {
  process.env.REACT_APP_ENVIRONMENT = 'DEV';
  process.env.REACT_APP_API_BASE_URL = 'http://localhost:3001';
});

// All the providers wrapper
export const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <SolariumThemeProvider>
      <BrowserRouter>
        <LoadingProvider>
          <AuthProvider>{children}</AuthProvider>
        </LoadingProvider>
      </BrowserRouter>
    </SolariumThemeProvider>
  );
};

// Custom render function with act wrapper
export const customRender = async (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  let result;
  await act(async () => {
    result = render(ui, { wrapper: AllTheProviders, ...options });
  });
  return result;
};

// Minimal providers for unit tests
export const MinimalProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export const renderWithMinimalProviders = async (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): Promise<ReturnType<typeof render>> => {
  let result = render(<div />); // Safe default initialization
  await act(async () => {
    result = render(ui, { wrapper: MinimalProviders, ...options });
  });
  return result;
};

// Mock user data
export const mockUsers = {
  admin: {
    id: '1',
    email: 'admin@solarium.com',
    role: 'admin' as const,
    name: 'Admin User',
  },
  kam: {
    id: '2',
    email: 'kam@solarium.com',
    role: 'kam' as const,
    name: 'KAM User',
  },
};

// Test data generators
export const createMockLead = (overrides = {}) => ({
  id: '1',
  customerName: 'Test Customer',
  status: 'new',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockQuotation = (overrides = {}) => ({
  id: '1',
  leadId: '1',
  amount: 50000,
  status: 'draft',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// User event helpers
export const setupUser = () => {
  const mockUser = mockUsers.admin;
  localStorage.setItem('solarium_user', JSON.stringify(mockUser));
  return mockUser;
};

export const clearUser = () => {
  localStorage.removeItem('solarium_user');
};

// Wait utilities
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 100));

// Re-export everything
export * from '@testing-library/react';
