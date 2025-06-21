/**
 * Mock Service Worker handlers for dashboard API
 * Provides realistic data for development and testing
 */
import { rest } from 'msw';
import type { DashboardMetrics } from '../api/endpoints/dashboardEndpoints';

/**
 * Generate mock dashboard metrics
 */
const generateMockMetrics = (userRole: string = 'kam'): DashboardMetrics => {
  const baseMetrics: DashboardMetrics = {
    activeLeads: Math.floor(Math.random() * 50) + 10,
    pendingQuotations: Math.floor(Math.random() * 20) + 5,
    recentLeads: [
      {
        id: '1',
        customerName: 'John Smith',
        status: 'new',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        customerName: 'Jane Doe',
        status: 'in_discussion',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        customerName: 'Bob Johnson',
        status: 'won',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ],
    recentActivities: [
      {
        id: '1',
        title: 'New lead created',
        description: 'Solar installation for residential property',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'lead',
      },
      {
        id: '2',
        title: 'Quotation approved',
        description: 'Quote #QT-2024-001 approved by customer',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        type: 'quotation',
      },
      {
        id: '3',
        title: 'Commission processed',
        description: 'Payment released to CP-001',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: 'commission',
      },
    ],
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    },
    lastUpdated: new Date().toISOString(),
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  };

  // Add admin-specific metrics
  if (userRole === 'admin') {
    baseMetrics.channelPartners = Math.floor(Math.random() * 20) + 5;
    baseMetrics.pendingCommissions = Math.floor(Math.random() * 10) + 2;
    baseMetrics.totalRevenue = Math.floor(Math.random() * 1000000) + 500000;
  }

  return baseMetrics;
};

/**
 * MSW handlers for dashboard API endpoints
 */
export const dashboardMockHandlers = [
  // Get dashboard metrics
  rest.get('/api/v1/dashboard/metrics', async (req, res, ctx) => {
    // Simulate loading delay
    await new Promise(resolve =>
      setTimeout(resolve, Math.random() * 1000 + 500)
    );

    // Extract user role from request headers (in real app, from JWT)
    const userRole = req.headers.get('x-user-role') || 'kam';

    const metrics = generateMockMetrics(userRole);

    return res(ctx.json(metrics));
  }),

  // Refresh dashboard metrics
  rest.post('/api/v1/dashboard/metrics/refresh', async (req, res, ctx) => {
    // Simulate refresh delay
    await new Promise(resolve =>
      setTimeout(resolve, Math.random() * 800 + 200)
    );

    const userRole = req.headers.get('x-user-role') || 'kam';
    const metrics = generateMockMetrics(userRole);

    return res(ctx.json(metrics));
  }),

  // Error scenario for testing
  rest.get('/api/v1/dashboard/metrics/error', async (req, res, ctx) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    return res(
      ctx.status(500),
      ctx.json({
        message: 'Internal server error',
        code: 'DASHBOARD_METRICS_ERROR',
      })
    );
  }),
];

export default dashboardMockHandlers;
