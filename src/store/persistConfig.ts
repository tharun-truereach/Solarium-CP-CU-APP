import { PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { encryptTransform } from 'redux-persist-transform-encrypt';
import { AuthState } from '../types';
import { config } from '../config/environment';

export const createEncryptorTransform = () => {
  const secretKey = config.cryptoSecret;

  if (secretKey.length < 32) {
    console.warn(
      'VITE_CRYPTO_SECRET should be at least 32 characters for optimal security'
    );
  }

  return encryptTransform({
    secretKey,
    onError: error => {
      console.error('Redux persist encryption error:', error);
      localStorage.removeItem('persist:auth');
      window.location.reload();
    },
  });
};

export const authPersistConfig: PersistConfig<AuthState> = {
  key: 'auth',
  storage,
  transforms: [createEncryptorTransform()],
  whitelist: ['token', 'user', 'isAuthenticated'],
};

export const validatePersistenceConfig = (): boolean => {
  try {
    const testKey = '__redux_persist_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);

    const hasValidSecret = Boolean(
      config.cryptoSecret && config.cryptoSecret.length >= 16
    );

    if (!hasValidSecret) {
      console.warn(
        'Crypto secret is not properly configured for Redux persistence'
      );
    }

    return hasValidSecret;
  } catch (error) {
    console.error('localStorage is not available:', error);
    return false;
  }
};
