/**
 * NotificationsPage unit tests
 * Tests notification page functionality and user interactions
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../../api/apiSlice';
import { authSlice } from '../../store/slices/authSlice';
import { uiSlice } from '../../store/slices/uiSlice';
import NotificationsPage from '../NotificationsPage';

// Mock hooks
const mockNotifications = [
  {
    id: '1',
    type: 'system',
    title: 'System Update',
    message: 'System maintenance scheduled',
    status: 'unread',
    createdAt: '2023-01-01T00:00:00Z',
    userId: 'user1',
    priority: 'high',
  },
  {
    id: '2',
    type: 'lead',
    title: 'New Lead',
    message: 'New lead assigned',
    status: 'read',
    createdAt: '2023-01-01T01:00:00Z',
    userId: 'user1',
    priority: 'medium',
  },
];

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: 1,
    totalCount: 2,
    isLoading: false,
    isError: false,
    error: null,
    isPolling: true,
    lastPolled: new Date(),
    refresh: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    filter: {},
    setFilter: vi.fn(),
    clearFilter: vi.fn(),
    hasMore: false,
    loadMore: vi.fn(),
    getUnreadNotifications: () => [mockNotifications[0]],
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    },
  }),
}));

const createWrapper = () => {
  const store = configureStore({
    reducer: {
      api: apiSlice.reducer,
      auth: authSlice.reducer,
      ui: uiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );
};

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notifications page with notifications', () => {
    render(<NotificationsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('1 unread')).toBeInTheDocument();
    expect(screen.getByText('System Update')).toBeInTheDocument();
    expect(screen.getByText('New Lead')).toBeInTheDocument();
  });

  it('should show polling status when active', () => {
    render(<NotificationsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('should show refresh button', () => {
    render(<NotificationsPage />, { wrapper: createWrapper() });

    const refreshButton = screen.getByLabelText(/refresh notifications/i);
    expect(refreshButton).toBeInTheDocument();
  });

  it('should show notification filters', () => {
    render(<NotificationsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByLabelText(/search notifications/i)).toBeInTheDocument();
  });
});
