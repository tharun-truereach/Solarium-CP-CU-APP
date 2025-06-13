/**
 * SessionExpired page component - dedicated page for expired sessions
 * Alternative to modal approach for session expiration handling
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { AppButton } from '../components/ui';
import { ROUTES } from '../routes/routes';

const SessionExpired: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleGoToLogin = () => {
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
          {/* Icon */}
          <Box sx={{ mb: 4 }}>
            <ScheduleIcon
              sx={{
                fontSize: { xs: 80, sm: 120 },
                color: 'warning.main',
                opacity: 0.8,
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant={isMobile ? 'h5' : 'h3'}
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 2,
            }}
          >
            Session Expired
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
            Your session has expired due to inactivity. For security reasons,
            you have been automatically logged out.
          </Typography>

          {/* Security Notice */}
          <Alert
            severity="info"
            sx={{
              mb: 4,
              textAlign: 'left',
              maxWidth: 500,
              mx: 'auto',
            }}
          >
            <Typography variant="body2">
              <strong>Security Notice:</strong> Sessions automatically expire
              after 30 minutes of inactivity to protect your account and data.
            </Typography>
          </Alert>

          {/* Action Button */}
          <AppButton
            variant="primary"
            onClick={handleGoToLogin}
            icon={<LoginIcon />}
            size="large"
            sx={{ minWidth: 200 }}
          >
            Login Again
          </AppButton>

          {/* Help Text */}
          <Box
            sx={{
              pt: 4,
              borderTop: '1px solid',
              borderColor: 'divider',
              mt: 4,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              If you continue to experience issues, please contact support.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default SessionExpired;
