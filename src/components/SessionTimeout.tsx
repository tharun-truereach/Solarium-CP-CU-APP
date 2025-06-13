/**
 * SessionTimeout component - handles session expiration detection and user notification
 * Enhanced with environment-based configuration
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  LinearProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Timer as TimerIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppButton } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../routes/routes';
import { config } from '../config/environment';

interface SessionTimeoutProps {
  warningTimeMinutes?: number;
  sessionTimeoutMinutes?: number;
  checkIntervalSeconds?: number;
}

const SessionTimeout: React.FC<SessionTimeoutProps> = ({
  warningTimeMinutes = config.sessionWarningMinutes,
  sessionTimeoutMinutes = config.sessionTimeoutMinutes,
  checkIntervalSeconds = 60,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { logout, isAuthenticated } = useAuth();

  // Memoize logout and isAuthenticated to avoid unnecessary re-renders
  const stableLogout = useCallback(() => logout(), [logout]);
  const stableIsAuthenticated = useMemo(
    () => isAuthenticated,
    [isAuthenticated]
  );

  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Update last activity time
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
    setShowExpired(false);
    // console.log(user); // Remove or comment out to avoid unnecessary renders
  }, []); // No dependencies, as we only update state

  // Check session status
  const checkSession = useCallback(() => {
    if (!stableIsAuthenticated) return;

    const now = Date.now();
    const timeSinceActivity = now - lastActivity;
    const timeUntilWarning =
      (sessionTimeoutMinutes - warningTimeMinutes) * 60 * 1000;
    const timeUntilTimeout = sessionTimeoutMinutes * 60 * 1000;

    if (timeSinceActivity >= timeUntilTimeout) {
      // Session expired
      setShowExpired(true);
      setShowWarning(false);
    } else if (timeSinceActivity >= timeUntilWarning) {
      // Show warning
      const remaining = timeUntilTimeout - timeSinceActivity;
      setTimeLeft(Math.ceil(remaining / 1000));
      setShowWarning(true);
      setShowExpired(false);
    } else {
      // Session still active
      setShowWarning(false);
      setShowExpired(false);
    }
  }, [
    stableIsAuthenticated,
    lastActivity,
    sessionTimeoutMinutes,
    warningTimeMinutes,
  ]);

  // Set up activity listeners
  useEffect(() => {
    if (!stableIsAuthenticated) return;

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const throttledUpdateActivity = (() => {
      let timeout: NodeJS.Timeout | null = null;
      return () => {
        if (timeout) return;
        timeout = setTimeout(() => {
          updateActivity();
          timeout = null;
        }, 1000); // Throttle to once per second
      };
    })();

    events.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity, true);
      });
    };
  }, [stableIsAuthenticated, updateActivity]);

  // Set up session checking interval
  useEffect(() => {
    if (!stableIsAuthenticated) return;

    const interval = setInterval(checkSession, checkIntervalSeconds * 1000);

    // Check immediately
    checkSession();

    return () => clearInterval(interval);
  }, [stableIsAuthenticated, checkSession, checkIntervalSeconds]);

  // Countdown timer for warning
  useEffect(() => {
    if (!showWarning || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showWarning, timeLeft]);

  const handleExtendSession = () => {
    updateActivity();
  };

  const handleLogout = () => {
    stableLogout();
    navigate(ROUTES.LOGIN);
    setShowWarning(false);
    setShowExpired(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Don't render if user is not authenticated
  if (!stableIsAuthenticated) return null;

  return (
    <>
      {/* Session Warning Dialog */}
      <Dialog
        open={showWarning}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <TimerIcon sx={{ fontSize: 48, color: 'warning.main' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Session Expiring Soon
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Your session will expire due to inactivity
          </Alert>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You will be automatically logged out in:
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: timeLeft <= 60 ? 'error.main' : 'warning.main',
                fontFamily: 'monospace',
              }}
            >
              {formatTime(timeLeft)}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={
              ((warningTimeMinutes * 60 - timeLeft) /
                (warningTimeMinutes * 60)) *
              100
            }
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: timeLeft <= 60 ? 'error.main' : 'warning.main',
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, p: 3 }}>
          <AppButton
            variant="primary"
            onClick={handleExtendSession}
            size="large"
            sx={{ minWidth: 140 }}
          >
            Stay Logged In
          </AppButton>

          <AppButton
            variant="outline"
            onClick={handleLogout}
            size="large"
            sx={{ minWidth: 140 }}
          >
            Logout Now
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* Session Expired Dialog */}
      <Dialog
        open={showExpired}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <WarningIcon sx={{ fontSize: 48, color: 'error.main' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: 'error.main' }}
          >
            Session Expired
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            Your session has expired due to inactivity
          </Alert>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            For your security, you have been automatically logged out after{' '}
            {sessionTimeoutMinutes} minutes of inactivity.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Please log in again to continue using the application.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', p: 3 }}>
          <AppButton
            variant="primary"
            onClick={handleLogout}
            size="large"
            sx={{ minWidth: 160 }}
          >
            Go to Login
          </AppButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionTimeout;
