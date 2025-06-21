/**
 * Enhanced Header component with territory information display
 * Shows user role, territory access, and navigation controls
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
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Settings,
  Notifications,
  AdminPanelSettings,
  LocationOn,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  useAdminFeatures,
  useTerritoryDisplay,
} from '../hooks/useRoleVisibility';

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
    navigate('/settings');
  };

  const handleProfile = () => {
    handleClose();
    // Navigate to profile page when implemented
    console.log('Profile clicked');
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
          <IconButton
            size="large"
            color="inherit"
            aria-label="notifications"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>

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
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '1rem',
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
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
                  minWidth: 220,
                },
              }}
            >
              {/* User info */}
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>

                {/* Role and territory info in menu */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.5,
                  }}
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
                </Box>

                {/* Territory info in menu */}
                {territoryDisplay.territoryCount > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    {territoryDisplay.displayText}
                  </Typography>
                )}
              </Box>
              <Divider />

              {/* Menu items */}
              <MenuItem onClick={handleProfile}>
                <Avatar sx={{ mr: 2, width: 24, height: 24 }}>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                Profile
              </MenuItem>

              {/* Only show settings for admin users */}
              {adminFeatures.canManageSettings && (
                <MenuItem onClick={handleSettings}>
                  <Settings sx={{ mr: 2 }} />
                  Settings
                </MenuItem>
              )}

              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 2 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
