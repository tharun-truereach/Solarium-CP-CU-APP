import React from 'react';
import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import { useAppDispatch } from '../store/hooks';
import { showError } from '../store/slices/uiSlice';
import { httpClient } from '../services/http/axiosClient';

const ErrorTestComponent: React.FC = () => {
  const dispatch = useAppDispatch();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const testManualError = () => {
    dispatch(
      showError({
        message: 'This is a manual error test message.',
        severity: 'error',
      })
    );
  };

  const testManualWarning = () => {
    dispatch(
      showError({
        message: 'This is a manual warning test message.',
        severity: 'warning',
      })
    );
  };

  const testManualInfo = () => {
    dispatch(
      showError({
        message: 'This is a manual info test message.',
        severity: 'info',
      })
    );
  };

  const testManualSuccess = () => {
    dispatch(
      showError({
        message: 'This is a manual success test message.',
        severity: 'success',
      })
    );
  };

  const testNetworkError = async () => {
    try {
      await httpClient.get('/nonexistent-endpoint');
    } catch (error) {
      console.log('Network error triggered:', error);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Error Toast Testing (Development Only)
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Test various error scenarios and toast notifications
      </Typography>

      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Manual Error Tests
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" size="small" onClick={testManualError}>
              Test Error
            </Button>
            <Button variant="outlined" size="small" onClick={testManualWarning}>
              Test Warning
            </Button>
            <Button variant="outlined" size="small" onClick={testManualInfo}>
              Test Info
            </Button>
            <Button variant="outlined" size="small" onClick={testManualSuccess}>
              Test Success
            </Button>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Network Error Tests
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" size="small" onClick={testNetworkError}>
              Test Network Error
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ErrorTestComponent;
