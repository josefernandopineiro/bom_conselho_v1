
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
  const header = jsonData[headerRow];
  const students: Student[] = [];

  // Find special columns; be tolerant to slight label variations and avoid confusing 'F' (faltas) with 'Fre(%)'
  let totalCol = -1, tfCol = -1, freqCol = -1, ftAnCol = -1, freqAnCol = -1;
  const normalize = (s: any) => String(s || '').toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9%]/g, '');
  for (let i = 0; i < header.length; i++) {
    const raw = normalize(header[i]);
    if (raw === 'TOTAL') totalCol = i;
    else if (raw === 'TF') tfCol = i;
    else if (raw.includes('FREAN') || raw.includes('FREANUAL')) freqAnCol = i;
    else if (raw.includes('FRE') && raw.includes('%')) freqCol = i;
    else if (raw === 'FRE' && freqCol === -1) freqCol = i; // fallback when heading is just 'Fre'
    else if (raw === 'FTAN') ftAnCol = i;
  }

  for (let i = headerRow + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || !Array.isArray(row) || !row[0]) continue;

    const name = String(row[0] || '').trim();
    const status = String(row[1] || '').trim();
    if (status.toLowerCase() !== 'ativo') continue;

    const studentSubjects: Record<string, any> = {};
    let totalStudentAbsences = 0;

    for (const [subject, columns] of Object.entries(subjectColumns)) {
      // Use the media column determined by the extractor when available.
      // Only fallback to nearby numeric heuristics when extractor didn't find an M column.
      let mediaIdx = columns.media;
      if (typeof mediaIdx !== 'number' || mediaIdx < 0) {
        let found = -1;
        for (let k = Math.max(0, (columns.subject || 0) - 2); k <= Math.min(row.length - 1, (columns.subject || 0) + 6); k++) {
          const v = String(row[k] || '').replace(',', '.').replace('%','').trim();
          const n = parseFloat(v);
          if (!isNaN(n) && n >= 0 && n <= 10) { found = k; break; }
        }
        if (found !== -1) mediaIdx = found;
      }

      const mediaValue = row[mediaIdx];
      const faltasValue = row[columns.faltas];
      const acValue = row[columns.ausenciasCompensadas];

      // Parse grade: support '-' as null, comma decimals
      const gradeRaw = String(mediaValue || '').trim();
      const grade = gradeRaw === '-' || gradeRaw === '' ? null : (() => {
        const n = parseFloat(gradeRaw.replace(',', '.'));
        return isNaN(n) ? null : n;
      })();

      const absences = (() => {
        const n = parseInt(String(faltasValue || '').replace(/[^0-9\-]/g, ''), 10);
        return isNaN(n) ? 0 : n;
      })();

      const compensatedAbsences = (() => {
        const n = parseInt(String(acValue || '').replace(/[^0-9\-]/g, ''), 10);
        return isNaN(n) ? 0 : n;
      })();

      totalStudentAbsences += absences;
      studentSubjects[subject] = { number: columns.subject, grade, absences, compensatedAbsences };
    }

    const totalAbsences = tfCol > -1 ? (Number(row[tfCol]) || totalStudentAbsences) : totalStudentAbsences;
    let frequency = freqCol > -1 ? convertToPercentage(row[freqCol]) : NaN;
    let yearlyFrequency = freqAnCol > -1 ? convertToPercentage(row[freqAnCol]) : NaN;

    if ((isNaN(frequency) || frequency === 0) && totalClassesPerPeriod) {
      frequency = calculateFrequency(totalAbsences, totalClassesPerPeriod);
    }
    if ((isNaN(yearlyFrequency) || yearlyFrequency === 0) && totalClassesPerPeriod) {
      const yearlyAbsences = ftAnCol > -1 ? (Number(row[ftAnCol]) || totalAbsences * 2) : totalAbsences * 2;
      yearlyFrequency = calculateFrequency(yearlyAbsences, (totalClassesPerPeriod || 111) * 2);
    }

    if (isNaN(frequency)) frequency = 0;
    if (isNaN(yearlyFrequency)) yearlyFrequency = 0;

    const lowFrequency = frequency < 70 || yearlyFrequency < 70;

    students.push({
      id: i - headerRow,
      name,
      status,
      averageGrade: 0,
      behavioralCodes: [],
      subjects: studentSubjects,
      totalAbsences,
      frequency,
      yearlyAbsences: ftAnCol > -1 ? (Number(row[ftAnCol]) || totalAbsences * 2) : totalAbsences * 2,
      yearlyFrequency,
      lowFrequency,
      manualFrequency: false,
      totalClasses: totalClassesPerPeriod
    });
  }

  return students;
}
