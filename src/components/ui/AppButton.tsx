/**
 * AppButton component - customized Material UI button with consistent styling
 * Provides different variants and sizes following the design system
 */
import React from 'react';
import { Button, ButtonProps, CircularProgress, Box } from '@mui/material';

export interface AppButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactElement;
  iconPosition?: 'start' | 'end';
}

const AppButton: React.FC<AppButtonProps> = ({
  variant = 'primary',
  loading = false,
  children,
  disabled,
  icon,
  iconPosition = 'start',
  sx,
  ...props
}) => {
  const getVariantProps = () => {
    switch (variant) {
      case 'primary':
        return {
          variant: 'contained' as const,
          color: 'primary' as const,
        };
      case 'secondary':
        return {
          variant: 'contained' as const,
          color: 'secondary' as const,
        };
      case 'outline':
        return {
          variant: 'outlined' as const,
          color: 'primary' as const,
        };
      case 'text':
        return {
          variant: 'text' as const,
          color: 'primary' as const,
        };
      case 'danger':
        return {
          variant: 'contained' as const,
          color: 'error' as const,
        };
      default:
        return {
          variant: 'contained' as const,
          color: 'primary' as const,
        };
    }
  };

  const variantProps = getVariantProps();

  return (
    <Button
      {...variantProps}
      disabled={disabled || loading}
      sx={{
        position: 'relative',
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 2,
        py: 1.5,
        px: 3,
        minHeight: 44,
        ...sx,
      }}
      {...props}
    >
      {loading && (
        <CircularProgress
          size={20}
          sx={{
            position: 'absolute',
            color: 'inherit',
          }}
        />
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          visibility: loading ? 'hidden' : 'visible',
        }}
      >
        {icon && iconPosition === 'start' && icon}
        {children}
        {icon && iconPosition === 'end' && icon}
      </Box>
    </Button>
  );
};

export default AppButton;
