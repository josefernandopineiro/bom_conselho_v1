
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
 * Extracts subjects and their column indices
 * Each subject has associated M (Média), F (Faltas), and AC (Ausências Compensadas) columns
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
  
  console.log('\n=== Extracting Subjects and Columns ===');
  console.log('Header row:', header);
  
  // Identify column index for each element in header
  const columnIndices: Record<string, number[]> = {};
  for (let i = 0; i < header.length; i++) {
    const column = String(header[i] || '').trim();
    if (!column) continue;
    
    if (!columnIndices[column]) {
      columnIndices[column] = [];
    }
    columnIndices[column].push(i);
    console.log(`Column "${column}" found at index ${i}`);
  }

  // Look for the pattern of subject name followed by M, F, AC columns
  for (let i = 0; i < header.length; i++) {
    const potentialSubject = String(header[i] || '').trim();
    
    // Skip empty and standard non-subject columns
    if (!potentialSubject || 
        potentialSubject === 'ALUNO' || 
        potentialSubject === 'Nº' || 
        potentialSubject === 'M' || 
        potentialSubject === 'F' || 
        potentialSubject === 'AC' || 
        potentialSubject === 'TOTAL' || 
        potentialSubject === 'TF' || 
        potentialSubject === 'Fre(%)' || 
        potentialSubject === 'FT An' || 
        potentialSubject === 'Fre An(%)') {
      continue;
    }
    
    // Check if this is followed by M, F, AC pattern
    if (i + 1 < header.length && String(header[i + 1] || '').trim() === 'M' &&
        i + 2 < header.length && String(header[i + 2] || '').trim() === 'F' &&
        i + 3 < header.length && String(header[i + 3] || '').trim() === 'AC') {
      
      subjects.push(potentialSubject);
      subjectColumns[potentialSubject] = {
        subject: i,     // Column index of the subject name
        media: i + 1,   // Column index of M (Média)
        faltas: i + 2,  // Column index of F (Faltas)
        ausenciasCompensadas: i + 3 // Column index of AC (Ausências Compensadas)
      };
      
      console.log(`Found subject: "${potentialSubject}" at column ${i} with M:${i+1}, F:${i+2}, AC:${i+3}`);
      
      // Skip the M, F, AC columns as we've already processed them
      i += 3;
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
