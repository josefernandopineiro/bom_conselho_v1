
import * as XLSX from 'xlsx';
import { parseCSVInBrowser } from './csvParser';

/**
 * Reads an Excel or CSV file and returns the parsed data as JSON
 */
export const readFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        let jsonData: any[];
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          // Process CSV file using browser-compatible approach
          const csvContent = content as string;
          jsonData = parseCSVInBrowser(csvContent);
        } else {
          // Process Excel file
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        }
        
        resolve(jsonData);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        reject(new Error('Erro ao processar o arquivo. Verifique se o formato está correto.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro na leitura do arquivo.'));
    };
    
    // Read file appropriately based on type
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};
