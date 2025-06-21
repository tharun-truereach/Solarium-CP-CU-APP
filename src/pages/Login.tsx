/**
 * Enhanced Login page component with comprehensive security and accessibility
 * Provides secure email/password authentication with proper error handling and WCAG 2.1 AA compliance
 */
import React, { useState, useRef, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
  Link,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  InputAdornment,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Login as LoginIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAppDispatch } from '../store/hooks';
import { showToast } from '../store/slices/uiSlice';
import { ROUTES } from '../routes/routes';
import { VALIDATION_PATTERNS, ERROR_MESSAGES } from '../utils/constants';

/**
 * Interface for login form values
 */
interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Enhanced Login component with accessibility and security features
 */
const Login: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const {
    login,
    isAuthenticated,
    error: authError,
    isLoading,
    clearError,
  } = useAuth();

  // Form state
  const [formValues, setFormValues] = useState<LoginFormValues>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [formErrors, setFormErrors] = useState<Partial<LoginFormValues>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string>('');

  // Refs for focus management
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const errorAlertRef = useRef<HTMLDivElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    // Focus email input on component mount
    emailInputRef.current?.focus();
  }, []);

  // Handle Escape key to clear errors
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearError();
        setSubmitError('');
        setFormErrors({});
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [clearError]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || ROUTES.DASHBOARD;
    return <Navigate to={from} replace />;
  }

  // Validation function
  const validateForm = (): boolean => {
    const errors: Partial<LoginFormValues> = {};

    if (!formValues.email) {
      errors.email = 'Email is required';
    } else if (!VALIDATION_PATTERNS.EMAIL.test(formValues.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (formValues.email.length > 255) {
      errors.email = 'Email must be less than 255 characters';
    }

    if (!formValues.password) {
      errors.password = 'Password is required';
    } else if (formValues.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (formValues.password.length > 128) {
      errors.password = 'Password must be less than 128 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    clearError();

    if (!validateForm()) {
      // Focus first error field
      if (formErrors.email) {
        emailInputRef.current?.focus();
      } else if (formErrors.password) {
        passwordInputRef.current?.focus();
      }
      return;
    }

    // Check for account lockout
    if (isLocked) {
      const errorMessage =
        'Account temporarily locked due to multiple failed attempts';
      setSubmitError(errorMessage);
      dispatch(
        showToast({
          message: errorMessage,
          severity: 'error',
          duration: 8000,
        })
      );
      return;
    }

    try {
      await login({
        email: formValues.email.trim().toLowerCase(),
        password: formValues.password,
        rememberMe: formValues.rememberMe,
      });

      // Reset login attempts on successful login
      setLoginAttempts(0);
      setIsLocked(false);

      // Show success message
      dispatch(
        showToast({
          message: 'Successfully logged in!',
          severity: 'success',
          duration: 4000,
        })
      );

      // Redirect to intended page
      const from = location.state?.from?.pathname || ROUTES.DASHBOARD;
      navigate(from, { replace: true });
    } catch (error: any) {
      const errorMessage = error.message || ERROR_MESSAGES.GENERIC_ERROR;

      // Increment login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockoutTimer(15 * 60); // 15 minutes
        const lockoutMessage =
          'Account locked for 15 minutes due to multiple failed login attempts';
        setSubmitError(lockoutMessage);

        // Show lockout error in GlobalErrorToast
        dispatch(
          showToast({
            message: lockoutMessage,
            severity: 'error',
            duration: 0, // Don't auto-hide lockout messages
          })
        );

        // Start countdown timer
        const timer = setInterval(() => {
          setLockoutTimer(prev => {
            if (prev <= 1) {
              setIsLocked(false);
              setLoginAttempts(0);
              clearInterval(timer);
              dispatch(
                showToast({
                  message: 'Account unlocked. You may try logging in again.',
                  severity: 'info',
                  duration: 5000,
                })
              );
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Handle specific error types and show in GlobalErrorToast
        if (errorMessage.toLowerCase().includes('email')) {
          setFormErrors({ email: errorMessage });
          emailInputRef.current?.focus();
          dispatch(
            showToast({
              message: errorMessage,
              severity: 'error',
              duration: 6000,
            })
          );
        } else if (errorMessage.toLowerCase().includes('password')) {
          setFormErrors({ password: errorMessage });
          passwordInputRef.current?.focus();
          dispatch(
            showToast({
              message: errorMessage,
              severity: 'error',
              duration: 6000,
            })
          );
        } else if (errorMessage.toLowerCase().includes('locked')) {
          setSubmitError(errorMessage);
          dispatch(
            showToast({
              message: errorMessage,
              severity: 'warning',
              duration: 8000,
            })
          );
        } else if (errorMessage.toLowerCase().includes('network')) {
          setSubmitError(ERROR_MESSAGES.NETWORK_ERROR);
          dispatch(
            showToast({
              message: ERROR_MESSAGES.NETWORK_ERROR,
              severity: 'error',
              duration: 8000,
            })
          );
        } else {
          setSubmitError(errorMessage);
          dispatch(
            showToast({
              message: errorMessage,
              severity: 'error',
              duration: 8000,
            })
          );
        }
      }

      // Focus error alert for screen readers
      setTimeout(() => {
        errorAlertRef.current?.focus();
      }, 100);
    }
  };

  // Handle input changes
  const handleInputChange =
    (field: keyof LoginFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === 'rememberMe' ? event.target.checked : event.target.value;
      setFormValues(prev => ({ ...prev, [field]: value }));

      // Clear field error when user starts typing
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
      }

      // Clear submit error when user makes changes
      if (submitError) {
        setSubmitError('');
      }

      // Clear auth error when user makes changes
      if (authError) {
        clearError();
      }
    };

  // Handle password visibility toggle
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Format lockout timer display
  const formatLockoutTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get current error message for display
  const getCurrentError = () => {
    return authError || submitError;
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
              Solarium Portal
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Sign in to your account
            </Typography>

            {/* Lockout warning */}
            {isLocked && (
              <Alert
                severity="warning"
                sx={{ mb: 2, textAlign: 'left' }}
                role="alert"
                aria-live="polite"
              >
                Account locked for {formatLockoutTime(lockoutTimer)} due to
                multiple failed attempts
              </Alert>
            )}
          </Box>

          {/* Login Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Login form"
          >
            {/* Error Display */}
            {getCurrentError() && (
              <Alert
                ref={errorAlertRef}
                severity="error"
                sx={{ mb: 3 }}
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
              >
                {getCurrentError()}
              </Alert>
            )}

            {/* Email Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                ref={emailInputRef}
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                autoComplete="username"
                value={formValues.email}
                onChange={handleInputChange('email')}
                error={Boolean(formErrors.email)}
                helperText={formErrors.email}
                disabled={isLoading || isLocked}
                aria-invalid={Boolean(formErrors.email)}
                aria-describedby={formErrors.email ? 'email-error' : undefined}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  'aria-label': 'Email address',
                  maxLength: 255,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                ref={passwordInputRef}
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formValues.password}
                onChange={handleInputChange('password')}
                error={Boolean(formErrors.password)}
                helperText={formErrors.password}
                disabled={isLoading || isLocked}
                aria-invalid={Boolean(formErrors.password)}
                aria-describedby={
                  formErrors.password ? 'password-error' : undefined
                }
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
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        disabled={isLoading || isLocked}
                        tabIndex={0}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  'aria-label': 'Password',
                  maxLength: 128,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            {/* Remember Me */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formValues.rememberMe}
                    onChange={handleInputChange('rememberMe')}
                    disabled={isLoading || isLocked}
                    color="primary"
                  />
                }
                label="Remember me"
              />
            </Box>

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading || isLocked}
              startIcon={isLoading ? undefined : <LoginIcon />}
              sx={{
                mb: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 48, // WCAG touch target minimum
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Login Attempt Counter */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', mb: 3, fontSize: '0.75rem' }}
              aria-live="polite"
            >
              {loginAttempts > 0 &&
                !isLocked &&
                `${5 - loginAttempts} attempts remaining before account lockout`}
            </Typography>

            {/* Divider */}
            <Divider sx={{ my: 3 }} />

            {/* Additional Links */}
            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/forgot-password')}
                disabled={isLoading}
                sx={{
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'none' },
                  minHeight: 44, // WCAG touch target minimum
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1,
                }}
                aria-label="Go to forgot password page"
              >
                Forgot your password?
              </Link>
            </Box>

            {/* Demo Information - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <Alert
                severity="info"
                sx={{ mt: 3, textAlign: 'left' }}
                role="region"
                aria-label="Demo information"
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Demo Credentials:
                </Typography>
                <Typography variant="body2" component="div">
                  • Admin: admin@solarium.com / Admin123!
                  <br />• KAM: kam@solarium.com / Kam123!
                </Typography>
              </Alert>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
