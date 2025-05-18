
/**
 * Parse CSV content in browser environment
 * This function handles semicolon-separated CSV files
 */
export const parseCSVInBrowser = (csvContent: string): any[] => {
  // Split by lines and handle different line endings
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Parse each line by splitting on semicolons
  return lines.map(line => {
    // Handle quoted fields correctly
    const result: any[] = [];
    let field = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      // Handle quotes
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Double quotes inside quoted field - add a single quote
          field += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } 
      // Handle field separator (only if not in quotes)
      else if (char === ';' && !inQuotes) {
        // End of field, add to result
        result.push(field);
        field = '';
      } 
      // Add character to current field
      else {
        field += char;
      }
    }
    
    // Add the last field
    result.push(field);
    
    return result;
  });
};
