# Types Directory

This directory contains all TypeScript type definitions for the Solarium Web Portal, providing type safety and development experience improvements.

## Structure

```
types/
├── api/              # API request/response types
├── components/       # Component prop types
├── forms/           # Form and validation types
├── user/            # User and authentication types
├── lead/            # Lead management types
├── quotation/       # Quotation types
├── commission/      # Commission types
├── common/          # Shared/common types
└── utils/           # Utility types
```

## Guidelines

### Type Definition Principles
- **Explicit Types**: Prefer explicit types over inference when clarity is important
- **Reusability**: Create reusable types for common patterns
- **Documentation**: Include JSDoc comments for complex types
- **Consistency**: Follow consistent naming conventions
- **Strict Typing**: Avoid `any` type unless absolutely necessary

### Common Type Patterns
```typescript
// API Response Pattern
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

// Paginated Response Pattern
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Form State Pattern
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}
```

## Type Categories

### API Types (`api/`)
Request and response type definitions:

```typescript
// api/common.ts
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
  errors?: ApiError[];
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

### User Types (`user/`)
User and authentication related types:

```typescript
// user/types.ts
export type UserRole = 'admin' | 'kam' | 'cp' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
  territories?: string[];
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  department?: string;
  jobTitle?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expiresAt: string;
  refreshToken?: string;
}
```

### Lead Types (`lead/`)
Lead management type definitions:

```typescript
// lead/types.ts
export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'on_hold';

export interface Lead {
  id: string;
  leadNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: LeadStatus;
  source: LeadSource;
  assignedTo?: string;
  territory: string;
  estimatedValue?: number;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  activities: LeadActivity[];
  documents: LeadDocument[];
}

export interface LeadActivity {
  id: string;
  type: LeadActivityType;
  description: string;
  performedBy: string;
  performedAt: string;
  metadata?: Record<string, any>;
}

export type LeadActivityType =
  | 'created'
  | 'contacted'
  | 'email_sent'
  | 'meeting_scheduled'
  | 'status_changed'
  | 'note_added'
  | 'document_uploaded';

export type LeadSource =
  | 'website'
  | 'referral'
  | 'cold_call'
  | 'social_media'
  | 'advertisement'
  | 'trade_show'
  | 'partner';
```

### Form Types (`forms/`)
Form and validation type definitions:

```typescript
// forms/types.ts
export interface FormField<T = any> {
  name: keyof T;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  defaultValue?: any;
}

export type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'file';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
}

export type ValidationType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'phone'
  | 'custom';

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}
```

### Component Types (`components/`)
Component prop and state type definitions:

```typescript
// components/types.ts
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  error?: Error | string;
  errorInfo?: any;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  selection?: SelectionConfig<T>;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
}
```

### Common Types (`common/`)
Shared utility and common type definitions:

```typescript
// common/types.ts
export type ID = string | number;

export interface Timestamp {
  createdAt: string;
  updatedAt: string;
}

export interface SoftDelete {
  deletedAt?: string;
  isDeleted?: boolean;
}

export type Status = 'active' | 'inactive' | 'pending' | 'archived';

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface Contact {
  name: string;
  email: string;
  phone: string;
  title?: string;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
```

### Utility Types (`utils/`)
TypeScript utility and helper types:

```typescript
// utils/types.ts
// Make all properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Extract keys of a certain type
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Create a type with only specified keys
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Create a type without specified keys
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Function type helpers
export type AsyncFunction<T extends any[] = any[], R = any> = (...args: T) => Promise<R>;
export type EventHandler<T = any> = (event: T) => void;
export type ValueOf<T> = T[keyof T];

// Array element type
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

// Promise result type
export type Awaited<T> = T extends Promise<infer U> ? U : T;
```

## Type Organization Best Practices

### File Naming
- Use kebab-case for file names: `user-types.ts`
- Use descriptive names that indicate the domain
- Group related types in the same file

### Export Strategy
```typescript
// Export individual types
export interface User { ... }
export type UserRole = ...;

// Export type collections
export namespace UserTypes {
  export interface User { ... }
  export type Role = ...;
  export interface Profile { ... }
}

// Re-export from index files
export * from './user-types';
export * from './lead-types';
```

### Documentation
```typescript
/**
 * Represents a user in the Solarium system
 * @interface User
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  
  /** User's email address (must be unique) */
  email: string;
  
  /** User's role in the system */
  role: UserRole;
  
  /** Whether the user account is active */
  isActive: boolean;
}
```

## Testing Types

### Type Testing Utilities
```typescript
// utils/type-testing.ts
export type Expect<T extends true> = T;
export type Equal<X, Y> = 
  (<T>() => T extends X ? 1 : 2) extends 
  (<T>() => T extends Y ? 1 : 2) ? true : false;

// Usage in tests
type TestUserType = Expect<Equal<User['role'], UserRole>>;
```

This comprehensive type system provides strong typing throughout the Solarium Web Portal, improving developer experience and reducing runtime errors. 