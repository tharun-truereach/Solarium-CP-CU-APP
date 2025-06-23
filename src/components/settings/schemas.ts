/**
 * Validation schemas for settings forms using Yup
 * Defines validation rules for all settings categories
 */

import * as yup from 'yup';

/**
 * General settings validation schema
 */
export const generalSettingsSchema = yup.object({
  sessionTimeoutMin: yup
    .number()
    .required('Session timeout is required')
    .min(5, 'Session timeout must be at least 5 minutes')
    .max(1440, 'Session timeout cannot exceed 1440 minutes (24 hours)')
    .integer('Session timeout must be a whole number'),

  tokenExpiryMin: yup
    .number()
    .required('Token expiry is required')
    .min(15, 'Token expiry must be at least 15 minutes')
    .max(4320, 'Token expiry cannot exceed 4320 minutes (72 hours)')
    .integer('Token expiry must be a whole number')
    .test(
      'greater-than-session',
      'Token expiry should be greater than session timeout',
      function (value) {
        const sessionTimeout = this.parent.sessionTimeoutMin;
        return !value || !sessionTimeout || value > sessionTimeout;
      }
    ),
});

/**
 * Feature flags validation schema
 */
export const featureFlagsSchema = yup.object({
  featureFlags: yup
    .object()
    .test(
      'valid-flags',
      'Feature flags must be boolean values',
      function (value) {
        if (!value || typeof value !== 'object') return true;

        for (const [key, val] of Object.entries(value)) {
          if (typeof val !== 'boolean') {
            return this.createError({
              path: `featureFlags.${key}`,
              message: `${key} must be true or false`,
            });
          }
        }
        return true;
      }
    ),
});

/**
 * Threshold settings validation schema
 */
export const thresholdSettingsSchema = yup.object({
  thresholds: yup.object({
    MAX_FILE_SIZE: yup
      .number()
      .required('Max file size is required')
      .min(1, 'Max file size must be at least 1 MB')
      .max(100, 'Max file size cannot exceed 100 MB')
      .integer('Max file size must be a whole number'),

    SESSION_WARNING: yup
      .number()
      .required('Session warning time is required')
      .min(1, 'Session warning must be at least 1 minute')
      .max(30, 'Session warning cannot exceed 30 minutes')
      .integer('Session warning must be a whole number'),

    API_TIMEOUT: yup
      .number()
      .required('API timeout is required')
      .min(10, 'API timeout must be at least 10 seconds')
      .max(300, 'API timeout cannot exceed 300 seconds (5 minutes)')
      .integer('API timeout must be a whole number'),

    MAX_LOGIN_ATTEMPTS: yup
      .number()
      .required('Max login attempts is required')
      .min(3, 'Max login attempts must be at least 3')
      .max(10, 'Max login attempts cannot exceed 10')
      .integer('Max login attempts must be a whole number'),

    LOCKOUT_DURATION: yup
      .number()
      .required('Lockout duration is required')
      .min(5, 'Lockout duration must be at least 5 minutes')
      .max(60, 'Lockout duration cannot exceed 60 minutes')
      .integer('Lockout duration must be a whole number'),

    PASSWORD_MIN_LENGTH: yup
      .number()
      .required('Password minimum length is required')
      .min(6, 'Password minimum length must be at least 6 characters')
      .max(32, 'Password minimum length cannot exceed 32 characters')
      .integer('Password minimum length must be a whole number'),
  }),
});

/**
 * Combined settings validation schema for full form validation
 */
export const combinedSettingsSchema = yup.object({
  ...generalSettingsSchema.fields,
  ...featureFlagsSchema.fields,
  ...thresholdSettingsSchema.fields,
});

/**
 * Validation error formatter
 */
export const formatValidationErrors = (errors: yup.ValidationError) => {
  const formatted: Record<string, string[]> = {};

  errors.inner.forEach((error: yup.ValidationError) => {
    if (error.path) {
      if (!formatted[error.path]) {
        formatted[error.path] = [];
      }
      formatted[error.path]!.push(error.message);
    }
  });

  return formatted;
};

/**
 * Field-specific validation helpers
 */
export const validateField = async (
  schema: yup.AnySchema,
  value: any,
  field: string
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    await schema.validateAt(field, { [field]: value });
    return { isValid: true };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return { isValid: false, error: error.message };
    }
    return { isValid: false, error: 'Validation failed' };
  }
};

/**
 * Real-time validation debounced helper
 */
export const createDebouncedValidator = (
  schema: yup.AnySchema,
  onValidationResult: (
    field: string,
    result: { isValid: boolean; error?: string }
  ) => void,
  delay = 300
) => {
  const timeouts: Record<string, NodeJS.Timeout> = {};

  return (field: string, value: any) => {
    if (timeouts[field]) {
      clearTimeout(timeouts[field]);
    }

    timeouts[field] = setTimeout(async () => {
      const result = await validateField(schema, value, field);
      onValidationResult(field, result);
    }, delay);
  };
};
