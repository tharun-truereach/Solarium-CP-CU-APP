# Lead Bulk Actions & CSV Import/Export User Guide

## Overview

The Lead Bulk Actions feature allows administrators and KAMs to efficiently manage multiple leads simultaneously through:

- **Bulk Status Updates**: Update status of up to 50 leads at once
- **Bulk Reassignment**: Reassign multiple leads to different Channel Partners
- **CSV Import**: Import new leads from CSV files (max 50 rows)
- **CSV Export**: Export leads to CSV with current filter applied

## Key Limitations

### 50-Lead Limit
All bulk operations are limited to **50 leads maximum** per operation to ensure system performance and prevent timeouts.

### All-or-Nothing Import Rule
CSV imports follow an **all-or-nothing validation approach**:
- If ANY row fails validation, NO leads are imported
- All data must be valid before the import can proceed
- Partial imports are not supported

## CSV Import Guide

### Required Columns
The following columns must be present and contain valid data:
- `customerName` - Customer's full name
- `customerPhone` - Valid Indian mobile number (10 digits)
- `address` - Complete address
- `state` - State name
- `pinCode` - 6-digit PIN code

### Optional Columns
- `customerEmail` - Valid email address
- `services` - Comma-separated service list
- `requirements` - Detailed requirements
- `assignedTo` - Channel Partner ID
- `source` - Lead source (website, referral, etc.)
- `followUpDate` - Date in YYYY-MM-DD format
- `remarks` - Additional notes

### Sample CSV Format

```csv
customerName,customerPhone,customerEmail,address,state,pinCode,services,requirements
John Doe,9876543210,john@example.com,123 Main St Mumbai,Maharashtra,400001,Solar Panel Installation,5kW residential system
Jane Smith,9876543211,jane@example.com,456 Park Ave Delhi,Delhi,110001,Solar Water Heater,Home installation
```

### Validation Rules

1. **Phone Number**: Must be valid Indian mobile (10 digits, starting with 6/7/8/9)
2. **Email**: Must be valid email format (if provided)
3. **PIN Code**: Must be exactly 6 digits
4. **Follow-up Date**: Must be in YYYY-MM-DD format (if provided)
5. **All required fields**: Cannot be empty or contain only whitespace

## Step-by-Step Usage

### Bulk Status Update

1. Navigate to **Leads Management** page
2. Select leads using checkboxes (max 50)
3. Click **"Update Status"** in the bulk action toolbar
4. Choose new status from dropdown
5. Enter remarks (minimum 10 characters)
6. Fill additional required fields based on status
7. Click **"Update X Leads"** to confirm
8. Review results in the confirmation dialog

### Bulk Reassignment

1. Select leads using checkboxes (max 50)
2. Click **"Reassign"** in the bulk action toolbar
3. Choose Channel Partner from dropdown
4. Enter reason for reassignment (minimum 10 characters)
5. Click **"Reassign X Leads"** to confirm
6. Review results in the confirmation dialog

### CSV Import

1. Click **"Import CSV"** button (Admin only)
2. Download the template if needed
3. Upload your CSV file (max 10MB, 50 rows)
4. Review the data preview and validation results
5. Fix any validation errors in your CSV
6. Click **"Import X Leads"** when all data is valid
7. Review import results

### CSV Export

1. Apply desired filters to the leads list
2. Click **"Export CSV"** button
3. File will download automatically with current timestamp
4. Export reflects all currently applied filters

## Error Handling

### Common Validation Errors

- **"Invalid phone format"**: Use 10-digit Indian mobile numbers
- **"PIN code must be exactly 6 digits"**: Check PIN code format
- **"Invalid email format"**: Ensure proper email structure
- **"Required field cannot be empty"**: Fill all mandatory columns

### Import Errors

- **"CSV contains X rows, but maximum allowed is 50"**: Reduce file size
- **"Validation failed"**: Fix all validation errors before importing
- **"File too large"**: Keep files under 10MB

### Bulk Operation Errors

- **"Selection limit exceeded"**: Select maximum 50 leads
- **"Insufficient permissions"**: Contact administrator
- **"Lead is in terminal status"**: Cannot modify executed/closed leads

## Best Practices

### CSV Import
1. Always download and use the provided template
2. Validate data in Excel/Google Sheets before upload
3. Keep phone numbers in text format to preserve leading zeros
4. Use consistent date format (YYYY-MM-DD)
5. Test with small batches first (5-10 rows)

### Bulk Operations
1. Use filters to narrow down lead selection
2. Always provide meaningful remarks for status changes
3. Review selection before confirming bulk actions
4. Check results dialog for any partial failures

### Data Management
1. Export leads regularly for backup
2. Use consistent naming for CSV files
3. Keep import files under 10MB
4. Validate phone numbers before import

## Troubleshooting

### Import Issues
- **File won't upload**: Check file size (max 10MB) and format (.csv)
- **Validation errors**: Fix data in source file and re-upload
- **Import failed**: Check network connection and try again

### Bulk Operations
- **Buttons disabled**: Check selection count (max 50)
- **Operation failed**: Review error message and retry
- **Partial success**: Failed items remain selected for retry

### Export Issues
- **No download**: Check browser popup blocker
- **Empty file**: Verify applied filters don't exclude all leads
- **Large exports**: Use filters to reduce data size

## Technical Support

If you encounter issues not covered in this guide:

1. Check the browser console for error details
2. Verify your user permissions (Admin/KAM)
3. Try refreshing the page and retrying
4. Contact technical support with error screenshots

## Feature Updates

This feature is part of Sprint 13 Task 2 and includes:
- Version: 1.0.0
- Last Updated: 2024-02-01
- Compatibility: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+) 