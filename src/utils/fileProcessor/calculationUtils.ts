
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
  if (value === null || value === undefined) return NaN; // Retorna NaN para ausência de dados
  const strValue = String(value).trim();
  if (strValue === '' || strValue === '-') return NaN; // NaN para vazios

  const cleanValue = strValue.replace(/[%\s]/g, '').replace(',', '.');
  const numValue = parseFloat(cleanValue);

  if (isNaN(numValue)) {
    console.warn(`[convertToPercentage] Valor inválido: "${value}"`);
    return NaN;
  }

  // Se valor entre 0 e 1, assume decimal (0.85 -> 85%)
  if (numValue > 0 && numValue < 1) {
    return Math.round(numValue * 100);
  }

  // Se valor > 100, é inválido
  if (numValue > 100) {
    console.warn(`[convertToPercentage] Percentual inválido (>100): ${numValue}`);
    return NaN;
  }

  // Se valor < 0, é inválido
  if (numValue < 0) {
    console.warn(`[convertToPercentage] Percentual inválido (<0): ${numValue}`);
    return NaN;
  }

  return Math.round(numValue);
};
