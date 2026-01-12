
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

  // First pass: detect TOTAL and TF and FTAN and PAEE
  for (let i = 0; i < header.length; i++) {
    const { header: h, sub: s, combined } = cellText(i);
    const up = `${h} ${s}`.toUpperCase();
    if (/^TOTAL$/i.test(h) || /^TOTAL$/i.test(up)) totalCol = i;
    if (/^TF$/i.test(h) || /^TF$/i.test(up) || /^TOTAL\s*FALTAS$/i.test(up)) tfCol = i;
    if (/FTAN|FT\s*AN|FALTAS\s*ANUAL/i.test(h) || /FTAN|FTAN/i.test(up)) ftAnCol = i;
    if (/PAEE|PAE\b|ALUNO\s*PAEE/i.test(h) || /PAEE/i.test(up)) paeeCol = i;
  }
  // Second pass: detect frequency columns explicitly and distinctly
  // We'll scan headers and subheaders looking for explicit markers.
  for (let i = 0; i < header.length; i++) {
    const { header: h, sub: s } = cellText(i);
    const combined = `${h} ${s}`.toUpperCase();

    // Prefer explicit yearly markers
    if (freqAnCol === -1 && /\bFRE\b.*\bAN\b|\bFREAN\b|\bFRE\s*AN\b|\bFREQUEN[CÇ]A.*ANUAL\b|\bANUAL\b|FRE\s*AN\(?%?\)?/i.test(combined)) {
      freqAnCol = i;
      continue;
    }
  }

  for (let i = 0; i < header.length; i++) {
    const { header: h, sub: s } = cellText(i);
    const combined = `${h} ${s}`.toUpperCase();

    // Skip if this is the column already identified as yearly
    if (i === freqAnCol) continue;

    // Exclude per-discipline 'F' or 'FALTAS' columns by checking for exact small labels
    const looksLikePerDisciplineF = /^F$/.test((s || '').trim()) || /\bFALTAS\b/.test(combined) || /\bAC\b/.test((s || '').trim());
    if (looksLikePerDisciplineF) continue;

    // Period frequency markers: 'FRE', 'FRE(%)', 'FRE %', but avoid ones already marked as annual
    if (freqCol === -1 && (/\bFRE\b/.test(combined) || /FRE\s*\(|FRE.*%/.test(combined)) && !/\bAN\b|ANUAL|FRE.*AN/.test(combined)) {
      freqCol = i;
      continue;
    }
  }

  // Final safety: if both detected as same index, unset yearly to avoid duplication
  if (freqCol !== -1 && freqAnCol === freqCol) {
    console.warn(`[studentProcessor] Fre% e Fre An% apontam para a mesma coluna (${freqCol}). Usando para período apenas.`);
    freqAnCol = -1;
  }

  // Log de debug para verificar detecção
  console.log(`[studentProcessor] Colunas detectadas: freqCol=${freqCol}, freqAnCol=${freqAnCol}, tfCol=${tfCol}, ftAnCol=${ftAnCol}, paeeCol=${paeeCol}`);

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
    let yearlyFrequency = freqAnCol > -1 ? convertToPercentage(row[freqAnCol]) : NaN;
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
      if (yearlyAbsences > 0) {
        yearlyFrequency = calculateFrequency(yearlyAbsences, (totalClassesPerPeriod || 111) * 2);
        manualYearlyFrequency = true;
      } else {
        // Se não tem faltas anuais no Excel, não inventa dados
        yearlyFrequency = NaN;
      }
    }

    // Converte NaN para 0 apenas para exibição (mantém distinção interna)
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
      yearlyAbsences: ftAnCol > -1 ? (Number(row[ftAnCol]) || 0) : 0,
      yearlyFrequency,
      lowFrequency,
      paee: paeeFlag,
      manualFrequency: manualFrequency || manualYearlyFrequency,
      totalClasses: totalClassesPerPeriod
    });
  }

  return students;
}
