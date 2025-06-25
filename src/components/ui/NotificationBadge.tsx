/**
 * Notification Badge Component
 * Displays unread notification count with proper styling and animations
 */

import React from 'react';
import { Badge, IconButton, Tooltip, Zoom } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';

/**
 * Component props interface
 */
interface NotificationBadgeProps {
  unreadCount: number;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showZeroCount?: boolean;
  maxCount?: number;
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
}

/**
 * Notification Badge Component
 */
const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  unreadCount,
  onClick,
  isLoading = false,
  disabled = false,
  size = 'medium',
  showZeroCount = false,
  maxCount = 99,
  color = 'error',
}) => {
  // Determine badge content
  const badgeContent = unreadCount > maxCount ? `${maxCount}+` : unreadCount;
  const showBadge = showZeroCount || unreadCount > 0;

  // Icon size mapping
  const iconSizeMap = {
    small: 20,
    medium: 24,
    large: 28,
  };

  return (
    <Tooltip
      title={
        isLoading
          ? 'Loading notifications...'
          : unreadCount === 0
            ? 'No new notifications'
            : `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
      }
      arrow
    >
      <span>
        <IconButton
          onClick={onClick}
          disabled={disabled || isLoading}
          size={size}
          aria-label={`notifications, ${unreadCount} unread`}
          sx={{
            position: 'relative',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
              bgcolor: 'action.hover',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            ...(isLoading && {
              opacity: 0.6,
              cursor: 'progress',
            }),
          }}
        >
          <Badge
            badgeContent={showBadge ? badgeContent : 0}
            color={color}
            overlap="circular"
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                fontWeight: 600,
                minWidth: 20,
                height: 20,
                animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                  },
                  '100%': {
                    transform: 'scale(1)',
                  },
                },
              },
            }}
          >
            <NotificationsIcon
              sx={{
                fontSize: iconSizeMap[size],
                color: unreadCount > 0 ? 'primary.main' : 'text.secondary',
                transition: 'color 0.2s ease-in-out',
              }}
            />
          </Badge>
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default NotificationBadge;
