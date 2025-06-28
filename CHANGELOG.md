# Changelog

All notable changes to the Solarium Web Portal will be documented in this file.

## [1.1.0] - 2024-02-01

### Added - Lead Bulk Actions & CSV Import/Export

#### 🚀 New Features
- **Bulk Status Updates**: Update up to 50 leads simultaneously with comprehensive validation
- **Bulk Reassignment**: Reassign multiple leads to different Channel Partners in one operation
- **CSV Import**: Import new leads from CSV files with real-time validation and preview
- **CSV Export**: Export leads to CSV format with current filters applied
- **Result Dialogs**: Detailed success/failure reporting for all bulk operations
- **Template Download**: CSV import templates with sample data and field descriptions

#### 🛡️ Security & Validation
- 50-lead maximum per bulk operation for performance optimization
- All-or-nothing CSV import validation (no partial imports)
- Territory-based access control for KAM users
- Admin-only CSV import permissions
- File size validation (10MB maximum)
- Comprehensive input validation for all fields

#### 🎨 User Experience
- Bulk Action Toolbar with conditional visibility
- Real-time selection feedback with limit warnings
- Progressive CSV import wizard with validation preview
- Accessibility compliance (WCAG 2.1 AA) for all new components
- Responsive design for desktop and mobile
- Smart error handling with retry capabilities

#### 🔧 Technical Improvements
- RTK Query endpoints for optimistic updates
- Web Worker support for large CSV parsing
- Territory filtering integration
- Comprehensive test coverage (85%+ for bulk features)
- Performance testing for 600 concurrent users
- SonarQube compliance with no critical issues

#### 📊 API Endpoints
- `PATCH /api/v1/leads/bulk` - Bulk status updates
- `PATCH /api/v1/leads/bulk-reassign` - Bulk reassignment  
- `POST /api/v1/leads/import` - CSV import
- `GET /api/v1/leads/export` - CSV export

#### 📱 Components Added
- `BulkActionToolbar` - Main bulk operations interface
- `BulkStatusDialog` - Status update dialog with validation
- `BulkReassignDialog` - Lead reassignment interface
- `CSVImportDialog` - Multi-step import wizard
- `ResultDialog` - Success/failure reporting
- `useCSVExport` - Export functionality hook

#### 🧪 Testing
- 85%+ code coverage for all bulk operations
- Comprehensive unit tests with jest-axe accessibility testing
- End-to-end Cypress tests for complete user workflows
- MSW mocks for all API scenarios including error cases
- Performance testing under load

#### 📖 Documentation
- Complete user guide (`docs/LEADS_BULK.md`)
- API documentation updates
- JSDoc comments for all public methods
- CSV template examples and validation rules

### Changed
- Lead grid now supports multi-selection with bulk operations
- Enhanced lead filters to work with export functionality
- Updated navigation to include import shortcuts for Admin users

### Fixed
- Territory filtering edge cases in lead access control
- CSV parsing performance for large files
- Form validation consistency across bulk operations

### Dependencies Added
- `formik` v2.4.5 - Form handling for bulk operations
- `yup` v1.3.5 - Schema validation
- CSV parsing toolkit (internal) - File processing utilities

---

## [1.0.0] - 2024-01-15

### Added
- Initial release with core lead management functionality
- User authentication and role-based access control
- Lead creation, editing, and status management
- Quotation generation and management
- Commission tracking
- Document management with Azure Blob Storage
- Territory-based access for KAM users

### Technical Foundation
- React 18 + TypeScript frontend
- Redux Toolkit for state management
- RTK Query for API integration
- Material-UI component library
- Azure cloud deployment
- PostgreSQL database
- Comprehensive testing suite 