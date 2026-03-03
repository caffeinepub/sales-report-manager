import { format, getDay } from "date-fns";
import { AlertCircle, CheckCircle2, RefreshCw, Save } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import type { DailySalesEntry } from "../backend";
import {
  getLocalDailyEntry,
  useGetDailyEntries,
  useSaveDailyEntries,
} from "../hooks/useQueries";
import {
  SALESMEN,
  type SalesmanName,
  getBeatForDay,
  isSunday,
} from "../utils/beatSchedule";
import { formatIndianCurrency } from "../utils/formatCurrency";
import {
  validateLoadNumber,
  validateSalesValue,
  validateStockQty,
  validateTotalBills,
} from "../utils/validation";

interface RowData {
  salesman: SalesmanName;
  beat: string;
  loadNumber: string;
  totalBills: string;
  salesValue: string;
  daySales: string;
  stockValue: string;
  stockQty: string;
}

interface RowErrors {
  loadNumber?: string;
  totalBills?: string;
  salesValue?: string;
  stockQty?: string;
}

function buildDefaultRows(date: Date): RowData[] {
  const dayOfWeek = getDay(date);
  return SALESMEN.map((salesman) => ({
    salesman,
    beat: getBeatForDay(salesman, dayOfWeek),
    loadNumber: "",
    totalBills: "0",
    salesValue: "0",
    daySales: "0",
    stockValue: "0",
    stockQty: "0",
  }));
}

function entryToRow(entry: DailySalesEntry, date: Date): RowData {
  const dayOfWeek = getDay(date);
  return {
    salesman: entry.salesman as SalesmanName,
    beat: getBeatForDay(entry.salesman as SalesmanName, dayOfWeek),
    loadNumber: entry.loadNumber,
    totalBills: Number(entry.totalBills).toString(),
    salesValue: entry.salesValue.toString(),
    daySales: entry.daySales.toString(),
    stockValue: entry.stockValue.toString(),
    stockQty: Number(entry.stockQty).toString(),
  };
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rows, setRows] = useState<RowData[]>(() =>
    buildDefaultRows(new Date()),
  );
  const [errors, setErrors] = useState<Record<string, RowErrors>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const _dayOfWeek = getDay(selectedDate);
  const isWeeklyOff = isSunday(selectedDate);

  const { data: backendEntries, isLoading } = useGetDailyEntries(selectedDate);
  const saveMutation = useSaveDailyEntries();

  // Load data when date changes or backend data arrives
  useEffect(() => {
    const defaultRows = buildDefaultRows(selectedDate);
    const mergedRows = defaultRows.map((defaultRow) => {
      // Try backend first
      const backendEntry = backendEntries?.find(
        (e) => e.salesman === defaultRow.salesman,
      );
      if (backendEntry) return entryToRow(backendEntry, selectedDate);

      // Try localStorage
      const localEntry = getLocalDailyEntry(dateStr, defaultRow.salesman);
      if (localEntry) return entryToRow(localEntry, selectedDate);

      return defaultRow;
    });
    setRows(mergedRows);
    setErrors({});
  }, [selectedDate, backendEntries, dateStr]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(`${e.target.value}T00:00:00`);
    setSelectedDate(newDate);
    setSaveSuccess(false);
  };

  const updateRow = useCallback(
    (salesman: string, field: keyof RowData, value: string) => {
      setRows((prev) =>
        prev.map((row) =>
          row.salesman === salesman ? { ...row, [field]: value } : row,
        ),
      );
      setSaveSuccess(false);

      // Validate on change
      setErrors((prev) => {
        const rowErrors = { ...prev[salesman] };
        if (field === "loadNumber") {
          const v = validateLoadNumber(value);
          if (!v.valid) rowErrors.loadNumber = v.error;
          else rowErrors.loadNumber = undefined;
        } else if (field === "totalBills") {
          const v = validateTotalBills(value);
          if (!v.valid) rowErrors.totalBills = v.error;
          else rowErrors.totalBills = undefined;
        } else if (field === "salesValue") {
          const v = validateSalesValue(value);
          if (!v.valid) rowErrors.salesValue = v.error;
          else rowErrors.salesValue = undefined;
        } else if (field === "stockQty") {
          const v = validateStockQty(value);
          if (!v.valid) rowErrors.stockQty = v.error;
          else rowErrors.stockQty = undefined;
        }
        return { ...prev, [salesman]: rowErrors };
      });
    },
    [],
  );

  const validateAll = (): boolean => {
    const newErrors: Record<string, RowErrors> = {};
    let valid = true;
    for (const row of rows) {
      const rowErrors: RowErrors = {};
      const ln = validateLoadNumber(row.loadNumber);
      if (!ln.valid) {
        rowErrors.loadNumber = ln.error;
        valid = false;
      }
      const tb = validateTotalBills(row.totalBills);
      if (!tb.valid) {
        rowErrors.totalBills = tb.error;
        valid = false;
      }
      const sv = validateSalesValue(row.salesValue);
      if (!sv.valid) {
        rowErrors.salesValue = sv.error;
        valid = false;
      }
      const sq = validateStockQty(row.stockQty);
      if (!sq.valid) {
        rowErrors.stockQty = sq.error;
        valid = false;
      }
      if (Object.keys(rowErrors).length > 0)
        newErrors[row.salesman] = rowErrors;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSave = async () => {
    if (!validateAll()) return;

    const entries: DailySalesEntry[] = rows.map((row) => ({
      date: dateStr,
      salesman: row.salesman,
      loadNumber: row.loadNumber,
      totalBills: BigInt(Number.parseInt(row.totalBills) || 0),
      salesValue: Number.parseFloat(row.salesValue) || 0,
      daySales: Number.parseFloat(row.daySales) || 0,
      stockValue: Number.parseFloat(row.stockValue) || 0,
      stockQty: BigInt(Number.parseInt(row.stockQty) || 0),
    }));

    try {
      await saveMutation.mutateAsync(entries);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  // Calculate totals
  const totals = rows.reduce(
    (acc, row) => ({
      totalBills: acc.totalBills + (Number.parseInt(row.totalBills) || 0),
      salesValue: acc.salesValue + (Number.parseFloat(row.salesValue) || 0),
      daySales: acc.daySales + (Number.parseFloat(row.daySales) || 0),
      stockValue: acc.stockValue + (Number.parseFloat(row.stockValue) || 0),
      stockQty: acc.stockQty + (Number.parseInt(row.stockQty) || 0),
    }),
    { totalBills: 0, salesValue: 0, daySales: 0, stockValue: 0, stockQty: 0 },
  );

  // Cumulative total sales
  let cumulativeSales = 0;
  const rowsWithCumulative = rows.map((row) => {
    cumulativeSales += Number.parseFloat(row.salesValue) || 0;
    return { ...row, totalSales: cumulativeSales };
  });

  const hasErrors = Object.values(errors).some(
    (e) => Object.keys(e).length > 0,
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Daily Sales Report</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enter and manage daily sales data for all salesman
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="dashboard-date"
              className="text-sm font-medium text-foreground"
            >
              Date:
            </label>
            <input
              id="dashboard-date"
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={handleDateChange}
              className="erp-input"
              style={{ width: "160px" }}
            />
          </div>
          {!isWeeklyOff && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending || hasErrors}
              className="btn-primary"
            >
              {saveMutation.isPending ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 size={16} />
              ) : (
                <Save size={16} />
              )}
              {saveMutation.isPending
                ? "Saving..."
                : saveSuccess
                  ? "Saved!"
                  : "Save Daily Data"}
            </button>
          )}
        </div>
      </div>

      {/* Status messages */}
      {saveMutation.isError && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle size={16} />
          Failed to save. Data saved locally as backup.
        </div>
      )}

      {/* Weekly Off Message */}
      {isWeeklyOff ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "oklch(0.93 0.01 240)" }}
          >
            <span className="text-3xl">🏖️</span>
          </div>
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: "oklch(0.22 0.07 240)" }}
          >
            Weekly Off
          </h3>
          <p className="text-muted-foreground max-w-sm">
            Sunday is a weekly off day. No sales data entry is required. Please
            select a weekday (Monday–Saturday) to enter data.
          </p>
        </div>
      ) : (
        <>
          {/* Day indicator */}
          <div className="mb-4 flex items-center gap-2">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: "oklch(0.55 0.18 200)",
                color: "white",
              }}
            >
              {format(selectedDate, "EEEE")}
            </span>
            <span className="text-sm text-muted-foreground">
              {format(selectedDate, "dd MMMM yyyy")}
            </span>
            {isLoading && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" /> Loading...
              </span>
            )}
          </div>

          {/* Table */}
          <div className="card-erp overflow-hidden">
            <div className="overflow-x-auto">
              <table className="erp-table sticky-header">
                <thead>
                  <tr>
                    <th className="w-28">Salesman</th>
                    <th className="w-40">Beat (Area)</th>
                    <th className="w-24">Load No.</th>
                    <th className="w-24">Total Bills</th>
                    <th className="w-32">Sales Value (₹)</th>
                    <th className="w-28">Day Sales (₹)</th>
                    <th className="w-28">Stock Value (₹)</th>
                    <th className="w-24">Stock Qty</th>
                    <th className="w-32">Total Sales (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsWithCumulative.map((row) => {
                    const rowErr = errors[row.salesman] || {};
                    return (
                      <tr key={row.salesman}>
                        <td
                          className="font-semibold text-xs"
                          style={{ color: "oklch(0.22 0.07 240)" }}
                        >
                          {row.salesman}
                        </td>
                        <td
                          className="text-xs font-medium"
                          style={{ color: "oklch(0.40 0.10 200)" }}
                        >
                          {row.beat}
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.loadNumber}
                            onChange={(e) =>
                              updateRow(
                                row.salesman,
                                "loadNumber",
                                e.target.value,
                              )
                            }
                            className={`erp-input ${rowErr.loadNumber ? "error" : ""}`}
                            placeholder="L001"
                          />
                          {rowErr.loadNumber && (
                            <p className="text-xs text-destructive mt-0.5">
                              {rowErr.loadNumber}
                            </p>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={row.totalBills}
                            onChange={(e) =>
                              updateRow(
                                row.salesman,
                                "totalBills",
                                e.target.value,
                              )
                            }
                            className={`erp-input ${rowErr.totalBills ? "error" : ""}`}
                          />
                          {rowErr.totalBills && (
                            <p className="text-xs text-destructive mt-0.5">
                              {rowErr.totalBills}
                            </p>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.salesValue}
                            onChange={(e) =>
                              updateRow(
                                row.salesman,
                                "salesValue",
                                e.target.value,
                              )
                            }
                            className={`erp-input ${rowErr.salesValue ? "error" : ""}`}
                          />
                          {rowErr.salesValue && (
                            <p className="text-xs text-destructive mt-0.5">
                              {rowErr.salesValue}
                            </p>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.daySales}
                            onChange={(e) =>
                              updateRow(
                                row.salesman,
                                "daySales",
                                e.target.value,
                              )
                            }
                            className="erp-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.stockValue}
                            onChange={(e) =>
                              updateRow(
                                row.salesman,
                                "stockValue",
                                e.target.value,
                              )
                            }
                            className="erp-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={row.stockQty}
                            onChange={(e) =>
                              updateRow(
                                row.salesman,
                                "stockQty",
                                e.target.value,
                              )
                            }
                            className={`erp-input ${rowErr.stockQty ? "error" : ""}`}
                          />
                          {rowErr.stockQty && (
                            <p className="text-xs text-destructive mt-0.5">
                              {rowErr.stockQty}
                            </p>
                          )}
                        </td>
                        <td
                          className="font-semibold mono text-right"
                          style={{ color: "oklch(0.35 0.12 145)" }}
                        >
                          {formatIndianCurrency(row.totalSales)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan={2} className="font-bold text-xs uppercase">
                      TOTALS
                    </td>
                    <td />
                    <td className="font-bold mono">{totals.totalBills}</td>
                    <td className="font-bold mono">
                      {formatIndianCurrency(totals.salesValue)}
                    </td>
                    <td className="font-bold mono">
                      {formatIndianCurrency(totals.daySales)}
                    </td>
                    <td className="font-bold mono">
                      {formatIndianCurrency(totals.stockValue)}
                    </td>
                    <td className="font-bold mono">{totals.stockQty}</td>
                    <td className="font-bold mono">
                      {formatIndianCurrency(totals.salesValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              {
                label: "Total Bills",
                value: totals.totalBills.toString(),
                color: "oklch(0.22 0.07 240)",
              },
              {
                label: "Total Sales Value",
                value: formatIndianCurrency(totals.salesValue),
                color: "oklch(0.35 0.12 145)",
              },
              {
                label: "Total Day Sales",
                value: formatIndianCurrency(totals.daySales),
                color: "oklch(0.55 0.18 200)",
              },
              {
                label: "Total Stock Value",
                value: formatIndianCurrency(totals.stockValue),
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
