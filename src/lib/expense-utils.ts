/**
 * Format a number or string to BRL currency format
 */
export function formatCurrency(value: string | number): string {
  // Remove non-numeric characters except comma and dot
  const numericValue = typeof value === 'string' 
    ? value.replace(/[^\d,]/g, '') 
    : value.toString();
  
  // Convert comma to dot for parsing
  const normalizedValue = numericValue.replace(',', '.');
  
  // Parse to number
  const number = parseFloat(normalizedValue);
  
  if (isNaN(number)) {
    return '';
  }
  
  // Format with Brazilian locale (uses comma as decimal separator)
  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse a BRL currency string to number
 */
export function parseCurrencyToNumber(value: string): number {
  if (!value) return 0;
  
  // Remove thousand separators (dots) and convert decimal separator (comma) to dot
  const normalizedValue = value.replace(/\./g, '').replace(',', '.');
  
  const number = parseFloat(normalizedValue);
  return isNaN(number) ? 0 : number;
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
