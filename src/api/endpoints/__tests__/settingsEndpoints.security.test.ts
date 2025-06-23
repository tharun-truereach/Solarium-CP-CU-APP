/**
 * Settings API security tests
 * Tests authentication, authorization, and security scenarios
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../../apiSlice';
import { settingsEndpoints } from '../settingsEndpoints';
import authSlice from '../../../store/slices/authSlice';
import type { SystemSettings } from '../../../types/settings.types';
import type { User } from '../../../types/user.types';

// Mock users for different roles
const mockAdminUser: User = {
  id: 'admin-123',
  email: 'admin@solarium.com',
  name: 'Admin User',
  role: 'admin',
  permissions: ['settings:read', 'settings:write'],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockKamUser: User = {
  id: 'kam-456',
  email: 'kam@solarium.com',
  name: 'KAM User',
  role: 'kam',
  permissions: ['leads:read'],
  territories: ['North'],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockSettings: SystemSettings = {
  sessionTimeoutMin: 30,
  tokenExpiryMin: 60,
  featureFlags: { ADVANCED_REPORTING: true },
  thresholds: { MAX_LEADS: 100 },
  lastUpdated: '2024-01-15T10:30:00Z',
  updatedBy: 'admin@solarium.com',
};

// MSW server with security scenarios
const server = setupServer(
  // GET /api/v1/settings with role-based access
  rest.get('/api/v1/settings', (req, res, ctx) => {
    const authHeader = req.headers.get('authorization');
    const userRole = req.headers.get('x-user-role'); // Simulated role header

    if (!authHeader) {
      return res(
        ctx.status(401),
        ctx.json({
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString(),
        })
      );
    }

    // Admin token - success
    if (authHeader === 'Bearer admin-token') {
      return res(ctx.status(200), ctx.json(mockSettings));
    }

    // Non-admin tokens - forbidden
    if (authHeader === 'Bearer kam-token' || userRole === 'kam') {
      return res(
        ctx.status(403),
        ctx.json({
          message:
            'Insufficient permissions. Admin role required for settings access.',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'admin',
          userRole: 'kam',
          timestamp: new Date().toISOString(),
        })
      );
    }

    if (authHeader === 'Bearer cp-token' || userRole === 'cp') {
      return res(
        ctx.status(403),
        ctx.json({
          message:
            'Insufficient permissions. Admin role required for settings access.',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRole: 'admin',
          userRole: 'cp',
          timestamp: new Date().toISOString(),
        })
      );
    }

    // Expired token
    if (authHeader === 'Bearer expired-token') {
      return res(
        ctx.status(401),
        ctx.json({
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
          timestamp: new Date().toISOString(),
        })
      );
    }

    // Invalid token
    if (authHeader === 'Bearer invalid-token') {
      return res(
        ctx.status(401),
        ctx.json({
          message: 'Invalid or malformed token',
          code: 'INVALID_TOKEN',
          timestamp: new Date().toISOString(),
        })
      );
    }

    // Revoked token
    if (authHeader === 'Bearer revoked-token') {
      return res(
        ctx.status(401),
        ctx.json({
          message: 'Token has been revoked',
          code: 'TOKEN_REVOKED',
          timestamp: new Date().toISOString(),
        })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({
        message: 'Authentication failed',
        code: 'AUTH_FAILED',
        timestamp: new Date().toISOString(),
      })
    );
  }),

  // PATCH /api/v1/settings with strict admin-only access
  rest.patch('/api/v1/settings', async (req, res, ctx) => {
    const authHeader = req.headers.get('authorization');
    const userRole = req.headers.get('x-user-role');

    if (!authHeader || authHeader !== 'Bearer admin-token') {
      const status = !authHeader ? 401 : 403;
      const message = !authHeader
        ? 'Authentication required for settings modification'
        : 'Admin role required for settings modification';

      return res(
        ctx.status(status),
        ctx.json({
          message,
          code: !authHeader ? 'AUTH_REQUIRED' : 'ADMIN_REQUIRED',
          requiredRole: 'admin',
          userRole: userRole || 'unknown',
          operation: 'settings_update',
          timestamp: new Date().toISOString(),
        })
      );
    }

    const updates = await req.json();

    // Input validation security
    if (updates.sessionTimeoutMin !== undefined) {
      if (
        typeof updates.sessionTimeoutMin !== 'number' ||
        updates.sessionTimeoutMin < 5 ||
        updates.sessionTimeoutMin > 1440
      ) {
        return res(
          ctx.status(422),
          ctx.json({
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: [
              {
                field: 'sessionTimeoutMin',
                message: 'Must be a number between 5 and 1440 minutes',
                value: updates.sessionTimeoutMin,
              },
            ],
            timestamp: new Date().toISOString(),
          })
        );
      }
    }

    // Dangerous settings protection
    if (updates.featureFlags && updates.featureFlags.DEBUG_MODE === true) {
      return res(
        ctx.status(422),
        ctx.json({
          message:
            'Debug mode can only be enabled through secure configuration',
          code: 'RESTRICTED_SETTING',
          field: 'featureFlags.DEBUG_MODE',
          timestamp: new Date().toISOString(),
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        ...mockSettings,
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin@solarium.com',
      })
    );
  }),

  // GET /api/v1/settings/audit with admin-only access
  rest.get('/api/v1/settings/audit', (req, res, ctx) => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || authHeader !== 'Bearer admin-token') {
      return res(
        ctx.status(403),
        ctx.json({
          message: 'Admin role required for audit log access',
          code: 'AUDIT_ACCESS_DENIED',
          requiredRole: 'admin',
          resource: 'audit_logs',
          timestamp: new Date().toISOString(),
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        logs: [
          {
            id: '1',
            userId: 'admin-123',
            userName: 'Admin User',
            field: 'sessionTimeoutMin',
            oldValue: 15,
            newValue: 30,
            timestamp: '2024-01-15T10:30:00Z',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Security Test)',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
    );
  }),

  // Rate limiting simulation
  rest.get('/api/v1/settings-rate-limited', (req, res, ctx) => {
    return res(
      ctx.status(429),
      ctx.set('Retry-After', '60'),
      ctx.json({
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: 60,
        timestamp: new Date().toISOString(),
      })
    );
  })
);

// Test store factory
const createTestStore = (
  user: User | null = null,
  token: string | null = null
) => {
  const preloadedState = {
    auth: {
      user,
      token,
      refreshToken: token ? 'refresh-token' : null,
      expiresAt: token ? new Date(Date.now() + 3600000).toISOString() : null,
      isLoading: false,
      isAuthenticated: !!token,
      lastActivity: token ? new Date().toISOString() : null,
      loginTimestamp: token ? new Date().toISOString() : null,
      sessionWarningShown: false,
      error: null,
      loginAttempts: 0,
      lockoutUntil: null,
      rememberMe: false,
      twoFactorRequired: false,
      twoFactorToken: null,
    },
  };

  return configureStore({
    reducer: {
      auth: authSlice,
      api: apiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState,
  });
};

describe('Settings API Security Tests', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Authentication Security', () => {
    it('should require authentication for settings access', async () => {
      const store = createTestStore(null, null);

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getSettings.initiate()
      );

      expect((result as any).status).toBe('rejected');
      expect((result.error as any)?.status).toBe(401);
      expect((result.error as any)?.data?.code).toBe('AUTH_REQUIRED');
    });

    it('should reject expired tokens', async () => {
      const store = createTestStore(mockAdminUser, 'expired-token');

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getSettings.initiate()
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(401);
      expect((result as any).error?.data?.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject invalid tokens', async () => {
      const store = createTestStore(mockAdminUser, 'invalid-token');

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getSettings.initiate()
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(401);
      expect((result as any).error?.data?.code).toBe('INVALID_TOKEN');
    });

    it('should reject revoked tokens', async () => {
      const store = createTestStore(mockAdminUser, 'revoked-token');

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getSettings.initiate()
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(401);
      expect((result as any).error?.data?.code).toBe('TOKEN_REVOKED');
    });
  });

  describe('Authorization Security', () => {
    it('should allow admin users to access settings', async () => {
      const store = createTestStore(mockAdminUser, 'admin-token');

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getSettings.initiate()
      );

      expect((result as any).status).toBe('fulfilled');
      expect((result as any).data).toEqual(mockSettings);
    });

    it('should deny KAM users access to settings with 403', async () => {
      const store = createTestStore(mockKamUser, 'kam-token');

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getSettings.initiate()
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(403);
      expect((result as any).error?.data?.code).toBe(
        'INSUFFICIENT_PERMISSIONS'
      );
      expect((result as any).error?.data?.requiredRole).toBe('admin');
      expect((result as any).error?.data?.userRole).toBe('kam');
    });

    it('should deny Channel Partner users access to settings', async () => {
      // Mock CP user token
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          return res(
            ctx.status(403),
            ctx.json({
              message:
                'Insufficient permissions. Admin role required for settings access.',
              code: 'INSUFFICIENT_PERMISSIONS',
              requiredRole: 'admin',
              userRole: 'cp',
            })
          );
        })
      );

      const store = createTestStore(null, 'cp-token');

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getSettings.initiate()
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(403);
      expect((result as any).error?.data?.userRole).toBe('cp');
    });
  });

  describe('Settings Update Security', () => {
    it('should allow admin to update settings', async () => {
      const store = createTestStore(mockAdminUser, 'admin-token');
      const updates = { sessionTimeoutMin: 45 };

      const result = await store.dispatch(
        settingsEndpoints.endpoints.updateSettings.initiate(updates)
      );

      expect((result as any).status).toBe('fulfilled');
      expect((result as any).data?.sessionTimeoutMin).toBe(45);
    });

    it('should deny non-admin users from updating settings', async () => {
      server.use(
        rest.patch('/api/v1/settings', (req, res, ctx) => {
          return res(
            ctx.status(403),
            ctx.json({
              message: 'Admin role required for settings modification',
              code: 'ADMIN_REQUIRED',
              requiredRole: 'admin',
              userRole: 'kam',
              operation: 'settings_update',
            })
          );
        })
      );

      const store = createTestStore(mockKamUser, 'kam-token');
      const updates = { sessionTimeoutMin: 45 };

      const result = await store.dispatch(
        settingsEndpoints.endpoints.updateSettings.initiate(updates)
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(403);
      expect((result as any).error?.data?.code).toBe('ADMIN_REQUIRED');
    });

    it('should validate input parameters securely', async () => {
      const store = createTestStore(mockAdminUser, 'admin-token');
      const invalidUpdates = { sessionTimeoutMin: -1 }; // Invalid value

      const result = await store.dispatch(
        settingsEndpoints.endpoints.updateSettings.initiate(invalidUpdates)
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(422);
      expect((result as any).error?.data?.code).toBe('VALIDATION_ERROR');
      expect((result as any).error?.data?.errors[0].field).toBe(
        'sessionTimeoutMin'
      );
    });

    it('should prevent modification of restricted settings', async () => {
      const store = createTestStore(mockAdminUser, 'admin-token');
      const restrictedUpdates = { featureFlags: { DEBUG_MODE: true } };

      const result = await store.dispatch(
        settingsEndpoints.endpoints.updateSettings.initiate(restrictedUpdates)
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(422);
      expect((result as any).error?.data?.code).toBe('RESTRICTED_SETTING');
      expect((result as any).error?.data?.field).toBe(
        'featureFlags.DEBUG_MODE'
      );
    });
  });

  describe('Audit Log Security', () => {
    it('should allow admin access to audit logs', async () => {
      const store = createTestStore(mockAdminUser, 'admin-token');

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getAuditLogs.initiate({
          page: 1,
          limit: 10,
        })
      );

      expect((result as any).status).toBe('fulfilled');
      expect((result as any).data?.logs).toBeDefined();
      expect((result as any).data?.logs[0].userId).toBe('admin-123');
    });

    it('should deny non-admin access to audit logs', async () => {
      server.use(
        rest.get('/api/v1/settings/audit', (req, res, ctx) => {
          return res(
            ctx.status(403),
            ctx.json({
              message: 'Admin role required for audit log access',
              code: 'AUDIT_ACCESS_DENIED',
              requiredRole: 'admin',
              resource: 'audit_logs',
            })
          );
        })
      );

      const store = createTestStore(mockKamUser, 'kam-token');

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getAuditLogs.initiate({
          page: 1,
          limit: 10,
        })
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(403);
      expect((result as any).error?.data?.code).toBe('AUDIT_ACCESS_DENIED');
    });
  });

  describe('Security Headers and Metadata', () => {
    it('should include security context in error responses', async () => {
      const store = createTestStore(mockKamUser, 'kam-token');

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getSettings.initiate()
      );

      expect((result as any).error?.data?.timestamp).toBeDefined();
      expect((result as any).error?.data?.code).toBeDefined();
      expect((result as any).error?.data?.requiredRole).toBe('admin');
    });

    it('should handle rate limiting gracefully', async () => {
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          return res(
            ctx.status(429),
            ctx.set('Retry-After', '60'),
            ctx.json({
              message: 'Too many requests. Please try again later.',
              code: 'RATE_LIMITED',
              retryAfter: 60,
            })
          );
        })
      );

      const store = createTestStore(mockAdminUser, 'admin-token');

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getSettings.initiate()
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(429);
      expect((result as any).error?.data?.code).toBe('RATE_LIMITED');
    });
  });

  describe('Token Security', () => {
    it('should handle missing Authorization header', async () => {
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          const authHeader = req.headers.get('authorization');
          expect(authHeader).toBeNull();
          return res(
            ctx.status(401),
            ctx.json({ message: 'Authentication required' })
          );
        })
      );

      const store = createTestStore(null, null);

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getSettings.initiate()
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(401);
    });

    it('should handle malformed Authorization header', async () => {
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          const authHeader = req.headers.get('authorization');
          if (authHeader === 'Bearer malformed-token-without-proper-format') {
            return res(
              ctx.status(401),
              ctx.json({
                message: 'Invalid token format',
                code: 'INVALID_TOKEN_FORMAT',
              })
            );
          }
          return res(ctx.status(401), ctx.json({ message: 'Auth failed' }));
        })
      );

      const store = createTestStore(
        mockAdminUser,
        'malformed-token-without-proper-format'
      );

      const result = await store.dispatch(
        settingsEndpoints.endpoints.getSettings.initiate()
      );

      expect((result as any).status).toBe('rejected');
      expect((result as any).error?.status).toBe(401);
    });
  });
});
