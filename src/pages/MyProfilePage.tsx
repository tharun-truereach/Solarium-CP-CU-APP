/**
 * My Profile Page - User profile management interface
 * Accessible to all authenticated users for personal profile management
 */

import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Alert,
  Paper,
} from '@mui/material';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProfileForm } from '../components/profile';
import { ROUTES } from '../routes/routes';

/**
 * My Profile Page Component
 */
const MyProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Verify user is authenticated (should be handled by ProtectedRoute, but defense in depth)
  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Authentication Required
          </Typography>
          <Typography variant="body2">
            You must be logged in to access your profile.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="my-profile-page" component="main">
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs
          separator={<ChevronRightIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link
            component={RouterLink}
            to={ROUTES.DASHBOARD}
            color="inherit"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
            Dashboard
          </Link>
          <Typography
            color="text.primary"
            sx={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
            }}
          >
            <PersonIcon sx={{ mr: 0.5, fontSize: 20 }} />
            My Profile
          </Typography>
        </Breadcrumbs>
      </Box>

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
            <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
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
                My Profile
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: '1.1rem' }}
              >
                Manage your personal information and account settings
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Welcome Message */}
        <Paper
          sx={{
            p: 2,
            bgcolor: 'primary.50',
            borderLeft: 4,
            borderColor: 'primary.main',
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            Welcome, {user.name}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keep your profile information up to date to ensure smooth
            communication and personalized experience across the platform.
          </Typography>
        </Paper>
      </Box>

      {/* Profile Form */}
      <ProfileForm />

      {/* Help Section */}
      <Paper
        sx={{
          p: 3,
          mt: 4,
          borderRadius: 3,
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Need Help?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          If you're having trouble updating your profile or need to change your
          email address, please contact our support team.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            • Email changes require admin approval
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Profile changes are logged for security
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Password must meet security requirements
          </Typography>
        </Box>
      </Paper>

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ p: 2, mt: 3, bgcolor: 'warning.50' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Development Info:
          </Typography>
          <Typography variant="body2" component="div">
            • Route: {ROUTES.MY_PROFILE}
            <br />
            • Access: All authenticated users
            <br />• User: {user.name} ({user.role})
            <br />• Email: {user.email}
            <br />• Last login:{' '}
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleString()
              : 'Unknown'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MyProfilePage;
