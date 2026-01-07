
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
  if (value === null || value === undefined) return 0;
  const strValue = String(value).trim();
  if (strValue === '') return 0;
  const cleanValue = strValue.replace(/[%\s]/g, '').replace(',', '.');
  const numValue = parseFloat(cleanValue);
  if (isNaN(numValue)) return 0;
  if (numValue > 0 && numValue < 1) return Math.max(0, Math.min(100, numValue * 100));
  return Math.max(0, Math.min(100, numValue));
};
