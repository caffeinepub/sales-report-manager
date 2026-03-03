# Specification

## Summary
**Goal:** Build a full-featured Sales Report Manager ERP web application with a Motoko backend for storing daily sales, weekly/monthly reports, and purchase/stock records, plus a professional desktop ERP frontend.

**Planned changes:**

### Backend (Motoko)
- Actor with stable storage for daily sales entries keyed by date + salesman, exposing `saveDailyEntry`, `getDailyEntry`, `getEntriesByWeek`, `getEntriesByMonth`
- Each daily entry holds: loadNumber, totalBills, salesValue, daySales, stockValue, stockQty
- Purchase/stock records with: productName, purchaseDate, quantity, purchaseRate, totalPurchaseValue; exposing `addPurchase`, `getPurchases`, `getAllPurchases`

### Frontend Layout & Navigation
- Fixed dark left sidebar (navy blue #1e3a5f) with 5 sections: Dashboard (Daily), Weekly Report, Monthly Report, Purchase & Stock, Export Reports
- Active section highlighted; main content area to the right

### Dashboard / Daily Report View
- Hardcoded beat schedule for 6 salesmen (SURAJ, MUNNA, CHANDRADEEP, SANTOSH, SAGAR, SUHAS) auto-populated based on current day of week
- Date picker to view/edit any day; Beat column is read-only and auto-filled
- Editable columns: Load Number, Total Bills, Total Sales Value ₹, Day Sales, Stock Value ₹, Stock Qty; calculated Total Sales column
- Summary row with column totals; "Save Daily Data" button persisting to backend + localStorage
- Sunday shows "Weekly Off" message instead of the table

### Weekly Report View
- Week picker (Mon–Sat) using date-fns; table showing all 6 salesmen × 6 days
- Per-salesman subtotal rows and grand total row; all monetary values with ₹ symbol

### Monthly Report View
- Month + year selector; one aggregated row per salesman: Total Bills, Total Sales Value ₹, Total Days Worked, Average Daily Sales
- Grand totals row at the bottom; calculations using date-fns

### Purchase & Stock View
- Add purchase form: Product Name, Purchase Date, Quantity, Purchase Rate ₹, auto-calculated Total Purchase Value (Qty × Rate)
- Current stock table: Product, Opening Stock, Purchased, Sold, Closing Stock, Stock Value ₹
- Stock history log sorted by date descending

### Export Reports View
- Daily, Weekly, Monthly, and Stock report exports to PDF (jsPDF + jsPDF-autotable) and Excel (SheetJS xlsx)
- PDF: professional company-style header, formatted table, page number footer
- Excel: .xlsx format with formatted column headers; all monetary values with ₹

### Sample Data Seeding
- On first load (no existing data), pre-populate realistic entries for past 2 weeks for all 6 salesmen and 3–5 purchase records; does not overwrite user data on subsequent loads

### Form Validation
- Daily entry: Load Number non-empty, bills/qty non-negative integers, monetary fields non-negative numbers
- Purchase form: all fields required, quantity and rate must be positive
- Inline error messages; Save/Add button disabled until form is valid

### Visual Theme
- Navy blue sidebar, white main content, light gray (#f1f5f9) table row backgrounds, alternating row shading, sticky table headers
- All monetary values formatted with ₹ and Indian number formatting (e.g., ₹1,23,456.00)
- Navy/teal accent action buttons; app logo in header

**User-visible outcome:** Users can log and view daily sales data per salesman with auto-filled beat schedules, browse weekly and monthly aggregated reports, manage purchase/stock records, and export any report to PDF or Excel — all within a professional desktop ERP interface persisted via localStorage and a Motoko backend.
