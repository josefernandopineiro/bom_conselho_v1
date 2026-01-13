import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import * as fs from 'fs';
import * as path from 'path';

const files = [
    'arquivos modelos/MAPAO__4050_-_ADMINISTRAÇÃO_-_2ª_SERIE_A_INTEGRAL_7H_T2_ANUAL_CONSELHO_TERCEIRO_BIMESTRE_10102025_1102.xlsx',
    'arquivos modelos/MAPAO__4050_-_ADMINISTRAÇAO_-_2ª_SERIE_A_MANHA_ANUAL_CONSELHO_TERCEIRO_BIMESTRE_09102025_1031.xlsx',
    'arquivos modelos/MAPAO__4050_-_ADMINISTRAÇÃO_-_3ª_SERIE_A_INTEGRAL_7H_T2_ANUAL_CONSELHO_TERCEIRO_BIMESTRE_10102025_1106.xlsx',
    'arquivos modelos/MAPAO__4050_-_ADMINISTRAÇÃO_-_3ª_SERIE_A_MANHA_ANUAL_CONSELHO_TERCEIRO_BIMESTRE_10102025_0943.xlsx'
];

function inspectFile(filePath) {
    console.log('\n================================================================');
    console.log(`INSPECTING: ${filePath}`);
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`);
        return;
    }

    const workbook = XLSX.readFile(fullPath);
    const sheetName = workbook.SheetNames[0];
    console.log(`Sheet Name: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('--- RAW ROW DUMP (0-19) ---');
    for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
        const row = jsonData[i];
        // Print row index and first few defined columns to identify structure
        console.log(`[Row ${i}]:`, JSON.stringify(row));
    }
}

files.forEach(inspectFile);
