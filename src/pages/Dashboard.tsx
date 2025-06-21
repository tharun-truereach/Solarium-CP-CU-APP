/**
 * Enhanced Dashboard page with Material UI components and real API integration
 * Displays role-based content with proper Material UI styling and live data
 */
import React from 'react';
import { Grid, Typography, Box, Fab, Alert } from '@mui/material';
import {
  People,
  RequestQuote,
  Business,
  Assessment,
  Notifications,
  TrendingUp,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppCard } from '../components/ui';
import { PlaceholderCard, QuickActionTile } from '../components/dashboard';
import { DataLoader } from '../components/loading';
import { useDashboardMetricsByRole } from '../hooks/useDashboardMetrics';
import { ROUTES } from '../routes/routes';

/**
 * Quick action configuration for role-based navigation
 */
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  roles: string[];
}

const quickActions: QuickAction[] = [
  {
    id: 'view-leads',
    label: 'View Leads',
    icon: <People />,
    path: ROUTES.LEADS,
    roles: ['admin', 'kam'],
  },
  {
    id: 'create-quotation',
    label: 'Create Quotation',
    icon: <RequestQuote />,
    path: ROUTES.QUOTATIONS,
    roles: ['admin', 'kam'],
  },
  {
    id: 'manage-partners',
    label: 'Manage Partners',
    icon: <Business />,
    path: ROUTES.CHANNEL_PARTNERS,
    roles: ['admin'], // Admin only
  },
  {
    id: 'view-reports',
    label: 'View Reports',
    icon: <Assessment />,
    path: ROUTES.SETTINGS, // Placeholder path for reports
    roles: ['admin'], // Admin only
  },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use role-based metrics hook for API integration
  const {
    data: metrics,
    isLoading,
    isError,
    error,
    hasData,
    lastUpdated,
    refresh,
    refetch,
  } = useDashboardMetricsByRole(user?.role);

  /**
   * Filter quick actions based on user role
   */
  const availableActions = quickActions.filter(
    action => user?.role && action.roles.includes(user.role)
  );

  /**
   * Handle quick action navigation
   */
  const handleQuickAction = (path: string) => {
    navigate(path);
  };

  /**
   * Handle manual refresh
   */
  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  };

  /**
   * Render metrics summary cards
   */
  const renderMetricsSummary = () => {
    if (isLoading) {
      return (
        <>
          <Grid item xs={12} md={6} lg={4}>
            <DataLoader isLoading={true} skeleton={true} height="120px">
              <div />
            </DataLoader>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <DataLoader isLoading={true} skeleton={true} height="120px">
              <div />
            </DataLoader>
          </Grid>
          {user?.role === 'admin' && (
            <Grid item xs={12} md={6} lg={4}>
              <DataLoader isLoading={true} skeleton={true} height="120px">
                <div />
              </DataLoader>
            </Grid>
          )}
        </>
      );
    }

    if (isError || !hasData) {
      return (
        <Grid item xs={12}>
          <Alert
            severity="warning"
            action={
              <Typography
                variant="button"
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={refetch}
              >
                Retry
              </Typography>
            }
          >
            {isError
              ? 'Failed to load dashboard metrics. Click retry to reload.'
              : 'No dashboard data available at the moment.'}
          </Alert>
        </Grid>
      );
    }

    return (
      <>
        {/* Active Leads */}
        <Grid item xs={12} md={6} lg={4}>
          <AppCard hover sx={{ textAlign: 'center', py: 3 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                mb: 1,
              }}
            >
              {metrics?.activeLeads || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Leads
            </Typography>
          </AppCard>
        </Grid>

        {/* Pending Quotations */}
        <Grid item xs={12} md={6} lg={4}>
          <AppCard hover sx={{ textAlign: 'center', py: 3 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: 'warning.main',
                mb: 1,
              }}
            >
              {metrics?.pendingQuotations || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Quotations
            </Typography>
          </AppCard>
        </Grid>

        {/* Admin-only metrics */}
        {user?.role === 'admin' && (
          <>
            <Grid item xs={12} md={6} lg={4}>
              <AppCard hover sx={{ textAlign: 'center', py: 3 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: 'success.main',
                    mb: 1,
                  }}
                >
                  {metrics?.channelPartners || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Channel Partners
                </Typography>
              </AppCard>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <AppCard hover sx={{ textAlign: 'center', py: 3 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: 'error.main',
                    mb: 1,
                  }}
                >
                  {metrics?.pendingCommissions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Commissions
                </Typography>
              </AppCard>
            </Grid>
          </>
        )}
      </>
    );
  };

  /**
   * Render recent activities
   */
  const renderRecentActivities = () => {
    if (isLoading) {
      return (
        <DataLoader isLoading={true} skeleton={true} height="200px">
          <div />
        </DataLoader>
      );
    }

    if (!hasData || !metrics?.recentActivities?.length) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            gap: 2,
          }}
        >
          <TrendingUp
            sx={{
              fontSize: 48,
              color: 'text.secondary',
              opacity: 0.5,
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: 'italic' }}
          >
            No recent activities to display
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {metrics.recentActivities.slice(0, 3).map((activity, index) => (
          <Box
            key={activity.id}
            sx={{
              py: 2,
              ...(index < 2 && {
                borderBottom: '1px solid',
                borderColor: 'divider',
              }),
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {activity.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {activity.description}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(activity.timestamp).toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box className="dashboard-page" component="main">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          component="h1"
          variant="h4"
          sx={{
            fontWeight: 600,
            mb: 1,
            color: 'text.primary',
          }}
        >
          Welcome back, {user?.firstName || user?.name}!
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: '1.1rem' }}
        >
          Here&apos;s what&apos;s happening with your{' '}
          {user?.role === 'admin' ? 'business' : 'territory'} today.
        </Typography>

        {/* Last updated info */}
        {lastUpdated && !isLoading && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </Typography>
        )}
      </Box>

      {/* Main Dashboard Grid */}
      <Grid container spacing={3}>
        {/* Metrics Summary Row */}
        {renderMetricsSummary()}

        {/* Recent Activities Panel */}
        <Grid item xs={12} lg={8}>
          <AppCard
            title="Recent Activity"
            subtitle="Latest updates from your dashboard"
            padding="medium"
            dividers
          >
            {renderRecentActivities()}
          </AppCard>
        </Grid>

        {/* Quick Actions Panel */}
        <Grid item xs={12} lg={4}>
          <AppCard
            title="Quick Actions"
            subtitle="Access your most-used features"
            padding="medium"
            dividers
            sx={{ minHeight: 200 }}
          >
            <Grid container spacing={2}>
              {availableActions.map(action => (
                <Grid item xs={12} key={action.id}>
                  <QuickActionTile
                    label={action.label}
                    icon={action.icon}
                    onClick={() => handleQuickAction(action.path)}
                  />
                </Grid>
              ))}
            </Grid>

            {availableActions.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 120,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: 'italic' }}
                >
                  No quick actions available for your role.
                </Typography>
              </Box>
            )}
          </AppCard>
        </Grid>
      </Grid>

      {/* Floating Action Button for Refresh */}
      <Fab
        color="primary"
        aria-label="refresh dashboard"
        onClick={handleRefresh}
        disabled={isLoading}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', lg: 'none' },
        }}
      >
        <RefreshIcon />
      </Fab>
    </Box>
  );
};

export default Dashboard;
