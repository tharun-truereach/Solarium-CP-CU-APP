/**
 * Enhanced 404 Not Found page component with Material UI styling
 * Displayed when users navigate to non-existent routes
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { AppButton } from '../components/ui';
import { ROUTES } from '../routes/routes';
import { useAuth } from '../contexts/AuthContext';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useAuth();

  const handleGoHome = () => {
    navigate(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME);
  };

  const handleGoBack = () => {
    navigate(-1);
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
            <ErrorIcon
              sx={{
                fontSize: { xs: 80, sm: 120 },
                color: 'text.secondary',
                opacity: 0.7,
              }}
            />
          </Box>

          {/* Error Message */}
          <Typography
            variant={isMobile ? 'h4' : 'h2'}
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 2,
            }}
          >
            404
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
            Page Not Found
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
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Please check the URL or navigate back to continue.
          </Typography>

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
              {isAuthenticated ? 'Go to Dashboard' : 'Go Home'}
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
              If you believe this is an error, please contact the system
              administrator.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFound;
