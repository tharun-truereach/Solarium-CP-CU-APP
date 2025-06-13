/**
 * EnvironmentBanner component - displays current environment information
 * Shows environment name and build information for development and staging
 */
import React, { useState } from 'react';
import {
  Box,
  Chip,
  Typography,
  Collapse,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import { Info as InfoIcon, Close as CloseIcon } from '@mui/icons-material';
import {
  config,
  isDevelopment,
  isStaging,
  getEnvironmentDisplayName,
} from '../config/environment';

export const EnvironmentBanner: React.FC = () => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show banner in development and staging
  if (!isDevelopment() && !isStaging()) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  const getColor = () => {
    switch (config.environment) {
      case 'DEV':
        return 'info';
      case 'STAGING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getBgColor = () => {
    switch (config.environment) {
      case 'DEV':
        return theme.palette.info.light;
      case 'STAGING':
        return theme.palette.warning.light;
      default:
        return theme.palette.grey[100];
    }
  };

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <Box
      data-testid="environment-banner"
      role="banner"
      aria-label="Environment information"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: getBgColor(),
        borderTop: '1px solid',
        borderColor: 'divider',
        p: 1,
        zIndex: theme.zIndex.snackbar,
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        {/* Environment Chip */}
        <Chip
          label={`ENV: ${getEnvironmentDisplayName()}`}
          color={getColor()}
          size="small"
          variant="filled"
          sx={{ fontWeight: 600 }}
          data-testid="environment-chip"
        />

        {/* Version Info */}
        <Typography
          variant="caption"
          color="text.secondary"
          data-testid="version-info"
        >
          v{config.version}
        </Typography>

        {/* Info Button */}
        <Tooltip
          title={expanded ? 'Hide build information' : 'Show build information'}
        >
          <IconButton
            size="small"
            onClick={handleExpand}
            sx={{ color: 'text.secondary' }}
            aria-label={
              expanded ? 'Hide build information' : 'Show build information'
            }
            data-testid="info-button"
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Close Button */}
        <Tooltip title="Dismiss banner">
          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{ color: 'text.secondary' }}
            aria-label="Dismiss banner"
            data-testid="dismiss-button"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Expanded Information */}
      <Collapse in={expanded} data-testid="expanded-info">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 3,
            mt: 1,
            py: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            data-testid="build-info"
          >
            <strong>Build:</strong> {config.buildNumber}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            data-testid="api-info"
          >
            <strong>API:</strong> {config.apiBaseUrl}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            data-testid="session-info"
          >
            <strong>Session:</strong> {config.sessionTimeoutMinutes}min
          </Typography>
          {config.enableDebugTools && (
            <Typography
              variant="caption"
              color="text.secondary"
              data-testid="debug-info"
            >
              <strong>Debug:</strong> Enabled
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default EnvironmentBanner;
