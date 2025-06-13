# Components Directory

This directory contains all reusable UI components for the Solarium Web Portal.

## Structure

```
components/
├── ui/           # Basic UI components (buttons, inputs, modals, etc.)
├── layout/       # Layout-specific components (header, sidebar, footer)
├── forms/        # Form-related components (fields, validation, etc.)
├── charts/       # Data visualization components
├── navigation/   # Navigation components (menus, breadcrumbs)
├── feedback/     # User feedback components (alerts, loading, etc.)
└── errors/       # Error handling components
```

## Guidelines

### Component Design Principles
- **Single Responsibility**: Each component should have one clear purpose
- **Composability**: Components should work well together
- **Accessibility**: Follow WCAG 2.1 guidelines
- **Consistency**: Use Material UI theme and design tokens
- **Testability**: Include comprehensive tests for each component

### Naming Conventions
- Use PascalCase for component names: `AppButton`, `FormField`
- Use descriptive, clear names that indicate purpose
- Prefix custom components with 'App' to distinguish from MUI components

### File Structure for Each Component
```
ComponentName/
├── index.ts          # Barrel export
├── ComponentName.tsx # Main component
├── ComponentName.test.tsx # Tests
├── ComponentName.stories.tsx # Storybook stories (if using)
└── types.ts          # Component-specific types
```

### Import/Export Pattern
- Each component folder should have an index.ts for clean imports
- Use named exports for components
- Export types alongside components when needed

### Example Usage
```typescript
// Importing components
import { AppButton, AppModal } from '@/components';
import { FormField } from '@/components/forms';

// Component implementation
export const MyFeature = () => {
  return (
    <AppModal>
      <FormField label="Name" />
      <AppButton variant="contained">Submit</AppButton>
    </AppModal>
  );
};
```

## Component Categories

### UI Components (`ui/`)
Basic building blocks that extend or wrap Material UI components:
- AppButton - Styled button with Solarium theme
- AppModal - Standard modal dialogs
- AppTable - Data tables with filtering/sorting
- AppCard - Content cards with consistent styling
- AppChip - Status indicators and tags

### Layout Components (`layout/`)
Structural components for page layout:
- Header - Application header with navigation
- Sidebar - Navigation sidebar for desktop
- Footer - Application footer
- PageContainer - Standard page wrapper
- ContentArea - Main content container

### Form Components (`forms/`)
Form-related components with validation:
- FormField - Text input with validation
- FormSelect - Dropdown selection
- FormDatePicker - Date selection
- FormFileUpload - File upload with progress
- FormValidation - Validation message display

### Chart Components (`charts/`)
Data visualization components:
- LeadFunnelChart - Sales funnel visualization
- CommissionChart - Commission tracking charts
- PerformanceChart - KAM/CP performance metrics

### Navigation Components (`navigation/`)
Navigation and routing components:
- AppNavigation - Main navigation menu
- Breadcrumbs - Page location indicator
- TabNavigation - Tab-based navigation
- SidebarMenu - Collapsible sidebar menu

### Feedback Components (`feedback/`)
User feedback and status components:
- LoadingSpinner - Loading indicators
- ErrorBoundary - Error handling display
- AlertMessage - Success/error/warning alerts
- ProgressIndicator - Progress bars and steppers

### Error Components (`errors/`)
Error handling and fallback components:
- ErrorBoundary - Catches component errors
- ErrorPage - Generic error page template
- ServerErrorPage - Server error specific page
- GlobalErrorHandler - Application-wide error handling

## Development Workflow

1. **Planning**: Define component requirements and API
2. **Implementation**: Create component with TypeScript
3. **Testing**: Write comprehensive unit tests
4. **Documentation**: Update this README and add JSDoc comments
5. **Integration**: Export from index.ts and test integration

## Testing Strategy

- Unit tests for all components using React Testing Library
- Visual regression tests for UI components
- Accessibility tests using jest-axe
- Integration tests for complex component interactions

## Future Enhancements

- Storybook integration for component documentation
- Visual testing with Chromatic
- Component performance monitoring
- Automated accessibility testing in CI/CD 