/**
 * Environment Banner Component - Enhanced with Feature Flag Demo
 * Shows environment information and demonstrates real-time feature flag updates
 */

import React from 'react';
import { Alert, Box, Chip, Typography, Fade, Paper } from '@mui/material';
import { Warning, Analytics, BugReport, Visibility } from '@mui/icons-material';
import { config } from '../config/environment';
import { useFeatureFlag, useFeatureFlags } from '../hooks/useFeatureFlags';

/**
 * Environment Banner Component
 * Demonstrates real-time feature flag propagation
 */
const EnvironmentBanner: React.FC = () => {
  // Demo: Use feature flags to control banner visibility and content
  const analyticsEnabled = useFeatureFlag('ANALYTICS');
  const debugMode = useFeatureFlag('DEBUG_MODE');
  const { enabledCount, flagCount, lastUpdated } = useFeatureFlags();

  // Only show banner in development or when analytics is disabled
  const shouldShowBanner = config.environment === 'DEV' || !analyticsEnabled;

  if (!shouldShowBanner) {
    return null;
  }

  const getBannerSeverity = () => {
    if (config.environment === 'DEV') return 'warning';
    if (debugMode) return 'error';
    return 'info';
  };

  const getBannerIcon = () => {
    if (debugMode) return <BugReport />;
    if (!analyticsEnabled) return <Visibility />;
    return <Warning />;
  };

  const getBannerMessage = () => {
    if (config.environment === 'DEV') {
      return 'Development Environment - Feature flags and real-time updates are active';
    }
    if (debugMode) {
      return 'Debug Mode Enabled - Additional logging and developer tools are active';
    }
    if (!analyticsEnabled) {
      return 'Analytics Disabled - User tracking and analytics are turned off';
    }
    return 'Environment Information';
  };

  return (
    <Fade in timeout={500}>
      <Paper
        elevation={2}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          borderRadius: 0,
          borderBottom: '2px solid',
          borderColor: `${getBannerSeverity()}.main`,
        }}
      >
        <Alert
          severity={getBannerSeverity()}
          icon={getBannerIcon()}
          sx={{
            borderRadius: 0,
            '& .MuiAlert-message': {
              width: '100%',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {getBannerMessage()}
              </Typography>
              {config.environment === 'DEV' && (
                <Typography
                  variant="caption"
                  sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}
                >
                  Environment: {config.environment} • API: {config.apiBaseUrl} •
                  Feature Flags: {enabledCount}/{flagCount} enabled
                  {lastUpdated &&
                    ` • Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {/* Environment Chip */}
              <Chip
                label={config.environment}
                size="small"
                color={config.environment === 'PROD' ? 'success' : 'warning'}
                variant="filled"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />

              {/* Analytics Chip */}
              <Chip
                icon={<Analytics sx={{ fontSize: 14 }} />}
                label={analyticsEnabled ? 'Analytics ON' : 'Analytics OFF'}
                size="small"
                color={analyticsEnabled ? 'success' : 'default'}
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />

              {/* Debug Mode Chip */}
              {debugMode && (
                <Chip
                  icon={<BugReport sx={{ fontSize: 14 }} />}
                  label="Debug Mode"
                  size="small"
                  color="error"
                  variant="filled"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}

              {/* Feature Flag Count Chip */}
              {config.environment === 'DEV' && (
                <Chip
                  label={`${enabledCount}/${flagCount} flags`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Box>
          </Box>
        </Alert>
      </Paper>
    </Fade>
  );
};

export default EnvironmentBanner;
