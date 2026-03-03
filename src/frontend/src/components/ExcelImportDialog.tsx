import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import * as XLSX from "xlsx";
import type { PurchaseEntry } from "../backend";
import { useBulkAddPurchases } from "../hooks/useQueries";
import { formatIndianCurrency } from "../utils/formatCurrency";

interface ParsedRow {
  productName: string;
  purchaseDate: string;
  quantity: number;
  purchaseRate: number;
  totalPurchaseValue: number;
  errors: string[];
  rowIndex: number;
}

function parseExcelDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  // Excel serial number
  if (typeof value === "number") {
    try {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        const month = String(date.m).padStart(2, "0");
        const day = String(date.d).padStart(2, "0");
        return `${date.y}-${month}-${day}`;
      }
    } catch {
      return null;
    }
  }

  const str = String(value).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, "0");
    const month = ddmmyyyy[2].padStart(2, "0");
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // DD-MM-YYYY
  const ddmmyyyyDash = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddmmyyyyDash) {
    const day = ddmmyyyyDash[1].padStart(2, "0");
    const month = ddmmyyyyDash[2].padStart(2, "0");
    const year = ddmmyyyyDash[3];
    return `${year}-${month}-${day}`;
  }

  // Try generic Date parse as last resort
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  return null;
}

function normalizeHeader(header: string): string {
  return header.toString().trim().toLowerCase().replace(/\s+/g, " ");
}

function parseRows(jsonRows: Record<string, unknown>[]): ParsedRow[] {
  return jsonRows.map((row, idx) => {
    const errors: string[] = [];

    // Find columns case-insensitively
    const headerMap: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      headerMap[normalizeHeader(key)] = key;
    }

    const productNameKey =
      headerMap["product name"] ?? headerMap.productname ?? headerMap.product;
    const purchaseDateKey =
      headerMap["purchase date"] ?? headerMap.purchasedate ?? headerMap.date;
    const quantityKey = headerMap.quantity ?? headerMap.qty;
    const purchaseRateKey =
      headerMap["purchase rate"] ??
      headerMap.purchaserate ??
      headerMap.rate ??
      headerMap.price;

    // Product Name
    const productNameRaw = productNameKey ? row[productNameKey] : undefined;
    const productName =
      productNameRaw !== undefined && productNameRaw !== null
        ? String(productNameRaw).trim()
        : "";
    if (!productName) {
      errors.push("Product Name is required");
    }

    // Purchase Date
    const purchaseDateRaw = purchaseDateKey ? row[purchaseDateKey] : undefined;
    const purchaseDate = parseExcelDate(purchaseDateRaw);
    if (!purchaseDate) {
      errors.push(
        "Invalid or missing Purchase Date (use YYYY-MM-DD or DD/MM/YYYY)",
      );
    }

    // Quantity
    const quantityRaw = quantityKey ? row[quantityKey] : undefined;
    const quantity =
      quantityRaw !== undefined && quantityRaw !== null
        ? Number(quantityRaw)
        : Number.NaN;
    if (
      Number.isNaN(quantity) ||
      quantity <= 0 ||
      !Number.isInteger(quantity)
    ) {
      errors.push("Quantity must be a positive whole number");
    }

    // Purchase Rate
    const purchaseRateRaw = purchaseRateKey ? row[purchaseRateKey] : undefined;
    const purchaseRate =
      purchaseRateRaw !== undefined && purchaseRateRaw !== null
        ? Number(purchaseRateRaw)
        : Number.NaN;
    if (Number.isNaN(purchaseRate) || purchaseRate <= 0) {
      errors.push("Purchase Rate must be a positive number");
    }

    const totalPurchaseValue =
      !Number.isNaN(quantity) && !Number.isNaN(purchaseRate)
        ? quantity * purchaseRate
        : 0;

    return {
      productName,
      purchaseDate: purchaseDate ?? "",
      quantity: Number.isNaN(quantity) ? 0 : quantity,
      purchaseRate: Number.isNaN(purchaseRate) ? 0 : purchaseRate,
      totalPurchaseValue,
      errors,
      rowIndex: idx + 1,
    };
  });
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["Product Name", "Purchase Date", "Quantity", "Purchase Rate"],
    ["Biscuits Assorted", "2026-03-01", 500, 12.5],
    ["Soft Drinks 2L", "01/03/2026", 200, 45],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 12 }, { wch: 16 }];

  XLSX.utils.book_append_sheet(wb, ws, "Purchases");
  XLSX.writeFile(wb, "purchase_import_template.xlsx");
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (count: number) => void;
}

export default function ExcelImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkAddMutation = useBulkAddPurchases();

  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const errorRows = parsedRows.filter((r) => r.errors.length > 0);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setImportSuccess(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "array", cellDates: false });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
          raw: true,
        });

        if (json.length === 0) {
          setImportError("The file appears to be empty or has no data rows.");
          setParsedRows([]);
          return;
        }

        const rows = parseRows(json);
        setParsedRows(rows);
      } catch (err) {
        setImportError(
          `Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        setParsedRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImportError(null);

    const purchases: PurchaseEntry[] = validRows.map((r) => ({
      productName: r.productName,
      purchaseDate: r.purchaseDate,
      quantity: BigInt(r.quantity),
      purchaseRate: r.purchaseRate,
      totalPurchaseValue: r.totalPurchaseValue,
    }));

    try {
      await bulkAddMutation.mutateAsync(purchases);
      setImportSuccess(validRows.length);
      onSuccess?.(validRows.length);
      // Auto-close after short delay
      setTimeout(() => {
        onOpenChange(false);
        // Reset state
        setParsedRows([]);
        setFileName("");
        setImportSuccess(null);
        setImportError(null);
      }, 1800);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Import failed. Please try again.",
      );
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Small delay to allow dialog close animation before reset
    setTimeout(() => {
      setParsedRows([]);
      setFileName("");
      setImportSuccess(null);
      setImportError(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl w-full"
        data-ocid="purchase.import.dialog"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2 text-base font-bold"
            style={{ color: "oklch(0.22 0.07 240)" }}
          >
            <FileSpreadsheet
              size={18}
              style={{ color: "oklch(0.55 0.18 200)" }}
            />
            Import Purchases from Excel / CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Upload Area */}
          {parsedRows.length === 0 && !importSuccess && (
            <label
              data-ocid="purchase.import.dropzone"
              htmlFor="excel-file-input"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                block relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${
                  isDragging
                    ? "border-[oklch(0.55_0.18_200)] bg-[oklch(0.96_0.02_200)]"
                    : "border-border hover:border-[oklch(0.55_0.18_200)] hover:bg-[oklch(0.98_0.005_200)]"
                }
              `}
            >
              <input
                ref={fileInputRef}
                id="excel-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                data-ocid="purchase.import.upload_button"
              />
              <Upload
                size={32}
                className="mx-auto mb-3"
                style={{ color: "oklch(0.55 0.18 200)" }}
              />
              <p className="text-sm font-medium text-foreground mb-1">
                {isDragging
                  ? "Drop file here"
                  : "Click to upload or drag & drop"}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports .xlsx, .xls, .csv files
              </p>
            </label>
          )}

          {/* Download Template */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground">
              Need a template? Download the sample file with correct column
              headers.
            </p>
            <button
              type="button"
              data-ocid="purchase.import.template_button"
              onClick={downloadTemplate}
              className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Download size={13} />
              Download Template
            </button>
          </div>

          {/* Error state */}
          {importError && (
            <div
              data-ocid="purchase.import.error_state"
              className="flex items-start gap-2 p-3 rounded-md text-sm text-destructive bg-destructive/10 border border-destructive/20"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}

          {/* Success state */}
          {importSuccess !== null && (
            <div
              data-ocid="purchase.import.success_state"
              className="flex items-center gap-2 p-3 rounded-md text-sm bg-green-50 border border-green-200 text-green-700"
            >
              <CheckCircle2 size={15} className="shrink-0" />
              <span className="font-medium">
                {importSuccess} purchase{importSuccess !== 1 ? "s" : ""}{" "}
                imported successfully!
              </span>
            </div>
          )}

          {/* Preview area */}
          {parsedRows.length > 0 && !importSuccess && (
            <div className="space-y-3">
              {/* Summary bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileSpreadsheet size={14} />
                  <span className="font-medium text-foreground">
                    {fileName}
                  </span>
                  <span>—</span>
                  <span>
                    {parsedRows.length} row{parsedRows.length !== 1 ? "s" : ""}{" "}
                    parsed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-medium"
                    style={{
                      borderColor: "oklch(0.55 0.15 145)",
                      color: "oklch(0.35 0.12 145)",
                      backgroundColor: "oklch(0.97 0.02 145)",
                    }}
                  >
                    {validRows.length} valid
                  </Badge>
                  {errorRows.length > 0 && (
                    <Badge
                      variant="destructive"
                      className="text-xs font-medium"
                    >
                      {errorRows.length} with errors
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setFileName("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors"
                  >
                    <X size={12} /> Change file
                  </button>
                </div>
              </div>

              {/* Preview table */}
              <ScrollArea className="h-64 border border-border rounded-md overflow-hidden">
                <table className="erp-table text-xs w-full">
                  <thead>
                    <tr>
                      <th className="w-8">#</th>
                      <th>Product Name</th>
                      <th>Purchase Date</th>
                      <th>Quantity</th>
                      <th>Rate (₹)</th>
                      <th>Total Value (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => {
                      const hasErrors = row.errors.length > 0;
                      return (
                        <tr
                          key={row.rowIndex}
                          data-ocid={`purchase.import.item.${row.rowIndex}`}
                          style={
                            hasErrors
                              ? { backgroundColor: "oklch(0.97 0.03 15)" }
                              : undefined
                          }
                        >
                          <td className="text-center text-muted-foreground">
                            {row.rowIndex}
                          </td>
                          <td
                            className={`font-medium ${hasErrors && !row.productName ? "text-destructive" : ""}`}
                          >
                            {row.productName || (
                              <span className="text-destructive italic">
                                missing
                              </span>
                            )}
                          </td>
                          <td
                            className={
                              hasErrors && !row.purchaseDate
                                ? "text-destructive"
                                : ""
                            }
                          >
                            {row.purchaseDate || (
                              <span className="text-destructive italic">
                                invalid
                              </span>
                            )}
                          </td>
                          <td
                            className={`mono text-right ${hasErrors && row.quantity <= 0 ? "text-destructive" : ""}`}
                          >
                            {row.quantity > 0 ? (
                              row.quantity
                            ) : (
                              <span className="text-destructive italic">—</span>
                            )}
                          </td>
                          <td
                            className={`mono text-right ${hasErrors && row.purchaseRate <= 0 ? "text-destructive" : ""}`}
                          >
                            {row.purchaseRate > 0 ? (
                              formatIndianCurrency(row.purchaseRate)
                            ) : (
                              <span className="text-destructive italic">—</span>
                            )}
                          </td>
                          <td
                            className="mono text-right font-semibold"
                            style={{
                              color: hasErrors
                                ? "inherit"
                                : "oklch(0.35 0.12 145)",
                            }}
                          >
                            {row.totalPurchaseValue > 0
                              ? formatIndianCurrency(row.totalPurchaseValue)
                              : "—"}
                          </td>
                          <td>
                            {hasErrors ? (
                              <div className="flex items-start gap-1">
                                <AlertCircle
                                  size={11}
                                  className="text-destructive shrink-0 mt-0.5"
                                />
                                <span className="text-destructive text-[10px] leading-tight">
                                  {row.errors.join("; ")}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[oklch(0.45_0.15_145)]">
                                <CheckCircle2 size={11} />
                                <span className="text-[10px]">OK</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>

              {/* Total preview */}
              {validRows.length > 0 && (
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-md border text-sm"
                  style={{
                    backgroundColor: "oklch(0.97 0.01 200)",
                    borderColor: "oklch(0.88 0.03 200)",
                  }}
                >
                  <span className="text-muted-foreground text-xs">
                    Total value to be imported:
                  </span>
                  <span
                    className="font-bold mono"
                    style={{ color: "oklch(0.35 0.12 145)" }}
                  >
                    {formatIndianCurrency(
                      validRows.reduce((s, r) => s + r.totalPurchaseValue, 0),
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            data-ocid="purchase.import.cancel_button"
            onClick={handleClose}
            className="btn-outline px-4 py-2"
            disabled={bulkAddMutation.isPending}
          >
            Cancel
          </button>

          <button
            type="button"
            data-ocid="purchase.import.submit_button"
            onClick={handleImport}
            disabled={validRows.length === 0 || bulkAddMutation.isPending}
            className="btn-teal px-4 py-2 flex items-center gap-2"
          >
            {bulkAddMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload size={14} />
                Import{" "}
                {validRows.length > 0
                  ? `${validRows.length} Row${validRows.length !== 1 ? "s" : ""}`
                  : "Rows"}
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
