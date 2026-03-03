import { format, getDaysInMonth } from "date-fns";
import { RefreshCw } from "lucide-react";
import React, { useState } from "react";
import type { DailySalesEntry } from "../backend";
import { useGetMonthlyEntries } from "../hooks/useQueries";
import { SALESMEN } from "../utils/beatSchedule";
import { formatIndianCurrency } from "../utils/formatCurrency";

interface MonthlyAggregate {
  salesman: string;
  totalBills: number;
  totalSalesValue: number;
  totalDaySales: number;
  totalDaysWorked: number;
  avgDailySales: number;
}

function aggregateMonthlyData(entries: DailySalesEntry[]): MonthlyAggregate[] {
  return SALESMEN.map((salesman) => {
    const salesmanEntries = entries.filter((e) => e.salesman === salesman);
    const uniqueDates = new Set(salesmanEntries.map((e) => e.date));

    const totalBills = salesmanEntries.reduce(
      (s, e) => s + Number(e.totalBills),
      0,
    );
    const totalSalesValue = salesmanEntries.reduce(
      (s, e) => s + e.salesValue,
      0,
    );
    const totalDaySales = salesmanEntries.reduce((s, e) => s + e.daySales, 0);
    const totalDaysWorked = uniqueDates.size;
    const avgDailySales =
      totalDaysWorked > 0 ? totalSalesValue / totalDaysWorked : 0;

    return {
      salesman,
      totalBills,
      totalSalesValue,
      totalDaySales,
      totalDaysWorked,
      avgDailySales,
    };
  });
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MonthlyReportPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: entries = [], isLoading } = useGetMonthlyEntries(
    selectedMonth,
    selectedYear,
  );
  const aggregated = aggregateMonthlyData(entries);

  const grandTotals = aggregated.reduce(
    (acc, row) => ({
      totalBills: acc.totalBills + row.totalBills,
      totalSalesValue: acc.totalSalesValue + row.totalSalesValue,
      totalDaySales: acc.totalDaySales + row.totalDaySales,
      totalDaysWorked: acc.totalDaysWorked + row.totalDaysWorked,
    }),
    { totalBills: 0, totalSalesValue: 0, totalDaySales: 0, totalDaysWorked: 0 },
  );

  const years = Array.from(
    { length: 5 },
    (_, i) => currentDate.getFullYear() - 2 + i,
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Monthly Sales Report</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Aggregated monthly data per salesman
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="month-select" className="text-sm font-medium">
              Month:
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="erp-input"
              style={{ width: "140px" }}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm font-medium">
              Year:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="erp-input"
              style={{ width: "100px" }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <RefreshCw size={14} className="animate-spin" /> Loading monthly
          data...
        </div>
      )}

      {/* Month summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Bills",
            value: grandTotals.totalBills.toString(),
            color: "oklch(0.22 0.07 240)",
          },
          {
            label: "Total Sales Value",
            value: formatIndianCurrency(grandTotals.totalSalesValue),
            color: "oklch(0.35 0.12 145)",
          },
          {
            label: "Total Day Sales",
            value: formatIndianCurrency(grandTotals.totalDaySales),
            color: "oklch(0.55 0.18 200)",
          },
          {
            label: "Working Days (Total)",
            value: grandTotals.totalDaysWorked.toString(),
            color: "oklch(0.65 0.18 60)",
          },
        ].map((card) => (
          <div key={card.label} className="card-erp p-4">
            <div className="text-xs text-muted-foreground mb-1">
              {card.label}
            </div>
            <div
              className="text-lg font-bold mono"
              style={{ color: card.color }}
            >
              {card.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly table */}
      <div className="card-erp overflow-hidden">
        <div
          className="px-4 py-3 border-b border-border"
          style={{ backgroundColor: "oklch(0.96 0.005 240)" }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: "oklch(0.22 0.07 240)" }}
          >
            {MONTHS[selectedMonth - 1]} {selectedYear} — Salesman Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table sticky-header">
            <thead>
              <tr>
                <th>Salesman</th>
                <th>Total Bills</th>
                <th>Total Sales Value (₹)</th>
                <th>Total Day Sales (₹)</th>
                <th>Days Worked</th>
                <th>Avg Daily Sales (₹)</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.map((row) => (
                <tr key={row.salesman}>
                  <td
                    className="font-semibold text-xs"
                    style={{ color: "oklch(0.22 0.07 240)" }}
                  >
                    {row.salesman}
                  </td>
                  <td className="mono text-right">{row.totalBills}</td>
                  <td className="mono text-right">
                    {formatIndianCurrency(row.totalSalesValue)}
                  </td>
                  <td className="mono text-right">
                    {formatIndianCurrency(row.totalDaySales)}
                  </td>
                  <td className="mono text-right">{row.totalDaysWorked}</td>
                  <td className="mono text-right">
                    {formatIndianCurrency(row.avgDailySales)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td className="font-bold text-xs uppercase">Grand Total</td>
                <td className="mono text-right font-bold">
                  {grandTotals.totalBills}
                </td>
                <td className="mono text-right font-bold">
                  {formatIndianCurrency(grandTotals.totalSalesValue)}
                </td>
                <td className="mono text-right font-bold">
                  {formatIndianCurrency(grandTotals.totalDaySales)}
                </td>
                <td className="mono text-right font-bold">
                  {grandTotals.totalDaysWorked}
                </td>
                <td className="mono text-right font-bold">
                  {formatIndianCurrency(
                    grandTotals.totalDaysWorked > 0
                      ? grandTotals.totalSalesValue /
                          grandTotals.totalDaysWorked
                      : 0,
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Per-salesman detail */}
      {entries.length > 0 && (
        <div className="mt-6">
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "oklch(0.22 0.07 240)" }}
          >
            Daily Breakdown
          </h3>
          <div className="card-erp overflow-hidden">
            <div className="overflow-x-auto">
              <table className="erp-table sticky-header">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Salesman</th>
                    <th>Load No.</th>
                    <th>Total Bills</th>
                    <th>Sales Value (₹)</th>
                    <th>Day Sales (₹)</th>
                    <th>Stock Value (₹)</th>
                    <th>Stock Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {[...entries]
                    .sort(
                      (a, b) =>
                        a.date.localeCompare(b.date) ||
                        a.salesman.localeCompare(b.salesman),
                    )
                    .map((entry) => (
                      <tr key={entry.date + entry.salesman}>
                        <td className="text-xs">
                          {format(new Date(entry.date), "dd/MM/yyyy (EEE)")}
                        </td>
                        <td className="font-semibold text-xs">
                          {entry.salesman}
                        </td>
                        <td className="text-xs">{entry.loadNumber || "-"}</td>
                        <td className="mono text-right">
                          {Number(entry.totalBills)}
                        </td>
                        <td className="mono text-right">
                          {formatIndianCurrency(entry.salesValue)}
                        </td>
                        <td className="mono text-right">
                          {formatIndianCurrency(entry.daySales)}
                        </td>
                        <td className="mono text-right">
                          {formatIndianCurrency(entry.stockValue)}
                        </td>
                        <td className="mono text-right">
                          {Number(entry.stockQty)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
