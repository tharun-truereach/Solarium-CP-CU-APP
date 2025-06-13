/**
 * DataLoader component for inline data loading states
 * Used when specific data sections are loading within a page
 */
import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import SkeletonLoader from './SkeletonLoader';

export interface DataLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: boolean;
  skeletonCount?: number;
  message?: string;
  height?: string;
  className?: string;
}

const DataLoader: React.FC<DataLoaderProps> = ({
  isLoading,
  children,
  skeleton = false,
  skeletonCount = 3,
  message = 'Loading data...',
  height = 'auto',
  className = '',
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div
      className={`data-loader ${className}`}
      style={{ minHeight: height }}
      role="status"
      aria-live="polite"
    >
      {skeleton ? (
        <div className="skeleton-container">
          <SkeletonLoader
            variant="text"
            count={skeletonCount}
            animation="pulse"
          />
        </div>
      ) : (
        <div className="data-loader-spinner">
          <LoadingSpinner size="medium" color="primary" message={message} />
        </div>
      )}
    </div>
  );
};

export default DataLoader;
