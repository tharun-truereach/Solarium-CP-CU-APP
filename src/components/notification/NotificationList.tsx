/**
 * Notification List Component
 * Displays notifications with virtualization support for large lists
 */

import React, { useMemo } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Avatar,
  Typography,
  Chip,
  Alert,
  Button,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  DoneAll as DoneAllIcon,
  NotificationsNone as NotificationsNoneIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  RequestQuote as QuotationIcon,
  AttachMoney as CommissionIcon,
  Announcement as AnnouncementIcon,
  Computer as SystemIcon,
} from '@mui/icons-material';
import { FixedSizeList as VirtualList } from 'react-window';
import type { Notification } from '../../types';

/**
 * Notification list props interface
 */
export interface NotificationListProps {
  notifications: Notification[];
  selectedNotifications: string[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  hasMore: boolean;
  onNotificationSelect: (id: string, selected: boolean) => void;
  onMarkAsRead: (id: string) => void;
  onLoadMore: () => void;
  enableVirtualization?: boolean;
  height?: number;
}

/**
 * Get notification type icon
 */
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'system':
      return <SystemIcon />;
    case 'security':
      return <SecurityIcon />;
    case 'lead':
      return <PersonIcon />;
    case 'quotation':
      return <QuotationIcon />;
    case 'commission':
      return <CommissionIcon />;
    case 'user':
      return <PersonIcon />;
    case 'announcement':
      return <AnnouncementIcon />;
    default:
      return <NotificationsNoneIcon />;
  }
};

/**
 * Get notification type color
 */
const getNotificationColor = (type: string, _priority?: string) => {
  const baseColors = {
    system: 'primary',
    security: 'error',
    lead: 'info',
    quotation: 'warning',
    commission: 'success',
    user: 'secondary',
    announcement: 'primary',
  } as const;

  return baseColors[type as keyof typeof baseColors] || 'default';
};

/**
 * Individual notification item component
 */
interface NotificationItemProps {
  notification: Notification;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onMarkAsRead: (id: string) => void;
  style?: React.CSSProperties;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  isSelected,
  onSelect,
  onMarkAsRead,
  style,
}) => {
  /**
   * Handle notification selection
   */
  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(notification.id, event.target.checked);
  };

  /**
   * Handle mark as read
   */
  const handleMarkAsRead = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  /**
   * Format notification time
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isUnread = !notification.read;

  // Get priority from metadata or default to 'medium'
  const priority =
    (notification.metadata?.priority as 'low' | 'medium' | 'high') || 'medium';

  return (
    <ListItem
      {...(style && { style })}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: isUnread ? 'action.hover' : 'transparent',
        '&:hover': {
          bgcolor: 'action.selected',
        },
        py: 2,
        px: 3,
      }}
    >
      {/* Selection Checkbox */}
      <ListItemIcon sx={{ minWidth: 40 }}>
        <Checkbox
          checked={isSelected}
          onChange={handleSelect}
          size="small"
          color="primary"
        />
      </ListItemIcon>

      {/* Notification Icon */}
      <ListItemIcon sx={{ minWidth: 50 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: `${getNotificationColor(notification.type, priority)}.main`,
            fontSize: '1rem',
          }}
        >
          {getNotificationIcon(notification.type)}
        </Avatar>
      </ListItemIcon>

      {/* Notification Content */}
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: isUnread ? 600 : 400,
                color: isUnread ? 'text.primary' : 'text.secondary',
              }}
            >
              {notification.title}
            </Typography>

            {/* Unread indicator */}
            {isUnread && (
              <CircleIcon
                sx={{
                  fontSize: 8,
                  color: 'primary.main',
                }}
              />
            )}

            {/* Priority indicator */}
            {priority === 'high' && (
              <Chip
                label="High"
                size="small"
                color="error"
                variant="outlined"
                sx={{ fontSize: '0.625rem', height: 16 }}
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {notification.message}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={notification.type.toUpperCase()}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.625rem', height: 18 }}
              />

              <Typography variant="caption" color="text.secondary">
                {formatTime(notification.createdAt)}
              </Typography>

              {notification.readAt && (
                <Typography variant="caption" color="success.main">
                  Read {formatTime(notification.readAt)}
                </Typography>
              )}
            </Box>
          </Box>
        }
      />

      {/* Actions */}
      <ListItemSecondaryAction>
        {isUnread && (
          <Tooltip title="Mark as read">
            <IconButton
              edge="end"
              onClick={handleMarkAsRead}
              size="small"
              sx={{ color: 'primary.main' }}
            >
              <CheckCircleIcon />
            </IconButton>
          </Tooltip>
        )}
      </ListItemSecondaryAction>
    </ListItem>
  );
};

/**
 * Virtualized notification item component
 */
interface VirtualizedNotificationItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    notifications: Notification[];
    selectedNotifications: string[];
    onSelect: (id: string, selected: boolean) => void;
    onMarkAsRead: (id: string) => void;
  };
}

const VirtualizedNotificationItem: React.FC<
  VirtualizedNotificationItemProps
> = ({ index, style, data }) => {
  const { notifications, selectedNotifications, onSelect, onMarkAsRead } = data;
  const notification = notifications[index];

  if (!notification) return null;

  return (
    <NotificationItem
      notification={notification}
      isSelected={selectedNotifications.includes(notification.id)}
      onSelect={onSelect}
      onMarkAsRead={onMarkAsRead}
      style={style}
    />
  );
};

/**
 * Loading skeleton component
 */
const NotificationSkeleton: React.FC = () => (
  <List>
    {Array.from({ length: 5 }).map((_, index) => (
      <ListItem key={index} sx={{ py: 2, px: 3 }}>
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Skeleton variant="rectangular" width={20} height={20} />
        </ListItemIcon>
        <ListItemIcon sx={{ minWidth: 50 }}>
          <Skeleton variant="circular" width={32} height={32} />
        </ListItemIcon>
        <ListItemText
          primary={<Skeleton variant="text" width="60%" />}
          secondary={
            <Box>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          }
        />
      </ListItem>
    ))}
  </List>
);

/**
 * Empty state component
 */
const EmptyState: React.FC<{
  hasFilters: boolean;
  onClearFilters?: () => void;
}> = ({ hasFilters, onClearFilters }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300,
      gap: 2,
      p: 4,
    }}
  >
    <NotificationsNoneIcon
      sx={{
        fontSize: 64,
        color: 'text.secondary',
        opacity: 0.5,
      }}
    />

    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
      {hasFilters ? 'No matching notifications' : 'No notifications yet'}
    </Typography>

    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ textAlign: 'center', maxWidth: 400 }}
    >
      {hasFilters
        ? 'Try adjusting your filters to see more notifications.'
        : 'When you receive notifications, they will appear here.'}
    </Typography>

    {hasFilters && onClearFilters && (
      <Button
        variant="outlined"
        onClick={onClearFilters}
        size="small"
        sx={{ mt: 1 }}
      >
        Clear Filters
      </Button>
    )}
  </Box>
);

/**
 * Error state component
 */
const ErrorState: React.FC<{ error: any; onRetry: () => void }> = ({
  error,
  onRetry,
}) => (
  <Box sx={{ p: 3 }}>
    <Alert
      severity="error"
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
        Failed to load notifications
      </Typography>
      <Typography variant="body2">
        {error?.data?.message ||
          error?.message ||
          'An unexpected error occurred while loading notifications.'}
      </Typography>
    </Alert>
  </Box>
);

/**
 * Notification List Component
 */
export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  selectedNotifications,
  isLoading,
  isError,
  error,
  hasMore,
  onNotificationSelect,
  onMarkAsRead,
  onLoadMore,
  enableVirtualization = false,
  height = 600,
}) => {
  /**
   * Virtualization data for react-window
   */
  const virtualizedData = useMemo(
    () => ({
      notifications,
      selectedNotifications,
      onSelect: onNotificationSelect,
      onMarkAsRead,
    }),
    [notifications, selectedNotifications, onNotificationSelect, onMarkAsRead]
  );

  // Loading state
  if (isLoading && notifications.length === 0) {
    return <NotificationSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return <EmptyState hasFilters={false} />;
  }

  // Virtualized list for large datasets
  if (enableVirtualization) {
    return (
      <Box sx={{ height }}>
        <VirtualList
          height={height}
          width="100%"
          itemCount={notifications.length}
          itemSize={120} // Fixed item height
          itemData={virtualizedData}
        >
          {VirtualizedNotificationItem}
        </VirtualList>

        {/* Load More Button */}
        {hasMore && (
          <Box
            sx={{
              p: 2,
              textAlign: 'center',
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Button
              onClick={onLoadMore}
              disabled={isLoading}
              startIcon={<RefreshIcon />}
            >
              Load More
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // Regular list for smaller datasets
  return (
    <Box>
      <List sx={{ py: 0 }}>
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            isSelected={selectedNotifications.includes(notification.id)}
            onSelect={onNotificationSelect}
            onMarkAsRead={onMarkAsRead}
          />
        ))}
      </List>

      {/* Load More Button */}
      {hasMore && (
        <Box
          sx={{
            p: 2,
            textAlign: 'center',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            startIcon={isLoading ? <RefreshIcon /> : <DoneAllIcon />}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default NotificationList;
