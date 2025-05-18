
/**
 * Calculate frequency percentage based on absences and total classes
 * Formula: Frequency = (1 - (Absences / TotalClasses)) * 100
 */
export function calculateFrequency(absences: number, totalClasses: number): number {
  if (totalClasses <= 0) return 0;
  
  // Apply the formula: Frequency = (1 - (Absences / TotalClasses)) * 100
  const frequency = (1 - (absences / totalClasses)) * 100;
  
  // Ensure the result is between 0 and 100
  return Math.max(0, Math.min(100, frequency));
}

/**
 * Converts any value to a percentage (0-100)
 * Handles various formats:
 * - Decimal values (0.85 becomes 85%)
 * - Text with % (85% becomes 85)
 * - Numbers (85 stays 85)
 */
export const convertToPercentage = (value: any): number => {
  console.log('\n=== Converting Frequency Value ===');
  console.log('Original value:', value, 'Type:', typeof value);
  
  if (value === null || value === undefined) {
    console.log('Null/undefined value detected, returning 0');
    return 0;
  }
  
  // Convert to string and trim whitespace
  const strValue = String(value).trim();
  console.log('As string (trimmed):', strValue);
  
  if (strValue === '') {
    console.log('Empty string detected, returning 0');
    return 0;
  }
  
  // Remove percentage sign and any spaces
  const cleanValue = strValue.replace(/[%\s]/g, '');
  console.log('Cleaned value (no % or spaces):', cleanValue);
  
  // Replace comma with dot for decimal values
  const normalizedValue = cleanValue.replace(',', '.');
  console.log('Normalized value (comma to dot):', normalizedValue);
  
  // Convert to number
  const numValue = parseFloat(normalizedValue);
  console.log('Parsed as number:', numValue, 'Type:', typeof numValue);
  
  if (isNaN(numValue)) {
    console.log('NaN detected, returning 0');
    return 0;
  }
  
  // If the value is a decimal less than 1, multiply by 100
  if (numValue > 0 && numValue < 1) {
    const percentage = numValue * 100;
    console.log('Decimal detected, converted to percentage:', percentage);
    return percentage;
  }
  
  // Ensure value is between 0 and 100
  const finalValue = Math.max(0, Math.min(100, numValue));
  console.log('Final percentage value:', finalValue);
  return finalValue;
};
