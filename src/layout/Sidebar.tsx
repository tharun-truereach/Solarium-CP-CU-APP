/**
 * Enhanced Sidebar component - navigation menu with role-based items and persistence
 * Supports collapsed state persistence and secure role-based filtering
 */
import React, { useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  People,
  Assignment,
  RequestQuote,
  Business,
  AttachMoney,
  Storage,
  Settings,
  Support,
  Inventory,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES, getRoutesByRole } from '../routes/routes';
import { STORAGE_KEYS } from '../utils/constants';

interface SidebarProps {
  onClose?: () => void;
  collapsed: boolean;
  isMobile: boolean;
  children?: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  allowedRoles?: string[];
  adminOnly?: boolean;
}

/**
 * Complete navigation items configuration
 * Maps to route definitions for consistency
 */
const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Dashboard />,
    path: ROUTES.DASHBOARD,
    allowedRoles: ['admin', 'kam'],
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: <People />,
    path: ROUTES.LEADS,
    allowedRoles: ['admin', 'kam'],
  },
  {
    id: 'quotations',
    label: 'Quotations',
    icon: <RequestQuote />,
    path: ROUTES.QUOTATIONS,
    allowedRoles: ['admin', 'kam'],
  },
  {
    id: 'channel-partners',
    label: 'Channel Partners',
    icon: <Business />,
    path: ROUTES.CHANNEL_PARTNERS,
    allowedRoles: ['admin', 'kam'],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: <Assignment />,
    path: ROUTES.CUSTOMERS,
    allowedRoles: ['admin', 'kam'],
  },
  {
    id: 'commissions',
    label: 'Commissions',
    icon: <AttachMoney />,
    path: ROUTES.COMMISSIONS,
    allowedRoles: ['admin'],
    adminOnly: true,
  },
  {
    id: 'master-data',
    label: 'Master Data',
    icon: <Storage />,
    path: ROUTES.MASTER_DATA,
    allowedRoles: ['admin'],
    adminOnly: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings />,
    path: ROUTES.SETTINGS,
    allowedRoles: ['admin'],
    adminOnly: true,
  },
];

/**
 * Persist sidebar collapse state to localStorage
 */
const persistSidebarState = (collapsed: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, JSON.stringify(collapsed));
  } catch (error) {
    console.warn('Failed to persist sidebar state:', error);
  }
};

/**
 * Read sidebar collapse state from localStorage
 */
const readSidebarState = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
    return stored ? JSON.parse(stored) : false;
  } catch (error) {
    console.warn('Failed to read sidebar state:', error);
    return false;
  }
};

const Sidebar: React.FC<SidebarProps> = ({ onClose, collapsed, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Persist sidebar state when collapsed prop changes (desktop only)
   */
  useEffect(() => {
    if (!isMobile) {
      persistSidebarState(collapsed);
    }
  }, [collapsed, isMobile]);

  /**
   * Handle navigation with mobile drawer close
   */
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  /**
   * Enhanced role-based filtering using routes.ts for single-source truth
   * Completely removes forbidden items from DOM for security
   */
  const getFilteredNavigationItems = (): NavigationItem[] => {
    if (!user?.role) {
      return [];
    }

    // Get accessible routes from single source of truth
    const accessibleRoutes = getRoutesByRole(user.role);
    const accessiblePaths = new Set(accessibleRoutes.map(route => route.path));

    // Filter navigation items based on route accessibility
    return navigationItems.filter(item => {
      // Check if route is accessible to user's role
      const isRouteAccessible = accessiblePaths.has(item.path);

      // Additional security check against item's own role configuration
      const isRoleAllowed =
        !item.allowedRoles || item.allowedRoles.includes(user.role);

      return isRouteAccessible && isRoleAllowed;
    });
  };

  const filteredNavigationItems = getFilteredNavigationItems();

  /**
   * Render individual navigation item with proper accessibility
   */
  const renderNavItem = (item: NavigationItem) => {
    const isActive = location.pathname === item.path;

    const listItem = (
      <ListItem key={item.id} disablePadding>
        <ListItemButton
          onClick={() => handleNavigation(item.path)}
          selected={isActive}
          sx={{
            minHeight: 48,
            px: 2.5,
            py: 1,
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '& .MuiListItemIcon-root': {
                color: 'primary.contrastText',
              },
            },
            '&:hover': {
              bgcolor: 'action.hover',
              borderRadius: 1,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: collapsed && !isMobile ? 0 : 3,
              justifyContent: 'center',
              color: isActive ? 'inherit' : 'text.secondary',
            }}
          >
            {item.icon}
          </ListItemIcon>

          {(!collapsed || isMobile) && (
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
              }}
            />
          )}

          {(!collapsed || isMobile) && item.adminOnly && (
            <Chip
              label="Admin"
              size="small"
              color="secondary"
              variant="outlined"
              sx={{
                fontSize: '0.625rem',
                height: 20,
              }}
            />
          )}
        </ListItemButton>
      </ListItem>
    );

    // Wrap with tooltip when collapsed (desktop only)
    if (collapsed && !isMobile) {
      return (
        <Tooltip key={item.id} title={item.label} placement="right" arrow>
          {listItem}
        </Tooltip>
      );
    }

    return listItem;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Title */}
      <Toolbar
        sx={{
          px: 2.5,
          minHeight: { xs: 56, sm: 64 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
        }}
      >
        {(!collapsed || isMobile) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.contrastText',
                fontWeight: 'bold',
                fontSize: '1.2rem',
              }}
            >
              S
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                fontSize: '1.1rem',
              }}
            >
              Solarium
            </Typography>
          </Box>
        )}

        {collapsed && !isMobile && (
          <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
              fontWeight: 'bold',
              fontSize: '1.2rem',
            }}
          >
            S
          </Box>
        )}
      </Toolbar>

      <Divider />

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        <List disablePadding>{filteredNavigationItems.map(renderNavItem)}</List>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (!collapsed || isMobile) && (
          <Box sx={{ px: 2, py: 1, mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Role: {user?.role?.toUpperCase()} | Items:{' '}
              {filteredNavigationItems.length}
            </Typography>
          </Box>
        )}
      </Box>

      {/* User info (collapsed state) */}
      {(!collapsed || isMobile) && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Signed in as
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role?.toUpperCase()}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Sidebar;
