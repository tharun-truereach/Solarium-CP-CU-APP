/**
 * ServerError (500) page component - for server-side errors
 * Displayed when the application encounters server errors
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Stack,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  BugReport as BugReportIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { AppButton } from '../components/ui';
import { ROUTES } from '../routes/routes';
import { useAuth } from '../contexts/AuthContext';

interface ServerErrorProps {
  error?: Error;
  errorId?: string;
}

const ServerError: React.FC<ServerErrorProps> = ({ error, errorId }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useAuth();

  const handleGoHome = () => {
    navigate(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleReportError = () => {
    // In a real implementation, this would open a support ticket or error reporting form
    console.log('Error reported:', {
      error,
      errorId,
      timestamp: new Date().toISOString(),
    });
    alert('Error reported. Thank you for helping us improve the system.');
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
            <BugReportIcon
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
            500
          </Typography>

          <Typography
            variant={isMobile ? 'h6' : 'h4'}
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 2,
            }}
          >
            Server Error
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
            We&apos;re experiencing technical difficulties. Our team has been
            notified and is working to resolve the issue.
          </Typography>

          {/* Error Details */}
          {(error || errorId) && (
            <Alert
              severity="error"
              sx={{
                mb: 4,
                textAlign: 'left',
                maxWidth: 500,
                mx: 'auto',
              }}
            >
              {errorId && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Error ID:</strong> {errorId}
                </Typography>
              )}
              {error && (
                <Typography variant="body2">
                  <strong>Details:</strong> {error.message}
                </Typography>
              )}
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
              onClick={handleRefresh}
              icon={<RefreshIcon />}
              size="large"
              sx={{ minWidth: 160 }}
            >
              Try Again
            </AppButton>

            <AppButton
              variant="outline"
              onClick={handleGoHome}
              icon={<HomeIcon />}
              size="large"
              sx={{ minWidth: 160 }}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Go Home'}
            </AppButton>

            <AppButton
              variant="text"
              onClick={handleReportError}
              icon={<BugReportIcon />}
              size="large"
              sx={{ minWidth: 160 }}
            >
              Report Issue
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
              If the problem persists, please contact our support team with the
              error ID above.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ServerError;
