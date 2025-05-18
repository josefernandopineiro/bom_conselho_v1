
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
  
  // First pass: identify all potential subjects and their columns
  const potentialSubjects: {index: number, name: string}[] = [];
  
  for (let i = 0; i < header.length; i++) {
    const columnName = String(header[i] || '').trim();
    
    // Skip empty and standard columns
    if (!columnName || standardColumns.some(stdCol => 
      columnName.toUpperCase() === stdCol.toUpperCase())) {
      continue;
    }
    
    // Skip if this is a known data column (M, F, AC)
    if (/^(M|F|AC)$/i.test(columnName)) {
      continue;
    }
    
    // This could be a subject
    potentialSubjects.push({index: i, name: columnName});
    console.log(`Found potential subject: "${columnName}" at column ${i}`);
  }
  
  // Second pass: analyze patterns to map subjects to their M, F, AC columns
  for (let i = 0; i < potentialSubjects.length; i++) {
    const subject = potentialSubjects[i];
    const nextSubject = i < potentialSubjects.length - 1 ? potentialSubjects[i + 1] : null;
    
    // Determine the range to search for M, F, AC columns
    const searchEndIdx = nextSubject ? nextSubject.index : header.length;
    
    // Initialize with default values (-1 means not found)
    let mediaIdx = -1;
    let faltasIdx = -1;
    let acIdx = -1;
    
    // Look for explicit M, F, AC pattern after the subject
    for (let j = subject.index + 1; j < searchEndIdx; j++) {
      const colName = String(header[j] || '').trim().toUpperCase();
      
      if (colName === 'M' && mediaIdx === -1) {
        mediaIdx = j;
      } else if (colName === 'F' && faltasIdx === -1) {
        faltasIdx = j;
      } else if (colName === 'AC' && acIdx === -1) {
        acIdx = j;
      }
    }
    
    // If we found the pattern, consider this a valid subject
    if (mediaIdx !== -1 && faltasIdx !== -1) {
      // AC is optional, if not found, set it to the next column after F
      if (acIdx === -1) {
        acIdx = faltasIdx + 1;
        // Verify this is actually an AC column (not strictly required)
        const acColName = String(header[acIdx] || '').trim().toUpperCase();
        if (acColName !== 'AC' && acColName !== '') {
          // If next column isn't empty and isn't "AC", use same as F (no AC data)
          acIdx = faltasIdx;
        }
      }
      
      subjects.push(subject.name);
      subjectColumns[subject.name] = {
        subject: subject.index,
        media: mediaIdx,
        faltas: faltasIdx,
        ausenciasCompensadas: acIdx
      };
      
      console.log(`Confirmed subject: "${subject.name}" with columns - M:${mediaIdx}, F:${faltasIdx}, AC:${acIdx}`);
    } 
    // As fallback, if we have at least 3 columns between this subject and next, assume they are M, F, AC
    else if ((nextSubject && (nextSubject.index - subject.index >= 4)) || 
             (!nextSubject && header.length - subject.index >= 4)) {
      
      // Assume M, F, AC are the next three columns after the subject
      mediaIdx = subject.index + 1;
      faltasIdx = subject.index + 2;
      acIdx = subject.index + 3;
      
      subjects.push(subject.name);
      subjectColumns[subject.name] = {
        subject: subject.index,
        media: mediaIdx,
        faltas: faltasIdx,
        ausenciasCompensadas: acIdx
      };
      
      console.log(`Inferred subject: "${subject.name}" with columns - M:${mediaIdx}, F:${faltasIdx}, AC:${acIdx}`);
    }
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
