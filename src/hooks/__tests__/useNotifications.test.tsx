/**
 * Unit tests for useNotifications hook
 * Tests polling, filtering, and notification management functionality
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../store/store';
import {
  useNotifications,
  selectUnreadCount,
  filterNotifications,
} from '../useNotifications';
import type {
  Notification,
  NotificationFilter,
} from '../../types/notification.types';

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Test Notification 1',
    message: 'Test message 1',
    type: 'SYSTEM',
    severity: 'info',
    read: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Test Notification 2',
    message: 'Test message 2',
    type: 'LEAD_UPDATE',
    severity: 'success',
    read: true,
    createdAt: '2024-01-02T00:00:00Z',
    readAt: '2024-01-02T01:00:00Z',
  },
];

// Wrapper for Redux Provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useNotifications', () => {
  beforeEach(() => {
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.filter).toEqual({
      status: 'all',
      type: 'all',
    });
  });

  it('should update filter and reset page', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.currentPage).toBe(2);

    act(() => {
      result.current.setFilter({ status: 'unread' });
    });

    expect(result.current.filter.status).toBe('unread');
    expect(result.current.currentPage).toBe(1); // Should reset to page 1
  });

  it('should handle pagination correctly', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Mock having multiple pages
    act(() => {
      result.current.goToPage(1);
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.hasPreviousPage).toBe(false);

    act(() => {
      result.current.nextPage();
    });
  });

  it('should reset filter to defaults', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.setFilter({ status: 'read', type: 'SYSTEM' });
    });

    expect(result.current.filter.status).toBe('read');
    expect(result.current.filter.type).toBe('SYSTEM');

    act(() => {
      result.current.resetFilter();
    });

    expect(result.current.filter).toEqual({
      status: 'all',
      type: 'all',
    });
  });
});

describe('selectUnreadCount', () => {
  it('should calculate unread count correctly', () => {
    const count = selectUnreadCount(mockNotifications);
    expect(count).toBe(1); // Only first notification is unread
  });

  it('should return 0 for empty array', () => {
    const count = selectUnreadCount([]);
    expect(count).toBe(0);
  });

  it('should return 0 when all notifications are read', () => {
    const readNotifications = mockNotifications.map(n => ({
      ...n,
      read: true,
    }));
    const count = selectUnreadCount(readNotifications);
    expect(count).toBe(0);
  });
});

describe('filterNotifications', () => {
  it('should filter by status correctly', () => {
    const unreadFilter: NotificationFilter = { status: 'unread' };
    const filtered = filterNotifications(mockNotifications, unreadFilter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.read).toBe(false);

    const readFilter: NotificationFilter = { status: 'read' };
    const readFiltered = filterNotifications(mockNotifications, readFilter);
    expect(readFiltered).toHaveLength(1);
    expect(readFiltered[0]?.read).toBe(true);
  });

  it('should filter by type correctly', () => {
    const systemFilter: NotificationFilter = { type: 'SYSTEM' };
    const filtered = filterNotifications(mockNotifications, systemFilter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.type).toBe('SYSTEM');
  });

  it('should filter by date range', () => {
    const dateFilter: NotificationFilter = {
      dateFrom: '2024-01-01T00:00:00Z',
      dateTo: '2024-01-01T23:59:59Z',
    };
    const filtered = filterNotifications(mockNotifications, dateFilter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('1');
  });

  it('should return all notifications with no filter', () => {
    const allFilter: NotificationFilter = { status: 'all', type: 'all' };
    const filtered = filterNotifications(mockNotifications, allFilter);
    expect(filtered).toHaveLength(2);
  });
});
