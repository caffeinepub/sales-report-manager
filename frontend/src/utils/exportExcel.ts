import { format } from 'date-fns';
import { DailySalesEntry, PurchaseEntry } from '../backend';

function getXLSX(): XLSXStatic {
  return window.XLSX;
}

function formatRupee(amount: number): string {
  return `₹${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function exportDailyExcel(entries: DailySalesEntry[], date: Date) {
  const XLSX = getXLSX();
  const wb = XLSX.utils.book_new();

  const headers = [
    'Salesman',
    'Load No.',
    'Total Bills',
    'Sales Value (₹)',
    'Day Sales (₹)',
    'Stock Value (₹)',
    'Stock Qty',
  ];

  const rows: (string | number)[][] = entries.map((e) => [
    e.salesman,
    e.loadNumber || '-',
    Number(e.totalBills),
    formatRupee(e.salesValue),
    formatRupee(e.daySales),
    formatRupee(e.stockValue),
    Number(e.stockQty),
  ]);

  const totals = entries.reduce(
    (acc, e) => ({
      bills: acc.bills + Number(e.totalBills),
      sales: acc.sales + e.salesValue,
      daySales: acc.daySales + e.daySales,
      stockValue: acc.stockValue + e.stockValue,
      stockQty: acc.stockQty + Number(e.stockQty),
    }),
    { bills: 0, sales: 0, daySales: 0, stockValue: 0, stockQty: 0 }
  );

  rows.push([
    'TOTAL',
    '',
    totals.bills,
    formatRupee(totals.sales),
    formatRupee(totals.daySales),
    formatRupee(totals.stockValue),
    totals.stockQty,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([
    [`Daily Sales Report - ${format(date, 'EEEE, dd MMMM yyyy')}`],
    [],
    headers,
    ...rows,
  ]);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');
  XLSX.writeFile(wb, `Daily_Report_${format(date, 'yyyy-MM-dd')}.xlsx`);
}

export function exportWeeklyExcel(entries: DailySalesEntry[], weekStart: Date, weekEnd: Date) {
  const XLSX = getXLSX();
  const wb = XLSX.utils.book_new();

  const headers = [
    'Salesman',
    'Date',
    'Day',
    'Load No.',
    'Total Bills',
    'Sales Value (₹)',
    'Day Sales (₹)',
    'Stock Value (₹)',
    'Stock Qty',
  ];

  const rows: (string | number)[][] = entries.map((e) => {
    const d = new Date(e.date);
    return [
      e.salesman,
      format(d, 'dd/MM/yyyy'),
      format(d, 'EEEE'),
      e.loadNumber || '-',
      Number(e.totalBills),
      formatRupee(e.salesValue),
      formatRupee(e.daySales),
      formatRupee(e.stockValue),
      Number(e.stockQty),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [
      `Weekly Sales Report - ${format(weekStart, 'dd/MM/yyyy')} to ${format(weekEnd, 'dd/MM/yyyy')}`,
    ],
    [],
    headers,
    ...rows,
  ]);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Weekly Report');
  XLSX.writeFile(wb, `Weekly_Report_${format(weekStart, 'yyyy-MM-dd')}.xlsx`);
}

export function exportMonthlyExcel(
  aggregated: Array<{
    salesman: string;
    totalBills: number;
    totalSalesValue: number;
    totalDaysWorked: number;
    avgDailySales: number;
  }>,
  month: number,
  year: number
) {
  const XLSX = getXLSX();
  const wb = XLSX.utils.book_new();
  const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy');

  const headers = [
    'Salesman',
    'Total Bills',
    'Total Sales Value (₹)',
    'Days Worked',
    'Avg Daily Sales (₹)',
  ];

  const rows: (string | number)[][] = aggregated.map((row) => [
    row.salesman,
    row.totalBills,
    formatRupee(row.totalSalesValue),
    row.totalDaysWorked,
    formatRupee(row.avgDailySales),
  ]);

  const grandBills = aggregated.reduce((s, r) => s + r.totalBills, 0);
  const grandSales = aggregated.reduce((s, r) => s + r.totalSalesValue, 0);
  const grandDays = aggregated.reduce((s, r) => s + r.totalDaysWorked, 0);
  rows.push([
    'GRAND TOTAL',
    grandBills,
    formatRupee(grandSales),
    grandDays,
    formatRupee(grandDays > 0 ? grandSales / grandDays : 0),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([
    [`Monthly Sales Report - ${monthName}`],
    [],
    headers,
    ...rows,
  ]);

  ws['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 22 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
  XLSX.writeFile(wb, `Monthly_Report_${format(new Date(year, month - 1, 1), 'yyyy-MM')}.xlsx`);
}

export function exportStockExcel(purchases: PurchaseEntry[]) {
  const XLSX = getXLSX();
  const wb = XLSX.utils.book_new();

  const headers = [
    'Product Name',
    'Purchase Date',
    'Quantity',
    'Purchase Rate (₹)',
    'Total Purchase Value (₹)',
  ];

  const rows: (string | number)[][] = purchases.map((p) => [
    p.productName,
    format(new Date(p.purchaseDate), 'dd/MM/yyyy'),
    Number(p.quantity),
    formatRupee(p.purchaseRate),
    formatRupee(p.totalPurchaseValue),
  ]);

  const grandTotal = purchases.reduce((s, p) => s + p.totalPurchaseValue, 0);
  rows.push(['TOTAL', '', '', '', formatRupee(grandTotal)]);

  const ws = XLSX.utils.aoa_to_sheet([
    [`Stock & Purchase Report - As of ${format(new Date(), 'dd/MM/yyyy')}`],
    [],
    headers,
    ...rows,
  ]);

  ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 22 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Stock Report');
  XLSX.writeFile(wb, `Stock_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
