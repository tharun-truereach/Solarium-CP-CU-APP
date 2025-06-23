/**
 * Settings Page - Admin-only system configuration interface
 * Comprehensive settings management with tabbed interface and real-time data
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Tabs,
  Tab,
  Skeleton,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Tune as GeneralIcon,
  Flag as FlagsIcon,
  Security as SecurityIcon,
  DataUsage as ThresholdsIcon,
  History as AuditIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useGetSettingsQuery } from '../../api/endpoints/settingsEndpoints';

/**
 * Tab panel component for consistent tab content structure
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const SettingsTabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

/**
 * Tab configuration for settings interface
 */
interface SettingsTab {
  id: string;
  label: string;
  icon: React.ReactElement;
  description: string;
  comingSoon?: boolean;
}

const settingsTabs: SettingsTab[] = [
  {
    id: 'general',
    label: 'General',
    icon: <GeneralIcon />,
    description: 'Session timeout, token expiry, and basic configuration',
  },
  {
    id: 'feature-flags',
    label: 'Feature Flags',
    icon: <FlagsIcon />,
    description:
      'Enable/disable application features and experimental functionality',
  },
  {
    id: 'security',
    label: 'Security',
    icon: <SecurityIcon />,
    description:
      'Authentication settings, password policies, and security controls',
    comingSoon: true,
  },
  {
    id: 'thresholds',
    label: 'Thresholds',
    icon: <ThresholdsIcon />,
    description: 'Numeric limits, quotas, and system boundaries',
  },
  {
    id: 'audit-log',
    label: 'Audit Log',
    icon: <AuditIcon />,
    description: 'View configuration change history and user activities',
  },
];

/**
 * Skeleton loader for settings content
 */
const SettingsSkeleton: React.FC = () => (
  <Box sx={{ py: 2 }}>
    <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2, width: '40%' }} />
    <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 3, width: '60%' }} />

    {/* Form skeleton elements */}
    {[...Array(4)].map((_, index) => (
      <Box key={index} sx={{ mb: 3 }}>
        <Skeleton
          variant="text"
          sx={{ fontSize: '1.2rem', mb: 1, width: '30%' }}
        />
        <Skeleton
          variant="rectangular"
          height={56}
          sx={{ mb: 1, borderRadius: 2 }}
        />
        <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '50%' }} />
      </Box>
    ))}

    {/* Action buttons skeleton */}
    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
      <Skeleton
        variant="rectangular"
        width={120}
        height={44}
        sx={{ borderRadius: 2 }}
      />
      <Skeleton
        variant="rectangular"
        width={100}
        height={44}
        sx={{ borderRadius: 2 }}
      />
    </Box>
  </Box>
);

/**
 * Error state component with retry functionality
 */
interface SettingsErrorProps {
  error: any;
  onRetry: () => void;
}

const SettingsError: React.FC<SettingsErrorProps> = ({ error, onRetry }) => (
  <Box sx={{ py: 4 }}>
    <Alert
      severity="error"
      sx={{ mb: 3 }}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={onRetry}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      }
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Failed to load settings
      </Typography>
      <Typography variant="body2">
        {error?.data?.message ||
          error?.message ||
          'An unexpected error occurred while loading system settings.'}
      </Typography>
    </Alert>

    <Box sx={{ textAlign: 'center', py: 4 }}>
      <SettingsIcon
        sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }}
      />
      <Typography variant="body2" color="text.secondary">
        Please try refreshing the page or contact support if the problem
        persists.
      </Typography>
    </Box>
  </Box>
);

/**
 * Coming soon placeholder for tabs under development
 */
interface ComingSoonProps {
  tabInfo: SettingsTab;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ tabInfo }) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    <Box sx={{ mb: 3 }}>
      {React.cloneElement(tabInfo.icon, {
        sx: { fontSize: 64, color: 'text.secondary', opacity: 0.5 },
      })}
    </Box>
    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
      {tabInfo.label} Settings
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
    >
      {tabInfo.description}
    </Typography>
    <Chip
      label="Coming Soon"
      color="primary"
      variant="outlined"
      size="small"
      sx={{ fontWeight: 600 }}
    />
  </Box>
);

/**
 * Settings Page Component - Admin Only
 * Enhanced with comprehensive tab interface and real-time data loading
 */
const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Fetch settings data
  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSettingsQuery();

  // Double-check admin access (ProtectedRoute should handle this, but defense in depth)
  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Access Denied
          </Typography>
          <Typography variant="body2">
            You must be an administrator to access system settings.
          </Typography>
        </Alert>
      </Box>
    );
  }

  /**
   * Handle tab change
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  /**
   * Handle settings refresh
   */
  const handleRefresh = () => {
    refetch();
  };

  /**
   * Get accessibility props for tabs
   */
  const getTabProps = (index: number) => ({
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  });

  return (
    <Box className="settings-page" component="main">
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 0.5,
                }}
              >
                System Settings
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                Configure system-wide parameters and application behavior
                {settings?.lastUpdated && (
                  <>
                    • Last updated:{' '}
                    {new Date(settings.lastUpdated).toLocaleString()}
                  </>
                )}
              </Typography>
            </Box>
          </Box>

          {/* Header Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh settings">
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading}
                size="small"
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <RefreshIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            {process.env.NODE_ENV === 'development' && (
              <Tooltip title="Development mode active">
                <Chip
                  icon={<InfoIcon />}
                  label="DEV"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* Settings Content */}
      <Paper
        elevation={1}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {/* Settings Tabs */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                py: 2,
              },
              '& .MuiTab-root.Mui-selected': {
                fontWeight: 600,
              },
            }}
          >
            {settingsTabs.map((tab, index) => (
              <Tab
                key={tab.id}
                icon={tab.icon}
                iconPosition="start"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.label}
                    {tab.comingSoon && (
                      <Chip
                        label="Soon"
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{
                          fontSize: '0.625rem',
                          height: 20,
                          '& .MuiChip-label': { px: 1 },
                        }}
                      />
                    )}
                  </Box>
                }
                {...getTabProps(index)}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ minHeight: 400 }}>
          {/* General Settings Tab */}
          <SettingsTabPanel value={activeTab} index={0}>
            {isLoading ? (
              <SettingsSkeleton />
            ) : isError ? (
              <SettingsError error={error} onRetry={handleRefresh} />
            ) : (
              <Box sx={{ px: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <GeneralIcon color="primary" />
                  General Configuration
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  Configure session timeouts, token expiry, and basic
                  application settings.
                </Typography>

                {/* Placeholder for General Settings Form */}
                <ComingSoon tabInfo={settingsTabs[0]!} />
              </Box>
            )}
          </SettingsTabPanel>

          {/* Feature Flags Tab */}
          <SettingsTabPanel value={activeTab} index={1}>
            {isLoading ? (
              <SettingsSkeleton />
            ) : isError ? (
              <SettingsError error={error} onRetry={handleRefresh} />
            ) : (
              <Box sx={{ px: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <FlagsIcon color="primary" />
                  Feature Flags
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  Toggle application features and experimental functionality in
                  real-time.
                </Typography>

                {/* Show current feature flags count */}
                {settings?.featureFlags && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>
                        {Object.keys(settings.featureFlags).length} feature
                        flags
                      </strong>{' '}
                      configured •
                      <strong>
                        {' '}
                        {
                          Object.values(settings.featureFlags).filter(Boolean)
                            .length
                        }{' '}
                        enabled
                      </strong>
                    </Typography>
                  </Alert>
                )}

                <ComingSoon tabInfo={settingsTabs[1]!} />
              </Box>
            )}
          </SettingsTabPanel>

          {/* Security Settings Tab */}
          <SettingsTabPanel value={activeTab} index={2}>
            <Box sx={{ px: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <SecurityIcon color="primary" />
                Security Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Configure authentication policies, password requirements, and
                security controls.
              </Typography>

              <ComingSoon tabInfo={settingsTabs[2]!} />
            </Box>
          </SettingsTabPanel>

          {/* Thresholds Tab */}
          <SettingsTabPanel value={activeTab} index={3}>
            {isLoading ? (
              <SettingsSkeleton />
            ) : isError ? (
              <SettingsError error={error} onRetry={handleRefresh} />
            ) : (
              <Box sx={{ px: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <ThresholdsIcon color="primary" />
                  System Thresholds
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  Configure numeric limits, quotas, and system operational
                  boundaries.
                </Typography>

                {/* Show current thresholds count */}
                {settings?.thresholds && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>
                        {Object.keys(settings.thresholds).length} threshold
                        values
                      </strong>{' '}
                      configured
                    </Typography>
                  </Alert>
                )}

                <ComingSoon tabInfo={settingsTabs[3]!} />
              </Box>
            )}
          </SettingsTabPanel>

          {/* Audit Log Tab */}
          <SettingsTabPanel value={activeTab} index={4}>
            <Box sx={{ px: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <AuditIcon color="primary" />
                Audit Log
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                View detailed history of configuration changes and
                administrative activities.
              </Typography>

              <ComingSoon tabInfo={settingsTabs[4]!} />
            </Box>
          </SettingsTabPanel>
        </Box>
      </Paper>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && settings && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="info">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Development Info:
            </Typography>
            <Typography variant="body2" component="div">
              • Route: /settings
              <br />
              • Access: Admin only
              <br />• User: {user.name} ({user.role})<br />• Settings loaded: ✅{' '}
              {Object.keys(settings.featureFlags).length} flags,{' '}
              {Object.keys(settings.thresholds).length} thresholds
              <br />• Last sync:{' '}
              {settings.lastUpdated
                ? new Date(settings.lastUpdated).toLocaleString()
                : 'Never'}
              <br />• Active tab: {settingsTabs[activeTab]?.label}
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default SettingsPage;
