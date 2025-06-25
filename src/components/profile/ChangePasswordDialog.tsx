/**
 * Change Password Dialog Component
 * Modal dialog for secure password change with validation
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { AppButton, AppTextField, AppModal } from '../ui';
import { VALIDATION_PATTERNS } from '../../utils/constants';
import type { PasswordChangePayload } from '../../types/profile.types';

/**
 * Password change form data interface
 */
interface PasswordChangeFormData extends PasswordChangePayload {
  confirmPassword: string;
}

/**
 * Password strength indicator component
 */
interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };

    score = Object.values(checks).filter(Boolean).length;

    return {
      score,
      checks,
      label:
        score <= 1
          ? 'Weak'
          : score <= 3
            ? 'Fair'
            : score <= 4
              ? 'Good'
              : 'Strong',
      color:
        score <= 1
          ? 'error'
          : score <= 3
            ? 'warning'
            : score <= 4
              ? 'info'
              : 'success',
    };
  };

  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Password Strength:
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: `${strength.color}.main`,
          }}
        >
          {strength.label}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={(strength.score / 5) * 100}
        color={strength.color as any}
        sx={{
          height: 4,
          borderRadius: 2,
          mb: 1,
        }}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Object.entries(strength.checks).map(([key, passed]) => (
          <Box
            key={key}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {passed ? (
              <CheckIcon sx={{ fontSize: 12, color: 'success.main' }} />
            ) : (
              <CancelIcon sx={{ fontSize: 12, color: 'error.main' }} />
            )}
            <Typography
              variant="caption"
              color={passed ? 'success.main' : 'error.main'}
            >
              {key === 'length'
                ? '8+ chars'
                : key === 'lowercase'
                  ? 'lowercase'
                  : key === 'uppercase'
                    ? 'uppercase'
                    : key === 'number'
                      ? 'number'
                      : 'special char'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * Component props interface
 */
interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PasswordChangePayload) => Promise<boolean>;
  isLoading?: boolean;
}

/**
 * Password validation function
 */
export const validatePasswordStrength = (password: string): boolean => {
  return VALIDATION_PATTERNS.PASSWORD.test(password);
};

/**
 * Change Password Dialog Component
 */
const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<PasswordChangeFormData>({
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');
  const confirmPassword = watch('confirmPassword');

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data: PasswordChangeFormData) => {
    setSubmitError('');

    // Validate password strength
    if (!validatePasswordStrength(data.newPassword)) {
      setSubmitError('Password must meet all strength requirements');
      return;
    }

    // Validate password confirmation
    if (data.newPassword !== data.confirmPassword) {
      setSubmitError('New passwords do not match');
      return;
    }

    try {
      const success = await onSubmit({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      if (success) {
        handleClose();
      }
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to change password');
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    reset();
    setSubmitError('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  /**
   * Toggle password visibility handlers
   */
  const toggleCurrentPassword = () =>
    setShowCurrentPassword(!showCurrentPassword);
  const toggleNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title="Change Password"
      maxWidth="sm"
      closeButton={true}
      actions={
        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
          <AppButton
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            fullWidth
          >
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            onClick={handleSubmit(handleFormSubmit)}
            loading={isLoading}
            disabled={!isValid}
            fullWidth
          >
            Change Password
          </AppButton>
        </Box>
      }
    >
      <Box component="form" noValidate>
        {/* Security Notice */}
        <Alert severity="info" sx={{ mb: 3 }} icon={<SecurityIcon />}>
          <Typography variant="body2">
            For your security, you must enter your current password to change
            it. Choose a strong password that you haven't used before.
          </Typography>
        </Alert>

        {/* Submit Error Display */}
        {submitError && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            role="alert"
            aria-live="polite"
          >
            {submitError}
          </Alert>
        )}

        {/* Current Password */}
        <Box sx={{ mb: 3 }}>
          <Controller
            name="currentPassword"
            control={control}
            rules={{
              required: 'Current password is required',
              minLength: {
                value: 1,
                message: 'Please enter your current password',
              },
            }}
            render={({ field }) => (
              <AppTextField
                {...field}
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                fullWidth
                required
                error={!!errors.currentPassword}
                helperText={errors.currentPassword?.message || ''}
                disabled={isLoading}
                autoComplete="current-password"
                inputProps={{
                  'aria-label': 'Current Password',
                  'aria-describedby': errors.currentPassword
                    ? 'current-password-error'
                    : undefined,
                }}
                startIcon={<LockIcon />}
                endIcon={
                  <IconButton
                    aria-label={
                      showCurrentPassword
                        ? 'Hide current password'
                        : 'Show current password'
                    }
                    onClick={toggleCurrentPassword}
                    edge="end"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                }
              />
            )}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* New Password */}
        <Box sx={{ mb: 3 }}>
          <Controller
            name="newPassword"
            control={control}
            rules={{
              required: 'New password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
              validate: value =>
                validatePasswordStrength(value) ||
                'Password must contain uppercase, lowercase, number, and special character',
            }}
            render={({ field }) => (
              <AppTextField
                {...field}
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                fullWidth
                required
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message || ''}
                disabled={isLoading}
                autoComplete="new-password"
                inputProps={{
                  'aria-label': 'New Password',
                  'aria-describedby': errors.newPassword
                    ? 'new-password-error'
                    : 'password-strength',
                }}
                startIcon={<LockIcon />}
                endIcon={
                  <IconButton
                    aria-label={
                      showNewPassword
                        ? 'Hide new password'
                        : 'Show new password'
                    }
                    onClick={toggleNewPassword}
                    edge="end"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                }
              />
            )}
          />

          {/* Password Strength Indicator */}
          <Box id="password-strength" aria-live="polite">
            <PasswordStrength password={newPassword} />
          </Box>
        </Box>

        {/* Confirm New Password */}
        <Box sx={{ mb: 3 }}>
          <Controller
            name="confirmPassword"
            control={control}
            rules={{
              required: 'Please confirm your new password',
              validate: value =>
                value === newPassword || 'Passwords do not match',
            }}
            render={({ field }) => (
              <AppTextField
                {...field}
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                required
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message || ''}
                disabled={isLoading}
                autoComplete="new-password"
                inputProps={{
                  'aria-label': 'Confirm New Password',
                  'aria-describedby': errors.confirmPassword
                    ? 'confirm-password-error'
                    : undefined,
                }}
                startIcon={<LockIcon />}
                endIcon={
                  <IconButton
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                    onClick={toggleConfirmPassword}
                    edge="end"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                }
              />
            )}
          />
        </Box>

        {/* Password Match Indicator */}
        {newPassword && confirmPassword && (
          <Box sx={{ mb: 2 }}>
            {newPassword === confirmPassword ? (
              <Alert severity="success" sx={{ py: 0.5 }}>
                <Typography variant="body2">✓ Passwords match</Typography>
              </Alert>
            ) : (
              <Alert severity="error" sx={{ py: 0.5 }}>
                <Typography variant="body2">
                  ✗ Passwords do not match
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Security Tips */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Password Security Tips:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
            <li>Use a unique password you haven't used elsewhere</li>
            <li>Consider using a password manager</li>
            <li>Avoid personal information like names or dates</li>
            <li>Make it at least 12 characters for better security</li>
          </Typography>
        </Alert>
      </Box>
    </AppModal>
  );
};

export default ChangePasswordDialog;
