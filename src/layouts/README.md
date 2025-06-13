# Layouts Directory

This directory contains layout components that define the overall structure and navigation of the Solarium Web Portal pages.

## Structure

```
layouts/
├── MainLayout/         # Primary authenticated layout
├── AuthLayout/         # Authentication pages layout
├── EmptyLayout/        # Minimal layout for error pages
├── components/         # Layout-specific components
│   ├── AppHeader/      # Application header
│   ├── AppSidebar/     # Navigation sidebar
│   ├── AppFooter/      # Application footer
│   └── Breadcrumbs/    # Navigation breadcrumbs
└── hooks/              # Layout-related hooks
```

## Guidelines

### Layout Design Principles
- **Consistency**: Maintain consistent structure across all pages
- **Responsiveness**: Adapt to different screen sizes gracefully
- **Accessibility**: Support keyboard navigation and screen readers
- **Performance**: Minimize layout shifts and optimize rendering
- **Flexibility**: Support different content types and page structures

### Layout Component Template
```typescript
import { ReactNode } from 'react';
import { Box, Container } from '@mui/material';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  breadcrumbs,
  actions,
}) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Layout structure */}
      <main>
        <Container maxWidth="lg">
          {children}
        </Container>
      </main>
    </Box>
  );
};
```

## Layout Types

### MainLayout
The primary layout for authenticated users (Admin/KAM):

**Features:**
- Top navigation bar with user info and environment indicator
- Collapsible sidebar navigation for different sections
- Main content area with proper spacing and containers
- Footer with system information
- Responsive behavior for mobile/tablet/desktop

**Usage:**
```typescript
<MainLayout title="Dashboard" breadcrumbs={breadcrumbs}>
  <DashboardPage />
</MainLayout>
```

**Components:**
- AppHeader: Logo, user menu, environment badge, notifications
- AppSidebar: Navigation menu with role-based visibility
- AppFooter: Copyright, version info, support links
- MainContent: Content area with proper spacing

### AuthLayout
Simplified layout for authentication pages:

**Features:**
- Clean, centered design for login/forgot password
- Minimal branding and environment indicator
- Responsive form containers
- Background styling with Solarium branding

**Usage:**
```typescript
<AuthLayout title="Login">
  <LoginPage />
</AuthLayout>
```

### EmptyLayout
Minimal layout for error pages and special cases:

**Features:**
- No navigation or sidebar
- Basic header with minimal branding
- Full-width content area
- Used for 404, 500, maintenance pages

**Usage:**
```typescript
<EmptyLayout>
  <NotFoundPage />
</EmptyLayout>
```

## Layout Components

### AppHeader
Main application header with navigation and user controls:

**Features:**
- Company logo and application title
- Environment indicator badge
- User profile menu with logout
- Role-specific action buttons
- Search functionality (where applicable)
- Notification center

**Responsive Behavior:**
- Desktop: Full header with all elements
- Tablet: Collapsed menu with hamburger
- Mobile: Minimal header with drawer navigation

### AppSidebar
Navigation sidebar for the main application:

**Features:**
- Role-based menu items (Admin vs KAM)
- Collapsible/expandable sections
- Active page highlighting
- Territory filter for KAM users
- Quick actions and shortcuts

**Navigation Structure:**
```
├── Dashboard
├── Lead Management
│   ├── All Leads
│   ├── Lead Import
│   └── Lead Reports
├── Quotation Management
├── Commission & Payouts
├── User Management (Admin only)
│   ├── Channel Partners
│   ├── KAMs
│   └── Customers
├── Reports & Analytics
└── System Settings (Admin only)
```

### AppFooter
Application footer with system information:

**Features:**
- Copyright notice
- Version information
- Support links
- Environment indicator
- System status (optional)

### Breadcrumbs
Navigation breadcrumbs for page hierarchy:

**Features:**
- Hierarchical navigation path
- Clickable parent levels
- Dynamic generation based on route
- Integration with page titles

## Responsive Design

### Breakpoint Strategy
- **Mobile (xs-sm)**: Single column, drawer navigation
- **Tablet (md)**: Sidebar toggles, optimized spacing
- **Desktop (lg-xl)**: Full layout with persistent sidebar

### Layout Behavior
```typescript
// Responsive layout hook example
const useResponsiveLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  return {
    isMobile,
    isTablet,
    sidebarVariant: isMobile ? 'temporary' : 'persistent',
    containerMaxWidth: isTablet ? 'md' : 'lg',
  };
};
```

## State Management

### Layout State
- Sidebar open/closed state
- Mobile drawer state
- User preferences (theme, sidebar width)
- Current page context

### Global Layout Context
```typescript
interface LayoutContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  pageTitle: string;
  setPageTitle: (title: string) => void;
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
}
```

## Performance Considerations

### Optimization Strategies
- **Virtualization**: For large navigation menus
- **Memoization**: Prevent unnecessary re-renders
- **Code Splitting**: Lazy load layout components
- **CSS-in-JS Optimization**: Use theme caching

### Bundle Size Management
- Keep layout components lightweight
- Lazy load non-critical layout features
- Optimize icon and image assets

## Accessibility

### WCAG 2.1 Compliance
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels
- **Focus Management**: Logical focus order
- **Color Contrast**: Meet AA contrast ratios

### Implementation
```typescript
// Accessibility features example
<nav role="navigation" aria-label="Main navigation">
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" aria-current={isActive ? 'page' : undefined}>
        Dashboard
      </a>
    </li>
  </ul>
</nav>
```

## Testing Strategy

### Layout Testing
- **Visual Regression**: Screenshot comparison
- **Responsive Testing**: Multiple viewport sizes
- **Accessibility Testing**: Automated a11y checks
- **Integration Testing**: Layout with different page types

### Test Examples
```typescript
describe('MainLayout', () => {
  test('renders with correct navigation for admin role', () => {
    render(
      <MainLayout>
        <div>Test content</div>
      </MainLayout>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
```

## Future Enhancements

- **Theme Switching**: Light/dark mode support
- **Layout Customization**: User-configurable layouts
- **Progressive Web App**: PWA layout considerations
- **Advanced Navigation**: Mega menus, search integration 