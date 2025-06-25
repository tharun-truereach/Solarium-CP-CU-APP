/**
 * Profile Form Component
 * Form for editing user profile information with validation
 */

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  IconButton,
  Alert,
  Divider,
  InputAdornment,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Schedule as TimezoneIcon,
  PhotoCamera as CameraIcon,
  Edit as EditIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { AppButton, AppTextField } from '../ui';
import { useMyProfile } from '../../hooks/useMyProfile';
import { VALIDATION_PATTERNS } from '../../utils/constants';
import type { ProfileUpdatePayload } from '../../types/profile.types';
import ChangePasswordDialog from './ChangePasswordDialog';

/**
 * Profile form data interface
 */
interface ProfileFormData extends ProfileUpdatePayload {
  email: string; // Read-only field for display
}

/**
 * Timezone options for select field
 */
const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC - Coordinated Universal Time' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

/**
 * Language options for select field
 */
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
];

/**
 * Profile Form Component
 */
const ProfileForm: React.FC = () => {
  const {
    profile,
    draftProfile,
    isLoading,
    isSaving,
    isUploadingAvatar,
    isDirty,
    hasValidationErrors,
    validationErrors,
    setField,
    saveProfile,
    resetDraft,
    uploadAvatar,
    changePassword,
    isChangingPassword,
    getFieldValue,
  } = useMyProfile();

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    mode: 'onChange',
    defaultValues: {
      name: getFieldValue('name'),
      firstName: getFieldValue('firstName'),
      lastName: getFieldValue('lastName'),
      phoneNumber: getFieldValue('phoneNumber'),
      timezone: getFieldValue('timezone'),
      language: getFieldValue('language'),
      email: profile?.email || '',
    },
  });

  // Update form when profile changes
  React.useEffect(() => {
    if (profile) {
      reset({
        name: getFieldValue('name'),
        firstName: getFieldValue('firstName'),
        lastName: getFieldValue('lastName'),
        phoneNumber: getFieldValue('phoneNumber'),
        timezone: getFieldValue('timezone'),
        language: getFieldValue('language'),
        email: profile.email,
      });
    }
  }, [profile, reset, getFieldValue]);

  /**
   * Handle form field changes
   */
  const handleFieldChange = (
    field: keyof ProfileUpdatePayload,
    value: string
  ) => {
    setField(field, value);
  };

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data: ProfileFormData) => {
    try {
      await saveProfile();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Form submission error:', error);
    }
  };

  /**
   * Handle form reset
   */
  const handleFormReset = () => {
    resetDraft();
    reset({
      name: profile?.name || '',
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phoneNumber: profile?.phoneNumber || '',
      timezone: profile?.timezone || '',
      language: profile?.language || '',
      email: profile?.email || '',
    });
  };

  /**
   * Handle avatar upload
   */
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = e => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    const success = await uploadAvatar(file);
    if (!success) {
      setAvatarPreview(''); // Clear preview on error
    }

    // Clear input
    event.target.value = '';
  };

  /**
   * Handle password change
   */
  const handlePasswordChange = async (passwordData: any) => {
    return await changePassword(passwordData);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load profile. Please refresh the page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Avatar Section */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={avatarPreview || profile.avatar || ''}
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 600,
              }}
            >
              {profile.name?.charAt(0)?.toUpperCase()}
            </Avatar>

            <Tooltip title="Change avatar">
              <IconButton
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                sx={{
                  position: 'absolute',
                  bottom: -8,
                  right: -8,
                  bgcolor: 'background.paper',
                  border: '2px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                aria-label="Change profile picture"
              >
                <CameraIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              aria-label="Upload profile picture"
            />
          </Box>

          {/* Profile Info */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {profile.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {profile.email}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {/* Role chip - to be implemented when role is added to UserProfile type */}
              {profile.timezone && (
                <Chip
                  label={`Timezone: ${profile.timezone}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {profile.language && (
                <Chip
                  label={`Language: ${profile.language.toUpperCase()}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          {/* Password Change Button */}
          <Box>
            <Tooltip title="Change password">
              <AppButton
                variant="outline"
                startIcon={<LockIcon />}
                onClick={() => setShowPasswordDialog(true)}
                disabled={isChangingPassword}
              >
                Change Password
              </AppButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Profile Form */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <EditIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Profile Information
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <Grid container spacing={3}>
            {/* Display Name */}
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: 'Display name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                  maxLength: {
                    value: 100,
                    message: 'Name must be less than 100 characters',
                  },
                }}
                render={({ field }) => (
                  <AppTextField
                    {...field}
                    label="Display Name"
                    fullWidth
                    required
                    error={!!errors.name || !!validationErrors?.name}
                    helperText={
                      errors.name?.message ||
                      validationErrors?.name?.[0] ||
                      'This name will be displayed throughout the application'
                    }
                    disabled={isSaving}
                    onChange={e => {
                      field.onChange(e);
                      handleFieldChange('name', e.target.value);
                    }}
                    startIcon={<PersonIcon />}
                    inputProps={{
                      'aria-label': 'Display Name',
                      maxLength: 100,
                    }}
                  />
                )}
              />
            </Grid>

            {/* First Name */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="firstName"
                control={control}
                rules={{
                  maxLength: {
                    value: 50,
                    message: 'First name must be less than 50 characters',
                  },
                }}
                render={({ field }) => (
                  <AppTextField
                    {...field}
                    label="First Name"
                    fullWidth
                    error={!!errors.firstName || !!validationErrors?.firstName}
                    helperText={
                      errors.firstName?.message ||
                      validationErrors?.firstName?.[0] ||
                      'Optional - used for formal communications'
                    }
                    disabled={isSaving}
                    onChange={e => {
                      field.onChange(e);
                      handleFieldChange('firstName', e.target.value);
                    }}
                    inputProps={{
                      'aria-label': 'First Name',
                      maxLength: 50,
                    }}
                  />
                )}
              />
            </Grid>

            {/* Last Name */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="lastName"
                control={control}
                rules={{
                  maxLength: {
                    value: 50,
                    message: 'Last name must be less than 50 characters',
                  },
                }}
                render={({ field }) => (
                  <AppTextField
                    {...field}
                    label="Last Name"
                    fullWidth
                    error={!!errors.lastName || !!validationErrors?.lastName}
                    helperText={
                      errors.lastName?.message ||
                      validationErrors?.lastName?.[0] ||
                      'Optional - used for formal communications'
                    }
                    disabled={isSaving}
                    onChange={e => {
                      field.onChange(e);
                      handleFieldChange('lastName', e.target.value);
                    }}
                    inputProps={{
                      'aria-label': 'Last Name',
                      maxLength: 50,
                    }}
                  />
                )}
              />
            </Grid>

            {/* Email (Read-only) */}
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <AppTextField
                    {...field}
                    label="Email Address"
                    fullWidth
                    disabled
                    helperText="Email cannot be changed. Contact support if needed."
                    startIcon={<EmailIcon />}
                    inputProps={{
                      'aria-label': 'Email Address (read-only)',
                      readOnly: true,
                    }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: 'text.secondary',
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Phone Number */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="phoneNumber"
                control={control}
                rules={{
                  pattern: {
                    value: VALIDATION_PATTERNS.PHONE,
                    message: 'Please enter a valid phone number',
                  },
                }}
                render={({ field }) => (
                  <AppTextField
                    {...field}
                    label="Phone Number"
                    fullWidth
                    error={
                      !!errors.phoneNumber || !!validationErrors?.phoneNumber
                    }
                    helperText={
                      errors.phoneNumber?.message ||
                      validationErrors?.phoneNumber?.[0] ||
                      'Include country code (e.g., +1 234 567 8900)'
                    }
                    disabled={isSaving}
                    onChange={e => {
                      field.onChange(e);
                      handleFieldChange('phoneNumber', e.target.value);
                    }}
                    startIcon={<PhoneIcon />}
                    inputProps={{
                      'aria-label': 'Phone Number',
                      placeholder: '+1 234 567 8900',
                    }}
                  />
                )}
              />
            </Grid>

            {/* Timezone */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <AppTextField
                    {...field}
                    select
                    label="Timezone"
                    fullWidth
                    error={!!errors.timezone || !!validationErrors?.timezone}
                    helperText={
                      errors.timezone?.message ||
                      validationErrors?.timezone?.[0] ||
                      'Used for displaying dates and times'
                    }
                    disabled={isSaving}
                    onChange={e => {
                      field.onChange(e);
                      handleFieldChange('timezone', e.target.value);
                    }}
                    startIcon={<TimezoneIcon />}
                    SelectProps={{
                      native: true,
                    }}
                    inputProps={{
                      'aria-label': 'Timezone',
                    }}
                  >
                    <option value="">Select timezone...</option>
                    {TIMEZONE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </AppTextField>
                )}
              />
            </Grid>

            {/* Language */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <AppTextField
                    {...field}
                    select
                    label="Language"
                    fullWidth
                    error={!!errors.language || !!validationErrors?.language}
                    helperText={
                      errors.language?.message ||
                      validationErrors?.language?.[0] ||
                      'Interface language preference'
                    }
                    disabled={isSaving}
                    onChange={e => {
                      field.onChange(e);
                      handleFieldChange('language', e.target.value);
                    }}
                    startIcon={<LanguageIcon />}
                    SelectProps={{
                      native: true,
                    }}
                    inputProps={{
                      'aria-label': 'Language',
                    }}
                  >
                    <option value="">Select language...</option>
                    {LANGUAGE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </AppTextField>
                )}
              />
            </Grid>
          </Grid>

          {/* Form Actions */}
          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <AppButton
              variant="outline"
              onClick={handleFormReset}
              disabled={!isDirty || isSaving}
            >
              Reset Changes
            </AppButton>
            <AppButton
              type="submit"
              variant="primary"
              loading={isSaving}
              disabled={!isDirty || hasValidationErrors}
            >
              Save Profile
            </AppButton>
          </Box>

          {/* Validation Summary */}
          {hasValidationErrors && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
              role="alert"
              aria-live="polite"
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Please fix the following errors:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {Object.entries(validationErrors || {}).map(
                  ([field, errors]) => (
                    <li key={field}>
                      <Typography variant="body2">
                        {field}: {errors[0]}
                      </Typography>
                    </li>
                  )
                )}
              </ul>
            </Alert>
          )}
        </form>
      </Paper>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onSubmit={handlePasswordChange}
        isLoading={isChangingPassword}
      />
    </Box>
  );
};

export default ProfileForm;
