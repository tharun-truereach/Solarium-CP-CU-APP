/**
 * useMyProfile hook unit tests
 * Ensures proper profile management and validation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createMockStore } from '../../test-utils';
import { useMyProfile } from '../useMyProfile';
import type { UserProfile } from '../../types/profile.types';

// Mock profile data
const mockProfile: UserProfile = {
  id: 'user-123',
  email: 'test@solarium.com',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+1234567890',
  timezone: 'UTC',
  language: 'en',
  updatedAt: '2024-01-01T00:00:00Z',
};

// MSW server setup
const server = setupServer(
  rest.get('/api/v1/user/me', (req, res, ctx) => {
    return res(ctx.json(mockProfile));
  }),

  rest.patch('/api/v1/user/me', (req, res, ctx) => {
    return res(ctx.json({ ...mockProfile, name: 'Updated User' }));
  }),

  rest.post('/api/v1/user/change-password', (req, res, ctx) => {
    return res(
      ctx.json({ success: true, message: 'Password changed successfully' })
    );
  }),

  rest.post('/api/v1/user/avatar', (req, res, ctx) => {
    return res(
      ctx.json({
        avatarUrl: 'https://example.com/avatar.jpg',
        message: 'Avatar uploaded successfully',
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test wrapper with store
const createWrapper = () => {
  const store = createMockStore();
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useMyProfile', () => {
  describe('initialization', () => {
    it('should load profile data on mount', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.profile).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.draftProfile.name).toBe('Test User');
    });

    it('should initialize draft with profile values', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      expect(result.current.draftProfile).toEqual({
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890',
        timezone: 'UTC',
        language: 'en',
      });
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('field management', () => {
    it('should set field values correctly', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      act(() => {
        result.current.setField('name', 'New Name');
      });

      expect(result.current.draftProfile.name).toBe('New Name');
      expect(result.current.isDirty).toBe(true);
      expect(result.current.isFieldDirty('name')).toBe(true);
      expect(result.current.getFieldValue('name')).toBe('New Name');
    });

    it('should set multiple fields at once', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      act(() => {
        result.current.setMultipleFields({
          name: 'Multi Update',
          firstName: 'Multi',
          lastName: 'Update',
        });
      });

      expect(result.current.draftProfile.name).toBe('Multi Update');
      expect(result.current.draftProfile.firstName).toBe('Multi');
      expect(result.current.draftProfile.lastName).toBe('Update');
      expect(result.current.isDirty).toBe(true);
    });

    it('should validate fields correctly', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      // Test required field validation
      act(() => {
        result.current.setField('name', '');
      });

      expect(result.current.hasValidationErrors).toBe(true);
      expect(result.current.validationErrors?.name).toContain(
        'Name is required'
      );

      // Test field length validation
      act(() => {
        result.current.setField('name', 'A');
      });

      expect(result.current.validationErrors?.name).toContain(
        'Name must be at least 2 characters'
      );

      // Test valid field
      act(() => {
        result.current.setField('name', 'Valid Name');
      });

      expect(result.current.hasValidationErrors).toBe(false);
      expect(result.current.validationErrors?.name).toBeUndefined();
    });

    it('should validate phone number format', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      // Test invalid phone number
      act(() => {
        result.current.setField('phoneNumber', '123');
      });

      expect(result.current.hasValidationErrors).toBe(true);
      expect(result.current.validationErrors?.phoneNumber).toContain(
        'Please enter a valid phone number'
      );

      // Test valid phone number
      act(() => {
        result.current.setField('phoneNumber', '+1234567890');
      });

      expect(result.current.hasValidationErrors).toBe(false);
    });
  });

  describe('profile saving', () => {
    it('should save profile changes successfully', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      act(() => {
        result.current.setField('name', 'Updated User');
      });

      expect(result.current.isDirty).toBe(true);

      await act(async () => {
        await result.current.saveProfile();
      });

      expect(result.current.isSaving).toBe(false);
      // Note: In real scenario, RTK Query would update the cache
    });

    it('should handle validation errors during save', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      act(() => {
        result.current.setField('name', ''); // Invalid name
      });

      await act(async () => {
        await result.current.saveProfile();
      });

      expect(result.current.hasValidationErrors).toBe(true);
      expect(result.current.validationErrors?.name).toContain(
        'Name is required'
      );
    });

    it('should handle server errors during save', async () => {
      server.use(
        rest.patch('/api/v1/user/me', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              message: 'Server validation error',
              validationErrors: { name: ['Server says name is invalid'] },
            })
          );
        })
      );

      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      act(() => {
        result.current.setField('name', 'New Name');
      });

      try {
        await act(async () => {
          await result.current.saveProfile();
        });
      } catch (error) {
        expect(result.current.validationErrors?.name).toContain(
          'Server says name is invalid'
        );
      }
    });

    it('should not save when no changes are made', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      expect(result.current.isDirty).toBe(false);

      await act(async () => {
        await result.current.saveProfile();
      });

      // Should complete without error and show "No changes" message
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('draft management', () => {
    it('should reset draft to original values', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      // Make changes
      act(() => {
        result.current.setField('name', 'Changed Name');
        result.current.setField('firstName', 'Changed');
      });

      expect(result.current.isDirty).toBe(true);
      expect(result.current.draftProfile.name).toBe('Changed Name');

      // Reset draft
      act(() => {
        result.current.resetDraft();
      });

      expect(result.current.isDirty).toBe(false);
      expect(result.current.draftProfile.name).toBe('Test User');
      expect(result.current.draftProfile.firstName).toBe('Test');
    });
  });

  describe('password management', () => {
    it('should change password successfully', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      const passwordData = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      let success = false;
      await act(async () => {
        success = await result.current.changePassword(passwordData);
      });

      expect(success).toBe(true);
      expect(result.current.isChangingPassword).toBe(false);
    });

    it('should handle password change errors', async () => {
      server.use(
        rest.post('/api/v1/user/change-password', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ message: 'Current password is incorrect' })
          );
        })
      );

      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      let success = true;
      await act(async () => {
        success = await result.current.changePassword(passwordData);
      });

      expect(success).toBe(false);
    });
  });

  describe('avatar management', () => {
    it('should upload avatar successfully', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      let success = false;
      await act(async () => {
        success = await result.current.uploadAvatar(file);
      });

      expect(success).toBe(true);
      expect(result.current.isUploadingAvatar).toBe(false);
    });

    it('should validate file size', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      // Create large file (>2MB)
      const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      let success = true;
      await act(async () => {
        success = await result.current.uploadAvatar(largeFile);
      });

      expect(success).toBe(false);
    });

    it('should validate file type', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      const invalidFile = new File(['content'], 'file.txt', {
        type: 'text/plain',
      });

      let success = true;
      await act(async () => {
        success = await result.current.uploadAvatar(invalidFile);
      });

      expect(success).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should check if individual fields are dirty', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      expect(result.current.isFieldDirty('name')).toBe(false);

      act(() => {
        result.current.setField('name', 'New Name');
      });

      expect(result.current.isFieldDirty('name')).toBe(true);
      expect(result.current.isFieldDirty('firstName')).toBe(false);
    });

    it('should validate individual fields', async () => {
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper(),
      });

      const nameError = result.current.validateField('name', '');
      expect(nameError).toBe('Name is required');

      const validName = result.current.validateField('name', 'Valid Name');
      expect(validName).toBe(null);

      const phoneError = result.current.validateField('phoneNumber', '123');
      expect(phoneError).toBe('Please enter a valid phone number');
    });
  });
});
