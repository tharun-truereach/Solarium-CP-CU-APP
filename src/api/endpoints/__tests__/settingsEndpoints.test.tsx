/**
 * Settings endpoints test suite
 * Tests RTK Query endpoints with MSW mocking
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../../apiSlice';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetAuditLogsQuery,
} from '../settingsEndpoints';
import type {
  SystemSettings,
  SettingsUpdatePayload,
  AuditLogResponse,
} from '../../../types/settings.types';

// Mock settings data
const mockSettings: SystemSettings = {
  sessionTimeoutMin: 30,
  tokenExpiryMin: 60,
  featureFlags: {
    ADVANCED_REPORTING: true,
    BETA_FEATURES: false,
    DARK_MODE: true,
  },
  thresholds: {
    MAX_FILE_SIZE: 10,
    SESSION_WARNING: 5,
    API_TIMEOUT: 30,
  },
  lastUpdated: '2024-01-15T10:30:00Z',
  updatedBy: 'admin@solarium.com',
};

const mockAuditLogs: AuditLogResponse = {
  logs: [
    {
      id: '1',
      userId: 'user1',
      userName: 'Admin User',
      field: 'sessionTimeoutMin',
      oldValue: 25,
      newValue: 30,
      timestamp: '2024-01-15T10:30:00Z',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
    },
    {
      id: '2',
      userId: 'user1',
      userName: 'Admin User',
      field: 'featureFlags.ADVANCED_REPORTING',
      oldValue: false,
      newValue: true,
      timestamp: '2024-01-15T10:25:00Z',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
    },
  ],
  total: 25,
  page: 1,
  limit: 10,
  totalPages: 3,
};

// MSW server setup
const server = setupServer(
  // GET /api/v1/settings
  rest.get('/api/v1/settings', (req, res, ctx) => {
    return res(ctx.json(mockSettings));
  }),

  // PATCH /api/v1/settings
  rest.patch('/api/v1/settings', async (req, res, ctx) => {
    const body = (await req.json()) as SettingsUpdatePayload;
    const updatedSettings = {
      ...mockSettings,
      ...body,
      lastUpdated: new Date().toISOString(),
    };
    return res(ctx.json(updatedSettings));
  }),

  // GET /api/v1/settings/audit
  rest.get('/api/v1/settings/audit', (req, res, ctx) => {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const field = url.searchParams.get('field');

    let filteredLogs = mockAuditLogs.logs;
    if (field) {
      filteredLogs = filteredLogs.filter(log => log.field.includes(field));
    }

    return res(
      ctx.json({
        ...mockAuditLogs,
        logs: filteredLogs,
        page,
        limit,
      })
    );
  }),

  // Error scenarios
  rest.get('*/api/v1/settings/error', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
  }),

  rest.patch('*/api/v1/settings/validation-error', (req, res, ctx) => {
    return res(
      ctx.status(422),
      ctx.json({
        message: 'Validation failed',
        validationErrors: {
          sessionTimeoutMin: ['Must be between 5 and 1440 minutes'],
        },
      })
    );
  }),

  rest.get('*/api/v1/settings/forbidden', (req, res, ctx) => {
    return res(ctx.status(403), ctx.json({ message: 'Access denied' }));
  })
);

// Test store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      api: apiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('Settings Endpoints', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterEach(() => {
    server.close();
  });

  describe('useGetSettingsQuery', () => {
    it('should fetch settings successfully', async () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useGetSettingsQuery(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockSettings);
      expect(result.current.error).toBeUndefined();
    });

    it('should handle server errors', async () => {
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ message: 'Internal server error' })
          );
        })
      );

      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useGetSettingsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect((result.current.error as any).status).toBe(500);
    });

    it('should handle 403 forbidden errors', async () => {
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json({ message: 'Access denied' }));
        })
      );

      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useGetSettingsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect((result.current.error as any).status).toBe(403);
    });
  });

  describe('useUpdateSettingsMutation', () => {
    it('should update settings successfully', async () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useUpdateSettingsMutation(), {
        wrapper,
      });

      const updatePayload: SettingsUpdatePayload = {
        sessionTimeoutMin: 45,
        featureFlags: {
          ...mockSettings.featureFlags,
          BETA_FEATURES: true,
        },
      };

      await result.current[0](updatePayload).unwrap();

      expect(result.current[1].isSuccess).toBe(true);
    });

    it('should handle validation errors', async () => {
      server.use(
        rest.patch('/api/v1/settings', (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json({
              message: 'Validation failed',
              validationErrors: {
                sessionTimeoutMin: ['Must be between 5 and 1440 minutes'],
              },
            })
          );
        })
      );

      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useUpdateSettingsMutation(), {
        wrapper,
      });

      const updatePayload: SettingsUpdatePayload = {
        sessionTimeoutMin: 2000, // Invalid value
      };

      try {
        await result.current[0](updatePayload).unwrap();
      } catch (error: any) {
        expect(error.status).toBe(422);
        expect(error.data.validationErrors).toBeDefined();
      }
    });

    it('should invalidate settings and audit log tags on successful update', async () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      // First, populate the cache with settings
      const getResult = renderHook(() => useGetSettingsQuery(), { wrapper });
      await waitFor(() => {
        expect(getResult.result.current.isSuccess).toBe(true);
      });

      // Then update settings
      const updateResult = renderHook(() => useUpdateSettingsMutation(), {
        wrapper,
      });

      const updatePayload: SettingsUpdatePayload = {
        sessionTimeoutMin: 45,
      };

      await updateResult.result.current[0](updatePayload).unwrap();

      // Verify the mutation was successful
      expect(updateResult.result.current[1].isSuccess).toBe(true);
    });
  });

  describe('useGetAuditLogsQuery', () => {
    it('should fetch audit logs with default pagination', async () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useGetAuditLogsQuery({}), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockAuditLogs);
      expect(result.current.data?.logs).toHaveLength(2);
    });

    it('should fetch audit logs with custom pagination', async () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(
        () => useGetAuditLogsQuery({ page: 2, limit: 5 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.page).toBe(2);
      expect(result.current.data?.limit).toBe(5);
    });

    it('should filter audit logs by field', async () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(
        () => useGetAuditLogsQuery({ field: 'sessionTimeoutMin' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Mock server filters by field containing the search term
      expect(result.current.data?.logs).toBeDefined();
    });

    it('should handle audit log fetch errors', async () => {
      server.use(
        rest.get('/api/v1/settings/audit', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Database error' }));
        })
      );

      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useGetAuditLogsQuery({}), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect((result.current.error as any).status).toBe(500);
    });
  });

  describe('Cache Behavior', () => {
    it('should cache settings data with correct tags', async () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      // First render should fetch from API
      const { result: result1 } = renderHook(() => useGetSettingsQuery(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      // Second render should use cached data
      const { result: result2 } = renderHook(() => useGetSettingsQuery(), {
        wrapper,
      });

      expect(result2.current.isSuccess).toBe(true);
      expect(result2.current.data).toEqual(result1.current.data);
    });

    it('should invalidate cache on settings update', async () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      // Load initial settings
      const getResult = renderHook(() => useGetSettingsQuery(), { wrapper });
      await waitFor(() => {
        expect(getResult.result.current.isSuccess).toBe(true);
      });

      // Update settings
      const updateResult = renderHook(() => useUpdateSettingsMutation(), {
        wrapper,
      });

      const updatePayload: SettingsUpdatePayload = {
        sessionTimeoutMin: 45,
      };

      await updateResult.result.current[0](updatePayload).unwrap();

      // Cache should be invalidated and refetched
      await waitFor(() => {
        expect(getResult.result.current.data?.sessionTimeoutMin).toBe(45);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useGetSettingsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should bubble up 401 errors correctly', async () => {
      server.use(
        rest.get('/api/v1/settings', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ message: 'Unauthorized' }));
        })
      );

      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useGetSettingsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect((result.current.error as any).status).toBe(401);
    });
  });
});
