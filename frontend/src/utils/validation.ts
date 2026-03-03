export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateLoadNumber(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Load number is required' };
  }
  return { valid: true };
}

export function validateTotalBills(value: string | number): ValidationResult {
  const num = Number(value);
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: 'Total bills is required' };
  }
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a number' };
  }
  if (num < 0) {
    return { valid: false, error: 'Cannot be negative' };
  }
  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Must be a whole number' };
  }
  return { valid: true };
}

export function validateSalesValue(value: string | number): ValidationResult {
  const num = Number(value);
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: 'Sales value is required' };
  }
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a number' };
  }
  if (num < 0) {
    return { valid: false, error: 'Cannot be negative' };
  }
  return { valid: true };
}

export function validateStockQty(value: string | number): ValidationResult {
  const num = Number(value);
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: 'Stock qty is required' };
  }
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a number' };
  }
  if (num < 0) {
    return { valid: false, error: 'Cannot be negative' };
  }
  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Must be a whole number' };
  }
  return { valid: true };
}

export function validateProductName(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Product name is required' };
  }
  return { valid: true };
}

export function validateQuantity(value: string | number): ValidationResult {
  const num = Number(value);
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: 'Quantity is required' };
  }
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a number' };
  }
  if (num <= 0) {
    return { valid: false, error: 'Must be greater than 0' };
  }
  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Must be a whole number' };
  }
  return { valid: true };
}

export function validatePurchaseRate(value: string | number): ValidationResult {
  const num = Number(value);
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: 'Purchase rate is required' };
  }
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a number' };
  }
  if (num <= 0) {
    return { valid: false, error: 'Must be greater than 0' };
  }
  return { valid: true };
}
