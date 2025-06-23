/**
 * Threshold Settings Form Component
 * Handles numeric thresholds and system limits configuration with toast feedback
 */

import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  Paper,
  Slider,
  Grid,
} from '@mui/material';
import { DataUsage, Warning, Security, Speed } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { useSettingsForm } from '../../hooks/useSettingsForm';
import { thresholdSettingsSchema } from './schemas';
import { AppButton, AppToast } from '../ui';
import { useToast } from '../../hooks/useToast';
import type {
  SystemSettings,
  SystemThresholds,
} from '../../types/settings.types';

/**
 * Threshold settings form data interface
 */
interface ThresholdSettingsFormData {
  thresholds: SystemThresholds;
}

/**
 * Threshold metadata for better UX
 */
interface ThresholdMeta {
  label: string;
  description: string;
  unit: string;
  icon: React.ReactElement;
  min: number;
  max: number;
  step: number;
  category: 'performance' | 'security' | 'storage' | 'ui';
  showSlider?: boolean;
}

/**
 * Threshold configuration metadata
 */
const thresholdMeta: Record<string, ThresholdMeta> = {
  MAX_FILE_SIZE: {
    label: 'Maximum File Size',
    description: 'Maximum size allowed for file uploads',
    unit: 'MB',
    icon: <DataUsage />,
    min: 1,
    max: 100,
    step: 1,
    category: 'storage',
    showSlider: true,
  },
  SESSION_WARNING: {
    label: 'Session Warning Time',
    description: 'Minutes before session expiry to show warning',
    unit: 'minutes',
    icon: <Warning />,
    min: 1,
    max: 30,
    step: 1,
    category: 'ui',
    showSlider: true,
  },
  API_TIMEOUT: {
    label: 'API Request Timeout',
    description: 'Maximum time to wait for API responses',
    unit: 'seconds',
    icon: <Speed />,
    min: 10,
    max: 300,
    step: 5,
    category: 'performance',
    showSlider: true,
  },
  MAX_LOGIN_ATTEMPTS: {
    label: 'Maximum Login Attempts',
    description: 'Number of failed login attempts before lockout',
    unit: 'attempts',
    icon: <Security />,
    min: 3,
    max: 10,
    step: 1,
    category: 'security',
  },
  LOCKOUT_DURATION: {
    label: 'Account Lockout Duration',
    description: 'Duration to lock account after failed attempts',
    unit: 'minutes',
    icon: <Security />,
    min: 5,
    max: 60,
    step: 5,
    category: 'security',
    showSlider: true,
  },
  PASSWORD_MIN_LENGTH: {
    label: 'Minimum Password Length',
    description: 'Minimum number of characters required for passwords',
    unit: 'characters',
    icon: <Security />,
    min: 6,
    max: 32,
    step: 1,
    category: 'security',
  },
};

/**
 * Component props
 */
interface ThresholdSettingsFormProps {
  initialData: SystemSettings;
  onSuccess?: (data: SystemSettings) => void;
  onError?: (error: any) => void;
}

/**
 * Threshold Settings Form Component
 */
const ThresholdSettingsForm: React.FC<ThresholdSettingsFormProps> = ({
  initialData,
  onSuccess,
  onError,
}) => {
  const { toastState, showSuccess, showError, hideToast } = useToast();

  const {
    control,
    formState: { errors, isValid },
    isSubmitting,
    isDirty,
    submitForm,
    resetForm,
    updateField,
  } = useSettingsForm<ThresholdSettingsFormData>({
    schema: thresholdSettingsSchema,
    defaultValues: {
      thresholds: initialData.thresholds,
    },
    onSuccess: data => {
      showSuccess('Thresholds updated successfully', 'Settings Saved');
      onSuccess?.(data);
    },
    onError: error => {
      showError(
        error?.data?.message || error?.message || 'Failed to update thresholds',
        'Update Failed'
      );
      onError?.(error);
    },
  });

  /**
   * Handle threshold change with optimistic update
   */
  const handleThresholdChange = (key: string, value: number) => {
    const updatedThresholds = {
      ...initialData.thresholds,
      [key]: value,
    };
    updateField('thresholds', updatedThresholds, true); // Enable optimistic update
  };

  /**
   * Get category color
   */
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance':
        return 'primary';
      case 'security':
        return 'error';
      case 'storage':
        return 'warning';
      case 'ui':
        return 'secondary';
      default:
        return 'default';
    }
  };

  /**
   * Group thresholds by category
   */
  const groupedThresholds = Object.entries(initialData.thresholds).reduce(
    (acc, [key, value]) => {
      const meta = thresholdMeta[key];
      const category = meta?.category || 'performance';

      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category].push({ key, value, ...(meta && { meta }) });
      return acc;
    },
    {} as Record<
      string,
      Array<{ key: string; value: number; meta?: ThresholdMeta }>
    >
  );

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <DataUsage color="primary" />
        System Thresholds Configuration
      </Typography>

      <form onSubmit={submitForm}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Summary Alert */}
          <Alert severity="info">
            <Typography variant="body2">
              Configure numeric limits and boundaries for system operations.
              Changes are applied immediately and may affect application
              behavior.
            </Typography>
          </Alert>

          {/* Thresholds by Category */}
          {Object.entries(groupedThresholds).map(([category, thresholds]) => (
            <Paper
              key={category}
              variant="outlined"
              sx={{ p: 3, borderRadius: 2 }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  textTransform: 'capitalize',
                  color: `${getCategoryColor(category)}.main`,
                }}
              >
                {category} Thresholds
              </Typography>

              <Grid container spacing={3}>
                {thresholds.map(({ key, value, meta }) => (
                  <Grid item xs={12} md={6} key={key}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        borderColor: `${getCategoryColor(meta?.category || 'performance')}.light`,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        {React.cloneElement(meta?.icon || <DataUsage />, {
                          color: getCategoryColor(
                            meta?.category || 'performance'
                          ),
                          sx: { fontSize: 20 },
                        })}
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {meta?.label || key}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, fontSize: '0.75rem' }}
                      >
                        {meta?.description || 'No description available'}
                      </Typography>

                      <Controller
                        name={`thresholds.${key}` as any}
                        control={control}
                        render={({ field }) => (
                          <Box>
                            <TextField
                              {...field}
                              type="number"
                              size="small"
                              fullWidth
                              error={!!errors.thresholds?.[key]}
                              helperText={errors.thresholds?.[key]?.message}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    {meta?.unit}
                                  </InputAdornment>
                                ),
                              }}
                              onChange={e => {
                                const newValue = parseInt(e.target.value, 10);
                                field.onChange(newValue);
                                if (!isNaN(newValue)) {
                                  handleThresholdChange(key, newValue);
                                }
                              }}
                              sx={{ mb: meta?.showSlider ? 2 : 0 }}
                            />

                            {meta?.showSlider && (
                              <Box sx={{ px: 1 }}>
                                <Slider
                                  value={field.value}
                                  min={meta.min}
                                  max={meta.max}
                                  step={meta.step}
                                  onChange={(_, newValue) => {
                                    const value = Array.isArray(newValue)
                                      ? newValue[0]
                                      : newValue;
                                    field.onChange(value);
                                    handleThresholdChange(key, value!);
                                  }}
                                  valueLabelDisplay="auto"
                                  size="small"
                                  color={getCategoryColor(meta.category) as any}
                                  marks={[
                                    {
                                      value: meta.min,
                                      label: meta.min.toString(),
                                    },
                                    {
                                      value: meta.max,
                                      label: meta.max.toString(),
                                    },
                                  ]}
                                />
                              </Box>
                            )}
                          </Box>
                        )}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))}

          {/* Security Warning */}
          {((initialData.thresholds.MAX_LOGIN_ATTEMPTS ?? 0) < 5 ||
            (initialData.thresholds.PASSWORD_MIN_LENGTH ?? 0) < 8) && (
            <Alert severity="warning">
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Security Recommendations
              </Typography>
              <Typography variant="body2">
                For optimal security, consider:
                <br />• Maximum login attempts: 5 or more
                <br />• Password minimum length: 8 or more characters
              </Typography>
            </Alert>
          )}

          {/* Form Actions */}
          <Box
            sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}
          >
            <AppButton
              variant="outline"
              onClick={resetForm}
              disabled={!isDirty || isSubmitting}
            >
              Reset
            </AppButton>
            <AppButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!isDirty || !isValid}
            >
              Save Changes
            </AppButton>
          </Box>
        </Box>
      </form>

      {/* Toast Notifications */}
      <AppToast
        open={toastState.open}
        message={toastState.message}
        severity={toastState.severity}
        {...(toastState.title && { title: toastState.title })}
        {...(toastState.duration && { duration: toastState.duration })}
        {...(toastState.position && { position: toastState.position })}
        onClose={hideToast}
      />
    </Box>
  );
};

export default ThresholdSettingsForm;
