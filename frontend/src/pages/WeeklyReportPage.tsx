import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getDay, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { DailySalesEntry } from '../backend';
import { SALESMEN, getBeatForDay, SalesmanName } from '../utils/beatSchedule';
import { formatIndianCurrency } from '../utils/formatCurrency';
import { useGetWeeklyEntries } from '../hooks/useQueries';

interface DayEntry {
  date: string;
  dayName: string;
  beat: string;
  loadNumber: string;
  totalBills: number;
  salesValue: number;
  daySales: number;
  stockValue: number;
  stockQty: number;
}

interface SalesmanWeekData {
  salesman: string;
  days: (DayEntry | null)[];
  totals: {
    totalBills: number;
    salesValue: number;
    daySales: number;
    stockValue: number;
    stockQty: number;
  };
}

function buildWeekData(entries: DailySalesEntry[], weekDays: Date[]): SalesmanWeekData[] {
  return SALESMEN.map((salesman) => {
    const days: (DayEntry | null)[] = weekDays.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day);
      const entry = entries.find((e) => e.salesman === salesman && e.date === dateStr);

      if (!entry) {
        return {
          date: dateStr,
          dayName: format(day, 'EEE'),
          beat: getBeatForDay(salesman as SalesmanName, dayOfWeek),
          loadNumber: '-',
          totalBills: 0,
          salesValue: 0,
          daySales: 0,
          stockValue: 0,
          stockQty: 0,
        };
      }

      return {
        date: dateStr,
        dayName: format(day, 'EEE'),
        beat: getBeatForDay(salesman as SalesmanName, dayOfWeek),
        loadNumber: entry.loadNumber || '-',
        totalBills: Number(entry.totalBills),
        salesValue: entry.salesValue,
        daySales: entry.daySales,
        stockValue: entry.stockValue,
        stockQty: Number(entry.stockQty),
      };
    });

    const totals = days.reduce(
      (acc, day) => ({
        totalBills: acc.totalBills + (day?.totalBills || 0),
        salesValue: acc.salesValue + (day?.salesValue || 0),
        daySales: acc.daySales + (day?.daySales || 0),
        stockValue: acc.stockValue + (day?.stockValue || 0),
        stockQty: acc.stockQty + (day?.stockQty || 0),
      }),
      { totalBills: 0, salesValue: 0, daySales: 0, stockValue: 0, stockQty: 0 }
    );

    return { salesman, days, totals };
  });
}

export default function WeeklyReportPage() {
  const [weekDate, setWeekDate] = useState<Date>(new Date());

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(
    (d) => getDay(d) !== 0
  ); // Mon-Sat

  const { data: entries = [], isLoading } = useGetWeeklyEntries(weekDate);
  const weekData = buildWeekData(entries, weekDays);

  const grandTotals = weekData.reduce(
    (acc, sm) => ({
      totalBills: acc.totalBills + sm.totals.totalBills,
      salesValue: acc.salesValue + sm.totals.salesValue,
      daySales: acc.daySales + sm.totals.daySales,
      stockValue: acc.stockValue + sm.totals.stockValue,
      stockQty: acc.stockQty + sm.totals.stockQty,
    }),
    { totalBills: 0, salesValue: 0, daySales: 0, stockValue: 0, stockQty: 0 }
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Weekly Sales Report</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            View all salesman data for the selected week
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekDate(subWeeks(weekDate, 1))}
            className="btn-outline p-2"
            title="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-sm font-medium px-3 py-2 rounded-md border border-border bg-card min-w-[200px] text-center">
            {format(weekStart, 'dd MMM')} – {format(weekEnd, 'dd MMM yyyy')}
          </div>
          <button
            onClick={() => setWeekDate(addWeeks(weekDate, 1))}
            className="btn-outline p-2"
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>
          <input
            type="date"
            value={format(weekDate, 'yyyy-MM-dd')}
            onChange={(e) => setWeekDate(new Date(e.target.value + 'T00:00:00'))}
            className="erp-input"
            style={{ width: '150px' }}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <RefreshCw size={14} className="animate-spin" /> Loading weekly data...
        </div>
      )}

      {/* Week header */}
      <div className="mb-4 flex gap-2">
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="flex-1 text-center py-2 rounded-md text-xs font-semibold"
            style={{ backgroundColor: 'oklch(0.22 0.07 240)', color: 'white' }}
          >
            <div>{format(day, 'EEE')}</div>
            <div className="font-normal opacity-80">{format(day, 'dd/MM')}</div>
          </div>
        ))}
      </div>

      {/* Per-salesman tables */}
      <div className="space-y-4">
        {weekData.map((smData) => (
          <div key={smData.salesman} className="card-erp overflow-hidden">
            <div
              className="px-4 py-2 flex items-center justify-between"
              style={{ backgroundColor: 'oklch(0.28 0.07 240)' }}
            >
              <span className="text-sm font-bold text-white">{smData.salesman}</span>
              <span className="text-xs text-white/70">
                Weekly Total: {formatIndianCurrency(smData.totals.salesValue)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Date</th>
                    <th>Beat</th>
                    <th>Load No.</th>
                    <th>Bills</th>
                    <th>Sales Value (₹)</th>
                    <th>Day Sales (₹)</th>
                    <th>Stock Value (₹)</th>
                    <th>Stock Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {smData.days.map((day, idx) => (
                    <tr key={idx}>
                      <td className="font-medium text-xs">{day?.dayName}</td>
                      <td className="text-xs">{day ? format(new Date(day.date), 'dd/MM/yyyy') : '-'}</td>
                      <td className="text-xs" style={{ color: 'oklch(0.40 0.10 200)' }}>{day?.beat}</td>
                      <td className="text-xs">{day?.loadNumber}</td>
                      <td className="mono text-right">{day?.totalBills || 0}</td>
                      <td className="mono text-right">{formatIndianCurrency(day?.salesValue || 0)}</td>
                      <td className="mono text-right">{formatIndianCurrency(day?.daySales || 0)}</td>
                      <td className="mono text-right">{formatIndianCurrency(day?.stockValue || 0)}</td>
                      <td className="mono text-right">{day?.stockQty || 0}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="subtotal-row">
                    <td colSpan={4} className="font-semibold text-xs">Weekly Subtotal</td>
                    <td className="mono text-right font-semibold">{smData.totals.totalBills}</td>
                    <td className="mono text-right font-semibold">{formatIndianCurrency(smData.totals.salesValue)}</td>
                    <td className="mono text-right font-semibold">{formatIndianCurrency(smData.totals.daySales)}</td>
                    <td className="mono text-right font-semibold">{formatIndianCurrency(smData.totals.stockValue)}</td>
                    <td className="mono text-right font-semibold">{smData.totals.stockQty}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}

        {/* Grand Totals */}
        <div className="card-erp overflow-hidden">
          <div
            className="px-4 py-2"
            style={{ backgroundColor: 'oklch(0.55 0.18 200)' }}
          >
            <span className="text-sm font-bold text-white">GRAND TOTALS — All Salesman</span>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Salesman</th>
                  <th>Total Bills</th>
                  <th>Total Sales Value (₹)</th>
                  <th>Total Day Sales (₹)</th>
                  <th>Total Stock Value (₹)</th>
                  <th>Total Stock Qty</th>
                </tr>
              </thead>
              <tbody>
                {weekData.map((sm) => (
                  <tr key={sm.salesman}>
                    <td className="font-semibold text-xs">{sm.salesman}</td>
                    <td className="mono text-right">{sm.totals.totalBills}</td>
                    <td className="mono text-right">{formatIndianCurrency(sm.totals.salesValue)}</td>
                    <td className="mono text-right">{formatIndianCurrency(sm.totals.daySales)}</td>
                    <td className="mono text-right">{formatIndianCurrency(sm.totals.stockValue)}</td>
                    <td className="mono text-right">{sm.totals.stockQty}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td className="font-bold text-xs uppercase">Grand Total</td>
                  <td className="mono text-right font-bold">{grandTotals.totalBills}</td>
                  <td className="mono text-right font-bold">{formatIndianCurrency(grandTotals.salesValue)}</td>
                  <td className="mono text-right font-bold">{formatIndianCurrency(grandTotals.daySales)}</td>
                  <td className="mono text-right font-bold">{formatIndianCurrency(grandTotals.stockValue)}</td>
                  <td className="mono text-right font-bold">{grandTotals.stockQty}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
