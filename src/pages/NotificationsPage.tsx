/**
 * Notifications Page - System notification center interface
 * Displays notifications with filtering, marking as read, and pagination
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Button,
  Stack,
  Pagination,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  MarkAsUnread as MarkReadIcon,
  SelectAll as SelectAllIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationList } from '../components/notification/NotificationList';
import { NotificationFilters } from '../components/notification/NotificationFilters';
import { NotificationToolbar } from '../components/notification/NotificationToolbar';
import { ROUTES } from '../routes/routes';

/**
 * Notifications Page Component
 * Comprehensive notification management interface
 */
const NotificationsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const {
    notifications,
    unreadCount,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    isError,
    error,
    refresh,
    markRead,
    markAllRead,
    filter,
    setFilter,
    resetFilter,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
    isMarkingRead,
    isMarkingAllRead,
  } = useNotifications({
    pageSize: 20,
    pollingInterval: 30000,
    pausePollingOnHidden: true,
  });

  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );

  const isPolling = !isLoading && !isError;

  /**
   * Handle notification selection for bulk operations
   */
  const handleNotificationSelect = (id: string, selected: boolean) => {
    setSelectedNotifications(prev => {
      if (selected) {
        return [...prev, id];
      } else {
        return prev.filter(notificationId => notificationId !== id);
      }
    });
  };

  /**
   * Handle select all notifications
   */
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedNotifications(notifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  /**
   * Handle mark selected as read
   */
  const handleMarkSelectedRead = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      // Mark each selected notification as read
      await Promise.all(selectedNotifications.map(id => markRead(id)));
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Failed to mark selected notifications as read:', error);
    }
  };

  /**
   * Handle mark all as read
   */
  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  /**
   * Handle single notification mark as read
   */
  const handleMarkSingleRead = async (id: string) => {
    try {
      await markRead(id);
      // Remove from selection if it was selected
      setSelectedNotifications(prev =>
        prev.filter(notificationId => notificationId !== id)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    refresh();
    setSelectedNotifications([]); // Clear selections on refresh
  };

  /**
   * Handle page change
   */
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    goToPage(page);
    setSelectedNotifications([]); // Clear selections on page change
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Access Denied
          </Typography>
          <Typography variant="body2">
            You must be logged in to view notifications.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="notifications-page" component="main">
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
            <NotificationsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
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
                Notifications
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Stay updated with system notifications and alerts
                </Typography>
                {unreadCount > 0 && (
                  <Chip
                    label={`${unreadCount} unread`}
                    size="small"
                    color="error"
                    variant="filled"
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Header Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Polling Status */}
            {isPolling && (
              <Tooltip title="Auto-refreshing notifications">
                <Chip
                  icon={<RefreshIcon sx={{ fontSize: '0.75rem !important' }} />}
                  label="Live"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontSize: '0.625rem' }}
                />
              </Tooltip>
            )}

            {/* Manual Refresh */}
            <Tooltip title="Refresh notifications">
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

            {/* Development Mode Indicator */}
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

      {/* Main Content */}
      <Paper
        elevation={1}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {/* Filters and Toolbar */}
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <NotificationFilters
            filter={filter}
            onFilterChange={setFilter}
            onClearFilter={resetFilter}
            totalCount={totalCount}
            unreadCount={unreadCount}
            isMobile={isMobile}
          />
        </Box>

        {/* Toolbar for bulk actions */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedNotifications.length > 0
                  ? `${selectedNotifications.length} selected`
                  : `${notifications.length} of ${totalCount} notifications`}
              </Typography>

              {notifications.length > 0 && (
                <Button
                  size="small"
                  onClick={() =>
                    handleSelectAll(selectedNotifications.length === 0)
                  }
                  startIcon={<SelectAllIcon />}
                >
                  {selectedNotifications.length === notifications.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              )}
            </Box>

            <Stack direction="row" spacing={1}>
              {selectedNotifications.length > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkSelectedRead}
                  disabled={isMarkingRead}
                  startIcon={<MarkReadIcon />}
                >
                  Mark Selected Read
                </Button>
              )}

              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAllRead}
                  variant="contained"
                  startIcon={<MarkReadIcon />}
                >
                  Mark All Read
                </Button>
              )}
            </Stack>
          </Box>
        </Box>

        {/* Notification List */}
        <Box sx={{ minHeight: 400 }}>
          <NotificationList
            notifications={notifications}
            selectedNotifications={selectedNotifications}
            isLoading={isLoading}
            isError={isError}
            error={error}
            hasMore={false}
            onNotificationSelect={handleNotificationSelect}
            onMarkAsRead={handleMarkSingleRead}
            onLoadMore={() => {}}
            enableVirtualization={notifications.length > 100}
            height={600}
          />
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box
            sx={{
              p: 3,
              display: 'flex',
              justifyContent: 'center',
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
              disabled={isLoading}
            />
          </Box>
        )}
      </Paper>

      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="info">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Development Info:
            </Typography>
            <Typography variant="body2" component="div">
              • Route: {ROUTES.NOTIFICATIONS}
              <br />
              • Access: All authenticated users
              <br />• User: {user.name} ({user.role})
              <br />• Total notifications: {totalCount}
              <br />• Unread: {unreadCount}
              <br />• Selected: {selectedNotifications.length}
              <br />• Current page: {currentPage} of {totalPages}
              <br />• Polling: {isPolling ? '✅ Active' : '⏸️ Paused'}
              <br />• Virtualization:{' '}
              {notifications.length > 100 ? '✅ Enabled' : '❌ Disabled'}
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default NotificationsPage;
