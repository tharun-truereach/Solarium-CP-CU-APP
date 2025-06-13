# Pages Directory

This directory contains all page-level components for the Solarium Web Portal. Each page represents a distinct route/screen in the application.

## Structure

```
pages/
├── auth/           # Authentication pages (login, forgot password)
├── dashboard/      # Dashboard and overview pages
├── leads/          # Lead management pages
├── quotations/     # Quotation management pages
├── commissions/    # Commission management pages
├── users/          # User management pages (CP, KAM, Customer)
├── reports/        # Reports and analytics pages
├── settings/       # System configuration pages
├── errors/         # Error pages (404, 403, 500)
└── support/        # Support and help pages
```

## Guidelines

### Page Component Principles
- **Single Route**: Each page should correspond to a single route
- **Layout Integration**: Use consistent layout components
- **Data Fetching**: Handle loading states and error conditions
- **Role-Based Access**: Implement proper authorization checks
- **SEO Ready**: Include proper meta tags and titles

### Naming Conventions
- Use PascalCase with 'Page' suffix: `LoginPage`, `LeadsListPage`
- Use descriptive names that match the route purpose
- Group related pages in subdirectories

### File Structure for Each Page
```
PageName/
├── index.ts            # Barrel export
├── PageName.tsx        # Main page component
├── PageName.test.tsx   # Page tests
├── hooks/              # Page-specific hooks
├── components/         # Page-specific components
└── types.ts            # Page-specific types
```

### Page Component Template
```typescript
import { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

interface PageNameProps {
  // Page-specific props
}

export const PageName: React.FC<PageNameProps> = () => {
  const [loading, setLoading] = useState(true);
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    // Page initialization logic
    setLoading(false);
  }, []);

  if (!hasPermission('required.permission')) {
    return <AccessDeniedPage />;
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Page Title
      </Typography>
      {/* Page content */}
    </Container>
  );
};

export default PageName;
```

## Page Categories

### Authentication Pages (`auth/`)
User authentication and session management:
- **LoginPage** - Admin/KAM email/password login
- **ForgotPasswordPage** - Password reset flow
- **SessionTimeoutPage** - Session expiry handling
- **UnauthorizedPage** - Access denied display

### Dashboard Pages (`dashboard/`)
Overview and summary pages:
- **DashboardPage** - Main dashboard with metrics
- **OverviewPage** - System overview for different roles
- **MetricsPage** - Detailed performance metrics

### Lead Management Pages (`leads/`)
Lead workflow and management:
- **LeadsListPage** - Lead list with filtering/sorting
- **LeadDetailsPage** - Individual lead details
- **LeadCreatePage** - Create new lead
- **LeadImportPage** - CSV import functionality
- **LeadTimelinePage** - Lead activity timeline

### Quotation Pages (`quotations/`)
Quotation management and workflow:
- **QuotationsListPage** - Quotation list view
- **QuotationDetailsPage** - View quotation details
- **QuotationCreatePage** - 7-step quotation wizard
- **QuotationEditPage** - Edit draft quotations

### Commission Pages (`commissions/`)
Commission tracking and payments:
- **CommissionsPage** - Commission overview
- **CommissionDetailsPage** - Individual commission details
- **PaymentProcessingPage** - Bulk payment processing
- **CommissionReportsPage** - Commission reports

### User Management Pages (`users/`)
User administration:
- **ChannelPartnersPage** - CP management
- **KAMsPage** - KAM management
- **CustomersPage** - Customer overview
- **UserDetailsPage** - Individual user details
- **UserApprovalPage** - User approval workflow

### Reports Pages (`reports/`)
Analytics and reporting:
- **ReportsPage** - Report dashboard
- **LeadReportsPage** - Lead analytics
- **PerformanceReportsPage** - User performance
- **SystemReportsPage** - System usage reports

### Settings Pages (`settings/`)
System configuration:
- **MasterDataPage** - Product catalog management
- **SystemConfigPage** - Global settings
- **UserProfilePage** - User profile management
- **NotificationSettingsPage** - Notification preferences

### Error Pages (`errors/`)
Error handling and fallback pages:
- **NotFoundPage** - 404 error page
- **AccessDeniedPage** - 403 error page
- **ServerErrorPage** - 500 error page
- **MaintenancePage** - Maintenance mode page

## Routing Integration

Pages are integrated with React Router for navigation:

```typescript
// Route configuration example
const routes = [
  { path: '/login', component: LoginPage, public: true },
  { path: '/dashboard', component: DashboardPage, roles: ['admin', 'kam'] },
  { path: '/leads', component: LeadsListPage, roles: ['admin', 'kam'] },
  { path: '/leads/:id', component: LeadDetailsPage, roles: ['admin', 'kam'] },
  // ... more routes
];
```

## Data Fetching Patterns

### Loading States
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchData()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

### Error Handling
```typescript
if (error) {
  return <ErrorMessage error={error} onRetry={refetch} />;
}
```

## Testing Strategy

- **Unit Tests**: Test page logic and state management
- **Integration Tests**: Test page with routing and data fetching
- **E2E Tests**: Test complete user workflows
- **Accessibility Tests**: Ensure pages are accessible

## Performance Considerations

- **Code Splitting**: Use React.lazy for route-based code splitting
- **Data Prefetching**: Prefetch critical data for faster navigation
- **Caching**: Implement appropriate caching strategies
- **Bundle Size**: Monitor and optimize page bundle sizes

## Security Considerations

- **Route Guards**: Implement role-based access control
- **Data Validation**: Validate all user inputs
- **CSRF Protection**: Implement CSRF tokens where needed
- **XSS Prevention**: Sanitize dynamic content 