
import * as XLSX from 'xlsx';
import { Student, ClassData } from '@/types/student';

export const processMapaoFile = (file: File): Promise<{
  students: Student[];
  classData: ClassData;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        let jsonData: any[];
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          // Process CSV file using browser-compatible approach
          const csvContent = content as string;
          jsonData = parseCSVInBrowser(csvContent);
        } else {
          // Process Excel file
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        }
        
        console.log('Raw JSON Data:', jsonData);
        
        // Extract header information
        const classData: ClassData = {
          name: extractClassNameFromHeader(jsonData),
          year: extractYearFromHeader(jsonData),
          period: extractPeriodFromHeader(jsonData),
          totalStudents: 0,
          belowAverageCount: 0,
          subjects: extractSubjects(jsonData), // Fix: extractSubjects now returns string[]
          totalClassesPerPeriod: estimateTotalClasses(jsonData),
        };
        
        // Process student rows
        const students = processStudentRows(jsonData, classData.subjects, classData.totalClassesPerPeriod);
        
        // Update class data counts
        classData.totalStudents = students.length;
        classData.belowAverageCount = students.filter(s => {
          // Check if any subject has grade < 5
          return Object.values(s.subjects).some(subject => subject.grade < 5);
        }).length;
        
        resolve({ students, classData });
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        reject(new Error('Erro ao processar o arquivo. Verifique se o formato está correto.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro na leitura do arquivo.'));
    };
    
    // Read file appropriately based on type
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

/**
 * Parse CSV content in browser environment
 * This function handles semicolon-separated CSV files
 */
const parseCSVInBrowser = (csvContent: string): any[] => {
  // Split by lines and handle different line endings
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Parse each line by splitting on semicolons
  return lines.map(line => {
    // Handle quoted fields correctly
    const result: any[] = [];
    let field = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      // Handle quotes
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Double quotes inside quoted field - add a single quote
          field += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } 
      // Handle field separator (only if not in quotes)
      else if (char === ';' && !inQuotes) {
        // End of field, add to result
        result.push(field);
        field = '';
      } 
      // Add character to current field
      else {
        field += char;
      }
    }
    
    // Add the last field
    result.push(field);
    
    return result;
  });
};

function estimateTotalClasses(jsonData: any[]): number | undefined {
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

function findHeaderRow(jsonData: any[]): number {
  console.log('\n=== Finding Header Row ===');
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row)) {
      console.log(`Row ${i}:`, row);
      if (String(row[0]).toUpperCase() === 'ALUNO') {
        console.log('Found header row at index:', i);
        return i;
      }
    }
  }
  return -1;
}

function extractSubjects(jsonData: any[]): string[] {
  const headerRow = findHeaderRow(jsonData);
  if (headerRow === -1) return []; // Fix: Return empty array instead of undefined[]
  
  const header = jsonData[headerRow];
  const subjects: string[] = [];
  
  let col = 2;
  
  while (col < header.length) {
    const cell = String(header[col] || '').trim();
    
    if (cell && 
        cell !== 'Nº' && 
        cell !== 'M' && 
        cell !== 'F' && 
        cell !== 'AC' && 
        cell !== 'TOTAL' && 
        cell !== 'TF' && 
        cell !== 'Fre(%)' && 
        cell !== 'FT An' && 
        cell !== 'Fre An(%)') {
      
      if (!subjects.includes(cell)) {
        subjects.push(cell);
      }
      
      col += 4;
    } else {
      col++;
    }
  }
  
  return subjects; // Fix: Now correctly returns string[]
}

function processStudentRows(jsonData: any[], subjects: string[], totalClassesPerPeriod?: number): Student[] {
  const headerRow = findHeaderRow(jsonData);
  if (headerRow === -1) return [];
  
  console.log('\n=== Processing Header Row ===');
  const header = jsonData[headerRow];
  console.log('Header row:', header);
  
  const students: Student[] = [];
  
  const subjectColumns: Record<string, number> = {};
  let col = 2;
  
  subjects.forEach(subject => {
    while (col < header.length) {
      if (String(header[col]).trim() === subject) {
        subjectColumns[subject] = col;
        col += 4;
        break;
      }
      col++;
    }
  });
  
  let totalCol = -1, tfCol = -1, freqCol = -1, ftAnCol = -1, freqAnCol = -1;
  
  // Find special columns with exact header matching and debug logging
  for (let i = 0; i < header.length; i++) {
    const cellValue = String(header[i] || '').trim();
    console.log(`Column ${i}: "${cellValue}"`);
    
    if (cellValue === 'TOTAL') totalCol = i;
    else if (cellValue === 'TF') tfCol = i;
    else if (cellValue === 'Fre(%)') {
      freqCol = i;
      console.log('Found Fre(%) column at index:', i);
    }
    else if (cellValue === 'FT An') ftAnCol = i;
    else if (cellValue === 'Fre An(%)') {
      freqAnCol = i;
      console.log('Found Fre An(%) column at index:', i);
    }
  }
  
  console.log('Special columns detected:', {
    totalCol,
    tfCol,
    freqCol,
    ftAnCol,
    freqAnCol
  });

  for (let i = headerRow + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || !Array.isArray(row) || !row[0]) continue;
    
    const name = String(row[0]);
    console.log(`\n=== Processing student: ${name} ===`);
    
    const status = String(row[1] || '');
    
    if (status.toLowerCase() !== 'ativo') continue;

    const studentSubjects: Record<string, any> = {};
    let totalStudentAbsences = 0;
    
    subjects.forEach(subject => {
      const subjectStartCol = subjectColumns[subject];
      if (subjectStartCol !== undefined) {
        const absences = Number(row[subjectStartCol + 2] || 0);
        
        const subjectData = {
          number: Number(row[subjectStartCol] || 0),
          grade: Number(row[subjectStartCol + 1] || 0),
          absences: absences,
          compensatedAbsences: Number(row[subjectStartCol + 3] || 0)
        };
        
        totalStudentAbsences += absences;
        studentSubjects[subject] = subjectData;
      }
    });

    // Get total absences from the TF column if available, otherwise use calculated total
    const totalAbsences = tfCol > -1 ? Number(row[tfCol] || 0) : totalStudentAbsences;
    
    console.log('Raw frequency values:', {
      'Fre(%)': freqCol > -1 ? row[freqCol] : 'Column not found',
      'Fre An(%)': freqAnCol > -1 ? row[freqAnCol] : 'Column not found'
    });
    
    // Extract frequency values with detailed logging
    let frequency = freqCol > -1 ? convertToPercentage(row[freqCol]) : 0;
    let yearlyFrequency = freqAnCol > -1 ? convertToPercentage(row[freqAnCol]) : 0;
    
    console.log('Processed frequency values:', {
      frequency,
      yearlyFrequency,
      totalAbsences,
      calculatedTotalAbsences: totalStudentAbsences
    });
    
    // Extract frequency values - try direct extraction first
    // let frequency = freqCol > -1 ? convertToPercentage(row[freqCol]) : 0;
    // let yearlyAbsences = ftAnCol > -1 ? Number(row[ftAnCol] || 0) : totalAbsences * 2;
    let yearlyAbsences = ftAnCol > -1 ? Number(row[ftAnCol] || 0) : totalAbsences * 2;
    // let yearlyFrequency = freqAnCol > -1 ? convertToPercentage(row[freqAnCol]) : 0;
    
    // Log raw values for debugging
    // console.log(`Student ${name} raw values:`, {
    //   rawFrequency: row[freqCol],
    //   convertedFrequency: frequency,
    //   rawYearlyFreq: row[freqAnCol],
    //   convertedYearlyFreq: yearlyFrequency,
    //   totalAbsences: totalAbsences,
    //   calculatedTotalAbsences: totalStudentAbsences
    // });

    // Flag to indicate if we manually calculated the frequency
    let manualFrequency = false;
    let calculatedFrequency = frequency;
    let calculatedYearlyFrequency = yearlyFrequency;
    
    // If frequency is 0 or not available, calculate it manually
    if (frequency === 0 || isNaN(frequency)) {
      manualFrequency = true;
      const totalClasses = totalClassesPerPeriod || 111;
      calculatedFrequency = calculateFrequency(totalAbsences, totalClasses);
      
      // Assume yearly classes are double the period classes (typical for semester-based systems)
      const yearlyClasses = totalClasses * 2;
      calculatedYearlyFrequency = calculateFrequency(yearlyAbsences, yearlyClasses);
      
      console.log(`Student ${name} manual frequency calculation:`, {
        totalClasses,
        totalAbsences,
        calculatedFrequency,
        yearlyClasses,
        yearlyAbsences,
        calculatedYearlyFrequency
      });
    }

    const lowFrequency = calculatedFrequency < 70 || calculatedYearlyFrequency < 70;

    students.push({
      id: i - headerRow,
      name,
      status,
      averageGrade: 0, // We no longer need this for individual evaluation
      behavioralCodes: [],
      subjects: studentSubjects,
      totalAbsences,
      frequency: calculatedFrequency,
      yearlyAbsences,
      yearlyFrequency: calculatedYearlyFrequency,
      lowFrequency,
      manualFrequency,
      totalClasses: totalClassesPerPeriod
    });
    
    // Final log to verify the processed student data
    console.log(`Student ${name} processed frequency data:`, {
      totalAbsences,
      frequency: calculatedFrequency,
      yearlyAbsences,
      yearlyFrequency: calculatedYearlyFrequency,
      lowFrequency,
      manualFrequency
    });
  }
  
  return students;
}

/**
 * Calculate frequency percentage based on absences and total classes
 * Formula: Frequency = (1 - (Absences / TotalClasses)) * 100
 */
function calculateFrequency(absences: number, totalClasses: number): number {
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
// function convertToPercentage(value: any): number {
//   if (value === null || value === undefined) {
//     return 0;
//   }
  
//   // Convert to string and trim whitespace
//   const strValue = String(value).trim();
  
//   if (strValue === '') {
//     return 0;
//   }
  
//   // Remove percentage sign and any spaces
//   const cleanValue = strValue.replace(/[%\s]/g, '');
  
//   // Replace comma with dot for decimal values
//   const normalizedValue = cleanValue.replace(',', '.');
  
//   // Convert to number
//   const numValue = parseFloat(normalizedValue);
  
//   if (isNaN(numValue)) {
//     return 0;
//   }
  
//   // If the value is a decimal less than 1, multiply by 100
//   if (numValue > 0 && numValue < 1) {
//     return numValue * 100;
//   }
  
//   // Ensure value is between 0 and 100
//   return Math.max(0, Math.min(100, numValue));
// }

const convertToPercentage = (value: any): number => {
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

function extractClassNameFromHeader(jsonData: any[]): string {
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

function extractYearFromHeader(jsonData: any[]): string {
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

function extractPeriodFromHeader(jsonData: any[]): string {
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
