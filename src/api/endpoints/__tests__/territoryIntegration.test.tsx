/**
 * Integration test for territory filtering in lead endpoints
 * Verifies that baseQueryWithTerritoryInjection works correctly
 */

import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../../apiSlice';
import { authSlice } from '../../../store/slices/authSlice';
import { useGetLeadsQuery } from '../leadEndpoints';
import type { User } from '../../../types/user.types';

// Mock users
const mockAdminUser: User = {
  id: 'admin-1',
  email: 'admin@solarium.com',
  name: 'Admin User',
  role: 'admin',
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockKamUser: User = {
  id: 'kam-1',
  email: 'kam@solarium.com',
  name: 'KAM User',
  role: 'kam',
  permissions: [],
  territories: ['West', 'Central'],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// MSW server to capture requests
const server = setupServer(
  rest.get('/api/v1/leads', (req, res, ctx) => {
    // Capture request details for verification
    const territories = req.url.searchParams.get('territories');
    const userRole = req.headers.get('X-User-Role');
    const userTerritories = req.headers.get('X-User-Territories');

    console.log('Territory Integration Test - Request captured:', {
      territories,
      userRole,
      userTerritories,
      url: req.url.toString(),
    });

    return res(
      ctx.json({
        success: true,
        data: {
          items: [],
          total: 0,
          offset: 0,
          limit: 25,
          totalPages: 0,
        },
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test store setup with auth state
const createTestStore = (user: User | null) =>
  configureStore({
    reducer: {
      api: apiSlice.reducer,
      auth: authSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: {
      auth: {
        user,
        token: user ? 'mock-token' : null,
        refreshToken: null,
        expiresAt: null,
        isLoading: false,
        isAuthenticated: !!user,
        lastActivity: null,
        loginTimestamp: null,
        sessionWarningShown: false,
        error: null,
        loginAttempts: 0,
        lockoutUntil: null,
        rememberMe: false,
        twoFactorRequired: false,
        twoFactorToken: null,
      },
    },
  });

describe('Territory Integration with Lead Endpoints', () => {
  it('should inject territory parameters for KAM users', async () => {
    const store = createTestStore(mockKamUser);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    // Capture the request
    let capturedRequest: any = null;
    server.use(
      rest.get('/api/v1/leads', (req, res, ctx) => {
        capturedRequest = {
          territories: req.url.searchParams.get('territories'),
          userRole: req.headers.get('X-User-Role'),
          userTerritories: req.headers.get('X-User-Territories'),
          url: req.url.toString(),
        };
        return res(
          ctx.json({
            success: true,
            data: { items: [], total: 0, offset: 0, limit: 25, totalPages: 0 },
          })
        );
      })
    );

    const { result: kamResult } = renderHook(() => useGetLeadsQuery({}), {
      wrapper,
    });

    await waitFor(() => {
      expect(kamResult.current.isSuccess).toBe(true);
    });

    // Verify territory injection
    expect(capturedRequest).not.toBeNull();
    expect(capturedRequest.userRole).toBe('kam');
    expect(capturedRequest.userTerritories).toBe('West,Central');
    expect(capturedRequest.territories).toBe('West,Central');
  });

  it('should not inject territory parameters for Admin users', async () => {
    const store = createTestStore(mockAdminUser);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    // Capture the request
    let adminCapturedRequest: any = null;
    server.use(
      rest.get('/api/v1/leads', (req, res, ctx) => {
        adminCapturedRequest = {
          territories: req.url.searchParams.get('territories'),
          userRole: req.headers.get('X-User-Role'),
          userTerritories: req.headers.get('X-User-Territories'),
          url: req.url.toString(),
        };
        return res(
          ctx.json({
            success: true,
            data: { items: [], total: 0, offset: 0, limit: 25, totalPages: 0 },
          })
        );
      })
    );

    const { result: adminResult } = renderHook(() => useGetLeadsQuery({}), {
      wrapper,
    });

    await waitFor(() => {
      expect(adminResult.current.isSuccess).toBe(true);
    });

    // Verify no territory injection for admin
    expect(adminCapturedRequest).not.toBeNull();
    expect(adminCapturedRequest.userRole).toBe('admin');
    expect(adminCapturedRequest.userTerritories).toBeNull();
    expect(adminCapturedRequest.territories).toBeNull();
  });

  it('should merge manual territory filter with user territories for KAM', async () => {
    const store = createTestStore(mockKamUser);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    // Capture the request
    let mergeCapturedRequest: any = null;
    server.use(
      rest.get('/api/v1/leads', (req, res, ctx) => {
        mergeCapturedRequest = {
          territory: req.url.searchParams.get('territory'),
          territories: req.url.searchParams.get('territories'),
          userRole: req.headers.get('X-User-Role'),
          userTerritories: req.headers.get('X-User-Territories'),
          url: req.url.toString(),
        };
        return res(
          ctx.json({
            success: true,
            data: { items: [], total: 0, offset: 0, limit: 25, totalPages: 0 },
          })
        );
      })
    );

    const { result: mergeResult } = renderHook(
      () => useGetLeadsQuery({ territory: 'West' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(mergeResult.current.isSuccess).toBe(true);
    });

    // Verify both manual and automatic territory filtering
    expect(mergeCapturedRequest).not.toBeNull();
    expect(mergeCapturedRequest.userRole).toBe('kam');
    expect(mergeCapturedRequest.userTerritories).toBe('West,Central');
    expect(mergeCapturedRequest.territories).toBe('West,Central');
    expect(mergeCapturedRequest.territory).toBe('West');
  });
});

describe('Territory Access Integration with Lead Endpoints', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      href: '',
      pathname: '/',
    } as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('should handle successful territory-filtered lead requests', async () => {
    const store = createTestStore({
      ...mockKamUser,
      territories: ['North', 'South'],
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    server.use(
      rest.get('/api/v1/leads', (req, res, ctx) => {
        // Verify territory headers are sent
        expect(req.headers.get('X-User-Role')).toBe('kam');
        expect(req.headers.get('X-User-Territories')).toBe('North,South');

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
                  territory: 'North',
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

    const { result } = renderHook(() => useGetLeadsQuery({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle 403 responses with territory-specific error messages', async () => {
    const eventSpy = jest.fn();
    window.addEventListener('api:forbidden', eventSpy);

    const store = createTestStore({
      ...mockKamUser,
      territories: ['North', 'South'],
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    server.use(
      rest.get('/api/v1/leads', (req, res, ctx) => {
        return res(
          ctx.status(403),
          ctx.json({
            success: false,
            error: {
              message:
                'Access denied: Lead is in East territory but user only has access to North,South',
              code: 'TERRITORY_ACCESS_DENIED',
            },
          })
        );
      })
    );

    const { result } = renderHook(() => useGetLeadsQuery({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect((result.current.error as any)?.status).toBe(403);

    window.removeEventListener('api:forbidden', eventSpy);
  });
});

describe('Admin User Territory Bypass', () => {
  it('should allow admin users to access all territories', async () => {
    const store = createTestStore({
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin',
      permissions: [],
      territories: [],
      isActive: true,
      isVerified: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    server.use(
      rest.get('/api/v1/leads', (req, res, ctx) => {
        // Admin should not have territory restrictions
        expect(req.headers.get('X-User-Role')).toBe('admin');
        expect(req.headers.get('X-User-Territories')).toBeFalsy();

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
                  territory: 'East', // Admin can access any territory
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

    const { result } = renderHook(() => useGetLeadsQuery({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
