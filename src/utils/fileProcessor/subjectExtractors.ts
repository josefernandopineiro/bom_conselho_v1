
/**
 * Find the header row that contains column names (subjects and their attributes)
 */
export function findHeaderRow(jsonData: any[]): number {
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
 * Extracts subjects and their column indices with improved pattern recognition
 * Handles various formats of subject headers and their associated M (Média), F (Faltas), and AC (Ausências Compensadas) columns
 */
export function extractSubjectsAndColumns(jsonData: any[]): {
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

  const header = jsonData[headerRow] as any[];
  const subjects: string[] = [];
  const subjectColumns: Record<string, { subject: number; media: number; faltas: number; ausenciasCompensadas: number }> = {};

  const subHeader = Array.isArray(jsonData[headerRow + 1]) ? jsonData[headerRow + 1] as any[] : null;

  // helper to normalize cells
  const cellNorm = (v: any) => String(v || '').trim();

  // collect indices where the subHeader (preferred) or header (fallback) is exactly 'M'
  const mIndices: number[] = [];
  if (subHeader) {
    for (let j = 0; j < subHeader.length; j++) {
      if (cellNorm(subHeader[j]).toUpperCase() === 'M') mIndices.push(j);
    }
  }
  // fallback: if no subHeader M's, look for header cells equal to 'M'
  if (mIndices.length === 0) {
    for (let j = 0; j < header.length; j++) {
      if (cellNorm(header[j]).toUpperCase() === 'M') mIndices.push(j);
    }
  }

  // If we found explicit M columns, map each to a subject by looking left for the subject name
  if (mIndices.length > 0) {
    for (const mIdx of mIndices) {
      // find subject name: look at header at same column, or scan left for first non-empty header cell
      let subjName = cellNorm(header[mIdx]);
      if (!subjName) {
        for (let k = mIdx - 1; k >= 0; k--) {
          const h = cellNorm(header[k]);
          if (h) { subjName = h.split(/\r?\n/)[0]; break; }
        }
      } else {
        subjName = subjName.split(/\r?\n/)[0];
      }

      if (!subjName) {
        // As a last resort, skip unnamed M columns (cannot produce a valid discipline name)
        continue;
      }

      const normalized = subjName.toUpperCase();
      if (normalized === 'M' || normalized === 'F' || normalized === 'AC') continue;

      // determine subject start index: leftmost column where header equals subjName, or mIdx-1
      let subjectIndex = -1;
      for (let k = 0; k <= mIdx; k++) {
        if (cellNorm(header[k]).split(/\r?\n/)[0] === subjName) { subjectIndex = k; break; }
      }
      if (subjectIndex === -1) subjectIndex = Math.max(0, mIdx - 1);

      // find F and AC within a small window to the right of M
      let faltasIdx = -1;
      let acIdx = -1;
      for (let k = mIdx + 1; k <= Math.min(mIdx + 4, header.length - 1); k++) {
        const sSub = subHeader ? cellNorm(subHeader[k]).toUpperCase() : '';
        const sHead = cellNorm(header[k]).toUpperCase();
        if (sSub === 'F' || sHead === 'F') { faltasIdx = k; }
        if (sSub === 'AC' || sHead === 'AC') { acIdx = k; }
        if (faltasIdx !== -1 && acIdx !== -1) break;
      }

      // If not found, try searching a bit further for header labels
      if (faltasIdx === -1) {
        for (let k = mIdx + 1; k <= Math.min(mIdx + 6, header.length - 1); k++) {
          if (cellNorm(header[k]).toUpperCase() === 'F') { faltasIdx = k; break; }
        }
      }
      if (acIdx === -1) {
        for (let k = mIdx + 1; k <= Math.min(mIdx + 6, header.length - 1); k++) {
          if (cellNorm(header[k]).toUpperCase() === 'AC') { acIdx = k; break; }
        }
      }

      // register subject
      const finalName = subjName;
      if (!subjects.includes(finalName)) subjects.push(finalName);
      subjectColumns[finalName] = { subject: subjectIndex, media: mIdx, faltas: faltasIdx, ausenciasCompensadas: acIdx };
    }
  }

  // aggressive fallback: group sequential columns into blocks of 3 when nothing explicit found
  if (subjects.length === 0) {
    for (let i = 0; i < header.length; i++) {
      const name = cellNorm(header[i]);
      if (!name) continue;
      const upper = name.toUpperCase();
      if (upper === 'M' || upper === 'F' || upper === 'AC') continue;
      if (i + 2 < header.length) {
        const media = i + 1; const faltas = i + 2; const ac = i + 3 < header.length ? i + 3 : -1;
        subjects.push(name);
        subjectColumns[name] = { subject: i, media, faltas, ausenciasCompensadas: ac };
        i += 3;
      }
    }
  }

  return { subjects, subjectColumns };
}

/**
 * Extract just the subject names from the data
 */
export function extractSubjects(jsonData: any[]): string[] {
  const { subjects } = extractSubjectsAndColumns(jsonData);
  return subjects;
}
