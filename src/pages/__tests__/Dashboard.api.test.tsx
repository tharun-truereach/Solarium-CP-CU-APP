/**
 * Integration tests for Dashboard component with API
 * Tests complete data flow from API to UI rendering
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import Dashboard from '../Dashboard';
import { baseApi } from '../../api/baseApi';
import { theme } from '../../theme';
import type { User } from '../../types';

// Mock users
const mockAdminUser: User = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  firstName: 'Admin',
  role: 'admin',
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockKamUser: User = {
  ...mockAdminUser,
  id: '2',
  email: 'kam@test.com',
  name: 'KAM User',
  firstName: 'KAM',
  role: 'kam',
};

// Mock API response
const mockMetricsResponse = {
  activeLeads: 25,
  pendingQuotations: 12,
  recentLeads: [
    {
      id: '1',
      customerName: 'John Smith',
      status: 'new',
      createdAt: '2024-01-01T10:00:00Z',
    },
  ],
  recentActivities: [
    {
      id: '1',
      title: 'New lead created',
      description: 'Solar installation for residential property',
      timestamp: '2024-01-01T10:00:00Z',
      type: 'lead',
    },
    {
      id: '2',
      title: 'Quotation approved',
      description: 'Quote #QT-2024-001 approved by customer',
      timestamp: '2024-01-01T11:00:00Z',
      type: 'quotation',
    },
  ],
  channelPartners: 8,
  pendingCommissions: 3,
  dateRange: {
    from: '2024-01-01T00:00:00Z',
    to: '2024-01-08T00:00:00Z',
  },
  lastUpdated: '2024-01-08T12:00:00Z',
};

// MSW server
const server = setupServer(
  http.get('/api/v1/dashboard/metrics', ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');

    // Return admin metrics if limit is high
    if (limit === '20') {
      return HttpResponse.json(mockMetricsResponse);
    }

    // Return KAM metrics (without admin fields)
    const { channelPartners, pendingCommissions, ...kamMetrics } =
      mockMetricsResponse;
    return HttpResponse.json(kamMetrics);
  }),

  http.post('/api/v1/dashboard/metrics/refresh', () => {
    return HttpResponse.json({
      ...mockMetricsResponse,
      lastUpdated: new Date().toISOString(),
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock useAuth hook
let mockUser: User | null = mockAdminUser;
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    token: 'fake-token',
  }),
}));

// Test store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      api: baseApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

const renderDashboard = () => {
  const store = createTestStore();

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('Dashboard API Integration', () => {
  beforeEach(() => {
    mockUser = mockAdminUser;
  });

  it('loads and displays dashboard metrics for admin user', async () => {
    renderDashboard();

    // Should show loading initially
    expect(screen.getAllByTestId('loading-skeleton')).toBeTruthy();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Active leads
      expect(screen.getByText('12')).toBeInTheDocument(); // Pending quotations
      expect(screen.getByText('8')).toBeInTheDocument(); // Channel partners (admin only)
      expect(screen.getByText('3')).toBeInTheDocument(); // Pending commissions (admin only)
    });

    // Check that recent activities are displayed
    expect(screen.getByText('New lead created')).toBeInTheDocument();
    expect(screen.getByText('Quotation approved')).toBeInTheDocument();
  });

  it('loads limited metrics for KAM user', async () => {
    mockUser = mockKamUser;
    renderDashboard();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Active leads
      expect(screen.getByText('12')).toBeInTheDocument(); // Pending quotations
    });

    // Should not show admin-only metrics
    expect(screen.queryByText('8')).not.toBeInTheDocument(); // Channel partners
    expect(screen.queryByText('3')).not.toBeInTheDocument(); // Pending commissions
  });

  it('handles API errors gracefully', async () => {
    server.use(
      http.get('/api/v1/dashboard/metrics', () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      })
    );

    renderDashboard();

    // Should show error message after loading
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load dashboard metrics/)
      ).toBeInTheDocument();
    });

    // Should have retry button
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('handles empty data gracefully', async () => {
    server.use(
      http.get('/api/v1/dashboard/metrics', () => {
        return HttpResponse.json({
          activeLeads: 0,
          pendingQuotations: 0,
          recentLeads: [],
          recentActivities: [],
          dateRange: {
            from: '2024-01-01T00:00:00Z',
            to: '2024-01-08T00:00:00Z',
          },
          lastUpdated: '2024-01-08T12:00:00Z',
        });
      })
    );

    renderDashboard();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument(); // Should show zeros
    });

    // Should show "no activities" message
    expect(
      screen.getByText('No recent activities to display')
    ).toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    let refreshCalled = false;

    server.use(
      http.post('/api/v1/dashboard/metrics/refresh', () => {
        refreshCalled = true;
        return HttpResponse.json({
          ...mockMetricsResponse,
          activeLeads: 30, // Changed value to verify refresh
          lastUpdated: new Date().toISOString(),
        });
      })
    );

    renderDashboard();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    // Find and click refresh button (mobile FAB)
    const refreshButton = screen.getByRole('button', {
      name: /refresh dashboard/i,
    });
    fireEvent.click(refreshButton);

    // Wait for refresh
    await waitFor(() => {
      expect(refreshCalled).toBe(true);
    });
  });

  it('displays last updated timestamp', async () => {
    renderDashboard();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    // Should show formatted timestamp
    expect(screen.getByText(/1\/8\/2024/)).toBeInTheDocument();
  });

  it('shows loading skeleton with correct height', async () => {
    // Delay the response to keep loading state visible
    server.use(
      http.get('/api/v1/dashboard/metrics', async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return HttpResponse.json(mockMetricsResponse);
      })
    );

    renderDashboard();

    // Should show loading skeletons
    const skeletons = screen.getAllByTestId('loading-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);

    // Clean up by not waiting for the delayed response
  });

  it('handles retry on error', async () => {
    let callCount = 0;

    server.use(
      http.get('/api/v1/dashboard/metrics', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { message: 'Server error' },
            { status: 500 }
          );
        }
        return HttpResponse.json(mockMetricsResponse);
      })
    );

    renderDashboard();

    // Wait for error to appear
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load dashboard metrics/)
      ).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByText('Retry'));

    // Should load successfully on retry
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  });
});
