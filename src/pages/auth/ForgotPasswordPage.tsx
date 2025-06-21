/**
 * Forgot Password page component with comprehensive accessibility and security
 * Allows users to request password reset via email with proper validation and error handling
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useRequestPasswordResetMutation } from '../../api/endpoints/authEndpoints';
import { ROUTES } from '../../routes/routes';
import { VALIDATION_PATTERNS } from '../../utils/constants';

/**
 * Interface for forgot password form values
 */
interface ForgotPasswordFormValues {
  email: string;
}

/**
 * Forgot Password component with accessibility and security features
 * Implements WCAG 2.1 AA guidelines for form accessibility
 */
const ForgotPasswordPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Form state
  const [formValues, setFormValues] = useState<ForgotPasswordFormValues>({
    email: '',
  });
  const [formErrors, setFormErrors] = useState<
    Partial<ForgotPasswordFormValues>
  >({});
  const [submitError, setSubmitError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // RTK Query mutation
  const [requestPasswordReset, { isLoading }] =
    useRequestPasswordResetMutation();

  // Refs for accessibility focus management
  const emailInputRef = useRef<HTMLInputElement>(null);
  const errorAlertRef = useRef<HTMLDivElement>(null);
  const successAlertRef = useRef<HTMLDivElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    // Focus email input on component mount
    emailInputRef.current?.focus();
  }, []);

  // Focus error alert when error occurs
  useEffect(() => {
    if (submitError) {
      setTimeout(() => {
        errorAlertRef.current?.focus();
      }, 100);
    }
  }, [submitError]);

  // Focus success alert when success occurs
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        successAlertRef.current?.focus();
      }, 100);
    }
  }, [isSuccess]);

  /**
   * Validate form fields with comprehensive validation
   */
  const validateForm = (): boolean => {
    const errors: Partial<ForgotPasswordFormValues> = {};

    if (!formValues.email) {
      errors.email = 'Email is required';
    } else if (!VALIDATION_PATTERNS.EMAIL.test(formValues.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (formValues.email.length > 255) {
      errors.email = 'Email must be less than 255 characters';
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

    if (!validateForm()) {
      // Focus first error field
      if (formErrors.email) {
        emailInputRef.current?.focus();
      }
      return;
    }

    try {
      await requestPasswordReset({
        email: formValues.email.trim().toLowerCase(),
      }).unwrap();

      // Show success message
      setIsSuccess(true);

      // Clear form for security
      setFormValues({ email: '' });

      console.log('✅ Password reset request sent successfully');
    } catch (error: any) {
      const errorMessage =
        error.data?.message || error.message || 'Failed to send reset email';
      setSubmitError(errorMessage);

      console.error('❌ Password reset request failed:', error);
    }
  };

  /**
   * Handle input changes with validation cleanup
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFormValues(prev => ({ ...prev, email: value }));

    // Clear field error when user starts typing
    if (formErrors.email) {
      setFormErrors(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
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
   * Handle back to login navigation
   */
  const handleBackToLogin = () => {
    navigate(ROUTES.LOGIN);
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
              Reset Password
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Enter your email address and we'll send you a link to reset your
              password
            </Typography>
          </Box>

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Forgot password form"
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
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Reset Link Sent
                </Typography>
                If an account exists with this email address, you will receive a
                password reset link shortly.
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

            {/* Email Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                ref={emailInputRef}
                fullWidth
                id="reset-email"
                name="email"
                label="Email Address"
                type="email"
                autoComplete="email"
                value={formValues.email}
                onChange={handleInputChange}
                error={Boolean(formErrors.email)}
                helperText={formErrors.email}
                disabled={isLoading}
                required
                aria-describedby={formErrors.email ? 'email-error' : undefined}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  'aria-label': 'Email address for password reset',
                  maxLength: 255,
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
              disabled={isLoading || isSuccess}
              startIcon={isLoading ? undefined : <SendIcon />}
              sx={{
                mb: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              aria-describedby="submit-button-help"
            >
              {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </Button>

            {/* Help Text */}
            <Typography
              id="submit-button-help"
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', mb: 3, fontSize: '0.875rem' }}
            >
              We'll send reset instructions to your email address
            </Typography>

            {/* Back to Login Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="text"
                startIcon={<ArrowBackIcon />}
                onClick={handleBackToLogin}
                disabled={isLoading}
                sx={{
                  textDecoration: 'none',
                  textTransform: 'none',
                  fontWeight: 500,
                }}
                aria-label="Go back to login page"
              >
                Back to Login
              </Button>
            </Box>

            {/* Alternative navigation for screen readers */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Typography
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/contact')}
                  sx={{
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    color: 'primary.main',
                    background: 'none',
                    border: 'none',
                    '&:hover': { textDecoration: 'none' },
                  }}
                  aria-label="Contact support for account creation"
                >
                  Contact Support
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
