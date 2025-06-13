# Tests Directory

This directory contains test utilities, setup files, and shared testing resources for the Solarium Web Portal.

## Structure

```
tests/
├── setupTests.ts         # Jest setup and configuration
├── testUtils.ts          # Testing utility functions
├── mockData/             # Mock data for tests
│   ├── users.ts          # Mock user data
│   ├── leads.ts          # Mock lead data
│   └── api.ts            # Mock API responses
├── fixtures/             # Test fixtures and constants
├── helpers/              # Test helper functions
└── __mocks__/            # Manual mocks for modules
```

## Guidelines

### Testing Principles
- **Comprehensive Coverage**: Aim for high test coverage across all components
- **Realistic Tests**: Test real user scenarios and edge cases
- **Fast Execution**: Keep tests fast and reliable
- **Clear Assertions**: Use descriptive test names and assertions
- **Mock Appropriately**: Mock external dependencies, not implementation details

### Test Categories
- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test component interactions and data flow
- **End-to-End Tests**: Test complete user workflows
- **Visual Tests**: Test UI appearance and responsive behavior

## Test Setup

### Jest Configuration (`setupTests.ts`)
```typescript
// setupTests.ts
import '@testing-library/jest-dom';

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables for testing
process.env.REACT_APP_ENVIRONMENT = 'TEST';
process.env.REACT_APP_API_BASE_URL = 'http://localhost:3000';
process.env.REACT_APP_SESSION_TIMEOUT_MIN = '30';

// Mock IntersectionObserver for tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### Test Utils (`testUtils.ts`)
```typescript
// testUtils.ts
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SolariumThemeProvider } from '../theme/ThemeProvider';
import { AuthProvider } from '../hooks/useAuth';

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: User;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries = ['/'], user, ...renderOptions } = options;

  // Mock authenticated user if provided
  if (user) {
    localStorage.setItem('solarium_token', 'mock_token');
    localStorage.setItem('solarium_user', JSON.stringify(user));
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <SolariumThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </SolariumThemeProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock user creation
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: '1',
  email: 'test@solarium.com',
  name: 'Test User',
  role: 'admin',
  isActive: true,
  ...overrides,
});

// Mock lead creation
export const createMockLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: '1',
  leadNumber: 'LEAD-001',
  customerName: 'Test Customer',
  customerEmail: 'customer@test.com',
  customerPhone: '(555) 123-4567',
  status: 'new',
  source: 'website',
  territory: 'North',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  activities: [],
  documents: [],
  ...overrides,
});

// Async utilities
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const mockApiDelay = (response: any, delay: number = 100) => {
  return new Promise(resolve => setTimeout(() => resolve(response), delay));
};

// Form testing utilities
export const fillForm = async (form: HTMLFormElement, data: Record<string, string>) => {
  const { fireEvent } = await import('@testing-library/react');
  
  Object.entries(data).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (input) {
      fireEvent.change(input, { target: { value } });
      fireEvent.blur(input);
    }
  });
};

// Responsive testing utilities
export const mockViewport = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  window.dispatchEvent(new Event('resize'));
};

// Error boundary testing
export const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};
```

### Mock Data (`mockData/`)
```typescript
// mockData/users.ts
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@solarium.com',
    name: 'Admin User',
    role: 'admin',
    isActive: true,
  },
  {
    id: '2',
    email: 'kam@solarium.com',
    name: 'KAM User',
    role: 'kam',
    isActive: true,
    territories: ['North', 'Central'],
  },
];

// mockData/leads.ts
export const mockLeads: Lead[] = [
  {
    id: '1',
    leadNumber: 'LEAD-001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '(555) 123-4567',
    status: 'new',
    source: 'website',
    territory: 'North',
    estimatedValue: 15000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    activities: [],
    documents: [],
  },
  // ... more mock leads
];

// mockData/api.ts
export const mockApiResponses = {
  login: {
    success: {
      token: 'mock_jwt_token',
      user: mockUsers[0],
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
    error: {
      message: 'Invalid credentials',
      code: 'AUTH_FAILED',
    },
  },
  
  leads: {
    list: {
      items: mockLeads,
      pagination: {
        total: mockLeads.length,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    },
  },
};
```

## Testing Patterns

### Component Testing
```typescript
// Example: Button component test
import { render, screen, fireEvent } from '@testing-library/react';
import { AppButton } from '@/components/ui/AppButton';

describe('AppButton', () => {
  test('renders button with text', () => {
    render(<AppButton>Click me</AppButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<AppButton onClick={handleClick}>Click me</AppButton>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    render(<AppButton loading>Loading</AppButton>);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

### Page Testing
```typescript
// Example: Login page test
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/tests/testUtils';
import { LoginPage } from '@/pages/auth/LoginPage';

describe('LoginPage', () => {
  test('allows user to login with valid credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    // Fill in login form
    await user.type(screen.getByLabelText(/email/i), 'admin@solarium.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for navigation
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });
  });

  test('shows error for invalid credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'invalid@email.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

### Hook Testing
```typescript
// Example: useAuth hook test
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initializes with no user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('logs in user successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('admin@solarium.com', 'password123');
    });

    expect(result.current.user).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### API Testing
```typescript
// Example: API service test
import { AuthApiService } from '@/services/api/auth';
import { mockApiResponses } from '@/tests/mockData/api';

// Mock fetch
global.fetch = jest.fn();

describe('AuthApiService', () => {
  const authApi = new AuthApiService();

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('login returns user data on success', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponses.login.success,
    });

    const result = await authApi.login({
      email: 'admin@solarium.com',
      password: 'password123',
    });

    expect(result.user.email).toBe('admin@solarium.com');
    expect(result.token).toBeTruthy();
  });

  test('login throws error on failure', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockApiResponses.login.error,
    });

    await expect(
      authApi.login({ email: 'invalid@email.com', password: 'wrong' })
    ).rejects.toThrow('Invalid credentials');
  });
});
```

### Responsive Testing
```typescript
// Example: Responsive component test
import { render, screen } from '@testing-library/react';
import { mockViewport } from '@/tests/testUtils';
import { MainLayout } from '@/layouts/MainLayout';

describe('MainLayout Responsive', () => {
  test('shows mobile menu on small screens', () => {
    mockViewport(375); // Mobile width
    
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByLabelText(/toggle drawer/i)).toBeInTheDocument();
  });

  test('shows full navigation on desktop', () => {
    mockViewport(1920); // Desktop width
    
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByText('Dashboard')).toBeVisible();
    expect(screen.getByText('Lead Management')).toBeVisible();
  });
});
```

### Error Boundary Testing
```typescript
// Example: Error boundary test
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { ThrowError } from '@/tests/testUtils';

describe('ErrorBoundary', () => {
  test('catches and displays error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  test('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
```

## Advanced Testing Techniques

### Snapshot Testing
```typescript
// Example: Snapshot test
import { render } from '@testing-library/react';
import { AppCard } from '@/components/ui/AppCard';

test('AppCard renders correctly', () => {
  const { container } = render(
    <AppCard title="Test Card" subtitle="Test subtitle">
      Card content
    </AppCard>
  );

  expect(container.firstChild).toMatchSnapshot();
});
```

### Integration Testing
```typescript
// Example: Full user flow test
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/tests/testUtils';
import { App } from '@/App';

describe('User Authentication Flow', () => {
  test('user can login and navigate to dashboard', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    // Should start at login page
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();

    // Login
    await user.type(screen.getByLabelText(/email/i), 'admin@solarium.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should navigate to dashboard
    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    // Should show navigation
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Lead Management')).toBeInTheDocument();
  });
});
```

### Performance Testing
```typescript
// Example: Performance test
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';
import { AppTable } from '@/components/ui/AppTable';
import { mockLeads } from '@/tests/mockData/leads';

describe('AppTable Performance', () => {
  test('renders 1000 rows within performance budget', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      ...mockLeads[0],
      id: `lead-${i}`,
      leadNumber: `LEAD-${i.toString().padStart(3, '0')}`,
    }));

    const start = performance.now();
    
    render(
      <AppTable
        data={largeDataset}
        columns={[
          { key: 'leadNumber', label: 'Lead Number' },
          { key: 'customerName', label: 'Customer' },
          { key: 'status', label: 'Status' },
        ]}
      />
    );

    const end = performance.now();
    const renderTime = end - start;

    // Should render within 100ms
    expect(renderTime).toBeLessThan(100);
  });
});
```

## Accessibility Testing
```typescript
// Example: Accessibility test
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LoginPage } from '@/pages/auth/LoginPage';

expect.extend(toHaveNoViolations);

describe('LoginPage Accessibility', () => {
  test('should not have accessibility violations', async () => {
    const { container } = render(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Custom Matchers
```typescript
// Custom Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveLoadingState(): R;
    }
  }
}

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () =>
        `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },

  toHaveLoadingState(received: HTMLElement) {
    const hasSpinner = received.querySelector('[role="progressbar"]');
    const hasLoadingText = received.textContent?.includes('Loading');
    const pass = !!(hasSpinner || hasLoadingText);
    
    return {
      message: () =>
        `expected element to have loading state (spinner or loading text)`,
      pass,
    };
  },
});
```

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use clear, descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Keep tests focused and independent
- Use `beforeEach` and `afterEach` for setup/cleanup

### Mocking Guidelines
- Mock external dependencies (APIs, third-party libraries)
- Don't mock implementation details
- Use realistic mock data
- Reset mocks between tests

### Coverage Goals
- Aim for 80%+ code coverage
- Focus on critical paths and edge cases
- Don't sacrifice test quality for coverage numbers
- Use coverage reports to identify untested code

### Performance Considerations
- Keep tests fast (< 1s per test ideally)
- Use shallow rendering when appropriate
- Minimize DOM operations in tests
- Parallelize test execution

This comprehensive testing setup provides a solid foundation for maintaining high code quality and catching regressions in the Solarium Web Portal. 