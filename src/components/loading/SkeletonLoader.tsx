/**
 * SkeletonLoader component for displaying placeholder content
 * Shows loading placeholders that match the expected content structure
 */
import React from 'react';

export interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  count?: number;
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width = '100%',
  height,
  count = 1,
  animation = 'pulse',
  className = '',
}) => {
  const getDefaultHeight = () => {
    switch (variant) {
      case 'text':
        return '1.2em';
      case 'circular':
        return width;
      case 'rectangular':
        return '140px';
      default:
        return '1.2em';
    }
  };

  const skeletonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: height || getDefaultHeight(),
  };

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`skeleton skeleton-${variant} skeleton-${animation} ${className}`}
      style={skeletonStyle}
      role="progressbar"
      aria-label="Loading content"
    />
  ));

  return count === 1 ? (
    skeletons[0]
  ) : (
    <div className="skeleton-group">{skeletons}</div>
  );
};

export default SkeletonLoader;
