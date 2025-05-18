
import { ClassData } from '@/types/student';
import { findHeaderRow } from './subjectExtractors';

/**
 * Extract class metadata from the header section of the file
 */
export const extractClassData = (jsonData: any[]): ClassData => {
  const classData: ClassData = {
    name: extractClassNameFromHeader(jsonData),
    year: extractYearFromHeader(jsonData),
    period: extractPeriodFromHeader(jsonData),
    totalStudents: 0,
    belowAverageCount: 0,
    subjects: [], // Will be populated with subject names only
    totalClassesPerPeriod: estimateTotalClasses(jsonData),
  };
  
  return classData;
};

/**
 * Estimate the total number of classes in the period from file data
 */
export function estimateTotalClasses(jsonData: any[]): number | undefined {
  const defaultClasses = 111; // Setting default to 111 based on the report
  
  for (let i = 0; i < 20; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row)) {
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toLowerCase();
        if (cell.includes('total de aulas') || cell.includes('aulas totais')) {
          const nextCell = row[j + 1];
          if (nextCell && !isNaN(Number(nextCell))) {
            return Number(nextCell);
          }
        }
      }
    }
  }
  
  return defaultClasses;
}

/**
 * Extract the class name from the header
 */
export function extractClassNameFromHeader(jsonData: any[]): string {
  for (let i = 0; i < 10; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row) && row.length > 1) {
      const firstCol = String(row[0] || '');
      if (firstCol.includes('Turma:')) {
        return String(row[1] || 'Turma não identificada');
      }
    }
  }
  return 'Turma não identificada';
}

/**
 * Extract the school year from the header
 */
export function extractYearFromHeader(jsonData: any[]): string {
  for (let i = 0; i < 10; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row) && row.length > 1) {
      const firstCol = String(row[0] || '');
      if (firstCol.includes('Ano Letivo:')) {
        return String(row[1] || new Date().getFullYear().toString());
      }
    }
  }
  return new Date().getFullYear().toString();
}

/**
 * Extract the period from the header
 */
export function extractPeriodFromHeader(jsonData: any[]): string {
  for (let i = 0; i < 10; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row) && row.length > 1) {
      const firstCol = String(row[0] || '');
      if (firstCol.includes('Tipo Fechamento:')) {
        return String(row[1] || 'Período não identificado');
      }
    }
  }
  return 'Período não identificado';
}
