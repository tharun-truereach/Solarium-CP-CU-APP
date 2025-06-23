/**
 * General Settings Form Component
 * Handles session timeout and token expiry configuration with validation and confirmation dialogs
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  Paper,
} from '@mui/material';
import { AccessTime, Token } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { useSettingsForm } from '../../hooks/useSettingsForm';
import { generalSettingsSchema } from './schemas';
import { AppButton, AppConfirmDialog, AppToast } from '../ui';
import { useToast } from '../../hooks/useToast';
import type { SystemSettings } from '../../types/settings.types';

/**
 * General settings form data interface
 */
interface GeneralSettingsFormData {
  sessionTimeoutMin: number;
  tokenExpiryMin: number;
}

/**
 * Component props
 */
interface GeneralSettingsFormProps {
  initialData: SystemSettings;
  onSuccess?: (data: SystemSettings) => void;
  onError?: (error: any) => void;
}

/**
 * General Settings Form Component
 */
const GeneralSettingsForm: React.FC<GeneralSettingsFormProps> = ({
  initialData,
  onSuccess,
  onError,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] =
    useState<GeneralSettingsFormData | null>(null);
  const { toastState, showSuccess, showError, hideToast } = useToast();

  const {
    control,
    formState: { errors, isValid },
    isSubmitting,
    isDirty,
    submitForm,
    resetForm,
    getValues,
  } = useSettingsForm<GeneralSettingsFormData>({
    schema: generalSettingsSchema,
    defaultValues: {
      sessionTimeoutMin: initialData.sessionTimeoutMin,
      tokenExpiryMin: initialData.tokenExpiryMin,
    },
    onSuccess: data => {
      showSuccess('Settings saved successfully', 'Configuration Updated');
      onSuccess?.(data);
    },
    onError: error => {
      showError(
        error?.data?.message || error?.message || 'Failed to save settings',
        'Save Failed'
      );
      onError?.(error);
    },
  });

  /**
   * Check if changes require confirmation
   */
  const requiresConfirmation = (formData: GeneralSettingsFormData): boolean => {
    const currentValues = {
      sessionTimeoutMin: initialData.sessionTimeoutMin,
      tokenExpiryMin: initialData.tokenExpiryMin,
    };

    // Check if critical values have changed
    return (
      formData.sessionTimeoutMin !== currentValues.sessionTimeoutMin ||
      formData.tokenExpiryMin !== currentValues.tokenExpiryMin
    );
  };

  /**
   * Get confirmation message based on changes
   */
  const getConfirmationMessage = (
    formData: GeneralSettingsFormData
  ): string => {
    const changes: string[] = [];

    if (formData.sessionTimeoutMin !== initialData.sessionTimeoutMin) {
      changes.push(
        `Session timeout: ${initialData.sessionTimeoutMin} → ${formData.sessionTimeoutMin} minutes`
      );
    }

    if (formData.tokenExpiryMin !== initialData.tokenExpiryMin) {
      changes.push(
        `Token expiry: ${initialData.tokenExpiryMin} → ${formData.tokenExpiryMin} minutes`
      );
    }

    return `The following critical settings will be changed:\n\n${changes.join('\n')}\n\nThis may affect user sessions and require users to log in again.`;
  };

  /**
   * Handle form submission with confirmation
   */
  const handleFormSubmit = async (formData: GeneralSettingsFormData) => {
    if (requiresConfirmation(formData)) {
      setPendingFormData(formData);
      setShowConfirmDialog(true);
    } else {
      // Submit directly if no confirmation needed
      await submitForm();
    }
  };

  /**
   * Handle confirmation dialog accept
   */
  const handleConfirm = async () => {
    setShowConfirmDialog(false);

    if (pendingFormData) {
      try {
        await submitForm();
      } catch (error) {
        // Error handling is done in the form hook
      } finally {
        setPendingFormData(null);
      }
    }
  };

  /**
   * Handle confirmation dialog cancel
   */
  const handleConfirmCancel = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
  };

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
        <AccessTime color="primary" />
        Session & Authentication Settings
      </Typography>

      <form
        onSubmit={e => {
          e.preventDefault();
          const formData = getValues();
          handleFormSubmit(formData);
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Session Timeout */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Session Management
            </Typography>

            <Controller
              name="sessionTimeoutMin"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Session Timeout"
                  type="number"
                  fullWidth
                  error={!!errors.sessionTimeoutMin}
                  helperText={
                    errors.sessionTimeoutMin?.message ||
                    'Time in minutes before user session expires due to inactivity'
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTime />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">minutes</InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
              <Typography variant="body2">
                <strong>Recommended:</strong> 30-60 minutes for most
                applications. Lower values provide better security but may
                inconvenience users.
              </Typography>
            </Alert>
          </Paper>

          {/* Token Expiry */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Token Management
            </Typography>

            <Controller
              name="tokenExpiryMin"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Token Expiry"
                  type="number"
                  fullWidth
                  error={!!errors.tokenExpiryMin}
                  helperText={
                    errors.tokenExpiryMin?.message ||
                    'Time in minutes before authentication tokens expire'
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Token />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">minutes</InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
              <Typography variant="body2">
                <strong>Important:</strong> Token expiry should be longer than
                session timeout. Users will be logged out when tokens expire.
              </Typography>
            </Alert>
          </Paper>

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

      {/* Confirmation Dialog */}
      <AppConfirmDialog
        open={showConfirmDialog}
        title="Confirm Critical Changes"
        message={pendingFormData ? getConfirmationMessage(pendingFormData) : ''}
        severity="warning"
        confirmText="Yes, Save Changes"
        cancelText="Cancel"
        confirmColor="warning"
        loading={isSubmitting}
        onConfirm={handleConfirm}
        onCancel={handleConfirmCancel}
        details="Active user sessions may be affected by these changes."
      />

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

export default GeneralSettingsForm;
