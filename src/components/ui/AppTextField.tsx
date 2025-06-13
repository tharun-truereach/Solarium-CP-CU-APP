/**
 * AppTextField component - customized Material UI text field
 * Provides consistent styling and enhanced functionality for forms
 */
import React, { useState } from 'react';
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  IconButton,
  Box,
  FormHelperText,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export interface AppTextFieldProps extends Omit<TextFieldProps, 'variant'> {
  variant?: 'outlined' | 'filled';
  startIcon?: React.ReactElement;
  endIcon?: React.ReactElement;
  showPasswordToggle?: boolean;
  helperText?: string;
  errorText?: string;
}

const AppTextField: React.FC<AppTextFieldProps> = ({
  variant = 'outlined',
  type,
  startIcon,
  endIcon,
  showPasswordToggle = false,
  helperText,
  errorText,
  error,
  InputProps,
  sx,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const isPasswordField = type === 'password' && showPasswordToggle;
  const actualType = isPasswordField
    ? showPassword
      ? 'text'
      : 'password'
    : type;

  const startAdornment = startIcon ? (
    <InputAdornment position="start">{startIcon}</InputAdornment>
  ) : undefined;

  const endAdornment =
    endIcon || isPasswordField ? (
      <InputAdornment position="end">
        {isPasswordField && (
          <IconButton
            aria-label="toggle password visibility"
            onClick={handleTogglePassword}
            edge="end"
            size="small"
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        )}
        {endIcon && !isPasswordField && endIcon}
      </InputAdornment>
    ) : undefined;

  return (
    <Box>
      <TextField
        variant={variant}
        type={actualType}
        error={error || !!errorText}
        InputProps={{
          startAdornment,
          endAdornment,
          ...InputProps,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '& fieldset': {
              borderColor: 'divider',
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
          },
          ...sx,
        }}
        {...props}
      />

      {(helperText || errorText) && (
        <FormHelperText
          error={error || !!errorText}
          sx={{ mx: 1.75, mt: 0.75 }}
        >
          {errorText || helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default AppTextField;
