/**
 * Integration tests for useNotifications hook with RTK Query
 */

import { renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Provider } from 'react-redux';
import { store } from '../../store/store';
import { useNotifications } from '../useNotifications';
import type { NotificationResponse } from '../../types/notification.types';

// Mock server
const server = setupServer(
  rest.get('/api/v1/notifications', (req, res, ctx) => {
    const mockResponse: NotificationResponse = {
      notifications: [
        {
          id: '1',
          title: 'Test Notification',
          message: 'Test message',
          type: 'SYSTEM',
          severity: 'info',
          read: false,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
      unreadCount: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    return res(ctx.json(mockResponse));
  })
);

// Wrapper for Redux Provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useNotifications Integration', () => {
  it('should fetch notifications from API', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.totalCount).toBe(1);
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.get('/api/v1/notifications', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.error).toBeDefined();
  });
});
