import * as XLSX from 'xlsx';
import { Student, ClassData } from '@/types/student';

export const processMapaoFile = (file: File): Promise<{
  students: Student[];
  classData: ClassData;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('Raw JSON Data:', jsonData);
        
        // Extract header information
        const classData: ClassData = {
          name: extractClassNameFromHeader(jsonData),
          year: extractYearFromHeader(jsonData),
          period: extractPeriodFromHeader(jsonData),
          totalStudents: 0,
          belowAverageCount: 0,
          subjects: extractSubjects(jsonData),
        };
        
        console.log('Extracted subjects:', classData.subjects);
        
        // Process student rows
        const students = processStudentRows(jsonData, classData.subjects);
        
        // Update class data counts
        classData.totalStudents = students.length;
        classData.belowAverageCount = students.filter(s => s.averageGrade < 5).length;
        
        resolve({ students, classData });
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        reject(new Error('Erro ao processar o arquivo. Verifique se o formato está correto.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro na leitura do arquivo.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

function findHeaderRow(jsonData: any[]): number {
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row) && String(row[0]).toUpperCase() === 'ALUNO') {
      return i;
    }
  }
  return -1;
}

function extractSubjects(jsonData: any[]): string[] {
  const headerRow = findHeaderRow(jsonData);
  if (headerRow === -1) return [];
  
  const header = jsonData[headerRow];
  const subjects: string[] = [];
  
  // Start from column 2 (after ALUNO and Situação)
  let col = 2;
  
  while (col < header.length) {
    const cell = String(header[col] || '').trim();
    
    // If we find a subject name (not one of the special columns)
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
      
      // Add the subject if it's not already in the list
      if (!subjects.includes(cell)) {
        subjects.push(cell);
      }
      
      // Skip the 4 columns for this subject (Nº, M, F, AC)
      col += 4;
    } else {
      // Move to the next column
      col++;
    }
  }
  
  return subjects;
}

function processStudentRows(jsonData: any[], subjects: string[]): Student[] {
  const headerRow = findHeaderRow(jsonData);
  if (headerRow === -1) return [];
  
  const header = jsonData[headerRow];
  const students: Student[] = [];
  
  // Map column indices to subjects
  const subjectColumns: Record<string, number> = {};
  let col = 2; // Start after ALUNO and Situação
  
  subjects.forEach(subject => {
    // Find where this subject starts in the header
    while (col < header.length) {
      if (String(header[col]).trim() === subject) {
        subjectColumns[subject] = col;
        // Move past this subject's columns (Nº, M, F, AC)
        col += 4;
        break;
      }
      col++;
    }
  });
  
  // Find the special columns (TOTAL, TF, Fre(%), FT An, Fre An(%))
  let totalCol = -1, tfCol = -1, freqCol = -1, ftAnCol = -1, freqAnCol = -1;
  for (let i = 0; i < header.length; i++) {
    const cellValue = String(header[i] || '').trim();
    if (cellValue === 'TOTAL') totalCol = i;
    else if (cellValue === 'TF') tfCol = i;
    else if (cellValue === 'Fre(%)') freqCol = i;
    else if (cellValue === 'FT An') ftAnCol = i;
    else if (cellValue === 'Fre An(%)') freqAnCol = i;
  }
  
  console.log('Special columns:', { totalCol, tfCol, freqCol, ftAnCol, freqAnCol });
  
  // Process each student
  for (let i = headerRow + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || !Array.isArray(row) || !row[0]) continue;
    
    const name = String(row[0]);
    const status = String(row[1] || '');
    
    // Skip non-active students
    if (status.toLowerCase() !== 'ativo') continue;
    
    const studentSubjects: Record<string, any> = {};
    let totalGrade = 0;
    let subjectCount = 0;
    
    // Process each subject for this student
    subjects.forEach(subject => {
      const subjectStartCol = subjectColumns[subject];
      if (subjectStartCol !== undefined) {
        const subjectData = {
          number: Number(row[subjectStartCol] || 0),
          grade: Number(row[subjectStartCol + 1] || 0),
          absences: Number(row[subjectStartCol + 2] || 0),
          correctedAbsences: Number(row[subjectStartCol + 3] || 0)
        };
        
        studentSubjects[subject] = subjectData;
        totalGrade += subjectData.grade;
        subjectCount++;
      }
    });
    
    // Process total columns
    let totalAbsences = 0;
    let frequency = 0; // Default to 0 instead of 100
    let yearlyAbsences = 0;
    let yearlyFrequency = 0; // Default to 0 instead of 100
    
    // Extract values directly from the correct columns
    if (tfCol > -1) totalAbsences = Number(row[tfCol] || 0);
    
    // Handle frequency values
    if (freqCol > -1) {
      frequency = calculateFrequencyValue(row[freqCol]);
      console.log(`Student ${name} period frequency:`, { 
        rawValue: row[freqCol], 
        calculatedFrequency: frequency 
      });
    }
    
    if (ftAnCol > -1) yearlyAbsences = Number(row[ftAnCol] || 0);
    
    // Handle yearly frequency
    if (freqAnCol > -1) {
      yearlyFrequency = calculateFrequencyValue(row[freqAnCol]);
      console.log(`Student ${name} yearly frequency:`, {
        rawValue: row[freqAnCol],
        calculatedYearlyFrequency: yearlyFrequency
      });
    }
    
    // Calculate lowFrequency based on proper percentage values
    const lowFrequency = frequency < 70 || yearlyFrequency < 70;
    
    console.log(`Student ${name} frequencies:`, { 
      totalAbsences, 
      frequency, 
      yearlyAbsences, 
      yearlyFrequency,
      rawFreq: row[freqCol],
      rawFreqAn: row[freqAnCol],
      lowFrequency
    });
    
    students.push({
      id: i - headerRow,
      name,
      status,
      averageGrade: subjectCount > 0 ? totalGrade / subjectCount : 0,
      behavioralCodes: [],
      subjects: studentSubjects,
      totalAbsences,
      frequency,
      yearlyAbsences,
      yearlyFrequency,
      lowFrequency
    });
  }
  
  return students;
}

/**
 * Calculates the frequency value from various formats
 * @param value - The raw frequency value from the Excel file
 * @returns The calculated frequency percentage
 */
function calculateFrequencyValue(value: any): number {
  // Handle null or undefined
  if (value === null || value === undefined) {
    return 0;
  }
  
  // Convert to string to handle all cases uniformly
  const strValue = String(value).trim();
  
  // Handle empty string
  if (strValue === '') {
    return 0;
  }
  
  // Try to extract numeric value
  let numericValue: number;
  
  // Check if it's in percentage format like "75%"
  if (strValue.includes('%')) {
    numericValue = parseFloat(strValue.replace('%', '').trim());
  } 
  // Check if it's in decimal format like "0.75"
  else if (strValue.includes('.') && parseFloat(strValue) < 1) {
    numericValue = parseFloat(strValue) * 100;
  } 
  // Otherwise try to parse it as a plain number
  else {
    numericValue = parseFloat(strValue);
  }
  
  // Return valid number or 0 if parsing failed
  return isNaN(numericValue) ? 0 : numericValue;
}

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
