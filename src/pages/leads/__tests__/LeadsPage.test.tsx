/**
 * LeadsPage unit tests
 * Tests page rendering, navigation, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import LeadsPage from '../LeadsPage';
import { apiSlice } from '../../../api/apiSlice';
import { authSlice } from '../../../store/slices/authSlice';

// Mock the useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require('../../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock server
const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock auth user data
const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin' as const,
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockKamUser = {
  id: 'kam-1',
  email: 'kam@test.com',
  name: 'KAM User',
  role: 'kam' as const,
  permissions: [],
  territories: ['North', 'South'],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockCustomerUser = {
  id: 'customer-1',
  email: 'customer@test.com',
  name: 'Customer User',
  role: 'customer' as const,
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

// Test store
const createTestStore = (initialState: any = {}) => {
  return configureStore({
    reducer: {
      api: apiSlice.reducer,
      auth: authSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: {
      auth: {
        user: mockAdminUser,
        isAuthenticated: true,
        token: 'test-token',
        refreshToken: null,
        expiresAt: null,
        isLoading: false,
        lastActivity: null,
        loginTimestamp: null,
        sessionWarningShown: false,
        error: null,
        loginAttempts: 0,
        lockoutUntil: null,
        rememberMe: false,
        twoFactorRequired: false,
        twoFactorToken: null,
        ...(initialState.auth || {}),
      },
      ...initialState,
    },
  });
};

// Test wrapper
const createWrapper = (initialState: any = {}) => {
  const store = createTestStore(initialState);
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );
};

describe('LeadsPage', () => {
  beforeEach(() => {
    // Reset mock
    mockUseAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      token: 'test-token',
      sessionStatus: {
        isAuthenticated: true,
        isTokenExpired: false,
        isAccountLocked: false,
        timeRemaining: 1800000,
        isActive: true,
        needsWarning: false,
      },
      loginAttempts: 0,
      isAccountLocked: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      updateProfile: jest.fn(),
      checkPermission: jest.fn(),
      checkRole: jest.fn(),
      clearError: jest.fn(),
      updateUserActivity: jest.fn(),
      showSessionExpiredWarning: jest.fn(),
      hideSessionExpiredWarning: jest.fn(),
      getTokenTimeRemaining: jest.fn(),
      formatTokenExpiration: jest.fn(),
      isTokenExpiringSoon: jest.fn(),
    });

    server.use(
      rest.get('*/api/v1/leads', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              items: [
                {
                  id: '1',
                  leadId: 'LEAD-001',
                  customerName: 'John Doe',
                  phone: '1234567890',
                  address: 'Test Address',
                  status: 'New Lead',
                  origin: 'CP',
                  pinCode: '123456',
                  createdAt: '2023-01-01T00:00:00Z',
                  updatedAt: '2023-01-01T00:00:00Z',
                  createdBy: 'user1',
                },
              ],
              total: 1,
              offset: 0,
              limit: 25,
            },
          })
        );
      })
    );
  });

  it('should render leads page for admin user', async () => {
    const Wrapper = createWrapper();
    render(<LeadsPage />, { wrapper: Wrapper });

    expect(screen.getByText('Leads Management')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Manage and track lead progress through the sales pipeline'
      )
    ).toBeInTheDocument();
  });

  it('should render access denied for unauthorized user', () => {
    mockUseAuth.mockReturnValue({
      user: mockCustomerUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      token: 'test-token',
      sessionStatus: {
        isAuthenticated: true,
        isTokenExpired: false,
        isAccountLocked: false,
        timeRemaining: 1800000,
        isActive: true,
        needsWarning: false,
      },
      loginAttempts: 0,
      isAccountLocked: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      updateProfile: jest.fn(),
      checkPermission: jest.fn(),
      checkRole: jest.fn(),
      clearError: jest.fn(),
      updateUserActivity: jest.fn(),
      showSessionExpiredWarning: jest.fn(),
      hideSessionExpiredWarning: jest.fn(),
      getTokenTimeRemaining: jest.fn(),
      formatTokenExpiration: jest.fn(),
      isTokenExpiringSoon: jest.fn(),
    });

    const Wrapper = createWrapper();
    render(<LeadsPage />, { wrapper: Wrapper });

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText('You do not have permission to view leads.')
    ).toBeInTheDocument();
  });

  it('should show territory restrictions for KAM user', async () => {
    mockUseAuth.mockReturnValue({
      user: mockKamUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      token: 'test-token',
      sessionStatus: {
        isAuthenticated: true,
        isTokenExpired: false,
        isAccountLocked: false,
        timeRemaining: 1800000,
        isActive: true,
        needsWarning: false,
      },
      loginAttempts: 0,
      isAccountLocked: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      updateProfile: jest.fn(),
      checkPermission: jest.fn(),
      checkRole: jest.fn(),
      clearError: jest.fn(),
      updateUserActivity: jest.fn(),
      showSessionExpiredWarning: jest.fn(),
      hideSessionExpiredWarning: jest.fn(),
      getTokenTimeRemaining: jest.fn(),
      formatTokenExpiration: jest.fn(),
      isTokenExpiringSoon: jest.fn(),
    });

    const Wrapper = createWrapper();
    render(<LeadsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Territory Limited/)).toBeInTheDocument();
    });
  });

  it('should handle refresh action', async () => {
    const Wrapper = createWrapper();
    render(<LeadsPage />, { wrapper: Wrapper });

    const refreshButton = screen.getByLabelText('Refresh leads');
    fireEvent.click(refreshButton);

    // Should trigger a new API call
    await waitFor(() => {
      expect(screen.getByText('Leads Management')).toBeInTheDocument();
    });
  });

  it('should show create lead button for authorized users', async () => {
    const Wrapper = createWrapper();
    render(<LeadsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('New Lead')).toBeInTheDocument();
    });
  });

  it('should handle view mode toggle', async () => {
    const Wrapper = createWrapper();
    render(<LeadsPage />, { wrapper: Wrapper });

    const gridViewButton = screen.getByRole('button', { name: /grid/i });
    fireEvent.click(gridViewButton);

    // View mode should change (visual feedback)
    expect(gridViewButton).toHaveAttribute('color', 'primary');
  });

  it('should show development info in dev mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const Wrapper = createWrapper();
    render(<LeadsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Development Info:')).toBeInTheDocument();
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle error state', async () => {
    server.use(
      rest.get('*/api/v1/leads', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            success: false,
            error: { message: 'Server error' },
          })
        );
      })
    );

    const Wrapper = createWrapper();
    render(<LeadsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Error Loading Leads')).toBeInTheDocument();
    });
  });

  it('should handle empty state', async () => {
    server.use(
      rest.get('*/api/v1/leads', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              items: [],
              total: 0,
              offset: 0,
              limit: 25,
            },
          })
        );
      })
    );

    const Wrapper = createWrapper();
    render(<LeadsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('No leads yet')).toBeInTheDocument();
    });
  });
});
