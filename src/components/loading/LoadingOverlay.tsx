/**
 * LoadingOverlay component for full-screen loading states
 * Prevents user interaction while content is loading
 */
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  backdrop?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  backdrop = true,
  size = 'large',
  className = '',
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`loading-overlay ${backdrop ? 'with-backdrop' : ''} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="loading-overlay-content">
        <LoadingSpinner size={size} color="white" message={message} />
      </div>
    </div>
  );
};

export default LoadingOverlay;
