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
          subjects: [], // Will be populated with subject names only
          totalClassesPerPeriod: estimateTotalClasses(jsonData),
        };
        
        // Extract subjects and their column indices
        const { subjects, subjectColumns } = extractSubjectsAndColumns(jsonData);
        
        // Update classData with subject names only
        classData.subjects = subjects;
        
        // Process student rows with the detailed column mapping
        const students = processStudentRows(jsonData, subjectColumns, classData.totalClassesPerPeriod);
        
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

/**
 * New function that extracts subjects and their column indices
 * Each subject has associated M (Média), F (Faltas), and AC (Ausências Compensadas) columns
 */
function extractSubjectsAndColumns(jsonData: any[]): { 
  subjects: string[], 
  subjectColumns: Record<string, { 
    subject: number, 
    media: number, 
    faltas: number, 
    ausenciasCompensadas: number 
  }> 
} {
  const headerRow = findHeaderRow(jsonData);
  if (headerRow === -1) return { subjects: [], subjectColumns: {} };
  
  const header = jsonData[headerRow];
  const subjects: string[] = [];
  const subjectColumns: Record<string, { 
    subject: number, 
    media: number, 
    faltas: number, 
    ausenciasCompensadas: number 
  }> = {};
  
  console.log('\n=== Extracting Subjects and Columns ===');
  console.log('Header row:', header);
  
  // Identify column index for each element in header
  const columnIndices: Record<string, number[]> = {};
  for (let i = 0; i < header.length; i++) {
    const column = String(header[i] || '').trim();
    if (!column) continue;
    
    if (!columnIndices[column]) {
      columnIndices[column] = [];
    }
    columnIndices[column].push(i);
    console.log(`Column "${column}" found at index ${i}`);
  }

  // Look for the pattern of subject name followed by M, F, AC columns
  for (let i = 0; i < header.length; i++) {
    const potentialSubject = String(header[i] || '').trim();
    
    // Skip empty and standard non-subject columns
    if (!potentialSubject || 
        potentialSubject === 'ALUNO' || 
        potentialSubject === 'Nº' || 
        potentialSubject === 'M' || 
        potentialSubject === 'F' || 
        potentialSubject === 'AC' || 
        potentialSubject === 'TOTAL' || 
        potentialSubject === 'TF' || 
        potentialSubject === 'Fre(%)' || 
        potentialSubject === 'FT An' || 
        potentialSubject === 'Fre An(%)') {
      continue;
    }
    
    // Check if this is followed by M, F, AC pattern
    if (i + 1 < header.length && String(header[i + 1] || '').trim() === 'M' &&
        i + 2 < header.length && String(header[i + 2] || '').trim() === 'F' &&
        i + 3 < header.length && String(header[i + 3] || '').trim() === 'AC') {
      
      subjects.push(potentialSubject);
      subjectColumns[potentialSubject] = {
        subject: i,     // Column index of the subject name
        media: i + 1,   // Column index of M (Média)
        faltas: i + 2,  // Column index of F (Faltas)
        ausenciasCompensadas: i + 3 // Column index of AC (Ausências Compensadas)
      };
      
      console.log(`Found subject: "${potentialSubject}" at column ${i} with M:${i+1}, F:${i+2}, AC:${i+3}`);
      
      // Skip the M, F, AC columns as we've already processed them
      i += 3;
    }
  }
  
  console.log(`Extracted ${subjects.length} subjects with column mapping:`, subjectColumns);
  
  return { subjects, subjectColumns };
}

function extractSubjects(jsonData: any[]): string[] {
  const { subjects } = extractSubjectsAndColumns(jsonData);
  return subjects;
}

function processStudentRows(
  jsonData: any[], 
  subjectColumns: Record<string, {
    subject: number,
    media: number,
    faltas: number,
    ausenciasCompensadas: number
  }>,
  totalClassesPerPeriod?: number
): Student[] {
  const headerRow = findHeaderRow(jsonData);
  if (headerRow === -1) return [];
  
  console.log('\n=== Processing Student Rows with New Column Mapping ===');
  const header = jsonData[headerRow];
  console.log('Header row:', header);
  
  const students: Student[] = [];
  
  // Find special columns with exact header matching
  let totalCol = -1, tfCol = -1, freqCol = -1, ftAnCol = -1, freqAnCol = -1;
  for (let i = 0; i < header.length; i++) {
    const cellValue = String(header[i] || '').trim();
    
    if (cellValue === 'TOTAL') totalCol = i;
    else if (cellValue === 'TF') tfCol = i;
    else if (cellValue === 'Fre(%)') freqCol = i;
    else if (cellValue === 'FT An') ftAnCol = i;
    else if (cellValue === 'Fre An(%)') freqAnCol = i;
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
    
    // Process each subject using the detailed column mapping
    for (const [subject, columns] of Object.entries(subjectColumns)) {
      const mediaValue = row[columns.media];
      const faltasValue = row[columns.faltas];
      const acValue = row[columns.ausenciasCompensadas];
      
      console.log(`Subject ${subject} - Media: ${mediaValue}, Faltas: ${faltasValue}, AC: ${acValue}`);
      
      const grade = Number(mediaValue || 0);
      const absences = Number(faltasValue || 0);
      const compensatedAbsences = Number(acValue || 0);
      
      const subjectData = {
        number: columns.subject,  // Using column index as number
        grade: grade,
        absences: absences,
        compensatedAbsences: compensatedAbsences
      };
      
      totalStudentAbsences += absences;
      studentSubjects[subject] = subjectData;
    }

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
    
    let yearlyAbsences = ftAnCol > -1 ? Number(row[ftAnCol] || 0) : totalAbsences * 2;
    
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
