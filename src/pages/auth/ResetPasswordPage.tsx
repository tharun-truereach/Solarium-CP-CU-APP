/**
 * Reset Password confirmation page component with comprehensive accessibility and security
 * Allows users to set new password using reset token from email
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useConfirmPasswordResetMutation } from '../../api/endpoints/authEndpoints';
import { ROUTES } from '../../routes/routes';
import { VALIDATION_PATTERNS, ERROR_MESSAGES } from '../../utils/constants';

/**
 * Interface for reset password form values
 */
interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password strength evaluation
 */
interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

/**
 * Reset Password component with accessibility and security features
 * Implements WCAG 2.1 AA guidelines for form accessibility
 */
const ResetPasswordPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get reset token from URL params (security: not stored, only in URL)
  const resetToken = searchParams.get('token');

  // Form state
  const [formValues, setFormValues] = useState<ResetPasswordFormValues>({
    newPassword: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<
    Partial<ResetPasswordFormValues>
  >({});
  const [submitError, setSubmitError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false,
  });

  // RTK Query mutation
  const [confirmPasswordReset, { isLoading }] =
    useConfirmPasswordResetMutation();

  // Refs for accessibility focus management
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const errorAlertRef = useRef<HTMLDivElement>(null);
  const successAlertRef = useRef<HTMLDivElement>(null);

  // Check for valid token on mount
  useEffect(() => {
    if (!resetToken) {
      setSubmitError(
        'Invalid or missing reset token. Please request a new password reset.'
      );
      return;
    }

    // Focus password input on component mount
    passwordInputRef.current?.focus();
  }, [resetToken]);

  // Focus management for accessibility
  useEffect(() => {
    if (submitError) {
      setTimeout(() => {
        errorAlertRef.current?.focus();
      }, 100);
    }
  }, [submitError]);

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        successAlertRef.current?.focus();
      }, 100);
    }
  }, [isSuccess]);

  /**
   * Evaluate password strength
   */
  const evaluatePasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length === 0) {
      return { score: 0, feedback: [], isValid: false };
    }

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Must be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Must contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Must contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Must contain at least one number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Must contain at least one special character');
    }

    const isValid = score >= 4 && password.length >= 8;

    return { score: Math.min(score, 4), feedback, isValid };
  };

  /**
   * Validate form fields with comprehensive validation
   */
  const validateForm = (): boolean => {
    const errors: Partial<ResetPasswordFormValues> = {};

    // Password validation
    if (!formValues.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (!passwordStrength.isValid) {
      errors.newPassword = 'Password does not meet security requirements';
    }

    // Confirm password validation
    if (!formValues.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formValues.newPassword !== formValues.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission with proper error handling
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setIsSuccess(false);

    if (!resetToken) {
      setSubmitError(
        'Invalid reset token. Please request a new password reset.'
      );
      return;
    }

    if (!validateForm()) {
      // Focus first error field
      if (formErrors.newPassword) {
        passwordInputRef.current?.focus();
      } else if (formErrors.confirmPassword) {
        confirmPasswordInputRef.current?.focus();
      }
      return;
    }

    try {
      await confirmPasswordReset({
        token: resetToken,
        newPassword: formValues.newPassword,
        confirmPassword: formValues.confirmPassword,
      }).unwrap();

      // Show success message
      setIsSuccess(true);

      // Clear sensitive data from form
      setFormValues({ newPassword: '', confirmPassword: '' });

      // Redirect to login after delay
      setTimeout(() => {
        navigate(ROUTES.LOGIN, {
          state: {
            message:
              'Password reset successfully. Please log in with your new password.',
          },
        });
      }, 3000);

      console.log('✅ Password reset completed successfully');
    } catch (error: any) {
      const errorMessage =
        error.data?.message || error.message || 'Failed to reset password';
      setSubmitError(errorMessage);

      console.error('❌ Password reset failed:', error);
    }
  };

  /**
   * Handle input changes with validation cleanup
   */
  const handleInputChange =
    (field: keyof ResetPasswordFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setFormValues(prev => ({ ...prev, [field]: value }));

      // Evaluate password strength for new password
      if (field === 'newPassword') {
        const strength = evaluatePasswordStrength(value);
        setPasswordStrength(strength);
      }

      // Clear field error when user starts typing
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
      }

      // Clear submit error when user makes changes
      if (submitError) {
        setSubmitError('');
      }

      // Clear success state when user modifies form
      if (isSuccess) {
        setIsSuccess(false);
      }
    };

  /**
   * Toggle password visibility
   */
  const handleTogglePasswordVisibility =
    (field: 'password' | 'confirm') => () => {
      if (field === 'password') {
        setShowPassword(!showPassword);
      } else {
        setShowConfirmPassword(!showConfirmPassword);
      }
    };

  /**
   * Get password strength color
   */
  const getPasswordStrengthColor = (score: number): string => {
    switch (score) {
      case 0:
      case 1:
        return theme.palette.error.main;
      case 2:
        return theme.palette.warning.main;
      case 3:
        return theme.palette.info.main;
      case 4:
        return theme.palette.success.main;
      default:
        return theme.palette.grey[400];
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              component="h1"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                mb: 1,
              }}
            >
              Set New Password
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Enter your new password to complete the reset process
            </Typography>
          </Box>

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Reset password form"
          >
            {/* Success Alert */}
            {isSuccess && (
              <Alert
                ref={successAlertRef}
                severity="success"
                sx={{ mb: 3 }}
                role="alert"
                aria-live="polite"
                tabIndex={-1}
                icon={<CheckCircleIcon />}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Password Reset Successfully
                </Typography>
                Redirecting to login page...
              </Alert>
            )}

            {/* Error Alert */}
            {submitError && (
              <Alert
                ref={errorAlertRef}
                severity="error"
                sx={{ mb: 3 }}
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
              >
                {submitError}
              </Alert>
            )}

            {/* New Password Field */}
            <Box sx={{ mb: 2 }}>
              <TextField
                ref={passwordInputRef}
                fullWidth
                id="new-password"
                name="newPassword"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formValues.newPassword}
                onChange={handleInputChange('newPassword')}
                error={Boolean(formErrors.newPassword)}
                helperText={formErrors.newPassword}
                disabled={isLoading || isSuccess}
                required
                aria-describedby="password-strength password-requirements"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        onClick={handleTogglePasswordVisibility('password')}
                        edge="end"
                        disabled={isLoading || isSuccess}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  'aria-label': 'New password',
                  maxLength: 128,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              {/* Password Strength Indicator */}
              {formValues.newPassword && (
                <Box sx={{ mt: 1 }} id="password-strength">
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', mr: 1 }}
                    >
                      Password Strength:
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(passwordStrength.score / 4) * 100}
                      role="progressbar"
                      aria-valuenow={passwordStrength.score}
                      aria-valuemin={0}
                      aria-valuemax={4}
                      aria-live="polite"
                      sx={{
                        flexGrow: 1,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getPasswordStrengthColor(
                            passwordStrength.score
                          ),
                          borderRadius: 3,
                        },
                      }}
                      aria-label={`Password strength: ${passwordStrength.score} out of 4`}
                    />
                  </Box>

                  {/* Password Requirements */}
                  {passwordStrength.feedback.length > 0 && (
                    <Box id="password-requirements" sx={{ mt: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        Password requirements:
                      </Typography>
                      {passwordStrength.feedback.map((feedback, index) => (
                        <Typography
                          key={index}
                          variant="caption"
                          sx={{
                            display: 'block',
                            color: 'error.main',
                            fontSize: '0.75rem',
                            ml: 1,
                          }}
                        >
                          • {feedback}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Confirm Password Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                ref={confirmPasswordInputRef}
                fullWidth
                id="confirm-password"
                name="confirmPassword"
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formValues.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={Boolean(formErrors.confirmPassword)}
                helperText={formErrors.confirmPassword}
                disabled={isLoading || isSuccess}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showConfirmPassword
                            ? 'Hide password confirmation'
                            : 'Show password confirmation'
                        }
                        onClick={handleTogglePasswordVisibility('confirm')}
                        edge="end"
                        disabled={isLoading || isSuccess}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  'aria-label': 'Confirm new password',
                  maxLength: 128,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading || isSuccess || !passwordStrength.isValid}
              startIcon={isLoading ? undefined : <SaveIcon />}
              sx={{
                mb: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            {/* Security Notice */}
            <Alert
              severity="info"
              sx={{ mt: 2 }}
              role="alert"
              aria-live="polite"
            >
              <Typography variant="body2">
                <strong>Security Notice:</strong> After resetting your password,
                you will be automatically redirected to the login page. Please
                log in with your new password.
              </Typography>
            </Alert>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
