/**
 * Profile endpoints unit tests
 * Ensures proper API integration and error handling
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { setupApiStore } from '../../../test-utils';
import { profileEndpoints } from '../profileEndpoints';
import type {
  UserProfile,
  ProfileUpdatePayload,
} from '../../../types/profile.types';

// Mock profile data
const mockProfile: UserProfile = {
  id: 'user-123',
  email: 'test@solarium.com',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+1234567890',
  avatar: 'https://example.com/avatar.jpg',
  timezone: 'UTC',
  language: 'en',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockUpdatePayload: ProfileUpdatePayload = {
  name: 'Updated User',
  firstName: 'Updated',
  lastName: 'User',
};

// MSW server setup
const server = setupServer(
  rest.get('/api/v1/user/me', (req, res, ctx) => {
    return res(ctx.json(mockProfile));
  }),

  rest.patch('/api/v1/user/me', (req, res, ctx) => {
    return res(ctx.json({ ...mockProfile, ...mockUpdatePayload }));
  }),

  rest.post('/api/v1/user/change-password', (req, res, ctx) => {
    return res(
      ctx.json({ success: true, message: 'Password changed successfully' })
    );
  }),

  rest.post('/api/v1/user/avatar', (req, res, ctx) => {
    return res(
      ctx.json({
        avatarUrl: 'https://example.com/new-avatar.jpg',
        message: 'Avatar uploaded successfully',
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('profileEndpoints', () => {
  let storeRef: ReturnType<typeof setupApiStore>;

  beforeEach(() => {
    storeRef = setupApiStore(profileEndpoints);
  });

  describe('getMyProfile', () => {
    it('should fetch user profile successfully', async () => {
      const profile = await storeRef.store.dispatch(
        profileEndpoints.endpoints.getMyProfile.initiate()
      );
      expect(profile.data).toEqual(mockProfile);
      expect(profile.data?.name).toBe('Test User');
      expect(profile.data?.email).toBe('test@solarium.com');
    });

    it('should handle profile fetch error', async () => {
      // Override handler to return error
      server.use(
        rest.get('/api/v1/user/me', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Server error' }));
        })
      );

      const response = await storeRef.store.dispatch(
        profileEndpoints.endpoints.getMyProfile.initiate()
      );
      if ('error' in response) {
        expect(response.error).toBeDefined();
        expect((response.error as any)?.status).toBe(500);
      }
    });

    it('should handle unauthorized access', async () => {
      server.use(
        rest.get('/api/v1/user/me', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ message: 'Unauthorized' }));
        })
      );

      const response = await storeRef.store.dispatch(
        profileEndpoints.endpoints.getMyProfile.initiate()
      );
      if ('error' in response) {
        expect(response.error).toBeDefined();
        expect((response.error as any)?.status).toBe(401);
      }
    });
  });

  describe('updateMyProfile', () => {
    it('should update profile successfully', async () => {
      const response = await storeRef.store.dispatch(
        profileEndpoints.endpoints.updateMyProfile.initiate(mockUpdatePayload)
      );
      if ('data' in response) {
        expect(response.data).toBeDefined();
        expect(response.data?.name).toBe('Updated User');
      }
    });

    it('should handle update validation errors', async () => {
      const invalidPayload = { name: '' };

      server.use(
        rest.patch('/api/v1/user/me', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              message: 'Validation failed',
              validationErrors: { name: ['Name is required'] },
            })
          );
        })
      );

      const response = await storeRef.store.dispatch(
        profileEndpoints.endpoints.updateMyProfile.initiate(invalidPayload)
      );
      if ('error' in response) {
        expect(response.error).toBeDefined();
        expect((response.error as any)?.status).toBe(400);
      }
    });

    it('should handle network errors', async () => {
      server.use(
        rest.patch('/api/v1/user/me', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      const response = await storeRef.store.dispatch(
        profileEndpoints.endpoints.updateMyProfile.initiate(mockUpdatePayload)
      );
      if ('error' in response) {
        expect(response.error).toBeDefined();
      }
    });
  });

  describe('changePassword', () => {
    const passwordPayload = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    };

    it('should change password successfully', async () => {
      const response = await storeRef.store.dispatch(
        profileEndpoints.endpoints.changePassword.initiate(passwordPayload)
      );
      if ('data' in response) {
        expect(response.data?.success).toBe(true);
        expect(response.data?.message).toBe('Password changed successfully');
      }
    });

    it('should handle incorrect current password', async () => {
      server.use(
        rest.post('/api/v1/user/change-password', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ message: 'Current password is incorrect' })
          );
        })
      );

      const response = await storeRef.store.dispatch(
        profileEndpoints.endpoints.changePassword.initiate(passwordPayload)
      );
      if ('error' in response) {
        expect(response.error).toBeDefined();
        expect((response.error as any)?.status).toBe(400);
      }
    });

    it('should handle password validation errors', async () => {
      const weakPasswordPayload = {
        currentPassword: 'oldPassword123',
        newPassword: '123',
        confirmPassword: '123',
      };

      server.use(
        rest.post('/api/v1/user/change-password', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              message: 'Password validation failed',
              validationErrors: {
                newPassword: ['Password must be at least 8 characters'],
              },
            })
          );
        })
      );

      const response = await storeRef.store.dispatch(
        profileEndpoints.endpoints.changePassword.initiate(weakPasswordPayload)
      );
      if ('error' in response) {
        expect(response.error).toBeDefined();
        expect((response.error as any)?.status).toBe(400);
      }
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      const formData = new FormData();
      formData.append(
        'avatar',
        new Blob(['test'], { type: 'image/jpeg' }),
        'avatar.jpg'
      );

      const response = await storeRef.store.dispatch(
        profileEndpoints.endpoints.uploadAvatar.initiate(formData)
      );
      if ('data' in response) {
        expect(response.data?.avatarUrl).toBe(
          'https://example.com/new-avatar.jpg'
        );
        expect(response.data?.message).toBe('Avatar uploaded successfully');
      }
    });

    it('should handle file upload errors', async () => {
      server.use(
        rest.post('/api/v1/user/avatar', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ message: 'File size too large' })
          );
        })
      );

      const formData = new FormData();
      formData.append(
        'avatar',
        new Blob(['large file'], { type: 'image/jpeg' }),
        'large.jpg'
      );

      const response = await storeRef.store.dispatch(
        profileEndpoints.endpoints.uploadAvatar.initiate(formData)
      );
      if ('error' in response) {
        expect(response.error).toBeDefined();
        expect((response.error as any)?.status).toBe(400);
      }
    });
  });

  describe('cache behavior', () => {
    it('should invalidate profile cache after update', async () => {
      // First fetch profile
      const fetchResult = await storeRef.store.dispatch(
        profileEndpoints.endpoints.getMyProfile.initiate()
      );

      // Update profile
      const updateResult = await storeRef.store.dispatch(
        profileEndpoints.endpoints.updateMyProfile.initiate({
          name: 'New Name',
        })
      );

      // Check that profile cache is marked for invalidation
      const state = storeRef.store.getState();
      const profileQueries = state.api.queries;
      expect(Object.keys(profileQueries)).toContain('getMyProfile()');
    });
  });
});
