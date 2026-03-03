import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from 'date-fns';
import { FileText, FileSpreadsheet, RefreshCw, AlertCircle, Download } from 'lucide-react';
import { DailySalesEntry } from '../backend';
import { SALESMEN } from '../utils/beatSchedule';
import {
  useGetDailyEntries,
  useGetWeeklyEntries,
  useGetMonthlyEntries,
  useGetAllPurchases,
} from '../hooks/useQueries';
import {
  exportDailyPDF,
  exportWeeklyPDF,
  exportMonthlyPDF,
  exportStockPDF,
} from '../utils/exportPDF';
import {
  exportDailyExcel,
  exportWeeklyExcel,
  exportMonthlyExcel,
  exportStockExcel,
} from '../utils/exportExcel';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'stock';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function aggregateMonthlyData(entries: DailySalesEntry[]) {
  return SALESMEN.map((salesman) => {
    const salesmanEntries = entries.filter((e) => e.salesman === salesman);
    const uniqueDates = new Set(salesmanEntries.map((e) => e.date));
    const totalBills = salesmanEntries.reduce((s, e) => s + Number(e.totalBills), 0);
    const totalSalesValue = salesmanEntries.reduce((s, e) => s + e.salesValue, 0);
    const totalDaysWorked = uniqueDates.size;
    const avgDailySales = totalDaysWorked > 0 ? totalSalesValue / totalDaysWorked : 0;
    return { salesman, totalBills, totalSalesValue, totalDaysWorked, avgDailySales };
  });
}

interface ExportCardProps {
  title: string;
  description: string;
  onExportPDF: () => void;
  onExportExcel: () => void;
  isExporting: boolean;
  disabled?: boolean;
}

function ExportCard({
  title,
  description,
  onExportPDF,
  onExportExcel,
  isExporting,
  disabled,
}: ExportCardProps) {
  return (
    <div className="card-erp p-5">
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'oklch(0.22 0.07 240)' }}
        >
          <Download size={18} color="white" />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'oklch(0.22 0.07 240)' }}>
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onExportPDF}
          disabled={isExporting || disabled}
          className="btn-primary flex-1 justify-center text-xs py-2"
        >
          {isExporting ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <FileText size={13} />
          )}
          Export PDF
        </button>
        <button
          onClick={onExportExcel}
          disabled={isExporting || disabled}
          className="btn-teal flex-1 justify-center text-xs py-2"
        >
          {isExporting ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <FileSpreadsheet size={13} />
          )}
          Export Excel
        </button>
      </div>
    </div>
  );
}

export default function ExportReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDate, setWeekDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

  const { data: dailyEntries = [] } = useGetDailyEntries(selectedDate);
  const { data: weeklyEntries = [] } = useGetWeeklyEntries(weekDate);
  const { data: monthlyEntries = [] } = useGetMonthlyEntries(selectedMonth, selectedYear);
  const { data: purchases = [] } = useGetAllPurchases();

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const withExport = async (fn: () => void) => {
    setIsExporting(true);
    setExportError(null);
    try {
      fn();
    } catch (err) {
      console.error('Export error:', err);
      setExportError(
        'Export failed. Please ensure the page has fully loaded and try again.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const monthlyAggregated = aggregateMonthlyData(monthlyEntries);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Export Reports</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Download reports in PDF or Excel format
          </p>
        </div>
      </div>

      {exportError && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle size={16} />
          {exportError}
        </div>
      )}

      {/* Report Type Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg border border-border bg-muted w-fit">
        {(['daily', 'weekly', 'monthly', 'stock'] as ReportType[]).map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              reportType === type
                ? 'bg-card shadow-xs text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {type === 'stock' ? 'Stock' : `${type.charAt(0).toUpperCase() + type.slice(1)} Report`}
          </button>
        ))}
      </div>

      {/* Date Selectors */}
      <div className="card-erp p-4 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Select Period
        </h3>

        {reportType === 'daily' && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Date:</label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
              className="erp-input"
              style={{ width: '160px' }}
            />
            <span className="text-sm text-muted-foreground">
              {format(selectedDate, 'EEEE, dd MMMM yyyy')}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              ({dailyEntries.length} entries loaded)
            </span>
          </div>
        )}

        {reportType === 'weekly' && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Any date in week:</label>
            <input
              type="date"
              value={format(weekDate, 'yyyy-MM-dd')}
              onChange={(e) => setWeekDate(new Date(e.target.value + 'T00:00:00'))}
              className="erp-input"
              style={{ width: '160px' }}
            />
            <span className="text-sm text-muted-foreground">
              Week: {format(weekStart, 'dd MMM')} – {format(weekEnd, 'dd MMM yyyy')}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              ({weeklyEntries.length} entries loaded)
            </span>
          </div>
        )}

        {reportType === 'monthly' && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="erp-input"
              style={{ width: '140px' }}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <label className="text-sm font-medium">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="erp-input"
              style={{ width: '100px' }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground ml-2">
              ({monthlyEntries.length} entries loaded)
            </span>
          </div>
        )}

        {reportType === 'stock' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet size={16} />
            All purchase records will be exported ({purchases.length} records)
          </div>
        )}
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-2 gap-4">
        {reportType === 'daily' && (
          <ExportCard
            title="Daily Sales Report"
            description={`Export data for ${format(selectedDate, 'dd MMMM yyyy')}`}
            isExporting={isExporting}
            onExportPDF={() => withExport(() => exportDailyPDF(dailyEntries, selectedDate))}
            onExportExcel={() => withExport(() => exportDailyExcel(dailyEntries, selectedDate))}
          />
        )}

        {reportType === 'weekly' && (
          <ExportCard
            title="Weekly Sales Report"
            description={`Week of ${format(weekStart, 'dd MMM')} – ${format(weekEnd, 'dd MMM yyyy')}`}
            isExporting={isExporting}
            onExportPDF={() =>
              withExport(() => exportWeeklyPDF(weeklyEntries, weekStart, weekEnd))
            }
            onExportExcel={() =>
              withExport(() => exportWeeklyExcel(weeklyEntries, weekStart, weekEnd))
            }
          />
        )}

        {reportType === 'monthly' && (
          <ExportCard
            title="Monthly Sales Report"
            description={`${MONTHS[selectedMonth - 1]} ${selectedYear} — All salesman aggregated`}
            isExporting={isExporting}
            onExportPDF={() =>
              withExport(() => exportMonthlyPDF(monthlyAggregated, selectedMonth, selectedYear))
            }
            onExportExcel={() =>
              withExport(() =>
                exportMonthlyExcel(monthlyAggregated, selectedMonth, selectedYear)
              )
            }
          />
        )}

        {reportType === 'stock' && (
          <ExportCard
            title="Stock & Purchase Report"
            description={`All ${purchases.length} purchase records`}
            isExporting={isExporting}
            onExportPDF={() => withExport(() => exportStockPDF(purchases))}
            onExportExcel={() => withExport(() => exportStockExcel(purchases))}
          />
        )}

        {/* Info card */}
        <div className="card-erp p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'oklch(0.22 0.07 240)' }}>
              Export Information
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <FileText size={12} style={{ color: 'oklch(0.22 0.07 240)' }} />
                PDF exports include company header, formatted tables, and page numbers
              </li>
              <li className="flex items-center gap-2">
                <FileSpreadsheet size={12} style={{ color: 'oklch(0.55 0.18 200)' }} />
                Excel exports use .xlsx format with formatted column headers
              </li>
              <li className="flex items-center gap-2">
                <Download size={12} style={{ color: 'oklch(0.35 0.12 145)' }} />
                All monetary values are formatted with ₹ symbol (Indian numbering)
              </li>
            </ul>
          </div>
          <div
            className="mt-4 p-3 rounded-md text-xs"
            style={{ backgroundColor: 'oklch(0.96 0.005 240)', color: 'oklch(0.40 0.05 240)' }}
          >
            <strong>Tip:</strong> Make sure to save your daily data before exporting to ensure the
            latest entries are included in the report.
          </div>
        </div>
      </div>

      {/* Quick export all */}
      <div className="mt-6 card-erp p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'oklch(0.22 0.07 240)' }}>
          Quick Export — Current Period
        </h3>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => withExport(() => exportDailyPDF(dailyEntries, selectedDate))}
            disabled={isExporting}
            className="btn-outline text-xs py-1.5"
          >
            <FileText size={13} />
            Today's PDF
          </button>
          <button
            onClick={() => withExport(() => exportDailyExcel(dailyEntries, selectedDate))}
            disabled={isExporting}
            className="btn-outline text-xs py-1.5"
          >
            <FileSpreadsheet size={13} />
            Today's Excel
          </button>
          <button
            onClick={() => withExport(() => exportWeeklyPDF(weeklyEntries, weekStart, weekEnd))}
            disabled={isExporting}
            className="btn-outline text-xs py-1.5"
          >
            <FileText size={13} />
            This Week PDF
          </button>
          <button
            onClick={() =>
              withExport(() => exportWeeklyExcel(weeklyEntries, weekStart, weekEnd))
            }
            disabled={isExporting}
            className="btn-outline text-xs py-1.5"
          >
            <FileSpreadsheet size={13} />
            This Week Excel
          </button>
          <button
            onClick={() => withExport(() => exportStockPDF(purchases))}
            disabled={isExporting}
            className="btn-outline text-xs py-1.5"
          >
            <FileText size={13} />
            Stock PDF
          </button>
          <button
            onClick={() => withExport(() => exportStockExcel(purchases))}
            disabled={isExporting}
            className="btn-outline text-xs py-1.5"
          >
            <FileSpreadsheet size={13} />
            Stock Excel
          </button>
        </div>
      </div>
    </div>
  );
}
