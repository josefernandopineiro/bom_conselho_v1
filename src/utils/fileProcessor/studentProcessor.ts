
import { Student } from '@/types/student';
import { findHeaderRow } from './subjectExtractors';
import { calculateFrequency, convertToPercentage } from './calculationUtils';

/**
 * Process the student data rows from the file
 */
export function processStudentRows(
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
