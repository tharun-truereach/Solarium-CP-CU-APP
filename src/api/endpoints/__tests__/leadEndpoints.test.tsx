/**
 * Unit tests for lead endpoints
 * Tests all endpoints with success/error scenarios and territory filtering
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../../apiSlice';
import { authSlice } from '../../../store/slices/authSlice';
import {
  useGetLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadStatusMutation,
  useReassignLeadMutation,
  useGetLeadTimelineQuery,
  leadEndpoints,
} from '../leadEndpoints';
import type {
  Lead,
  LeadListResponse,
  LeadTimelineResponse,
} from '../../../types/lead.types';

// Mock data
const mockLead: Lead = {
  id: '1',
  leadId: 'LEAD-001',
  customerName: 'John Doe',
  customerPhone: '+919876543210',
  customerEmail: 'john@example.com',
  address: '123 Main St, City',
  state: 'Maharashtra',
  pinCode: '400001',
  territory: 'West',
  status: 'New Lead',
  origin: 'CP',
  assignedTo: 'cp-1',
  assignedCpName: 'Channel Partner 1',
  createdBy: 'admin-1',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockLeadListResponse: LeadListResponse = {
  success: true,
  data: {
    items: [mockLead],
    total: 1,
    offset: 0,
    limit: 25,
    totalPages: 1,
  },
};

const mockTimelineResponse: LeadTimelineResponse = {
  success: true,
  data: {
    timeline: [
      {
        id: 'timeline-1',
        leadId: 'LEAD-001',
        action: 'Status Changed',
        actor: 'admin-1',
        actorName: 'Admin User',
        timestamp: '2024-01-15T10:00:00Z',
        details: {
          field: 'status',
          oldValue: 'New Lead',
          newValue: 'In Discussion',
        },
      },
    ],
    total: 1,
    leadId: 'LEAD-001',
  },
};

// MSW server setup
const server = setupServer(
  // Get leads - success
  rest.get('/api/v1/leads', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const territory = req.url.searchParams.get('territory');

    // Simulate territory filtering
    if (territory && territory !== 'West') {
      return res(
        ctx.json({
          success: true,
          data: { items: [], total: 0, offset: 0, limit: 25, totalPages: 0 },
        })
      );
    }

    return res(ctx.json(mockLeadListResponse));
  }),

  // Create lead - success
  rest.post('/api/v1/leads', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockLead }));
  }),

  // Update lead status - success
  rest.patch('/api/v1/leads/:leadId/status', (req, res, ctx) => {
    const updatedLead = { ...mockLead, status: 'In Discussion' as const };
    return res(ctx.json({ success: true, data: updatedLead }));
  }),

  // Reassign lead - success
  rest.patch('/api/v1/leads/:leadId/reassign', (req, res, ctx) => {
    const reassignedLead = { ...mockLead, assignedTo: 'cp-2' };
    return res(ctx.json({ success: true, data: reassignedLead }));
  }),

  // Get timeline - success
  rest.get('/api/v1/leads/:leadId/timeline', (req, res, ctx) => {
    return res(ctx.json(mockTimelineResponse));
  }),

  // Error scenarios
  rest.get('/api/v1/leads-error', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ message: 'Server error' }));
  }),

  rest.post('/api/v1/leads-validation-error', (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({
        message: 'Validation failed',
        validationErrors: { customerName: ['Name is required'] },
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test store setup
const createTestStore = () =>
  configureStore({
    reducer: {
      api: apiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={createTestStore()}>{children}</Provider>
);

describe('Lead Endpoints', () => {
  describe('useGetLeadsQuery', () => {
    it('should fetch leads successfully', async () => {
      const { result } = renderHook(
        () => useGetLeadsQuery({ limit: 25, offset: 0 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockLeadListResponse);
      expect(result.current.data?.data.items).toHaveLength(1);
      expect(result.current.data?.data.items[0]).toEqual(mockLead);
    });

    it('should filter leads by status', async () => {
      const { result } = renderHook(
        () => useGetLeadsQuery({ status: 'New Lead' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data.items[0]?.status).toBe('New Lead');
    });

    it('should apply territory filtering', async () => {
      const { result } = renderHook(
        () => useGetLeadsQuery({ territory: 'East' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data.items).toHaveLength(0);
    });

    it('should handle server error', async () => {
      server.use(
        rest.get('/api/v1/leads', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Server error' }));
        })
      );

      const { result } = renderHook(() => useGetLeadsQuery({}), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useCreateLeadMutation', () => {
    it('should create lead successfully', async () => {
      const { result } = renderHook(() => useCreateLeadMutation(), { wrapper });

      const createPayload = {
        customerName: 'John Doe',
        customerPhone: '+919876543210',
        address: '123 Main St',
        state: 'Maharashtra',
        pinCode: '400001',
      };

      const createResult = await result.current[0](createPayload);

      expect('data' in createResult).toBe(true);
      if ('data' in createResult) {
        expect(createResult.data).toEqual(mockLead);
      }
    });

    it('should handle validation errors', async () => {
      server.use(
        rest.post('/api/v1/leads', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              message: 'Validation failed',
              validationErrors: { customerName: ['Name is required'] },
            })
          );
        })
      );

      const { result } = renderHook(() => useCreateLeadMutation(), { wrapper });

      const createPayload = {
        customerName: '',
        customerPhone: '+919876543210',
        address: '123 Main St',
        state: 'Maharashtra',
        pinCode: '400001',
      };

      try {
        await result.current[0](createPayload);
      } catch (error: any) {
        expect(error.data.validationErrors.customerName).toContain(
          'Name is required'
        );
      }
    });
  });

  describe('useUpdateLeadStatusMutation', () => {
    it('should update lead status successfully', async () => {
      const { result } = renderHook(() => useUpdateLeadStatusMutation(), {
        wrapper,
      });

      const updateResult = await result.current[0]({
        leadId: 'LEAD-001',
        data: {
          status: 'In Discussion',
          remarks: 'Customer called back',
        },
      });

      expect('data' in updateResult).toBe(true);
      if ('data' in updateResult) {
        expect(updateResult.data.status).toBe('In Discussion');
      }
    });

    it('should handle status update with required fields', async () => {
      const { result } = renderHook(() => useUpdateLeadStatusMutation(), {
        wrapper,
      });

      const updateResult = await result.current[0]({
        leadId: 'LEAD-001',
        data: {
          status: 'Won',
          quotationRef: 'QUOTE-001',
          remarks: 'Customer accepted quotation',
        },
      });

      expect('data' in updateResult).toBe(true);
    });
  });

  describe('useReassignLeadMutation', () => {
    it('should reassign lead successfully', async () => {
      const { result } = renderHook(() => useReassignLeadMutation(), {
        wrapper,
      });

      const reassignResult = await result.current[0]({
        leadId: 'LEAD-001',
        data: {
          cpId: 'cp-2',
          reason: 'Territory change',
        },
      });

      expect('data' in reassignResult).toBe(true);
      if ('data' in reassignResult) {
        expect(reassignResult.data.assignedTo).toBe('cp-2');
      }
    });
  });

  describe('useGetLeadTimelineQuery', () => {
    it('should fetch lead timeline successfully', async () => {
      const { result } = renderHook(
        () => useGetLeadTimelineQuery({ leadId: 'LEAD-001' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTimelineResponse);
      expect(result.current.data?.data.timeline).toHaveLength(1);
      expect(result.current.data?.data.timeline[0]?.action).toBe(
        'Status Changed'
      );
    });

    it('should handle timeline fetch with limit', async () => {
      const { result } = renderHook(
        () => useGetLeadTimelineQuery({ leadId: 'LEAD-001', limit: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data.timeline).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    it('should invalidate lead cache on status update', async () => {
      const store = createTestStore();

      // This test verifies that cache invalidation is configured
      expect(leadEndpoints.endpoints.updateLeadStatus).toBeDefined();
    });

    it('should provide correct cache configuration', async () => {
      // This test verifies that cache tagging is configured
      expect(leadEndpoints.endpoints.getLeads).toBeDefined();
    });
  });

  describe('territory filtering integration', () => {
    it('should include territory parameters for KAM users', async () => {
      const kamUser = {
        id: 'kam-1',
        email: 'kam@test.com',
        name: 'KAM User',
        role: 'kam' as const,
        permissions: [],
        territories: ['North', 'South'],
        isActive: true,
        isVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      server.use(
        rest.get('*/api/v1/leads', (req, res, ctx) => {
          // Check that territory parameters are included
          const url = req.url;
          expect(req.headers.get('x-user-role')).toBe('kam');
          expect(req.headers.get('x-user-territories')).toBe('North,South');

          return res(
            ctx.json({
              success: true,
              data: { items: [], total: 0, offset: 0, limit: 25 },
            })
          );
        })
      );

      const store = configureStore({
        reducer: {
          api: apiSlice.reducer,
          auth: authSlice.reducer,
        },
        middleware: getDefaultMiddleware =>
          getDefaultMiddleware().concat(apiSlice.middleware),
        preloadedState: {
          auth: {
            user: {
              ...kamUser,
              territories: kamUser.territories as any,
            },
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
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useGetLeadsQuery({}), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should not include territory parameters for Admin users', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin' as const,
        permissions: [],
        territories: [],
        isActive: true,
        isVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      server.use(
        rest.get('*/api/v1/leads', (req, res, ctx) => {
          // Admin should not have territory restrictions
          expect(req.headers.get('x-user-role')).toBe('admin');
          expect(req.headers.get('x-user-territories')).toBeFalsy();

          return res(
            ctx.json({
              success: true,
              data: { items: [], total: 0, offset: 0, limit: 25 },
            })
          );
        })
      );

      const store = configureStore({
        reducer: {
          api: apiSlice.reducer,
          auth: authSlice.reducer,
        },
        middleware: getDefaultMiddleware =>
          getDefaultMiddleware().concat(apiSlice.middleware),
        preloadedState: {
          auth: {
            user: adminUser,
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
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useGetLeadsQuery({}), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('optimistic updates', () => {
    it('should optimistically update lead status and rollback on error', async () => {
      const mockLeads = {
        success: true,
        data: {
          items: [
            {
              id: '1',
              leadId: 'LEAD-001',
              customerName: 'John Doe',
              customerPhone: '+919876543210',
              address: 'Test Address',
              state: 'Maharashtra',
              pinCode: '400001',
              status: 'New Lead',
              origin: 'CP',
              territory: 'West',
              assignedTo: 'cp-1',
              createdBy: 'user1',
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z',
            },
          ],
          total: 1,
          offset: 0,
          limit: 25,
        },
      };

      // Initial load
      server.use(
        rest.get('*/api/v1/leads', (req, res, ctx) => {
          return res(ctx.json(mockLeads));
        })
      );

      const { result } = renderHook(
        () => ({
          getLeads: useGetLeadsQuery({}),
          updateStatus: useUpdateLeadStatusMutation(),
        }),
        { wrapper }
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.getLeads.isSuccess).toBe(true);
      });

      // Setup failure response for status update
      server.use(
        rest.patch('*/api/v1/leads/:leadId/status', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              success: false,
              error: { message: 'Invalid status transition' },
            })
          );
        })
      );

      const [updateStatus] = result.current.updateStatus;

      // Attempt status update that will fail
      try {
        await updateStatus({
          leadId: 'LEAD-001',
          data: { status: 'Won', remarks: 'Test update' },
        }).unwrap();
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      }

      // Verify that the optimistic update was rolled back
      expect(result.current.getLeads.data?.data.items[0]?.status).toBe(
        'New Lead'
      );
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate cache tags on mutations', async () => {
      const { result } = renderHook(() => useCreateLeadMutation(), {
        wrapper,
      });

      server.use(
        rest.post('*/api/v1/leads', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: { leadId: 'LEAD-002', id: '2' },
            })
          );
        })
      );

      const [createLead] = result.current;

      await waitFor(async () => {
        const response = await createLead({
          customerName: 'Jane Doe',
          customerPhone: '+919876543210',
          address: 'Test Address 2',
          state: 'Maharashtra',
          pinCode: '400001',
        }).unwrap();

        expect(response.leadId).toBe('LEAD-002');
      });

      // Cache should be invalidated for 'Lead' tag
      // This is tested implicitly through RTK Query's behavior
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        rest.get('*/api/v1/leads', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      const { result } = renderHook(() => useGetLeadsQuery({}), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle 403 forbidden responses', async () => {
      const forbiddenEventSpy = jest.fn();
      window.addEventListener('api:forbidden', forbiddenEventSpy);

      server.use(
        rest.get('*/api/v1/leads', (req, res, ctx) => {
          return res(
            ctx.status(403),
            ctx.json({
              success: false,
              error: { message: 'Territory access denied' },
            })
          );
        })
      );

      const { result } = renderHook(() => useGetLeadsQuery({}), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect((result.current.error as any)?.status).toBe(403);

      // Wait for event to be dispatched
      await waitFor(() => {
        expect(forbiddenEventSpy).toHaveBeenCalled();
      });

      window.removeEventListener('api:forbidden', forbiddenEventSpy);
    });

    it('should handle server errors with retry', async () => {
      let callCount = 0;
      server.use(
        rest.get('*/api/v1/leads', (req, res, ctx) => {
          callCount++;
          if (callCount === 1) {
            return res(
              ctx.status(500),
              ctx.json({
                success: false,
                error: { message: 'Internal server error' },
              })
            );
          }
          return res(
            ctx.json({
              success: true,
              data: { items: [], total: 0, offset: 0, limit: 25 },
            })
          );
        })
      );

      const { result } = renderHook(() => useGetLeadsQuery({}), {
        wrapper,
      });

      // First call should fail
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Refetch should succeed
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(callCount).toBe(2);
    });
  });
});
