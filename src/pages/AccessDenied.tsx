/**
 * Enhanced 403 Access Denied page component with Material UI styling
 * Displayed when users try to access unauthorized routes
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Stack,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Block as BlockIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { AppButton } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../routes/routes';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, logout } = useAuth();

  const handleGoHome = () => {
    navigate(ROUTES.DASHBOARD);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    logout();
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
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            textAlign: 'center',
            p: { xs: 4, sm: 6, md: 8 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {/* Error Icon */}
          <Box sx={{ mb: 4 }}>
            <BlockIcon
              sx={{
                fontSize: { xs: 80, sm: 120 },
                color: 'error.main',
                opacity: 0.8,
              }}
            />
          </Box>

          {/* Error Message */}
          <Typography
            variant={isMobile ? 'h4' : 'h2'}
            sx={{
              fontWeight: 700,
              color: 'error.main',
              mb: 2,
            }}
          >
            403
          </Typography>

          <Typography
            variant={isMobile ? 'h5' : 'h3'}
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 2,
            }}
          >
            Error
          </Typography>

          <Typography
            variant={isMobile ? 'h6' : 'h4'}
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 2,
            }}
          >
            Access Denied
          </Typography>

          <Typography variant="h4" component="h1" gutterBottom>
            Access Denied
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 4,
              maxWidth: 500,
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            You don&apos;t have permission to access this page. Contact your
            administrator if you need access.
          </Typography>

          {/* User Context */}
          {user && (
            <Alert
              severity="info"
              sx={{
                mb: 4,
                textAlign: 'left',
                maxWidth: 500,
                mx: 'auto',
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Current User:</strong> {user.name} ({user.email})
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Role:</strong>
                </Typography>
                <Chip
                  label={user.role.toUpperCase()}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Alert>
          )}

          {/* Action Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ mb: 4 }}
          >
            <AppButton
              variant="primary"
              onClick={handleGoHome}
              icon={<HomeIcon />}
              size="large"
              sx={{ minWidth: 160 }}
            >
              Go to Dashboard
            </AppButton>

            <AppButton
              variant="outline"
              onClick={handleGoBack}
              icon={<ArrowBackIcon />}
              size="large"
              sx={{ minWidth: 160 }}
            >
              Go Back
            </AppButton>

            <AppButton
              variant="text"
              onClick={handleLogout}
              icon={<LogoutIcon />}
              size="large"
              sx={{ minWidth: 160 }}
            >
              Switch User
            </AppButton>
          </Stack>

          {/* Help Text */}
          <Box
            sx={{
              pt: 4,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              If you need access to this page, please contact your administrator
              or try logging in with a different account.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AccessDenied;
