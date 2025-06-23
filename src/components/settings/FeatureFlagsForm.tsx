/**
 * Feature Flags Form Component
 * Handles real-time feature flag toggles with optimistic updates and toast feedback
 */

import React from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Alert,
  Chip,
  Tooltip,
  Grid,
} from '@mui/material';
import { Flag, RestartAlt } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { useSettingsForm } from '../../hooks/useSettingsForm';
import { featureFlagsSchema } from './schemas';
import { AppButton, AppToast } from '../ui';
import { useToast } from '../../hooks/useToast';
import type { SystemSettings, FeatureFlags } from '../../types/settings.types';

/**
 * Feature flags form data interface
 */
interface FeatureFlagsFormData {
  featureFlags: FeatureFlags;
}

/**
 * Feature flag metadata for better UX
 */
interface FeatureFlagMeta {
  label: string;
  description: string;
  category: 'core' | 'experimental' | 'ui' | 'analytics';
  requiresRestart?: boolean;
  risk?: 'low' | 'medium' | 'high';
}

/**
 * Feature flags metadata configuration
 */
const featureFlagsMeta: Record<string, FeatureFlagMeta> = {
  ADVANCED_REPORTING: {
    label: 'Advanced Reporting',
    description: 'Enable advanced analytics and reporting features',
    category: 'core',
    risk: 'low',
  },
  BETA_FEATURES: {
    label: 'Beta Features',
    description: 'Enable experimental features in beta testing',
    category: 'experimental',
    risk: 'medium',
  },
  DARK_MODE: {
    label: 'Dark Mode',
    description: 'Allow users to switch to dark theme',
    category: 'ui',
    risk: 'low',
  },
  ANALYTICS: {
    label: 'Analytics Tracking',
    description: 'Enable user behavior analytics and tracking',
    category: 'analytics',
    risk: 'low',
  },
  BULK_OPERATIONS: {
    label: 'Bulk Operations',
    description: 'Enable bulk editing and operations',
    category: 'core',
    risk: 'medium',
  },
  DEBUG_MODE: {
    label: 'Debug Mode',
    description: 'Enable debug information and developer tools',
    category: 'experimental',
    requiresRestart: true,
    risk: 'high',
  },
};

/**
 * Component props
 */
interface FeatureFlagsFormProps {
  initialData: SystemSettings;
  onSuccess?: (data: SystemSettings) => void;
  onError?: (error: any) => void;
}

/**
 * Feature Flags Form Component
 */
const FeatureFlagsForm: React.FC<FeatureFlagsFormProps> = ({
  initialData,
  onSuccess,
  onError,
}) => {
  const { toastState, showSuccess, showError, hideToast } = useToast();

  const {
    control,
    formState: { errors },
    isSubmitting,
    isDirty,
    submitForm,
    resetForm,
    updateField,
  } = useSettingsForm<FeatureFlagsFormData>({
    schema: featureFlagsSchema,
    defaultValues: {
      featureFlags: initialData.featureFlags,
    },
    onSuccess: data => {
      showSuccess('Feature flags updated successfully', 'Settings Saved');
      onSuccess?.(data);
    },
    onError: error => {
      showError(
        error?.data?.message ||
          error?.message ||
          'Failed to update feature flags',
        'Update Failed - Rolled Back'
      );
      onError?.(error);
    },
  });

  /**
   * Handle individual flag toggle with optimistic update and immediate save
   */
  const handleFlagToggle = async (flagName: string, value: boolean) => {
    const updatedFlags = {
      ...initialData.featureFlags,
      [flagName]: value,
    };

    // Apply optimistic update
    updateField('featureFlags', updatedFlags, true);

    // Auto-save for feature flags (they don't need confirmation)
    try {
      await submitForm();
    } catch (error) {
      // Error handling is done in the form hook with rollback
    }
  };

  /**
   * Get category color
   */
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core':
        return 'primary';
      case 'experimental':
        return 'warning';
      case 'ui':
        return 'secondary';
      case 'analytics':
        return 'info';
      default:
        return 'default';
    }
  };

  /**
   * Get risk color
   */
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  /**
   * Group flags by category
   */
  const groupedFlags = Object.entries(initialData.featureFlags).reduce(
    (acc, [key, value]) => {
      const meta = featureFlagsMeta[key];
      const category = meta?.category || 'core';

      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category].push({ key, value, ...(meta && { meta }) });
      return acc;
    },
    {} as Record<
      string,
      Array<{ key: string; value: boolean; meta?: FeatureFlagMeta }>
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
        <Flag color="primary" />
        Feature Flags Configuration
      </Typography>

      <form onSubmit={submitForm}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Summary Alert */}
          <Alert severity="info">
            <Typography variant="body2">
              Feature flags are saved automatically when toggled. Changes take
              effect immediately without requiring a restart unless specified.
            </Typography>
          </Alert>

          {/* Feature Flags by Category */}
          {Object.entries(groupedFlags).map(([category, flags]) => (
            <Paper
              key={category}
              variant="outlined"
              sx={{ p: 3, borderRadius: 2 }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, textTransform: 'capitalize' }}
              >
                {category} Features
              </Typography>

              <Grid container spacing={2}>
                {flags.map(({ key, value, meta }) => (
                  <Grid item xs={12} md={6} key={key}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: value ? 'success.light' : 'grey.50',
                        borderColor: value ? 'success.main' : 'grey.300',
                        opacity: value ? 1 : 0.7,
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Controller
                            name={`featureFlags.${key}` as any}
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Switch
                                    {...field}
                                    checked={field.value}
                                    onChange={e => {
                                      field.onChange(e.target.checked);
                                      handleFlagToggle(key, e.target.checked);
                                    }}
                                    color="primary"
                                    disabled={isSubmitting}
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {meta?.label || key}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ fontSize: '0.75rem' }}
                                    >
                                      {meta?.description ||
                                        'No description available'}
                                    </Typography>
                                  </Box>
                                }
                                sx={{ alignItems: 'flex-start', m: 0 }}
                              />
                            )}
                          />
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            ml: 1,
                          }}
                        >
                          <Chip
                            label={category}
                            size="small"
                            color={getCategoryColor(category) as any}
                            variant="outlined"
                            sx={{ fontSize: '0.625rem', height: 20 }}
                          />

                          {meta?.risk && (
                            <Chip
                              label={meta.risk}
                              size="small"
                              color={getRiskColor(meta.risk) as any}
                              variant="filled"
                              sx={{ fontSize: '0.625rem', height: 20 }}
                            />
                          )}

                          {meta?.requiresRestart && (
                            <Tooltip title="Requires application restart">
                              <Chip
                                icon={<RestartAlt sx={{ fontSize: 12 }} />}
                                label="Restart"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ fontSize: '0.625rem', height: 20 }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))}

          {/* Warnings for High-Risk Flags */}
          {Object.entries(initialData.featureFlags).some(
            ([key, value]) => value && featureFlagsMeta[key]?.risk === 'high'
          ) && (
            <Alert severity="warning">
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                High-Risk Features Enabled
              </Typography>
              <Typography variant="body2">
                Some enabled features are marked as high-risk and may affect
                system stability. Monitor application performance closely.
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
              Reset All
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

export default FeatureFlagsForm;
