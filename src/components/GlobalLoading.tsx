/**
 * GlobalLoading component for application-wide loading states
 * Integrates with LoadingContext to show global loading indicators
 */
import React from 'react';
import { useLoading } from '../contexts/LoadingContext';
import LoadingOverlay from './loading/LoadingOverlay';

const GlobalLoading: React.FC = () => {
  const { loading, isGlobalLoading } = useLoading();

  return (
    <>
      {/* Global loading overlay */}
      <LoadingOverlay
        isVisible={isGlobalLoading}
        {...(loading.loadingMessage && { message: loading.loadingMessage })}
        backdrop={true}
        size="large"
      />

      {/* Loading progress bar */}
      {isGlobalLoading && (
        <div
          className="global-loading-bar"
          role="progressbar"
          aria-label="Loading"
        />
      )}
    </>
  );
};

export default GlobalLoading;
