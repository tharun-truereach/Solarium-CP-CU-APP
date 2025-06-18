/**
 * Typed Redux hooks for Solarium Web Portal
 * Provides type-safe access to Redux store dispatch and state
 */

import {
  useDispatch,
  useSelector,
  useStore,
  TypedUseSelectorHook,
} from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed version of useDispatch hook
 * Use this instead of plain useDispatch to get proper typing
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed version of useSelector hook
 * Use this instead of plain useSelector to get proper typing
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Typed version of useStore hook
 * Use sparingly - prefer useAppSelector for accessing state
 */
export const useAppStore = () => useStore<RootState>();

/**
 * Custom hook for accessing both dispatch and state
 * Convenience hook when component needs both
 */
export const useAppRedux = () => {
  const dispatch = useAppDispatch();
  const selector = useAppSelector;
  return { dispatch, selector };
};

/**
 * Hook for checking if store is rehydrated (persistence loaded)
 * Useful for showing loading states during app initialization
 */
export const useStoreRehydration = () => {
  return useAppSelector(state => {
    // Check if redux-persist has finished rehydrating
    return !!(state as any)._persist?.rehydrated;
  });
};

/**
 * Development-only hook for debugging store state
 * Only available in development environment
 */
export const useStoreDebug = () => {
  const state = useAppSelector(state => state);
  const dispatch = useAppDispatch();
  const store = useAppStore();

  if (process.env.NODE_ENV === 'production') {
    console.warn('useStoreDebug should not be used in production');
    return null;
  }

  return {
    state,
    dispatch,
    logState: () => console.log('🏪 Current store state:', state),
    logActions: () => {
      const originalDispatch = dispatch;
      return (action: any) => {
        console.log('🎬 Dispatching action:', action);
        const result = originalDispatch(action);
        console.log('🏪 New state:', store.getState());
        return result;
      };
    },
  };
};
