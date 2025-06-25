/**
 * Enhanced Header component with profile and notification integration
 * Shows user role, territory access, navigation controls, and notification badge
 */
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  useTheme,
  Tooltip,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Settings,
  AdminPanelSettings,
  LocationOn,
  Person as PersonIcon,
  AccountCircle,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  useAdminFeatures,
  useTerritoryDisplay,
} from '../hooks/useRoleVisibility';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBadge from '../components/ui/NotificationBadge';
import { ROUTES } from '../routes/routes';

interface HeaderProps {
  drawerWidth: number;
  onMenuClick: () => void;
  isCollapsed: boolean;
  isMobile: boolean;
}

const Header: React.FC<HeaderProps> = ({
  drawerWidth,
  onMenuClick,
  isMobile,
}) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const adminFeatures = useAdminFeatures();
  const territoryDisplay = useTerritoryDisplay();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Notification hook for unread count
  const { unreadCount, isLoading: notificationsLoading } = useNotifications({
    pollingInterval: 30000, // Poll every 30 seconds
    pausePollingOnHidden: true,
  });

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const handleSettings = () => {
    handleClose();
    navigate(ROUTES.SETTINGS);
  };

  const handleProfile = () => {
    handleClose();
    navigate(ROUTES.MY_PROFILE);
  };

  const handleNotifications = () => {
    navigate(ROUTES.NOTIFICATIONS);
  };

  // Get user display name
  const getUserDisplayName = (): string => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.name || 'User';
  };

  // Get user initials for avatar
  const getUserInitials = (): string => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0]?.charAt(0)}${nameParts[1]?.charAt(0)}`.toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: {
          lg: `calc(100% - ${drawerWidth}px)`,
        },
        ml: { lg: `${drawerWidth}px` },
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Toolbar>
        {/* Menu button */}
        <IconButton
          color="inherit"
          aria-label={isMobile ? 'open drawer' : 'toggle drawer'}
          edge="start"
          onClick={onMenuClick}
          sx={{
            mr: 2,
            display: { xs: 'block', lg: 'block' },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Title and breadcrumb area */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Solarium Portal
          </Typography>

          {/* Mobile title */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              display: { xs: 'block', sm: 'none' },
            }}
          >
            Solarium
          </Typography>

          {/* Admin indicator */}
          {adminFeatures.showAdminBadge && (
            <Chip
              label="Admin"
              size="small"
              color="secondary"
              variant="filled"
              icon={<AdminPanelSettings sx={{ fontSize: '0.75rem' }} />}
              sx={{
                ml: 2,
                fontSize: '0.625rem',
                display: { xs: 'none', md: 'flex' },
              }}
            />
          )}
        </Box>

        {/* Right side items */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <NotificationBadge
              unreadCount={unreadCount}
              onClick={handleNotifications}
              isLoading={notificationsLoading}
              size="medium"
              maxCount={99}
            />
          </Box>

          {/* Territory information chip */}
          {territoryDisplay.territoryCount > 0 && (
            <Tooltip
              title={
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    Territory Access
                  </Typography>
                  {territoryDisplay.hasFullAccess ? (
                    <Typography variant="body2">
                      Full access to all territories
                    </Typography>
                  ) : (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Access to {territoryDisplay.territoryCount} territory
                        {territoryDisplay.territoryCount !== 1 ? 'ies' : ''}:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {territoryDisplay.territories.map(territory => (
                          <Chip
                            key={territory}
                            label={territory}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.625rem', height: 16 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              }
              placement="bottom-end"
              arrow
            >
              <Chip
                label={
                  territoryDisplay.hasFullAccess
                    ? 'All Territories'
                    : `${territoryDisplay.territoryCount} Territory${territoryDisplay.territoryCount !== 1 ? 'ies' : ''}`
                }
                size="small"
                color="primary"
                variant="outlined"
                icon={<LocationOn sx={{ fontSize: '0.75rem' }} />}
                sx={{
                  fontSize: '0.625rem',
                  display: { xs: 'none', sm: 'flex' },
                  cursor: 'help',
                }}
              />
            </Tooltip>
          )}

          {/* User role chip */}
          <Chip
            label={user?.role?.toUpperCase()}
            size="small"
            color="primary"
            variant="outlined"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />

          {/* User menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Avatar
                {...(user?.avatar && { src: user.avatar })}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {getUserInitials()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 280,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              {/* User info section */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}
                >
                  <Avatar
                    {...(user?.avatar && { src: user.avatar })}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'primary.main',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    }}
                  >
                    {getUserInitials()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getUserDisplayName()}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.email}
                    </Typography>
                  </Box>
                </Box>

                {/* Role and status indicators */}
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
                >
                  <Chip
                    label={user?.role?.toUpperCase()}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.625rem' }}
                  />

                  {adminFeatures.showAdminBadge && (
                    <Chip
                      label="ADMIN"
                      size="small"
                      color="secondary"
                      variant="filled"
                      sx={{ fontSize: '0.625rem' }}
                    />
                  )}

                  {/* Notification indicator in mobile menu */}
                  {unreadCount > 0 && (
                    <Chip
                      label={`${unreadCount} new`}
                      size="small"
                      color="error"
                      variant="filled"
                      sx={{
                        fontSize: '0.625rem',
                        display: { xs: 'flex', md: 'none' },
                      }}
                    />
                  )}
                </Box>

                {/* Territory info in menu */}
                {territoryDisplay.territoryCount > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {territoryDisplay.displayText}
                  </Typography>
                )}
              </Box>

              {/* Menu items */}
              <Box sx={{ py: 1 }}>
                <MenuItem onClick={handleProfile}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText>My Profile</ListItemText>
                </MenuItem>

                {/* Notifications item for mobile */}
                <MenuItem
                  onClick={() => {
                    handleClose();
                    handleNotifications();
                  }}
                  sx={{ display: { xs: 'flex', md: 'none' } }}
                >
                  <ListItemIcon>
                    <NotificationBadge
                      unreadCount={unreadCount}
                      onClick={() => {}}
                      size="small"
                      showZeroCount={false}
                    />
                  </ListItemIcon>
                  <ListItemText>
                    Notifications
                    {unreadCount > 0 && (
                      <Typography
                        variant="caption"
                        color="error.main"
                        sx={{ ml: 1, fontWeight: 600 }}
                      >
                        ({unreadCount} new)
                      </Typography>
                    )}
                  </ListItemText>
                </MenuItem>

                {/* Only show settings for admin users */}
                {adminFeatures.canManageSettings && (
                  <MenuItem onClick={handleSettings}>
                    <ListItemIcon>
                      <Settings />
                    </ListItemIcon>
                    <ListItemText>Settings</ListItemText>
                  </MenuItem>
                )}
              </Box>

              <Divider />

              <Box sx={{ py: 1 }}>
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'error.lighter',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Logout sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Box>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
