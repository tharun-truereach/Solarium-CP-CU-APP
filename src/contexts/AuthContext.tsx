/**
 * Authentication Context for managing user authentication state
 * This is a placeholder implementation for the routing foundation
 * Real authentication logic will be implemented in future tasks
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'kam';
  name: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkPermission: (allowedRoles?: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate checking for existing session on mount
  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        const savedUser = localStorage.getItem('solarium_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error checking existing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Simulate async check
    setTimeout(checkExistingAuth, 500);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock authentication - replace with real API call
    if (email && password) {
      const mockUser: User = {
        id: '1',
        email,
        role: email.includes('admin') ? 'admin' : 'kam',
        name: email.split('@')[0] || 'User',
      };

      setUser(mockUser);
      localStorage.setItem('solarium_user', JSON.stringify(mockUser));
    } else {
      throw new Error('Invalid credentials');
    }

    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('solarium_user');
  };

  const checkPermission = (allowedRoles?: string[]): boolean => {
    if (!user || !allowedRoles) return true;
    return allowedRoles.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
