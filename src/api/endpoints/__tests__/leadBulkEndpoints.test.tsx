/**
 * Tests for lead bulk operation endpoints
 */
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import React from 'react';
import { apiSlice } from '../../apiSlice';
import {
  useBulkUpdateLeadsMutation,
  useBulkReassignLeadsMutation,
  useImportLeadsMutation,
  useExportLeadsQuery,
} from '../leadEndpoints';

// Mock server setup
const server = setupServer();

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

describe('Lead Bulk Endpoints', () => {
  describe('useBulkUpdateLeadsMutation', () => {
    it('should validate max 50 leads client-side', async () => {
      const { result } = renderHook(() => useBulkUpdateLeadsMutation(), {
        wrapper,
      });

      const [bulkUpdate] = result.current;
      const leadIds = Array.from({ length: 51 }, (_, i) => `LEAD-${i + 1}`);

      await expect(
        bulkUpdate({
          leadIds,
          updates: { status: 'In Discussion', remarks: 'Test update' },
        }).unwrap()
      ).rejects.toThrow('Cannot update more than 50 leads at once');
    });

    it('should successfully update multiple leads', async () => {
      server.use(
        rest.patch('/api/v1/leads/bulk', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                total: 3,
                successful: 2,
                failed: 1,
                results: [
                  { id: 'LEAD-001', success: true },
                  { id: 'LEAD-002', success: true },
                  { id: 'LEAD-003', success: false, error: 'Invalid status' },
                ],
              },
            })
          );
        })
      );

      const { result } = renderHook(() => useBulkUpdateLeadsMutation(), {
        wrapper,
      });

      const [bulkUpdate] = result.current;
      const response = await bulkUpdate({
        leadIds: ['LEAD-001', 'LEAD-002', 'LEAD-003'],
        updates: { status: 'In Discussion', remarks: 'Test update' },
      }).unwrap();

      expect(response).toEqual({
        success: true,
        data: {
          total: 3,
          successful: 2,
          failed: 1,
          results: expect.any(Array),
        },
      });
    });
  });

  describe('useImportLeadsMutation', () => {
    it('should handle successful import', async () => {
      const mockFile = new File(
        ['name,phone\nJohn Doe,1234567890'],
        'test.csv',
        {
          type: 'text/csv',
        }
      );

      server.use(
        rest.post('/api/v1/leads/import', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                total: 1,
                imported: 1,
                errors: [],
              },
            })
          );
        })
      );

      const { result } = renderHook(() => useImportLeadsMutation(), {
        wrapper,
      });

      const [importLeads] = result.current;
      const response = await importLeads({ file: mockFile }).unwrap();

      expect(response).toEqual({
        success: true,
        data: {
          total: 1,
          imported: 1,
          errors: [],
        },
      });
    });

    it('should handle import validation errors', async () => {
      const mockFile = new File(['invalid,data'], 'test.csv', {
        type: 'text/csv',
      });

      server.use(
        rest.post('/api/v1/leads/import', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              success: false,
              data: {
                total: 1,
                imported: 0,
                errors: [
                  {
                    row: 1,
                    field: 'phone',
                    value: 'data',
                    message: 'Invalid phone number format',
                  },
                ],
              },
            })
          );
        })
      );

      const { result } = renderHook(() => useImportLeadsMutation(), {
        wrapper,
      });

      const [importLeads] = result.current;

      await expect(
        importLeads({ file: mockFile }).unwrap()
      ).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining('Failed to import leads'),
      });
    });
  });

  describe('useExportLeadsQuery', () => {
    it('should export leads as CSV blob', async () => {
      const mockBlob = new Blob(['name,phone\nJohn Doe,1234567890'], {
        type: 'text/csv',
      });

      server.use(
        rest.get('/api/v1/leads/export', (req, res, ctx) => {
          return res(ctx.body(mockBlob));
        })
      );

      const { result } = renderHook(
        () => useExportLeadsQuery({ status: 'New Lead' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeInstanceOf(Blob);
      expect(result.current.data?.type).toBe('text/csv');
    });
  });
});
