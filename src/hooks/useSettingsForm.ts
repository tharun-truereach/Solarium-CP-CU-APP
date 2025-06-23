/**
 * Custom hook for settings form management
 * Provides shared logic for React Hook Form integration with settings
 */

import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCallback, useEffect } from 'react';
import { useUpdateSettingsMutation } from '../api/endpoints/settingsEndpoints';
import { useAppDispatch } from '../store/hooks';
import {
  setFeatureFlagPending,
  setThresholdPending,
  rollbackAllPendingUpdates,
  confirmPendingUpdates,
} from '../store/slices/settingsSlice';
import type {
  SystemSettings,
  SettingsUpdatePayload,
} from '../types/settings.types';

/**
 * Settings form configuration
 */
export interface UseSettingsFormConfig<T extends FieldValues> {
  schema: yup.ObjectSchema<any>;
  defaultValues: T;
  onSuccess?: (data: SystemSettings) => void;
  onError?: (error: any) => void;
}

/**
 * Settings form return type
 */
export interface UseSettingsFormReturn<T extends FieldValues>
  extends UseFormReturn<T> {
  isSubmitting: boolean;
  isDirty: boolean;
  submitForm: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>;
  resetForm: () => void;
  updateField: (field: keyof T, value: any, optimistic?: boolean) => void;
}

/**
 * Custom hook for settings form management with optimistic updates
 */
export function useSettingsForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSuccess,
  onError,
}: UseSettingsFormConfig<T>): UseSettingsFormReturn<T> {
  const dispatch = useAppDispatch();
  const [updateSettings, { isLoading: isSubmitting }] =
    useUpdateSettingsMutation();

  const form = useForm<T>({
    resolver: yupResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onChange', // Validate on change for real-time feedback
  });

  const { handleSubmit, reset, setValue, formState, watch } = form;
  const { isDirty } = formState;

  /**
   * Submit form with optimistic updates and error handling
   */
  const submitForm = useCallback(
    async (data: T) => {
      try {
        // Prepare update payload
        const updatePayload: SettingsUpdatePayload = {};

        // Map form data to API payload
        Object.keys(data).forEach(key => {
          if (key in defaultValues && data[key] !== defaultValues[key]) {
            (updatePayload as any)[key] = data[key];
          }
        });

        // Submit to API
        const result = await updateSettings(updatePayload).unwrap();

        // Confirm optimistic updates
        dispatch(confirmPendingUpdates());

        // Reset form to new values
        reset(data);

        // Call success callback
        onSuccess?.(result);

        console.log('✅ Settings form submitted successfully');
      } catch (error: any) {
        console.error('❌ Settings form submission failed:', error);

        // Rollback optimistic updates
        dispatch(rollbackAllPendingUpdates());

        // Call error callback
        onError?.(error);

        // Re-throw for form error handling
        throw error;
      }
    },
    [updateSettings, dispatch, defaultValues, reset, onSuccess, onError]
  );

  /**
   * Update individual field with optional optimistic update
   */
  const updateField = useCallback(
    (field: keyof T, value: any, optimistic = false) => {
      setValue(field as any, value, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (optimistic) {
        // Apply optimistic update to Redux store
        if (field === 'featureFlags' && typeof value === 'object') {
          Object.entries(value).forEach(([flag, flagValue]) => {
            if (typeof flagValue === 'boolean') {
              dispatch(setFeatureFlagPending({ flag, value: flagValue }));
            }
          });
        } else if (field === 'thresholds' && typeof value === 'object') {
          Object.entries(value).forEach(([key, thresholdValue]) => {
            if (typeof thresholdValue === 'number') {
              dispatch(setThresholdPending({ key, value: thresholdValue }));
            }
          });
        }
      }
    },
    [setValue, dispatch]
  );

  /**
   * Reset form to default values
   */
  const resetForm = useCallback(() => {
    reset(defaultValues);
    dispatch(rollbackAllPendingUpdates());
  }, [reset, defaultValues, dispatch]);

  /**
   * Watch for changes and apply optimistic updates for feature flags
   */
  const watchedFeatureFlags = watch('featureFlags' as any);
  const watchedThresholds = watch('thresholds' as any);

  useEffect(() => {
    // Apply optimistic updates for feature flags when they change
    if (watchedFeatureFlags && typeof watchedFeatureFlags === 'object') {
      Object.entries(watchedFeatureFlags).forEach(([flag, value]) => {
        if (
          typeof value === 'boolean' &&
          value !== (defaultValues as any).featureFlags?.[flag]
        ) {
          dispatch(setFeatureFlagPending({ flag, value }));
        }
      });
    }
  }, [watchedFeatureFlags, dispatch, defaultValues]);

  useEffect(() => {
    // Apply optimistic updates for thresholds when they change
    if (watchedThresholds && typeof watchedThresholds === 'object') {
      Object.entries(watchedThresholds).forEach(([key, value]) => {
        if (
          typeof value === 'number' &&
          value !== (defaultValues as any).thresholds?.[key]
        ) {
          dispatch(setThresholdPending({ key, value: value as number }));
        }
      });
    }
  }, [watchedThresholds, dispatch, defaultValues]);

  return {
    ...form,
    isSubmitting,
    isDirty,
    submitForm: handleSubmit(submitForm),
    resetForm,
    updateField,
  };
}

/**
 * Debounced form validation hook
 */
export function useDebounceFormValidation<T extends FieldValues>(
  form: UseFormReturn<T>,
  delay = 300
) {
  const { trigger } = form;

  return useCallback(
    (field?: keyof T) => {
      const timeoutId = setTimeout(() => {
        trigger(field as any);
      }, delay);

      return () => clearTimeout(timeoutId);
    },
    [trigger, delay]
  );
}
