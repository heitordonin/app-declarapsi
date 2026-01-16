/**
 * Format a number to BRL currency display format (for read-only display)
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a number to BRL currency string for input fields
 */
export function formatCurrencyForInput(value: number): string {
  if (!value && value !== 0) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse a BRL currency string to number
 * Handles both "1.234,56" (Brazilian) and "1234.56" (international) formats
 */
export function parseCurrencyToNumber(value: string): number {
  if (!value) return 0;
  
  // If has comma, assume Brazilian format (1.234,56)
  if (value.includes(',')) {
    const normalized = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  }
  
  // Otherwise, assume international format (1234.56)
  return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
}

/**
 * Calculate deductible value for residential expenses
 */
export function calculateDeductibleValue(
  value: number,
  isResidential: boolean,
  percentage: number
): number {
  if (!isResidential) return value;
  return value * (percentage / 100);
}
