/**
 * PageLoader component for page-level loading states
 * Used when entire pages are loading or transitioning
 */
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export interface PageLoaderProps {
  message?: string;
  fullHeight?: boolean;
  className?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Loading page...',
  fullHeight = true,
  className = '',
}) => {
  return (
    <div
      className={`page-loader ${fullHeight ? 'full-height' : ''} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="page-loader-content">
        <LoadingSpinner size="large" color="primary" message={message} />
      </div>
    </div>
  );
};

export default PageLoader;
