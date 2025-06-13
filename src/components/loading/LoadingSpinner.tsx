/**
 * LoadingSpinner component for displaying loading animations
 * Provides different sizes and styles for various loading scenarios
 */
import React from 'react';
import './loading.css';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  message,
  className = '',
}) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large',
  };

  const colorClasses = {
    primary: 'spinner-primary',
    secondary: 'spinner-secondary',
    white: 'spinner-white',
  };

  return (
    <div className={`loading-spinner-container ${className}`}>
      <div
        className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`}
        role="progressbar"
        aria-label={message || 'Loading'}
      />
      {message && (
        <p className="loading-message" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
