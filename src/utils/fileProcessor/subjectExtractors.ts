
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
  
  const header = jsonData[headerRow];
  const subjects: string[] = [];
  const subjectColumns: Record<string, { 
    subject: number, 
    media: number, 
    faltas: number, 
    ausenciasCompensadas: number 
  }> = {};
  
  console.log('\n=== Extracting Subjects and Columns (Improved) ===');
  console.log('Header row:', header);
  
  // Identify standard non-subject columns for exclusion
  const standardColumns = ['ALUNO', 'Nº', 'CHAMADA', 'NÚMERO', 'TOTAL', 'SITUAÇÃO', 'STATUS', 'TF', 'Fre(%)', 'FT An', 'Fre An(%)'];
  
  // Enhanced detection: support two-row headers where the top row contains subject names
  const potentialSubjects: { index: number; name: string }[] = [];
  const topRow = headerRow > 0 ? jsonData[headerRow - 1] : null;

  if (topRow && Array.isArray(topRow)) {
    // Propagate merged/blank cells in topRow: when a cell has a subject name, assume it applies
    // to following columns until the next non-empty cell.
    let currentSubject: string | null = null;
    for (let i = 0; i < header.length; i++) {
      const topCell = String(topRow[i] || '').trim();
      const primaryCell = String(header[i] || '').trim();

      // If top row cell looks like a subject (not empty and not a data column), set currentSubject
      if (topCell && !/^(M|F|AC|TF|Fre\(\%\)|FT An|Fre An\(\%\))$/i.test(topCell) && !standardColumns.some(sc => topCell.toUpperCase() === sc.toUpperCase())) {
        currentSubject = topCell;
      }

      // If currentSubject set and primaryCell indicates subject data (M/F/AC) or primaryCell is empty,
      // mark this column as belonging to currentSubject
      if (currentSubject) {
        // Only push when we encounter the first data column after the subject name (subject start)
        const already = potentialSubjects.find(p => p.name === currentSubject);
        if (!already) {
          potentialSubjects.push({ index: i, name: currentSubject });
          console.log(`Found subject from top row: "${currentSubject}" at approx column ${i}`);
        }
      } else {
        // fallback: if primaryCell is a non-M/F/AC and not a standard column, consider it a subject
        if (primaryCell && !/^(M|F|AC)$/i.test(primaryCell) && !standardColumns.some(sc => primaryCell.toUpperCase() === sc.toUpperCase())) {
          potentialSubjects.push({ index: i, name: primaryCell });
          console.log(`Found potential subject in primary header: "${primaryCell}" at column ${i}`);
        }
      }
    }
  } else {
    // Single-row header fallback (existing behavior)
    for (let i = 0; i < header.length; i++) {
      const columnName = String(header[i] || '').trim();
      if (!columnName || standardColumns.some(stdCol => columnName.toUpperCase() === stdCol.toUpperCase())) continue;
      if (/^(M|F|AC)$/i.test(columnName)) continue;
      potentialSubjects.push({ index: i, name: columnName });
      console.log(`Found potential subject: "${columnName}" at column ${i}`);
    }
  }

  // Second pass: map each detected subject to its M/F/AC columns using the primary header row
  for (let i = 0; i < potentialSubjects.length; i++) {
    const subject = potentialSubjects[i];
    const nextSubject = i < potentialSubjects.length - 1 ? potentialSubjects[i + 1] : null;
    const searchEndIdx = nextSubject ? nextSubject.index : header.length;

    let mediaIdx = -1;
    let faltasIdx = -1;
    let acIdx = -1;

    for (let j = subject.index; j < searchEndIdx; j++) {
      const colName = String(header[j] || '').trim().toUpperCase();
      if (colName === 'M' && mediaIdx === -1) mediaIdx = j;
      else if (colName === 'F' && faltasIdx === -1) faltasIdx = j;
      else if (colName === 'AC' && acIdx === -1) acIdx = j;
    }

    // If no explicit M/F/AC found, try scanning a small window after the subject index
    if (mediaIdx === -1 && subject.index + 1 < header.length) mediaIdx = subject.index + 1;
    if (faltasIdx === -1 && subject.index + 2 < header.length) faltasIdx = subject.index + 2;
    if (acIdx === -1 && subject.index + 3 < header.length) acIdx = subject.index + 3;

    // Validate and adjust AC if it points to a non-empty label that is not AC
    const acColName = String(header[acIdx] || '').trim().toUpperCase();
    if (acColName && acColName !== 'AC') {
      acIdx = faltasIdx; // fallback to same as faltas
    }

    subjects.push(subject.name);
    subjectColumns[subject.name] = {
      subject: subject.index,
      media: mediaIdx,
      faltas: faltasIdx,
      ausenciasCompensadas: acIdx
    };

    console.log(`Mapped subject: "${subject.name}" -> M:${mediaIdx}, F:${faltasIdx}, AC:${acIdx}`);
  }
  
  // If we didn't find any subjects with the expected pattern, try a more aggressive approach
  if (subjects.length === 0) {
    console.log('No standard subject patterns found. Trying alternative detection...');
    
    // Group columns in sets of 4 (subject + M + F + AC)
    for (let i = 0; i < potentialSubjects.length; i++) {
      const subject = potentialSubjects[i];
      
      if (subject.index + 3 < header.length) {
        subjects.push(subject.name);
        subjectColumns[subject.name] = {
          subject: subject.index,
          media: subject.index + 1,
          faltas: subject.index + 2,
          ausenciasCompensadas: subject.index + 3
        };
        
        console.log(`Alternative detection - Subject: "${subject.name}" with assumed columns - M:${subject.index + 1}, F:${subject.index + 2}, AC:${subject.index + 3}`);
      }
    }
  }
  
  console.log(`Extracted ${subjects.length} subjects with column mapping:`, subjectColumns);
  
  return { subjects, subjectColumns };
}

/**
 * Extract just the subject names from the data
 */
export function extractSubjects(jsonData: any[]): string[] {
  const { subjects } = extractSubjectsAndColumns(jsonData);
  return subjects;
}
