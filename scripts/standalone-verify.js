
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// --- COPIED LOGIC FROM headerNormalizer.ts ---
const ColumnType = {
    Unknown: 0,
    StudentName: 1,
    StudentStatus: 2,
    TotalAbsences: 3,        // TF
    PeriodAttendance: 4,     // Fre(%)
    AnnualAbsences: 5,       // FT An
    AnnualAttendance: 6,     // Fre An(%)
    PAEE: 7,
    DisciplineName: 8,
    Total: 9
};

const normalizeHeader = (text) => {
    return String(text || '')
        .trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .toUpperCase()
        .replace(/\s+/g, ' '); // Collapse spaces
};

const identifyColumn = (header, sub) => {
    const h = normalizeHeader(header);
    const s = normalizeHeader(sub);
    const combined = `${h} ${s}`.trim();

    // Explicit Exact Matches from Mapão Analysis
    if (s.includes('FRE AN(%)') || s.includes('FRE AN (%)')) return ColumnType.AnnualAttendance;
    if (combined.includes('FRE AN(%)') || combined.includes('FRE AN (%)')) return ColumnType.AnnualAttendance;

    if ((s.includes('FRE(%)') || s.includes('FRE (%)')) && !s.includes('AN')) return ColumnType.PeriodAttendance;

    if (s === 'TF' || h === 'TF' || combined.includes('TOTAL FALTAS')) return ColumnType.TotalAbsences;

    if (s === 'FT AN' || s === 'FTAN' || combined.includes('FALTAS ANUAIS')) return ColumnType.AnnualAbsences;

    if (combined.match(/FRE.*ANUAL/)) return ColumnType.AnnualAttendance;
    if (combined.match(/FRE.*AN\b/)) return ColumnType.AnnualAttendance;

    if (combined.includes('PAEE') || combined.includes('PUBLICO ALVO')) return ColumnType.PAEE;

    if (h === 'ALUNO' || h.includes('NOME DO ALUNO')) return ColumnType.StudentName;
    if (h === 'SITUACAO' || h === 'STATUS') return ColumnType.StudentStatus;

    return ColumnType.Unknown;
};

// --- COPIED LOGIC FROM calculationUtils.ts ---
const convertToPercentage = (value) => {
    if (value === null || value === undefined) return NaN;
    const strValue = String(value).trim();
    if (strValue === '' || strValue === '-') return NaN;

    const cleanValue = strValue.replace(/[%\s]/g, '').replace(',', '.');
    const numValue = parseFloat(cleanValue);

    if (isNaN(numValue)) return NaN;

    if (numValue > 0 && numValue < 1) {
        return Math.round(numValue * 100);
    }
    if (numValue > 100) return NaN;
    if (numValue < 0) return NaN;

    return Math.round(numValue);
};

// --- MAIN VERIFICATION LOGIC ---

const files = [
    'arquivos modelos/MAPAO__4050_-_ADMINISTRAÇÃO_-_2ª_SERIE_A_INTEGRAL_7H_T2_ANUAL_CONSELHO_TERCEIRO_BIMESTRE_10102025_1102.xlsx',
    'arquivos modelos/MAPAO__4050_-_ADMINISTRAÇAO_-_2ª_SERIE_A_MANHA_ANUAL_CONSELHO_TERCEIRO_BIMESTRE_09102025_1031.xlsx',
    'arquivos modelos/MAPAO__4050_-_ADMINISTRAÇÃO_-_3ª_SERIE_A_INTEGRAL_7H_T2_ANUAL_CONSELHO_TERCEIRO_BIMESTRE_10102025_1106.xlsx',
    'arquivos modelos/MAPAO__4050_-_ADMINISTRAÇÃO_-_3ª_SERIE_A_MANHA_ANUAL_CONSELHO_TERCEIRO_BIMESTRE_10102025_0943.xlsx'
];

function verifyFile(filePath) {
    console.log(`\n-----------------------------------------------------------`);
    console.log(`VERIFYING: ${path.basename(filePath)}`);
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.error(`File NOT found: ${filePath}`);
        return;
    }

    const workbook = XLSX.readFile(fullPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 1. Find Header Row (Simulating findHeaderRow)
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(data.length, 20); i++) {
        const row = data[i];
        if (!Array.isArray(row)) continue;
        const rowStr = row.map(c => String(c).toUpperCase()).join(' ');
        if (rowStr.includes('ALUNO') && rowStr.includes('TOTAL')) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.error('❌ Failed to find header row (ALUNO + TOTAL)');
        return;
    }
    console.log(`✅ Header Row detected at API index: ${headerRowIndex}`);

    // 2. Identify Columns
    const header = data[headerRowIndex];
    const subHeader = data[headerRowIndex + 1] || [];

    let freqAnCol = -1;

    const maxLen = Math.max(header.length, subHeader.length);
    console.log('--- Column Identification ---');
    for (let i = 0; i < maxLen; i++) {
        const h = String(header[i] || '');
        const s = String(subHeader[i] || '');
        const type = identifyColumn(h, s);

        if (type === ColumnType.AnnualAttendance) {
            freqAnCol = i;
            console.log(`✅ FOUND Annual Attendance (Fre An%) at Index ${i}`);
            console.log(`   Header: "${h}", Sub: "${s}"`);
        }
    }

    if (freqAnCol === -1) {
        console.error('❌ FAILED to detect Annual Attendance column using new logic!');
        return;
    }

    // 3. Extract Values (Proof of Data)
    console.log('--- Sample Data Extraction ---');
    let nonZeroCount = 0;
    let zeroCount = 0;
    let nanCount = 0;

    // Check first 10 students
    let count = 0;
    for (let i = headerRowIndex + 2; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue; // Skip empty
        const status = String(row[1] || '');
        if (status !== 'Ativo') continue;

        const rawVal = row[freqAnCol];
        const finalVal = convertToPercentage(rawVal);

        if (count < 5) {
            console.log(`   Student: ${row[0].substring(0, 20)}... | Raw: "${rawVal}" | Parsed: ${finalVal}%`);
        }

        if (isNaN(finalVal)) nanCount++;
        else if (finalVal === 0) zeroCount++;
        else nonZeroCount++;

        count++;
    }

    console.log(`--- Summary for ${count} Active Students ---`);
    console.log(`   Valid Non-Zero: ${nonZeroCount}`);
    console.log(`   Zero: ${zeroCount}`);
    console.log(`   NaN: ${nanCount}`);

    if (nonZeroCount > 0) {
        console.log('✅ TEST PASSED: Successfully extracted non-zero annual attendance.');
    } else {
        console.log('❌ TEST FAILED: All values are 0 or NaN.');
    }
}

files.forEach(verifyFile);
