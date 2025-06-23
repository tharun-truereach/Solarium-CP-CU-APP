/**
 * Mock authentication API for development and testing
 * Provides realistic login flow with different user roles
 */
import { rest } from 'msw';
import type {
  User,
  LoginCredentials,
  LoginResponse,
} from '../types/user.types';

// Mock user data for different roles
const mockUsers: Record<string, User> = {
  // Admin user
  'admin@solarium.com': {
    id: '1',
    email: 'admin@solarium.com',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    permissions: [
      'leads:read',
      'leads:write',
      'leads:delete',
      'quotations:read',
      'quotations:write',
      'quotations:approve',
      'commissions:read',
      'commissions:write',
      'commissions:approve',
      'users:read',
      'users:write',
      'users:delete',
      'master-data:read',
      'master-data:write',
      'reports:read',
      'reports:advanced',
      'settings:read',
      'settings:write',
    ],
    territories: [], // Admin has access to all territories
    phoneNumber: '+1-555-0101',
    department: 'Administration',
    isActive: true,
    isVerified: true,
    lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    timezone: 'America/New_York',
    language: 'en',
  },

  // KAM user
  'kam@solarium.com': {
    id: '2',
    email: 'kam@solarium.com',
    name: 'KAM User',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'kam',
    permissions: [
      'leads:read',
      'leads:write',
      'quotations:read',
      'quotations:write',
      'users:read',
    ],
    territories: ['North', 'Northeast'],
    phoneNumber: '+1-555-0102',
    department: 'Sales',
    manager: 'Admin User',
    isActive: true,
    isVerified: true,
    lastLoginAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    timezone: 'America/New_York',
    language: 'en',
  },
};

// Mock credentials
const mockCredentials: Record<string, string> = {
  'admin@solarium.com': 'password123',
  'kam@solarium.com': 'password123',
};

/**
 * Generate mock JWT token
 */
const generateMockToken = (user: User): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      territories: user.territories,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 4 * 60 * 60, // 4 hours
    })
  );
  const signature = btoa('mock-signature');

  return `${header}.${payload}.${signature}`;
};

/**
 * MSW handlers for authentication endpoints
 */
export const authMockHandlers = [
  // Login endpoint - match the expected API format
  rest.post(/.*\/api\/v1\/auth\/login$/, async (req, res, ctx) => {
    console.log('🎯 MSW: Login handler called!', req.url.href);

    try {
      // Check if request has body content
      const text = await req.text();
      console.log('📄 Raw request body:', text);

      if (!text || text.trim() === '') {
        console.log('❌ Empty request body');
        return res(
          ctx.status(400),
          ctx.json({ message: 'Request body is empty' })
        );
      }

      const body = JSON.parse(text) as LoginCredentials;
      console.log('🔐 Mock login attempt:', body.email);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Validate credentials
      const user = mockUsers[body.email];
      const validPassword = mockCredentials[body.email];

      if (!user || !validPassword || body.password !== validPassword) {
        console.log('❌ Invalid credentials for:', body.email);
        return res(
          ctx.status(401),
          ctx.json({
            message: 'Invalid email or password',
            errors: [
              {
                field: 'credentials',
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS',
              },
            ],
          })
        );
      }

      // Generate tokens
      const token = generateMockToken(user);
      const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

      // Update last login
      user.lastLoginAt = new Date().toISOString();

      // Return response in the format expected by AuthContext
      const response: LoginResponse = {
        user,
        token,
        refreshToken,
        expiresAt,
      };

      console.log(`✅ Mock login successful for ${user.role}: ${user.email}`);

      // Return the response directly (not wrapped in success/data structure)
      return res(ctx.json(response));
    } catch (error) {
      console.error('Mock login error:', error);
      return res(
        ctx.status(500),
        ctx.json({ message: 'Internal server error' })
      );
    }
  }),

  // Logout endpoint
  rest.post(/.*\/api\/v1\/auth\/logout$/, (req, res, ctx) => {
    console.log('🎯 MSW: Logout handler called!', req.url.href);
    console.log('🔐 Mock logout successful');
    return res(ctx.json({ message: 'Logout successful' }));
  }),

  // Token refresh endpoint
  rest.post(/.*\/api\/v1\/auth\/refresh$/, (req, res, ctx) => {
    console.log('🎯 MSW: Refresh handler called!', req.url.href);
    const newToken = `refreshed_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    return res(
      ctx.json({
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt,
      })
    );
  }),

  // Get current user endpoint
  rest.get(/.*\/api\/v1\/auth\/me$/, (req, res, ctx) => {
    console.log('🎯 MSW: Get user handler called!', req.url.href);
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return res(
        ctx.status(401),
        ctx.json({ message: 'No authorization header' })
      );
    }

    // Simple logic to determine user from common patterns
    const isAdminToken = authHeader.toLowerCase().includes('admin');

    const user = isAdminToken
      ? mockUsers['admin@solarium.com']
      : mockUsers['kam@solarium.com'];

    return res(ctx.json(user));
  }),

  // Token verification endpoint
  rest.get(/.*\/api\/v1\/auth\/verify$/, (req, res, ctx) => {
    console.log('🎯 MSW: Verify handler called!', req.url.href);
    const authHeader = req.headers.get('authorization');

    return res(
      ctx.json({
        valid: !!authHeader,
        message: authHeader ? 'Token is valid' : 'No token provided',
      })
    );
  }),
];

export { mockUsers, mockCredentials };
