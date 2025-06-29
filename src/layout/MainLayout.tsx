/**
 * MainLayout component - responsive layout with header, sidebar, and main content
 * Provides the primary layout structure for authenticated pages with sidebar persistence
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  Toolbar,
  useTheme,
  useMediaQuery,
  Container,
  Typography,
} from '@mui/material';

import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalErrorToast from '../components/GlobalErrorToast';
import { STORAGE_KEYS } from '../utils/constants';

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 60;

interface MainLayoutProps {
  children: React.ReactNode;
}

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

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  /**
   * Initialize sidebar state from localStorage on mount
   */
  useEffect(() => {
    if (!isMobile) {
      const savedState = readSidebarState();
      setDesktopCollapsed(savedState);
    }
  }, [isMobile]);

  /**
   * Handle drawer toggle with persistence for desktop
   */
  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      const newCollapsedState = !desktopCollapsed;
      setDesktopCollapsed(newCollapsedState);
      persistSidebarState(newCollapsedState);
    }
  };

  const handleMobileDrawerClose = () => {
    setMobileOpen(false);
  };

  const drawerWidth = isMobile
    ? DRAWER_WIDTH
    : desktopCollapsed
      ? DRAWER_WIDTH_COLLAPSED
      : DRAWER_WIDTH;

  // Don't show layout for login page
  if (!user) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <Header
        drawerWidth={drawerWidth}
        onMenuClick={handleDrawerToggle}
        isCollapsed={desktopCollapsed}
        isMobile={isMobile}
      />

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { lg: drawerWidth },
          flexShrink: { lg: 0 },
        }}
      >
        {/* Mobile drawer */}
        {isMobile && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleMobileDrawerClose}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              display: { xs: 'block', lg: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                borderRight: '1px solid',
                borderColor: 'divider',
              },
            }}
          >
            <Sidebar
              onClose={handleMobileDrawerClose}
              collapsed={false}
              isMobile={true}
            >
              <div className="sidebar-header">
                <Typography variant="h6" component="h6">
                  Solarium
                </Typography>
              </div>
            </Sidebar>
          </Drawer>
        )}

        {/* Desktop drawer */}
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', lg: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: '1px solid',
                borderColor: 'divider',
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                overflowX: 'hidden',
              },
            }}
            open
          >
            <Sidebar collapsed={desktopCollapsed} isMobile={false}>
              <div className="sidebar-header">
                <Typography variant="h6" component="h6">
                  Solarium
                </Typography>
              </div>
            </Sidebar>
          </Drawer>
        )}
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            lg: `calc(100% - ${drawerWidth}px)`,
          },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Toolbar spacer */}
        <Toolbar />

        {/* Page content */}
        <Box
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            overflow: 'hidden',
          }}
        >
          <Container
            maxWidth={false}
            sx={{
              py: 3,
              px: { xs: 2, sm: 3 },
              maxWidth: '1400px',
            }}
          >
            {children}
          </Container>
        </Box>
      </Box>

      {/* Global Error Toast */}
      <GlobalErrorToast />
    </Box>
  );
};

export default MainLayout;
