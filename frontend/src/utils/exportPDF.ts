import { format } from 'date-fns';
import { DailySalesEntry, PurchaseEntry } from '../backend';
import { formatIndianCurrency } from './formatCurrency';

const COMPANY_NAME = 'Sales Report Manager';
const NAVY: [number, number, number] = [30, 58, 95];
const TEAL: [number, number, number] = [0, 128, 160];
const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT_GRAY: [number, number, number] = [241, 245, 249];

function getJsPDF() {
  const { jsPDF } = window.jspdf;
  return jsPDF;
}

function addHeader(doc: jspdf.jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, doc.internal.pageSize.width, 28, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 20);
  doc.setFontSize(9);
  doc.text(subtitle, doc.internal.pageSize.width - 14, 20, { align: 'right' });
  doc.setFontSize(8);
  doc.text(
    `Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
    doc.internal.pageSize.width - 14,
    12,
    { align: 'right' }
  );
}

function addFooter(doc: jspdf.jsPDF) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    doc.text(COMPANY_NAME, 14, pageHeight - 8);
    doc.text(
      format(new Date(), 'dd/MM/yyyy'),
      doc.internal.pageSize.width - 14,
      pageHeight - 8,
      { align: 'right' }
    );
  }
}

export function exportDailyPDF(entries: DailySalesEntry[], date: Date) {
  const JsPDF = getJsPDF();
  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const dateStr = format(date, 'EEEE, dd MMMM yyyy');

  addHeader(doc, 'Daily Sales Report', dateStr);

  const head = [
    ['Salesman', 'Load No.', 'Total Bills', 'Sales Value (₹)', 'Day Sales (₹)', 'Stock Value (₹)', 'Stock Qty'],
  ];

  let totalBills = 0,
    totalSales = 0,
    totalDaySales = 0,
    totalStockValue = 0,
    totalStockQty = 0;

  const body: (string | number)[][] = entries.map((e) => {
    const bills = Number(e.totalBills);
    totalBills += bills;
    totalSales += e.salesValue;
    totalDaySales += e.daySales;
    totalStockValue += e.stockValue;
    totalStockQty += Number(e.stockQty);
    return [
      e.salesman,
      e.loadNumber || '-',
      bills,
      formatIndianCurrency(e.salesValue),
      formatIndianCurrency(e.daySales),
      formatIndianCurrency(e.stockValue),
      Number(e.stockQty),
    ];
  });

  body.push([
    'TOTAL',
    '',
    totalBills,
    formatIndianCurrency(totalSales),
    formatIndianCurrency(totalDaySales),
    formatIndianCurrency(totalStockValue),
    totalStockQty,
  ]);

  doc.autoTable({
    head,
    body,
    startY: 32,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1) {
        data.cell.styles['fillColor'] = TEAL;
        data.cell.styles['textColor'] = WHITE;
        data.cell.styles['fontStyle'] = 'bold';
      }
    },
    margin: { top: 32, bottom: 16 },
  });

  addFooter(doc);
  doc.save(`Daily_Report_${format(date, 'yyyy-MM-dd')}.pdf`);
}

export function exportWeeklyPDF(entries: DailySalesEntry[], weekStart: Date, weekEnd: Date) {
  const JsPDF = getJsPDF();
  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const period = `${format(weekStart, 'dd/MM/yyyy')} - ${format(weekEnd, 'dd/MM/yyyy')}`;

  addHeader(doc, 'Weekly Sales Report', period);

  const head = [
    ['Salesman', 'Date', 'Load No.', 'Total Bills', 'Sales Value (₹)', 'Day Sales (₹)', 'Stock Value (₹)', 'Stock Qty'],
  ];

  const body: (string | number)[][] = entries.map((e) => [
    e.salesman,
    format(new Date(e.date), 'dd/MM/yyyy (EEE)'),
    e.loadNumber || '-',
    Number(e.totalBills),
    formatIndianCurrency(e.salesValue),
    formatIndianCurrency(e.daySales),
    formatIndianCurrency(e.stockValue),
    Number(e.stockQty),
  ]);

  doc.autoTable({
    head,
    body,
    startY: 32,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { top: 32, bottom: 16 },
  });

  addFooter(doc);
  doc.save(`Weekly_Report_${format(weekStart, 'yyyy-MM-dd')}.pdf`);
}

export function exportMonthlyPDF(
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
  const JsPDF = getJsPDF();
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy');

  addHeader(doc, 'Monthly Sales Report', monthName);

  const head = [['Salesman', 'Total Bills', 'Total Sales Value (₹)', 'Days Worked', 'Avg Daily Sales (₹)']];

  let grandBills = 0,
    grandSales = 0,
    grandDays = 0;

  const body: (string | number)[][] = aggregated.map((row) => {
    grandBills += row.totalBills;
    grandSales += row.totalSalesValue;
    grandDays += row.totalDaysWorked;
    return [
      row.salesman,
      row.totalBills,
      formatIndianCurrency(row.totalSalesValue),
      row.totalDaysWorked,
      formatIndianCurrency(row.avgDailySales),
    ];
  });

  body.push([
    'GRAND TOTAL',
    grandBills,
    formatIndianCurrency(grandSales),
    grandDays,
    formatIndianCurrency(grandDays > 0 ? grandSales / grandDays : 0),
  ]);

  doc.autoTable({
    head,
    body,
    startY: 32,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1) {
        data.cell.styles['fillColor'] = TEAL;
        data.cell.styles['textColor'] = WHITE;
        data.cell.styles['fontStyle'] = 'bold';
      }
    },
    margin: { top: 32, bottom: 16 },
  });

  addFooter(doc);
  doc.save(`Monthly_Report_${format(new Date(year, month - 1, 1), 'yyyy-MM')}.pdf`);
}

export function exportStockPDF(purchases: PurchaseEntry[]) {
  const JsPDF = getJsPDF();
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  addHeader(doc, 'Stock & Purchase Report', `As of ${format(new Date(), 'dd/MM/yyyy')}`);

  const head = [['Product Name', 'Purchase Date', 'Quantity', 'Rate (₹)', 'Total Value (₹)']];

  let grandTotal = 0;
  const body: (string | number)[][] = purchases.map((p) => {
    grandTotal += p.totalPurchaseValue;
    return [
      p.productName,
      format(new Date(p.purchaseDate), 'dd/MM/yyyy'),
      Number(p.quantity),
      formatIndianCurrency(p.purchaseRate),
      formatIndianCurrency(p.totalPurchaseValue),
    ];
  });

  body.push(['TOTAL', '', '', '', formatIndianCurrency(grandTotal)]);

  doc.autoTable({
    head,
    body,
    startY: 32,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1) {
        data.cell.styles['fillColor'] = TEAL;
        data.cell.styles['textColor'] = WHITE;
        data.cell.styles['fontStyle'] = 'bold';
      }
    },
    margin: { top: 32, bottom: 16 },
  });

  addFooter(doc);
  doc.save(`Stock_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
