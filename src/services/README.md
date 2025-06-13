# Services Directory

This directory contains all service modules for the Solarium Web Portal, including API clients, utilities, and business logic services.

## Structure

```
services/
├── api/              # API client services
│   ├── base.ts       # Base API configuration
│   ├── auth.ts       # Authentication API
│   ├── leads.ts      # Lead management API
│   ├── quotations.ts # Quotation API
│   ├── commissions.ts# Commission API
│   ├── users.ts      # User management API
│   └── types.ts      # API type definitions
├── auth/             # Authentication services
├── storage/          # Local storage utilities
├── validation/       # Form validation services
├── notifications/    # Notification services
├── analytics/        # Analytics and tracking
├── utils/            # Utility services
└── hooks/            # Service-related hooks
```

## Guidelines

### Service Design Principles
- **Single Responsibility**: Each service has one clear purpose
- **Dependency Injection**: Services should be easily mockable
- **Error Handling**: Consistent error handling across all services
- **Type Safety**: Full TypeScript coverage with proper typing
- **Caching**: Implement appropriate caching strategies

### API Service Pattern
```typescript
// Base API service pattern
export class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
  }

  async get<T>(endpoint: string): Promise<T> {
    // Implementation
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    // Implementation
  }

  // ... other HTTP methods
}
```

## Service Categories

### API Services (`api/`)
HTTP client services for backend communication:

#### Base API Service (`api/base.ts`)
```typescript
export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class BaseApiService {
  // Axios instance configuration
  // Request/response interceptors
  // Error handling
  // Authentication token management
}
```

#### Authentication Service (`api/auth.ts`)
```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export class AuthApiService extends BaseApiService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {}
  async logout(): Promise<void> {}
  async refreshToken(): Promise<string> {}
  async forgotPassword(email: string): Promise<void> {}
  async resetPassword(token: string, password: string): Promise<void> {}
}
```

#### Lead Management Service (`api/leads.ts`)
```typescript
export interface LeadQuery {
  page?: number;
  limit?: number;
  status?: string;
  territory?: string;
  assignedTo?: string;
}

export class LeadApiService extends BaseApiService {
  async getLeads(query: LeadQuery): Promise<PaginatedResponse<Lead>> {}
  async getLead(id: string): Promise<Lead> {}
  async createLead(lead: CreateLeadRequest): Promise<Lead> {}
  async updateLead(id: string, updates: UpdateLeadRequest): Promise<Lead> {}
  async updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {}
  async assignLead(id: string, assigneeId: string): Promise<Lead> {}
  async bulkUpdateLeads(updates: BulkUpdateRequest): Promise<void> {}
}
```

### Authentication Services (`auth/`)
User authentication and session management:

```typescript
// auth/authService.ts
export class AuthService {
  private tokenKey = 'solarium_token';
  private userKey = 'solarium_user';

  getToken(): string | null {}
  setToken(token: string): void {}
  removeToken(): void {}
  
  getCurrentUser(): User | null {}
  setCurrentUser(user: User): void {}
  
  isAuthenticated(): boolean {}
  hasRole(role: UserRole): boolean {}
  hasPermission(permission: string): boolean {}
  
  logout(): void {}
}
```

### Storage Services (`storage/`)
Local and session storage utilities:

```typescript
// storage/storageService.ts
export class StorageService {
  // LocalStorage operations
  setItem(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  // SessionStorage operations
  setSessionItem(key: string, value: unknown): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error);
    }
  }

  getSessionItem<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to read from sessionStorage:', error);
      return null;
    }
  }

  removeSessionItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from sessionStorage:', error);
    }
  }

  // Clear all storage
  clear(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}
```

### Validation Services (`validation/`)
Form and data validation utilities:

```typescript
// validation/validationService.ts
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationService {
  static validateField(value: unknown, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];
    
    if (rules.required && (!value || String(value).trim() === '')) {
      errors.push('This field is required');
    }
    
    if (rules.minLength && String(value).length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength} characters`);
    }
    
    if (rules.maxLength && String(value).length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength} characters`);
    }
    
    if (rules.pattern && !rules.pattern.test(String(value))) {
      errors.push('Invalid format');
    }
    
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateEmail(email: string): ValidationResult {
    return this.validateField(email, {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    });
  }

  static validatePhone(phone: string): ValidationResult {
    return this.validateField(phone, {
      required: true,
      pattern: /^\+?[\d\s\-\(\)]{10,}$/,
    });
  }
}
```

### Notification Services (`notifications/`)
User notification and messaging services:

```typescript
// notifications/notificationService.ts
export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

export class NotificationService {
  private notifications: NotificationOptions[] = [];
  private listeners: ((notifications: NotificationOptions[]) => void)[] = [];

  show(options: NotificationOptions): void {
    const notification = {
      ...options,
      duration: options.duration || 5000,
    };
    
    this.notifications.push(notification);
    this.notifyListeners();
    
    if (notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, notification.duration);
    }
  }

  remove(notification: NotificationOptions): void {
    const index = this.notifications.indexOf(notification);
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.notifyListeners();
    }
  }

  clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  subscribe(listener: (notifications: NotificationOptions[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }
}
```

### Analytics Services (`analytics/`)
User tracking and analytics:

```typescript
// analytics/analyticsService.ts
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  timestamp?: Date;
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private userId: string | null = null;

  setUserId(userId: string): void {
    this.userId = userId;
  }

  track(name: string, properties?: Record<string, unknown>): void {
    const event: AnalyticsEvent = {
      name,
      properties,
      userId: this.userId || undefined,
      timestamp: new Date(),
    };
    
    this.events.push(event);
    
    // In production, send to analytics service
    console.log('Analytics event:', event);
  }

  page(name: string, properties?: Record<string, unknown>): void {
    this.track('page_view', { page: name, ...properties });
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.setUserId(userId);
    this.track('identify', { userId, ...traits });
  }

  flush(): void {
    // Send all events to analytics service
    console.log('Flushing analytics events:', this.events);
    this.events = [];
  }
}
```

## Service Hooks

### Custom React Hooks for Services
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const authService = new AuthService();
  
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);
  
  const login = async (credentials: LoginRequest) => {
    // Implementation
  };
  
  const logout = () => {
    authService.logout();
    setUser(null);
  };
  
  return { user, loading, login, logout };
};
```

## Error Handling

### Centralized Error Handling
```typescript
// utils/errorHandler.ts
export class ErrorHandler {
  static handle(error: unknown): void {
    if (error instanceof ApiError) {
      // Handle API errors
      NotificationService.show({
        type: 'error',
        message: error.message,
      });
    } else if (error instanceof ValidationError) {
      // Handle validation errors
      console.warn('Validation error:', error);
    } else {
      // Handle unknown errors
      console.error('Unknown error:', error);
      NotificationService.show({
        type: 'error',
        message: 'An unexpected error occurred',
      });
    }
  }
}
```

## Testing Strategy

### Service Testing
```typescript
// __tests__/authService.test.ts
describe('AuthService', () => {
  let authService: AuthService;
  
  beforeEach(() => {
    authService = new AuthService();
    localStorage.clear();
  });
  
  test('stores and retrieves token correctly', () => {
    const token = 'test-token';
    authService.setToken(token);
    expect(authService.getToken()).toBe(token);
  });
  
  test('clears user data on logout', () => {
    authService.setToken('token');
    authService.setCurrentUser({ id: '1', name: 'Test User' });
    
    authService.logout();
    
    expect(authService.getToken()).toBeNull();
    expect(authService.getCurrentUser()).toBeNull();
  });
});
```

## Performance Considerations

### Optimization Strategies
- **Caching**: Implement intelligent caching for API responses
- **Debouncing**: Use debouncing for search and filter operations
- **Lazy Loading**: Load services only when needed
- **Memory Management**: Clean up subscriptions and timers

### Bundle Size Management
- **Tree Shaking**: Ensure services can be tree-shaken
- **Code Splitting**: Split services by feature
- **Dependency Management**: Minimize external dependencies

## Security Considerations

### Best Practices
- **Token Security**: Secure storage and transmission of tokens
- **Input Validation**: Sanitize all inputs before processing
- **HTTPS Only**: All API calls over secure connections
- **Error Information**: Don't expose sensitive information in errors

## Future Enhancements

- **Service Worker**: Offline capability and background sync
- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Caching**: Redis-like caching strategies
- **Metrics Collection**: Performance and usage metrics
- **Retry Logic**: Automatic retry with exponential backoff