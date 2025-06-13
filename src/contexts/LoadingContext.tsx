/**
 * Loading Context for managing global loading states
 * Provides centralized loading state management across the application
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  loadingType?: 'global' | 'page' | 'component' | 'data';
}

export interface LoadingContextType {
  loading: LoadingState;
  setLoading: (loading: Partial<LoadingState>) => void;
  startLoading: (message?: string, type?: LoadingState['loadingType']) => void;
  stopLoading: () => void;
  isGlobalLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({
  children,
}) => {
  const [loading, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadingType: 'global',
  });

  const setLoading = (newLoading: Partial<LoadingState>) => {
    setLoadingState(prev => ({
      ...prev,
      ...newLoading,
    }));
  };

  const startLoading = (
    message = 'Loading...',
    type: LoadingState['loadingType'] = 'global'
  ) => {
    setLoadingState({
      isLoading: true,
      loadingMessage: message,
      loadingType: type,
    });
  };

  const stopLoading = () => {
    setLoadingState({
      isLoading: false,
      loadingType: 'global',
    });
  };

  const value: LoadingContextType = {
    loading,
    setLoading,
    startLoading,
    stopLoading,
    isGlobalLoading: loading.isLoading && loading.loadingType === 'global',
  };

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};
