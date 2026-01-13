
import { Student } from '@/types/student';
import { findHeaderRow } from './subjectExtractors';
import { calculateFrequency, convertToPercentage } from './calculationUtils';
import { validateStudentData } from './validator';
import { identifyColumn, ColumnType } from './headerNormalizer';

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

  // Find special columns using header and optional subHeader
  let totalCol = -1, tfCol = -1, freqCol = -1, ftAnCol = -1, freqAnCol = -1, paeeCol = -1;
  const labelRows: any[] = [];
  labelRows.push(header);
  if (Array.isArray(jsonData[headerRow + 1])) labelRows.push(jsonData[headerRow + 1]);
  if (Array.isArray(jsonData[headerRow + 2])) labelRows.push(jsonData[headerRow + 2]);
  if (Array.isArray(jsonData[headerRow + 3])) labelRows.push(jsonData[headerRow + 3]);

  const cellText = (i: number) => {
    const parts: string[] = [];
    for (const r of labelRows) {
      try { parts.push(String(r[i] || '').trim()); } catch (e) { parts.push(''); }
    }
    const headerText = parts[0] || '';
    const sub = parts.slice(1).join(' ');
    return { header: headerText, sub: sub, combined: `${headerText} ${sub}`.trim() };
  };

  const isMatch = (text: string, pattern: RegExp) => pattern.test(String(text || ''));

  // Calculate max length to cover all subheader columns (crucial for merged headers like TOTAL)
  const maxLen = labelRows.reduce((max, row) => Math.max(max, (row && row.length) || 0), 0);

  // Robust Column Identification using centralized normalizer
  for (let i = 0; i < maxLen; i++) {
    const { header: h, sub: s } = cellText(i);
    const type = identifyColumn(h, s);

    if (type === ColumnType.Total) totalCol = i;
    else if (type === ColumnType.TotalAbsences) tfCol = i;
    else if (type === ColumnType.PeriodAttendance) freqCol = i;
    else if (type === ColumnType.AnnualAbsences) ftAnCol = i;
    else if (type === ColumnType.AnnualAttendance) freqAnCol = i;
    else if (type === ColumnType.PAEE) paeeCol = i;
  }

  // Final safety: if both detected as same index, unset yearly to avoid duplication
  if (freqCol !== -1 && freqAnCol === freqCol) {
    console.warn(`[studentProcessor] Fre% e Fre An% apontam para a mesma coluna (${freqCol}). Usando para período apenas.`);
    freqAnCol = -1;
  }

  // Log de debug para verificar detecção
  console.log(`[studentProcessor] Colunas detectadas: freqCol=${freqCol}, freqAnCol=${freqAnCol}, tfCol=${tfCol}, ftAnCol=${ftAnCol}, paeeCol=${paeeCol}`);

  // Log headers para debug
  if (freqAnCol > -1) {
    const { header: h, sub: s } = cellText(freqAnCol);
    console.log(`[studentProcessor] Coluna Fre An(%) detectada no índice ${freqAnCol}: header="${h}", sub="${s}"`);
  } else {
    console.warn(`[studentProcessor] ⚠️ Coluna Fre An(%) NÃO DETECTADA! Verifique o header do Excel.`);
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
          const v = String(row[k] || '').replace(',', '.').replace('%', '').trim();
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

    // CRITICAL: Read annual frequency from Excel with detailed logging
    let yearlyFrequency = NaN;
    if (freqAnCol > -1) {
      const rawValue = row[freqAnCol];
      console.log(`[studentProcessor] Aluno "${name}": Lendo Fre An(%) da coluna ${freqAnCol}, valor bruto="${rawValue}"`);
      yearlyFrequency = convertToPercentage(rawValue);
      console.log(`[studentProcessor] Aluno "${name}": Fre An(%) convertido = ${yearlyFrequency}${isNaN(yearlyFrequency) ? ' (NaN - valor inválido!)' : '%'}`);
    } else {
      console.warn(`[studentProcessor] Aluno "${name}": freqAnCol=-1, coluna Fre An(%) não detectada`);
    }
    const paeeFlag = paeeCol > -1 ? (() => {
      const val = String(row[paeeCol] || '').trim().toUpperCase();
      // Aceita: "SIM", "S", "X", "1", "TRUE", "PAEE", ou qualquer texto não-vazio
      // Rejeita explicitamente: "NÃO", "NAO", "N", "0", "FALSE", "" (vazio)
      if (val === '' || val === '0' || val === 'N' || val === 'NÃO' || val === 'NAO' || val === 'FALSE') {
        return false;
      }
      return val.length > 0; // Qualquer outro texto não-vazio = true
    })() : false;


    // Apenas calcula frequência se NaN (ausente), NÃO se for 0 (pode ser real)
    let manualFrequency = false;
    if (isNaN(frequency) && totalClassesPerPeriod) {
      frequency = calculateFrequency(totalAbsences, totalClassesPerPeriod);
      manualFrequency = true;
    }

    let manualYearlyFrequency = false;
    if (isNaN(yearlyFrequency) && totalClassesPerPeriod) {
      const yearlyAbsences = ftAnCol > -1 ? (Number(row[ftAnCol]) || 0) : 0;
      console.log(`[studentProcessor] Aluno "${name}": Fre An(%) é NaN, tentando calcular a partir de faltas anuais (${yearlyAbsences})`);
      if (yearlyAbsences > 0) {
        yearlyFrequency = calculateFrequency(yearlyAbsences, (totalClassesPerPeriod || 111) * 2);
        manualYearlyFrequency = true;
        console.log(`[studentProcessor] Aluno "${name}": Fre An(%) calculado = ${yearlyFrequency}%`);
      } else {
        // Se não tem faltas anuais no Excel, não inventa dados
        console.warn(`[studentProcessor] Aluno "${name}": ⚠️ Fre An(%) não encontrado no Excel e sem faltas anuais para calcular. Será 0.`);
        yearlyFrequency = NaN;
      }
    }

    // Converte NaN para 0 apenas para exibição (mantém distinção interna)
    if (isNaN(frequency)) frequency = 0;
    if (isNaN(yearlyFrequency)) {
      console.warn(`[studentProcessor] Aluno "${name}": ⚠️ Fre An(%) final = NaN (Valor ausente ou inválido)`);
      // User explicitly forbade silent fallback to 0. Leaving as NaN.
    }

    const lowFrequency = frequency < 70 || yearlyFrequency < 70;

    const student: Student = {
      id: i - headerRow,
      name,
      status,
      averageGrade: 0,
      behavioralCodes: [],
      subjects: studentSubjects,
      totalAbsences,
      frequency,
      yearlyAbsences: ftAnCol > -1 ? (Number(row[ftAnCol]) || 0) : 0,
      yearlyFrequency,
      lowFrequency,
      paee: paeeFlag,
      manualFrequency: manualFrequency || manualYearlyFrequency,
      totalClasses: totalClassesPerPeriod
    };

    // Validação de schema (apenas warnings, não bloqueia)
    const validation = validateStudentData(student);
    if (!validation.success) {
      console.warn(`[studentProcessor] Aluno "${name}" tem dados inválidos:`, validation.error.format());
    }

    students.push(student);
  }

  return students;
}
