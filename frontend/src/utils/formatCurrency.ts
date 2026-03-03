/**
 * Format a number as Indian currency with ₹ symbol.
 * e.g., 123456.78 → ₹1,23,456.78
 */
export function formatIndianCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as Indian number (no currency symbol).
 */
export function formatIndianNumber(amount: number): string {
  if (isNaN(amount)) return '0';
  return new Intl.NumberFormat('en-IN').format(amount);
}
