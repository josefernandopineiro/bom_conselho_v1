import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const folder = path.resolve(process.cwd(), 'arquivos modelos');

function readXlsx(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
  return data;
}

function printPreview(filePath) {
  console.log('\n--- File:', path.basename(filePath), '---');
  try {
    const rows = readXlsx(filePath);
    const preview = rows.slice(0, 8);
    preview.forEach((r, i) => console.log(`Row ${i}:`, r));
    console.log('Total rows:', rows.length);

    // Search for a header row containing 'ALUNO' (case-insensitive)
    let headerIdx = -1;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (Array.isArray(row)) {
        for (const cell of row) {
          if (String(cell || '').toUpperCase().trim() === 'ALUNO') {
            headerIdx = i;
            break;
          }
        }
      }
      if (headerIdx !== -1) break;
    }

    if (headerIdx === -1) {
      console.log('Header row with "ALUNO" not found in this file.');
    } else {
      console.log('\nFound header row at index:', headerIdx);
      const start = Math.max(0, headerIdx - 5);
      const end = Math.min(rows.length - 1, headerIdx + 5);
      for (let i = start; i <= end; i++) {
        console.log(`Row ${i}:`, rows[i]);
      }
    }
  } catch (err) {
    console.error('Error reading', filePath, err.message || err);
  }
}

function main() {
  if (!fs.existsSync(folder)) {
    console.error('Folder not found:', folder);
    process.exit(1);
  }

  const files = fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith('.xlsx') || f.toLowerCase().endsWith('.xls'));
  if (files.length === 0) {
    console.error('No Excel files found in', folder);
    process.exit(1);
  }

  for (const f of files) {
    const full = path.join(folder, f);
    printPreview(full);
  }
}

main();
