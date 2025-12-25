# FareFlow Data Uploads - Credit Card Transaction Import

Complete frontend implementation for uploading and importing credit card transaction CSV files with automatic cab and driver mapping.

## Features

### ✅ Core Functionality
- **CSV File Upload**: Drag-and-drop or file picker interface
- **Automatic Column Detection**: Smart mapping of CSV columns to database fields
- **Merchant-to-Cab Mapping**: Automatically assigns cab numbers based on merchant2cab table
- **Driver Lookup**: Finds drivers from shift data based on cab, date, and time
- **Data Preview**: Review and edit all transactions before import
- **Inline Editing**: Edit cab number, driver number, and driver name directly in the table
- **Validation**: Real-time validation with clear error messages
- **Duplicate Detection**: Automatically skips duplicate transactions
- **Batch Import**: Import hundreds of transactions at once
- **Import Results**: Detailed summary with success/error reporting

### 📊 Advanced Features
- **Statistics Dashboard**: See total rows, valid rows, cab matches, driver matches
- **Expandable Rows**: View additional transaction details
- **Pagination**: Handle large datasets efficiently
- **Autocomplete**: Easy selection of cabs and drivers during editing
- **Status Indicators**: Color-coded chips showing validation status
- **Multi-step Wizard**: Clear 3-step process (Upload → Review → Results)

## Installation

### 1. Copy Files to Your Project

Extract the zip and copy the `data-uploads` folder to your Next.js app directory:

```
your-project/
├── app/
│   ├── data-uploads/              ← Copy this folder here
│   │   ├── components/
│   │   │   ├── FileUploadStep.js
│   │   │   ├── DataPreviewStep.js
│   │   │   └── ImportResultsStep.js
│   │   └── page.js
│   ├── components/
│   │   └── GlobalNav.js           ← Should already exist
│   └── lib/
│       └── api.js                 ← Should already exist
```

### 2. Add Navigation Link

Add a link to the Data Uploads page in your main navigation (e.g., Dashboard):

```javascript
// In app/page.js or wherever you have your main dashboard
<Button
  variant="contained"
  onClick={() => router.push("/data-uploads")}
  startIcon={<CloudUploadIcon />}
>
  Data Uploads
</Button>
```

### 3. Backend Requirements

Ensure you have the following backend endpoints implemented:

#### Upload & Preview Endpoint
```
POST /api/uploads/credit-card-transactions/preview
Content-Type: multipart/form-data
```
Returns: `CsvUploadPreviewDTO` with parsed data, column mappings, and statistics

#### Import Endpoint
```
POST /api/uploads/credit-card-transactions/import?filename={filename}
Content-Type: application/json
Body: Array of CreditCardTransactionUploadDTO
```
Returns: Import results with success/error counts

#### Supporting Endpoints
```
GET /api/cabs                      - List all cabs for autocomplete
GET /api/drivers                   - List all drivers for autocomplete
```

### 4. Database Requirements

Ensure these tables exist:
- `credit_card_transaction` - Main transaction table
- `merchant2cab` - Merchant to cab mappings
- `shift` - Shift data for driver lookup
- `cab` - Cab information
- `driver` - Driver information

## Usage Guide

### Step 1: Upload CSV File

1. Click "Choose CSV File" or drag and drop a CSV file
2. Supported columns (auto-detected):
   - **Merchant Number** → Merchant ID (required)
   - **Site Number** / **Device Number** → Terminal ID (required)
   - **Authorization Code** → Auth code (required)
   - **Transaction Date** → Date (required)
   - **Transaction Time** → Time (required)
   - **Transaction Amount** → Amount (required)
   - **Settlement Date** → Settlement date
   - **Card Type** → Card type (VISA, MC, etc.)
   - **Cardholder Number** → Last 4 digits extracted
   - **Batch Number** → Batch reference
   - And more...

3. Click "Upload and Preview"

### Step 2: Review & Edit Data

The system automatically:
- ✅ Maps merchant numbers to cab numbers using `merchant2cab` table
- ✅ Looks up drivers from `shift` table based on cab + date + time
- ✅ Validates all required fields
- ✅ Detects potential duplicates
- ✅ Shows status for each row (Valid/Invalid/No Cab/No Driver)

You can:
- 📝 Click edit icon to modify cab number, driver number, or driver name
- 🔍 Click expand icon to see full transaction details
- 👀 Review validation messages for invalid rows
- 📊 See statistics: total rows, valid rows, cab matches, driver matches

### Step 3: Import & View Results

1. Click "Import X Valid Transactions"
2. System imports all valid transactions
3. View detailed results:
   - ✅ Successfully imported count
   - ⚠️ Skipped (duplicates) count
   - ❌ Failed count with error details
4. Download batch ID for reference
5. Navigate to Reports or Dashboard

## Column Mapping Reference

| CSV Column | Database Field | Required | Auto-Mapped |
|------------|---------------|----------|-------------|
| Merchant Number | merchant_id | ✅ | ✅ |
| Site Number | terminal_id | ✅ | ✅ |
| Authorization Code | authorization_code | ✅ | ✅ |
| Transaction Date | transaction_date | ✅ | ✅ |
| Transaction Time | transaction_time | ✅ | ✅ |
| Transaction Amount | amount | ✅ | ✅ |
| Settlement Date | settlement_date | ❌ | ✅ |
| Card Type | card_type | ❌ | ✅ |
| Cardholder Number | card_last_four | ❌ | ✅ (last 4) |
| Batch Number | batch_number | ❌ | ✅ |
| Cab Number | cab_number | ❌ | 🤖 Auto-lookup |
| Driver Number | driver_number | ❌ | 🤖 Auto-lookup |
| Driver Name | driver_name | ❌ | 🤖 Auto-lookup |

## Automatic Lookups

### Cab Number Lookup
```
merchant_id + transaction_date → merchant2cab table → cab_number
```
Finds active merchant-to-cab mapping for the transaction date.

### Driver Lookup
```
cab_number + transaction_date + transaction_time → shift table → driver
```
Finds the driver who was working that shift at that time.

### Driver Name
```
driver_number → driver table → firstName + lastName
```
Concatenates first and last name from driver record.

## Validation Rules

### Required Fields
- Authorization Code
- Merchant Number  
- Terminal ID (Site or Device Number)
- Transaction Date
- Transaction Time
- Amount (must be > 0)

### Optional Validations
- Cab Number must exist in `cab` table (if provided/looked up)
- Driver Number must exist in `driver` table (if provided/looked up)
- Merchant mapping should exist (warning if not)
- Driver shift should exist (warning if not)

### Duplicate Detection
Transactions are considered duplicates if they match on:
- Terminal ID
- Authorization Code
- Amount
- Transaction Date
- Transaction Time

## Error Handling

### Common Errors
1. **"No cab mapping found for merchant XXX"**
   - Create merchant2cab mapping or manually assign cab number

2. **"No active shift found for this cab/time"**
   - Verify shift records exist or manually assign driver

3. **"Authorization code is required"**
   - CSV missing required column

4. **"Unable to parse date/time"**
   - Check date/time format in CSV

5. **"Cab number not found: XXX"**
   - Cab doesn't exist in system

## Performance

- Handles files with **thousands of rows**
- Preview shows first 100 rows by default
- Pagination for efficient browsing
- Batch import processes all rows
- Typical import speed: ~50-100 transactions/second

## Troubleshooting

### CSV Not Uploading
- Ensure file extension is `.csv`
- Check file size (recommended < 10MB)
- Verify CSV is properly formatted

### Columns Not Detected
- Check CSV header row exists
- Verify column names match expected patterns
- Review "Detected Column Mappings" section

### No Cab/Driver Matches
- Verify merchant2cab mappings exist
- Check shift records cover transaction date/time
- Ensure cab and driver records exist

### Import Failures
- Review error messages in Step 3
- Check backend logs for detailed errors
- Verify database constraints

## Support

For issues or questions:
1. Check validation messages in preview
2. Review error details in import results
3. Check browser console for frontend errors
4. Check backend logs for API errors

## Future Enhancements

- [ ] Support for multiple CSV formats
- [ ] Bulk edit operations
- [ ] Import history tracking
- [ ] Export edited data back to CSV
- [ ] Email notifications on import completion
- [ ] Scheduled imports
- [ ] Template CSV download

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Compatible**: Next.js 13+, React 18+, Material-UI 5+
