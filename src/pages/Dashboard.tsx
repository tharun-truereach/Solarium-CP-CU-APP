/**
 * Enhanced Dashboard page with Material UI components and responsive layout
 * Displays role-based content with proper Material UI styling
 */
import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Fab } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { DataLoader } from '../components/loading';
import { AppCard, AppButton } from '../components/ui';
import { useLoadingState } from '../hooks/useLoadingState';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  const { isLoading, withLoading } = useLoadingState({
    globalLoading: true,
    loadingMessage: 'Refreshing dashboard data...',
  });

  // Simulate data loading
  useEffect(() => {
    const loadDashboardData = async () => {
      setTimeout(() => setStatsLoading(false), 1500);
      setTimeout(() => setActivityLoading(false), 2000);
    };

    loadDashboardData();
  }, []);

  const handleRefreshData = async () => {
    await withLoading(async () => {
      setStatsLoading(true);
      setActivityLoading(true);

      await new Promise(resolve => setTimeout(resolve, 2000));

      setStatsLoading(false);
      setActivityLoading(false);
    });
  };

  const statsData = [
    { label: 'Active Leads', value: 12, color: 'primary.main' },
    { label: 'Pending Quotations', value: 5, color: 'warning.main' },
    ...(user?.role === 'admin'
      ? [
          { label: 'Channel Partners', value: 8, color: 'success.main' },
          { label: 'Pending Commissions', value: 3, color: 'error.main' },
        ]
      : []),
  ];

  const activities = [
    {
      title: 'New lead created',
      description: 'Solar installation for residential property',
      time: '2 hours ago',
    },
    {
      title: 'Quotation approved',
      description: 'Quote #QT-2024-001 approved by customer',
      time: '5 hours ago',
    },
    {
      title: 'Commission processed',
      description: 'Payment released to CP-001',
      time: '1 day ago',
    },
  ];

  return (
    <Box className="dashboard-page" component="main">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here&apos;s what&apos;s happening with your{' '}
          {user?.role === 'admin' ? 'business' : 'territory'} today.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map(stat => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <AppCard hover>
              <DataLoader
                isLoading={statsLoading}
                skeleton={true}
                skeletonCount={2}
                height="80px"
              >
                <Box textAlign="center">
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: stat.color,
                      mb: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </DataLoader>
            </AppCard>
          </Grid>
        ))}
      </Grid>

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} lg={8}>
          <AppCard
            title="Recent Activity"
            subtitle="Latest updates from your dashboard"
            padding="medium"
            dividers
          >
            <DataLoader
              isLoading={activityLoading}
              skeleton={true}
              skeletonCount={3}
              height="200px"
            >
              <Box>
                {activities.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      py: 2,
                      ...(index < activities.length - 1 && {
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }),
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {activity.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {activity.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </DataLoader>
          </AppCard>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={4}>
          <AppCard
            title="Quick Actions"
            subtitle="Common tasks"
            padding="medium"
            dividers
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AppButton variant="primary" fullWidth>
                View Leads
              </AppButton>
              <AppButton variant="outline" fullWidth>
                Create Quotation
              </AppButton>
              {user?.role === 'admin' && (
                <>
                  <AppButton variant="outline" fullWidth>
                    Manage Partners
                  </AppButton>
                  <AppButton variant="outline" fullWidth>
                    View Reports
                  </AppButton>
                </>
              )}
            </Box>
          </AppCard>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="refresh"
        onClick={handleRefreshData}
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
