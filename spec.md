# Sales Report Manager

## Current State
- Purchase & Stock Management page allows manual entry of individual purchase records (product name, date, quantity, rate).
- Backend stores PurchaseEntry records and exposes addPurchase / getAllPurchases APIs.
- Stock summary is derived client-side by aggregating all purchase records.

## Requested Changes (Diff)

### Add
- Excel file import feature on the Purchase & Stock page.
- User can upload an `.xlsx` / `.xls` / `.csv` file containing purchased product rows.
- Expected columns: Product Name, Purchase Date, Quantity, Purchase Rate (Total Purchase Value auto-calculated).
- After parsing, a preview table is shown listing the imported rows with validation feedback.
- User confirms import; all valid rows are bulk-saved to the backend via a new `bulkAddPurchases` API.
- Stock summary updates automatically after import.
- Download a sample template Excel file so users know the expected format.

### Modify
- Backend: add `bulkAddPurchases` function that accepts an array of PurchaseEntry and adds them all.
- PurchaseStockPage: add an "Import Excel" button next to the Add Purchase form heading, opens an import dialog.

### Remove
- Nothing removed.

## Implementation Plan
1. Backend: Add `bulkAddPurchases(purchases: [PurchaseEntry]) : async ()` to main.mo.
2. Frontend: Install `xlsx` (SheetJS) npm package for client-side Excel/CSV parsing.
3. Frontend: Create `ExcelImportDialog` component inside PurchaseStockPage:
   - File dropzone / upload button (.xlsx, .xls, .csv).
   - Parse file using SheetJS, map columns to PurchaseEntry fields.
   - Show preview table with row-level validation errors highlighted.
   - "Import X rows" confirm button calls bulkAddPurchases.
   - Success/error feedback, then close dialog and refresh stock.
4. Frontend: Add "Download Template" button that generates and downloads a sample .xlsx with correct headers.
5. Wire `useBulkAddPurchases` React Query mutation to the new backend function.
