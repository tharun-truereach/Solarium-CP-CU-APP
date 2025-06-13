/**
 * Header component - top navigation bar with menu toggle and user info
 * Responsive header that adapts to different screen sizes
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Settings,
  Notifications,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

        {/* Title */}
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
            <Notifications />
          </IconButton>

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
                  minWidth: 200,
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
              </Box>
              <Divider />

              {/* Menu items */}
              <MenuItem onClick={handleSettings}>
                <Settings sx={{ mr: 2 }} />
                Settings
              </MenuItem>
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
