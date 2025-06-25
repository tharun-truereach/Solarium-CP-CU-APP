/**
 * Custom hook for managing user profile with local draft state
 * Provides editable profile management without persistent Redux slice
 */

import { useState, useCallback, useMemo } from 'react';
import { useImmer } from 'use-immer';
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
} from '../api/endpoints/profileEndpoints';
import { useAppDispatch } from '../store/hooks';
import { showToast } from '../store/slices/uiSlice';
import type {
  UserProfile,
  ProfileUpdatePayload,
  PasswordChangePayload,
  ProfileApiError,
} from '../types/profile.types';

/**
 * Profile field type for type-safe field updates
 */
export type ProfileField = keyof ProfileUpdatePayload;

/**
 * Hook return interface
 */
export interface UseMyProfileReturn {
  // Profile data
  profile: UserProfile | undefined;
  draftProfile: ProfileUpdatePayload;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isChangingPassword: boolean;
  isUploadingAvatar: boolean;

  // State flags
  isDirty: boolean;
  hasValidationErrors: boolean;

  // Error states
  error: ProfileApiError | null;
  validationErrors: Record<string, string[]> | undefined;

  // Profile management functions
  setField: (field: ProfileField, value: string) => void;
  setMultipleFields: (fields: Partial<ProfileUpdatePayload>) => void;
  saveProfile: () => Promise<void>;
  resetDraft: () => void;

  // Password management
  changePassword: (passwordData: PasswordChangePayload) => Promise<boolean>;

  // Avatar management
  uploadAvatar: (file: File) => Promise<boolean>;

  // Utility functions
  getFieldValue: (field: ProfileField) => string;
  isFieldDirty: (field: ProfileField) => boolean;
  validateField: (field: ProfileField, value: string) => string | null;
}

/**
 * Field validation rules
 */
const FIELD_VALIDATION = {
  name: (value: string) => {
    if (!value?.trim()) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    if (value.length > 100) return 'Name must be less than 100 characters';
    return null;
  },

  firstName: (value: string) => {
    if (value && value.length < 1) return 'First name cannot be empty';
    if (value && value.length > 50)
      return 'First name must be less than 50 characters';
    return null;
  },

  lastName: (value: string) => {
    if (value && value.length < 1) return 'Last name cannot be empty';
    if (value && value.length > 50)
      return 'Last name must be less than 50 characters';
    return null;
  },

  phoneNumber: (value: string) => {
    if (value && !/^\+?[\d\s\-()]{10,}$/.test(value)) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  timezone: (value: string) => {
    // Basic timezone validation - can be enhanced
    if (value && !value.includes('/') && !['UTC', 'GMT'].includes(value)) {
      return 'Please select a valid timezone';
    }
    return null;
  },

  language: (value: string) => {
    if (value && !['en', 'es', 'fr', 'de', 'hi'].includes(value)) {
      return 'Please select a supported language';
    }
    return null;
  },
} as const;

/**
 * useMyProfile hook implementation
 */
export const useMyProfile = (): UseMyProfileReturn => {
  const dispatch = useAppDispatch();

  // RTK Query hooks
  const {
    data: profile,
    isLoading,
    error: fetchError,
    refetch: refetchProfile,
  } = useGetMyProfileQuery();

  const [updateProfile, { isLoading: isSaving, error: updateError }] =
    useUpdateMyProfileMutation();

  const [
    changePasswordMutation,
    { isLoading: isChangingPassword, error: passwordError },
  ] = useChangePasswordMutation();

  const [
    uploadAvatarMutation,
    { isLoading: isUploadingAvatar, error: avatarError },
  ] = useUploadAvatarMutation();

  // Local draft state using Immer for immutable updates
  const [draftProfile, updateDraftProfile] = useImmer<ProfileUpdatePayload>({});

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  // Initialize draft when profile loads
  useState(() => {
    if (profile && Object.keys(draftProfile).length === 0) {
      updateDraftProfile(draft => {
        Object.assign(draft, {
          name: profile.name,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phoneNumber: profile.phoneNumber,
          timezone: profile.timezone,
          language: profile.language,
        });
      });
    }
  });

  // Computed values
  const isDirty = useMemo(() => {
    if (!profile) return false;

    return Object.keys(draftProfile).some(key => {
      const field = key as ProfileField;
      const draftValue = draftProfile[field] ?? '';
      const profileValue = profile[field] ?? '';
      return draftValue !== profileValue;
    });
  }, [profile, draftProfile]);

  const hasValidationErrors = useMemo(() => {
    return Object.keys(validationErrors).length > 0;
  }, [validationErrors]);

  const error = useMemo(() => {
    return (fetchError ||
      updateError ||
      passwordError ||
      avatarError) as ProfileApiError | null;
  }, [fetchError, updateError, passwordError, avatarError]);

  /**
   * Set a single field value with validation
   */
  const setField = useCallback(
    (field: ProfileField, value: string) => {
      updateDraftProfile(draft => {
        draft[field] = value;
      });

      // Validate field and update validation errors
      const validator =
        field in FIELD_VALIDATION
          ? FIELD_VALIDATION[field as keyof typeof FIELD_VALIDATION]
          : null;
      if (validator) {
        const validationError = validator(value);
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          if (validationError) {
            newErrors[field] = [validationError];
          } else {
            delete newErrors[field];
          }
          return newErrors;
        });
      }
    },
    [updateDraftProfile]
  );

  /**
   * Set multiple fields at once
   */
  const setMultipleFields = useCallback(
    (fields: Partial<ProfileUpdatePayload>) => {
      updateDraftProfile(draft => {
        Object.assign(draft, fields);
      });

      // Validate all updated fields
      const newValidationErrors: Record<string, string[]> = {};
      Object.entries(fields).forEach(([key, value]) => {
        const field = key as ProfileField;
        const validator =
          field in FIELD_VALIDATION
            ? FIELD_VALIDATION[field as keyof typeof FIELD_VALIDATION]
            : null;
        if (validator && typeof value === 'string') {
          const validationError = validator(value);
          if (validationError) {
            newValidationErrors[field] = [validationError];
          }
        }
      });

      setValidationErrors(prev => ({
        ...prev,
        ...newValidationErrors,
      }));
    },
    [updateDraftProfile]
  );

  /**
   * Save profile changes to server
   */
  const saveProfile = useCallback(async () => {
    if (!profile) {
      dispatch(
        showToast({
          message: 'Profile not loaded yet',
          severity: 'error',
        })
      );
      return;
    }

    // Validate all fields before saving
    const errors: Record<string, string[]> = {};
    Object.entries(draftProfile).forEach(([key, value]) => {
      const field = key as ProfileField;
      const validator =
        field in FIELD_VALIDATION
          ? FIELD_VALIDATION[field as keyof typeof FIELD_VALIDATION]
          : null;
      if (validator && typeof value === 'string') {
        const validationError = validator(value);
        if (validationError) {
          errors[field] = [validationError];
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      dispatch(
        showToast({
          message: 'Please fix validation errors before saving',
          severity: 'error',
        })
      );
      return;
    }

    // Filter out unchanged fields to minimize payload
    const changedFields: ProfileUpdatePayload = {};
    Object.entries(draftProfile).forEach(([key, value]) => {
      const field = key as ProfileField;
      const profileValue = profile[field] ?? '';
      if (value !== profileValue && value !== undefined) {
        changedFields[field] = value;
      }
    });

    if (Object.keys(changedFields).length === 0) {
      dispatch(
        showToast({
          message: 'No changes to save',
          severity: 'info',
        })
      );
      return;
    }

    try {
      const result = await updateProfile(changedFields).unwrap();

      // Update draft with server response to sync state
      updateDraftProfile(draft => {
        Object.assign(draft, {
          name: result.name,
          firstName: result.firstName,
          lastName: result.lastName,
          phoneNumber: result.phoneNumber,
          timezone: result.timezone,
          language: result.language,
        });
      });

      // Clear validation errors on successful save
      setValidationErrors({});

      dispatch(
        showToast({
          message: 'Profile updated successfully',
          severity: 'success',
        })
      );
    } catch (error: any) {
      const apiError = error as ProfileApiError;

      // Handle server validation errors
      if (apiError.validationErrors) {
        setValidationErrors(apiError.validationErrors);
      }

      dispatch(
        showToast({
          message: apiError.message || 'Failed to update profile',
          severity: 'error',
        })
      );

      throw error; // Re-throw for component error handling
    }
  }, [profile, draftProfile, updateProfile, updateDraftProfile, dispatch]);

  /**
   * Reset draft to current profile values
   */
  const resetDraft = useCallback(() => {
    if (profile) {
      updateDraftProfile(draft => {
        // Clear draft and repopulate with profile data
        Object.keys(draft).forEach(key => {
          delete draft[key as ProfileField];
        });

        Object.assign(draft, {
          name: profile.name,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phoneNumber: profile.phoneNumber,
          timezone: profile.timezone,
          language: profile.language,
        });
      });

      // Clear validation errors
      setValidationErrors({});

      dispatch(
        showToast({
          message: 'Changes discarded',
          severity: 'info',
        })
      );
    }
  }, [profile, updateDraftProfile, dispatch]);

  /**
   * Change user password
   */
  const changePassword = useCallback(
    async (passwordData: PasswordChangePayload): Promise<boolean> => {
      try {
        const result = await changePasswordMutation(passwordData).unwrap();

        dispatch(
          showToast({
            message: result.message || 'Password changed successfully',
            severity: 'success',
          })
        );

        // Refresh profile if reauth is required
        if (result.requiresReauth) {
          dispatch(
            showToast({
              message: 'Please log in again with your new password',
              severity: 'warning',
              duration: 8000,
            })
          );
        }

        return true;
      } catch (error: any) {
        const apiError = error as ProfileApiError;

        dispatch(
          showToast({
            message: apiError.message || 'Failed to change password',
            severity: 'error',
          })
        );

        return false;
      }
    },
    [changePasswordMutation, dispatch]
  );

  /**
   * Upload user avatar
   */
  const uploadAvatar = useCallback(
    async (file: File): Promise<boolean> => {
      // Validate file
      const maxSize = 2 * 1024 * 1024; // 2MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

      if (file.size > maxSize) {
        dispatch(
          showToast({
            message: 'File size must be less than 2MB',
            severity: 'error',
          })
        );
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        dispatch(
          showToast({
            message: 'Please upload a JPEG or PNG image',
            severity: 'error',
          })
        );
        return false;
      }

      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const result = await uploadAvatarMutation(formData).unwrap();

        dispatch(
          showToast({
            message: result.message || 'Avatar uploaded successfully',
            severity: 'success',
          })
        );

        // Refresh profile to get updated avatar URL
        refetchProfile();

        return true;
      } catch (error: any) {
        const apiError = error as ProfileApiError;

        dispatch(
          showToast({
            message: apiError.message || 'Failed to upload avatar',
            severity: 'error',
          })
        );

        return false;
      }
    },
    [uploadAvatarMutation, dispatch, refetchProfile]
  );

  /**
   * Get current value for a field (draft or profile fallback)
   */
  const getFieldValue = useCallback(
    (field: ProfileField): string => {
      return draftProfile[field] ?? profile?.[field] ?? '';
    },
    [draftProfile, profile]
  );

  /**
   * Check if a specific field is dirty
   */
  const isFieldDirty = useCallback(
    (field: ProfileField): boolean => {
      if (!profile) return false;
      const draftValue = draftProfile[field] ?? '';
      const profileValue = profile[field] ?? '';
      return draftValue !== profileValue;
    },
    [profile, draftProfile]
  );

  /**
   * Validate a specific field
   */
  const validateField = useCallback(
    (field: ProfileField, value: string): string | null => {
      const validator =
        field in FIELD_VALIDATION
          ? FIELD_VALIDATION[field as keyof typeof FIELD_VALIDATION]
          : null;
      return validator ? validator(value) : null;
    },
    []
  );

  return {
    // Profile data
    profile,
    draftProfile,

    // Loading states
    isLoading,
    isSaving,
    isChangingPassword,
    isUploadingAvatar,

    // State flags
    isDirty,
    hasValidationErrors,

    // Error states
    error,
    validationErrors,

    // Profile management functions
    setField,
    setMultipleFields,
    saveProfile,
    resetDraft,

    // Password management
    changePassword,

    // Avatar management
    uploadAvatar,

    // Utility functions
    getFieldValue,
    isFieldDirty,
    validateField,
  };
};

export default useMyProfile;
