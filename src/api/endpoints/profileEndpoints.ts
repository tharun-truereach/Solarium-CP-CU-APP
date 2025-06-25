/**
 * Profile API endpoints using RTK Query
 * Handles user profile management with optimistic updates and proper caching
 */

import { apiSlice } from '../apiSlice';
import type {
  UserProfile,
  ProfileUpdatePayload,
  PasswordChangePayload,
  PasswordChangeResponse,
  AvatarUploadResponse,
  ProfileApiError,
} from '../../types/profile.types';

/**
 * Profile endpoints extension of base API
 */
export const profileEndpoints = apiSlice.injectEndpoints({
  endpoints: builder => ({
    /**
     * Get current user profile
     */
    getMyProfile: builder.query<UserProfile, void>({
      query: () => ({
        url: '/user/me',
        method: 'GET',
      }),
      providesTags: ['Profile'],
      transformResponse: (response: UserProfile) => {
        console.log('✅ Profile loaded successfully:', {
          userId: response.id,
          name: response.name,
          email: response.email,
          hasAvatar: !!response.avatar,
          lastUpdated: response.updatedAt,
        });
        return response;
      },
      transformErrorResponse: (response: any): ProfileApiError => {
        console.error(
          '❌ Failed to load profile:',
          response.status,
          response.data?.message
        );
        return {
          status: response.status,
          message: response.data?.message || 'Failed to load profile',
          field: response.data?.field,
          validationErrors: response.data?.validationErrors,
        };
      },
    }),

    /**
     * Update user profile with optimistic updates and rollback
     */
    updateMyProfile: builder.mutation<UserProfile, ProfileUpdatePayload>({
      query: profileData => ({
        url: '/user/me',
        method: 'PATCH',
        data: profileData,
      }),
      invalidatesTags: ['Profile'],

      // Optimistic update with rollback on failure
      onQueryStarted: async (
        profileData,
        { dispatch, queryFulfilled, getState }
      ) => {
        // Create optimistic update
        const patchResult = dispatch(
          profileEndpoints.util.updateQueryData(
            'getMyProfile',
            undefined,
            draft => {
              // Apply optimistic changes
              Object.assign(draft, profileData);
              draft.updatedAt = new Date().toISOString();
            }
          )
        );

        try {
          const { data } = await queryFulfilled;
          console.log('✅ Profile updated successfully:', {
            updatedFields: Object.keys(profileData),
            timestamp: data.updatedAt,
          });
        } catch (error: any) {
          console.error('❌ Profile update failed, rolling back:', error);
          // Rollback optimistic update
          patchResult.undo();

          // Ensure we refetch to get canonical state
          dispatch(profileEndpoints.util.invalidateTags(['Profile']));
        }
      },

      transformResponse: (response: UserProfile) => {
        return response;
      },

      transformErrorResponse: (response: any): ProfileApiError => {
        console.error(
          '❌ Profile update error:',
          response.status,
          response.data?.message
        );
        return {
          status: response.status,
          message: response.data?.message || 'Failed to update profile',
          field: response.data?.field,
          validationErrors: response.data?.validationErrors,
        };
      },
    }),

    /**
     * Change user password
     */
    changePassword: builder.mutation<
      PasswordChangeResponse,
      PasswordChangePayload
    >({
      query: passwordData => ({
        url: '/user/change-password',
        method: 'POST',
        data: passwordData,
      }),
      // Don't cache password change requests
      invalidatesTags: ['Profile'],

      transformResponse: (response: PasswordChangeResponse) => {
        console.log('✅ Password changed successfully:', {
          requiresReauth: response.requiresReauth,
        });
        return response;
      },

      transformErrorResponse: (response: any): ProfileApiError => {
        console.error(
          '❌ Password change error:',
          response.status,
          response.data?.message
        );
        return {
          status: response.status,
          message: response.data?.message || 'Failed to change password',
          field: response.data?.field,
          validationErrors: response.data?.validationErrors,
        };
      },
    }),

    /**
     * Upload user avatar
     */
    uploadAvatar: builder.mutation<AvatarUploadResponse, FormData>({
      query: avatarFormData => ({
        url: '/user/avatar',
        method: 'POST',
        data: avatarFormData,
        headers: {
          // Don't set Content-Type, let browser set it for FormData
        },
      }),
      invalidatesTags: ['Profile'],

      transformResponse: (response: AvatarUploadResponse) => {
        console.log('✅ Avatar uploaded successfully:', {
          avatarUrl: response.avatarUrl,
        });
        return response;
      },

      transformErrorResponse: (response: any): ProfileApiError => {
        console.error(
          '❌ Avatar upload error:',
          response.status,
          response.data?.message
        );
        return {
          status: response.status,
          message: response.data?.message || 'Failed to upload avatar',
          field: response.data?.field,
          validationErrors: response.data?.validationErrors,
        };
      },
    }),
  }),
  overrideExisting: true,
});

/**
 * Export hooks for use in components
 */
export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
} = profileEndpoints;

/**
 * Export endpoint selectors for advanced usage
 */
export const profileSelectors = profileEndpoints.endpoints;

/**
 * Export endpoints for direct access
 */
export default profileEndpoints;
