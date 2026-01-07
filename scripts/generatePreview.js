import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const MODELOS_DIR = path.resolve(process.cwd(), 'arquivos modelos');
const OUT_DIR = path.resolve(process.cwd(), 'preview');

function readXlsx(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
}

function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (Array.isArray(row)) {
      for (const cell of row) {
        if (String(cell || '').toUpperCase().trim() === 'ALUNO') return i;
      }
    }
  }
  return -1;
}

function convertToPercentage(value) {
  if (value === null || value === undefined) return 0;
  const s = String(value).trim().replace(/[%\s]/g, '').replace(',', '.');
  if (s === '') return 0;
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  if (n > 0 && n < 1) return n * 100;
  return Math.max(0, Math.min(100, n));
}

function calculateFrequency(absences, totalClasses) {
  if (!totalClasses || totalClasses <= 0) return 0;
  const freq = (1 - (absences / totalClasses)) * 100;
  return Math.max(0, Math.min(100, freq));
}

function extractTotalClasses(rows) {
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const first = String(row[0] || '').toLowerCase();
    if (first.includes('total de aulas dadas')) {
      // try to find a number in the row
      for (const cell of row) {
        const num = parseInt(String(cell || '').replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && num > 0) return num;
      }
    }
  }
  return null;
}

function extractSubjectsAndColumns(rows, headerRow) {
  const header = rows[headerRow] || [];
  const topRow = headerRow > 0 ? rows[headerRow - 1] : null;
  const standardColumns = ['ALUNO','Nº','CHAMADA','NÚMERO','TOTAL','SITUAÇÃO','STATUS','TF','Fre(%)','FT An','Fre An(%)'];

  const potentialSubjects = [];

  if (topRow && Array.isArray(topRow)) {
    let currentSubject = null;
    for (let i = 0; i < header.length; i++) {
      const topCell = String(topRow[i] || '').trim();
      const primaryCell = String(header[i] || '').trim();
      if (topCell && !/^(M|F|AC|TF|Fre\(\%\)|FT An|Fre An\(\%\))$/i.test(topCell) && !standardColumns.some(sc => topCell.toUpperCase() === sc.toUpperCase())) {
        currentSubject = topCell.split(/\r?\n/)[0];
      }
      if (currentSubject) {
        const already = potentialSubjects.find(p => p.name === currentSubject);
        if (!already) potentialSubjects.push({ index: i, name: currentSubject });
      } else {
        if (primaryCell && !/^(M|F|AC)$/i.test(primaryCell) && !standardColumns.some(sc => primaryCell.toUpperCase() === sc.toUpperCase())) {
          potentialSubjects.push({ index: i, name: primaryCell.split(/\r?\n/)[0] });
        }
      }
    }
  } else {
    for (let i = 0; i < header.length; i++) {
      const columnName = String(header[i] || '').trim();
      if (!columnName || standardColumns.some(stdCol => columnName.toUpperCase() === stdCol.toUpperCase())) continue;
      if (/^(M|F|AC)$/i.test(columnName)) continue;
      potentialSubjects.push({ index: i, name: columnName.split(/\r?\n/)[0] });
    }
  }

  const subjects = [];
  const subjectColumns = {};

  for (let i = 0; i < potentialSubjects.length; i++) {
    const subject = potentialSubjects[i];
    const nextSubject = i < potentialSubjects.length - 1 ? potentialSubjects[i + 1] : null;
    const searchEndIdx = nextSubject ? nextSubject.index : header.length;

    let mediaIdx = -1, faltasIdx = -1, acIdx = -1;
    for (let j = subject.index; j < searchEndIdx; j++) {
      const colName = String(header[j] || '').trim().toUpperCase();
      if (colName === 'M' && mediaIdx === -1) mediaIdx = j;
      else if (colName === 'F' && faltasIdx === -1) faltasIdx = j;
      else if (colName === 'AC' && acIdx === -1) acIdx = j;
    }

    if (mediaIdx === -1 && subject.index + 1 < header.length) mediaIdx = subject.index + 1;
    if (faltasIdx === -1 && subject.index + 2 < header.length) faltasIdx = subject.index + 2;
    if (acIdx === -1 && subject.index + 3 < header.length) acIdx = subject.index + 3;

    const acColName = String(header[acIdx] || '').trim().toUpperCase();
    if (acColName && acColName !== 'AC') acIdx = faltasIdx;

    subjects.push(subject.name);
    subjectColumns[subject.name] = { subject: subject.index, media: mediaIdx, faltas: faltasIdx, ausenciasCompensadas: acIdx };
  }

  return { subjects, subjectColumns };
}

function processStudentRows(rows, headerRow, subjectColumns, totalClassesPerPeriod) {
  const header = rows[headerRow];
  let totalCol = -1, tfCol = -1, freqCol = -1, ftAnCol = -1, freqAnCol = -1;
  for (let i = 0; i < header.length; i++) {
    const cell = String(header[i] || '').trim();
    if (cell === 'TOTAL') totalCol = i;
    else if (cell === 'TF') tfCol = i;
    else if (cell === 'Fre(%)') freqCol = i;
    else if (cell === 'FT An') ftAnCol = i;
    else if (cell === 'Fre An(%)') freqAnCol = i;
  }

  const students = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row) || !row[0]) continue;
    const name = String(row[0]).trim();
    const status = String(row[1] || '').trim();
    if (status.toLowerCase() !== 'ativo') continue;

    const studentSubjects = {};
    let totalStudentAbsences = 0;

    for (const [subject, cols] of Object.entries(subjectColumns)) {
      const mediaValue = row[cols.media];
      const faltasValue = row[cols.faltas];
      const acValue = row[cols.ausenciasCompensadas];

      const grade = (() => { const n = parseFloat(String(mediaValue || '').replace(',', '.')); return isNaN(n) ? null : n; })();
      const absences = (() => { const n = parseInt(String(faltasValue || '').replace(/[^0-9\-]/g, ''), 10); return isNaN(n) ? 0 : n; })();
      const compensated = (() => { const n = parseInt(String(acValue || '').replace(/[^0-9\-]/g, ''), 10); return isNaN(n) ? 0 : n; })();

      totalStudentAbsences += absences;
      studentSubjects[subject] = { number: cols.subject, grade, absences, compensatedAbsences: compensated };
    }

    const totalAbsences = (tfCol > -1 ? Number(rows[i][tfCol] || 0) : totalStudentAbsences) || 0;
    let frequency = (freqCol > -1) ? convertToPercentage(rows[i][freqCol]) : null;
    let yearlyFrequency = (freqAnCol > -1) ? convertToPercentage(rows[i][freqAnCol]) : null;

    if ((frequency === null || isNaN(frequency) || frequency === 0) && totalClassesPerPeriod) {
      frequency = calculateFrequency(totalAbsences, totalClassesPerPeriod);
    } else if (frequency === null) frequency = 0;

    const yearlyAbsences = (ftAnCol > -1 ? Number(rows[i][ftAnCol] || 0) : totalAbsences * 2) || 0;
    if ((yearlyFrequency === null || isNaN(yearlyFrequency) || yearlyFrequency === 0) && totalClassesPerPeriod) {
      yearlyFrequency = calculateFrequency(yearlyAbsences, (totalClassesPerPeriod || 111) * 2);
    } else if (yearlyFrequency === null) yearlyFrequency = 0;

    const lowFrequency = frequency < 70 || yearlyFrequency < 70;

    students.push({ id: i - headerRow, name, status, subjects: studentSubjects, totalAbsences, frequency, yearlyAbsences, yearlyFrequency, lowFrequency });
  }

  return students;
}

function main() {
  if (!fs.existsSync(MODELOS_DIR)) {
    console.error('Models folder not found:', MODELOS_DIR);
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  const files = fs.readdirSync(MODELOS_DIR).filter(f => f.toLowerCase().endsWith('.xlsx') || f.toLowerCase().endsWith('.xls'));
  if (files.length === 0) {
    console.error('No Excel files found in', MODELOS_DIR);
    process.exit(1);
  }

  for (const f of files) {
    const full = path.join(MODELOS_DIR, f);
    console.log('\nProcessing', f);
    const rows = readXlsx(full);
    const totalClasses = extractTotalClasses(rows) || null;
    const headerRow = findHeaderRow(rows);
    if (headerRow === -1) {
      console.warn('Header row not found for', f);
      continue;
    }
    const { subjects, subjectColumns } = extractSubjectsAndColumns(rows, headerRow);
    const students = processStudentRows(rows, headerRow, subjectColumns, totalClasses);

    const out = { file: f, totalClassesPerPeriod: totalClasses, subjects, subjectColumns, studentsCount: students.length, sampleStudents: students.slice(0,8) };
    const outPath = path.join(OUT_DIR, f.replace(/\.(xlsx|xls)$/i, '.json'));
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('Wrote preview to', outPath);
    console.log('Subjects detected:', subjects);
    console.log('Students processed:', students.length);
  }
}

main();
