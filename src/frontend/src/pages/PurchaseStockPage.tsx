import { format } from "date-fns";
import { AlertCircle, FileUp, Package, Plus, RefreshCw } from "lucide-react";
import React, { useState } from "react";
import type { PurchaseEntry } from "../backend";
import ExcelImportDialog from "../components/ExcelImportDialog";
import { useAddPurchase, useGetAllPurchases } from "../hooks/useQueries";
import { formatIndianCurrency } from "../utils/formatCurrency";
import {
  validateProductName,
  validatePurchaseRate,
  validateQuantity,
} from "../utils/validation";

interface FormData {
  productName: string;
  purchaseDate: string;
  quantity: string;
  purchaseRate: string;
}

interface FormErrors {
  productName?: string;
  purchaseDate?: string;
  quantity?: string;
  purchaseRate?: string;
}

interface StockSummary {
  productName: string;
  totalPurchased: number;
  totalValue: number;
  avgRate: number;
}

function buildStockSummary(purchases: PurchaseEntry[]): StockSummary[] {
  const map = new Map<string, StockSummary>();
  for (const p of purchases) {
    const existing = map.get(p.productName);
    if (existing) {
      existing.totalPurchased += Number(p.quantity);
      existing.totalValue += p.totalPurchaseValue;
      existing.avgRate = existing.totalValue / existing.totalPurchased;
    } else {
      map.set(p.productName, {
        productName: p.productName,
        totalPurchased: Number(p.quantity),
        totalValue: p.totalPurchaseValue,
        avgRate: p.purchaseRate,
      });
    }
  }
  return Array.from(map.values());
}

export default function PurchaseStockPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState<FormData>({
    productName: "",
    purchaseDate: today,
    quantity: "",
    purchaseRate: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [addSuccess, setAddSuccess] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: purchases = [], isLoading } = useGetAllPurchases();
  const addPurchaseMutation = useAddPurchase();

  const totalPurchaseValue =
    (Number.parseFloat(form.quantity) || 0) *
    (Number.parseFloat(form.purchaseRate) || 0);

  const stockSummary = buildStockSummary(purchases);

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setAddSuccess(false);

    setFormErrors((prev) => {
      const newErrors = { ...prev };
      if (field === "productName") {
        const v = validateProductName(value);
        if (!v.valid) newErrors.productName = v.error;
        else newErrors.productName = undefined;
      } else if (field === "quantity") {
        const v = validateQuantity(value);
        if (!v.valid) newErrors.quantity = v.error;
        else newErrors.quantity = undefined;
      } else if (field === "purchaseRate") {
        const v = validatePurchaseRate(value);
        if (!v.valid) newErrors.purchaseRate = v.error;
        else newErrors.purchaseRate = undefined;
      } else if (field === "purchaseDate") {
        if (!value) newErrors.purchaseDate = "Date is required";
        else newErrors.purchaseDate = undefined;
      }
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const pn = validateProductName(form.productName);
    if (!pn.valid) errors.productName = pn.error;
    if (!form.purchaseDate) errors.purchaseDate = "Date is required";
    const qty = validateQuantity(form.quantity);
    if (!qty.valid) errors.quantity = qty.error;
    const rate = validatePurchaseRate(form.purchaseRate);
    if (!rate.valid) errors.purchaseRate = rate.error;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    const purchase: PurchaseEntry = {
      productName: form.productName.trim(),
      purchaseDate: form.purchaseDate,
      quantity: BigInt(Number.parseInt(form.quantity)),
      purchaseRate: Number.parseFloat(form.purchaseRate),
      totalPurchaseValue,
    };

    try {
      await addPurchaseMutation.mutateAsync(purchase);
      setForm({
        productName: "",
        purchaseDate: today,
        quantity: "",
        purchaseRate: "",
      });
      setFormErrors({});
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3000);
    } catch (err) {
      console.error("Add purchase failed:", err);
    }
  };

  const isFormValid =
    form.productName.trim() !== "" &&
    form.purchaseDate !== "" &&
    form.quantity !== "" &&
    form.purchaseRate !== "" &&
    Object.keys(formErrors).length === 0;

  const sortedPurchases = [...purchases].sort((a, b) =>
    b.purchaseDate.localeCompare(a.purchaseDate),
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Purchase & Stock Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track product purchases and manage inventory
          </p>
        </div>
        <button
          type="button"
          data-ocid="purchase.import_excel.open_modal_button"
          onClick={() => setImportDialogOpen(true)}
          className="btn-teal flex items-center gap-2"
        >
          <FileUp size={15} />
          Import Excel
        </button>
      </div>

      <ExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={(count) => {
          console.log(`${count} purchases imported`);
        }}
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Add Purchase Form */}
        <div className="col-span-1">
          <div className="card-erp p-5">
            <h3
              className="text-sm font-bold mb-4 flex items-center gap-2"
              style={{ color: "oklch(0.22 0.07 240)" }}
            >
              <Plus size={16} />
              Add New Purchase
            </h3>

            {addSuccess && (
              <div className="mb-3 p-2 rounded text-xs text-green-700 bg-green-50 border border-green-200">
                Purchase added successfully!
              </div>
            )}

            {addPurchaseMutation.isError && (
              <div className="mb-3 p-2 rounded text-xs flex items-center gap-1 text-destructive bg-destructive/10">
                <AlertCircle size={12} />
                Failed to save. Saved locally.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="purchase-product-name"
                  className="block text-xs font-medium mb-1 text-foreground"
                >
                  Product Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="purchase-product-name"
                  type="text"
                  value={form.productName}
                  onChange={(e) => updateForm("productName", e.target.value)}
                  className={`erp-input w-full ${formErrors.productName ? "error" : ""}`}
                  placeholder="e.g., Biscuits Assorted"
                />
                {formErrors.productName && (
                  <p className="text-xs text-destructive mt-0.5">
                    {formErrors.productName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="purchase-date"
                  className="block text-xs font-medium mb-1 text-foreground"
                >
                  Purchase Date <span className="text-destructive">*</span>
                </label>
                <input
                  id="purchase-date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => updateForm("purchaseDate", e.target.value)}
                  className={`erp-input w-full ${formErrors.purchaseDate ? "error" : ""}`}
                />
                {formErrors.purchaseDate && (
                  <p className="text-xs text-destructive mt-0.5">
                    {formErrors.purchaseDate}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="purchase-quantity"
                  className="block text-xs font-medium mb-1 text-foreground"
                >
                  Quantity (Pieces) <span className="text-destructive">*</span>
                </label>
                <input
                  id="purchase-quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => updateForm("quantity", e.target.value)}
                  className={`erp-input w-full ${formErrors.quantity ? "error" : ""}`}
                  placeholder="e.g., 500"
                />
                {formErrors.quantity && (
                  <p className="text-xs text-destructive mt-0.5">
                    {formErrors.quantity}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="purchase-rate"
                  className="block text-xs font-medium mb-1 text-foreground"
                >
                  Purchase Rate (₹) <span className="text-destructive">*</span>
                </label>
                <input
                  id="purchase-rate"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.purchaseRate}
                  onChange={(e) => updateForm("purchaseRate", e.target.value)}
                  className={`erp-input w-full ${formErrors.purchaseRate ? "error" : ""}`}
                  placeholder="e.g., 12.50"
                />
                {formErrors.purchaseRate && (
                  <p className="text-xs text-destructive mt-0.5">
                    {formErrors.purchaseRate}
                  </p>
                )}
              </div>

              <div
                className="p-3 rounded-md border"
                style={{
                  backgroundColor: "oklch(0.96 0.005 240)",
                  borderColor: "oklch(0.88 0.01 240)",
                }}
              >
                <div className="text-xs text-muted-foreground mb-1">
                  Total Purchase Value
                </div>
                <div
                  className="text-lg font-bold mono"
                  style={{ color: "oklch(0.35 0.12 145)" }}
                >
                  {formatIndianCurrency(totalPurchaseValue)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {form.quantity || "0"} × ₹{form.purchaseRate || "0"}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={!isFormValid || addPurchaseMutation.isPending}
                className="btn-primary w-full justify-center"
              >
                {addPurchaseMutation.isPending ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {addPurchaseMutation.isPending ? "Adding..." : "Add Purchase"}
              </button>
            </div>
          </div>
        </div>

        {/* Right side: Stock Summary + History */}
        <div className="col-span-2 space-y-6">
          {/* Current Stock Summary */}
          <div className="card-erp overflow-hidden">
            <div
              className="px-4 py-3 border-b border-border flex items-center gap-2"
              style={{ backgroundColor: "oklch(0.96 0.005 240)" }}
            >
              <Package size={16} style={{ color: "oklch(0.22 0.07 240)" }} />
              <h3
                className="text-sm font-semibold"
                style={{ color: "oklch(0.22 0.07 240)" }}
              >
                Current Stock Summary
              </h3>
            </div>
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> Loading...
              </div>
            ) : stockSummary.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No stock data available. Add purchases to see stock summary.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Total Purchased (Qty)</th>
                      <th>Avg Rate (₹)</th>
                      <th>Total Stock Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockSummary.map((item) => (
                      <tr key={item.productName}>
                        <td className="font-medium text-xs">
                          {item.productName}
                        </td>
                        <td className="mono text-right">
                          {item.totalPurchased}
                        </td>
                        <td className="mono text-right">
                          {formatIndianCurrency(item.avgRate)}
                        </td>
                        <td
                          className="mono text-right font-semibold"
                          style={{ color: "oklch(0.35 0.12 145)" }}
                        >
                          {formatIndianCurrency(item.totalValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td className="font-bold text-xs uppercase">Total</td>
                      <td className="mono text-right font-bold">
                        {stockSummary.reduce((s, i) => s + i.totalPurchased, 0)}
                      </td>
                      <td />
                      <td className="mono text-right font-bold">
                        {formatIndianCurrency(
                          stockSummary.reduce((s, i) => s + i.totalValue, 0),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Purchase History */}
          <div className="card-erp overflow-hidden">
            <div
              className="px-4 py-3 border-b border-border"
              style={{ backgroundColor: "oklch(0.96 0.005 240)" }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "oklch(0.22 0.07 240)" }}
              >
                Purchase History ({purchases.length} records)
              </h3>
            </div>
            {sortedPurchases.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No purchase records found.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="erp-table sticky-header">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Rate (₹)</th>
                      <th>Total Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPurchases.map((p) => (
                      <tr
                        key={`${p.purchaseDate}-${p.productName}-${Number(p.quantity)}`}
                      >
                        <td className="text-xs">
                          {format(new Date(p.purchaseDate), "dd/MM/yyyy")}
                        </td>
                        <td className="font-medium text-xs">{p.productName}</td>
                        <td className="mono text-right">
                          {Number(p.quantity)}
                        </td>
                        <td className="mono text-right">
                          {formatIndianCurrency(p.purchaseRate)}
                        </td>
                        <td
                          className="mono text-right font-semibold"
                          style={{ color: "oklch(0.35 0.12 145)" }}
                        >
                          {formatIndianCurrency(p.totalPurchaseValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
