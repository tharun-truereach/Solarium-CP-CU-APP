/**
 * Mock Settings API for development and testing
 * Provides realistic settings management endpoints
 */
import { rest } from 'msw';
import type {
  SystemSettings,
  AuditLogResponse,
  SettingsAuditLog,
} from '../types/settings.types';

// Mock settings data
const mockSettings = {
  sessionTimeoutMin: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  passwordComplexity: 'medium',
  tokenExpiryMin: 240,
  requireMFA: false,
  featureFlags: {
    ADVANCED_REPORTING: true,
    BETA_FEATURES: false,
    DARK_MODE: true,
    ANALYTICS: false,
    BULK_OPERATIONS: true,
    DEBUG_MODE: true,
  },
  thresholds: {
    maxFileSize: 10485760,
    maxRecordsPerPage: 100,
    apiRateLimit: 1000,
    sessionWarningMin: 5,
  },
  lastUpdated: new Date().toISOString(),
  updatedBy: 'admin@solarium.com',
  version: '1.2.0',
};

// Mock audit logs
const mockAuditLogs = [
  {
    id: '1',
    field: 'sessionTimeoutMin',
    oldValue: '60',
    newValue: '30',
    changedBy: 'admin@solarium.com',
    changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reason: 'Enhanced security policy',
    ipAddress: '192.168.1.100',
  },
  {
    id: '2',
    field: 'featureFlags.BETA_FEATURES',
    oldValue: 'true',
    newValue: 'false',
    changedBy: 'admin@solarium.com',
    changedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    reason: 'Disabled for production stability',
    ipAddress: '192.168.1.100',
  },
];

/**
 * MSW handlers for settings endpoints
 */
export const settingsMockHandlers = [
  // Get system settings - /settings
  rest.get(/.*\/settings$/, (req, res, ctx) => {
    console.log('🎯 MSW: Get settings handler called!', req.url.href);
    return res(ctx.json(mockSettings));
  }),

  // Update system settings - /settings
  rest.patch(/.*\/settings$/, async (req, res, ctx) => {
    console.log('🎯 MSW: Update settings handler called!', req.url.href);

    try {
      const updateData = await req.json();
      const updatedSettings = {
        ...mockSettings,
        ...updateData,
        lastUpdated: new Date().toISOString(),
      };

      Object.assign(mockSettings, updatedSettings);

      await new Promise(resolve => setTimeout(resolve, 500));
      return res(ctx.json(updatedSettings));
    } catch (error) {
      return res(
        ctx.status(500),
        ctx.json({ message: 'Internal server error' })
      );
    }
  }),

  // Get settings audit logs - /settings/audit
  rest.get(/.*\/settings\/audit$/, (req, res, ctx) => {
    console.log('🎯 MSW: Get audit logs handler called!', req.url.href);

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = mockAuditLogs.slice(startIndex, endIndex);

    const response = {
      logs: paginatedLogs,
      total: mockAuditLogs.length,
      page,
      limit,
      totalPages: Math.ceil(mockAuditLogs.length / limit),
    };

    return res(ctx.json(response));
  }),
];
