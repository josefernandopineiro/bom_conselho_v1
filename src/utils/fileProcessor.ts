
import * as XLSX from 'xlsx';

export interface Student {
  id: number;
  name: string;
  status: string;
  averageGrade: number;
  behavioralCodes: string[];
  subjects: Record<string, {
    number: number;
    grade: number;
    absences: number;
    correctedAbsences: number;
  }>;
  totalAbsences: number;
  frequency: number;
  yearlyAbsences: number;
  yearlyFrequency: number;
}

export interface ClassData {
  name: string;
  year: string;
  period: string;
  totalStudents: number;
  belowAverageCount: number;
  subjects: string[];
}

export const processMapaoFile = (file: File): Promise<{
  students: Student[];
  classData: ClassData;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Extract header information
        const classData: ClassData = {
          name: extractClassNameFromHeader(jsonData),
          year: extractYearFromHeader(jsonData),
          period: extractPeriodFromHeader(jsonData),
          totalStudents: 0,
          belowAverageCount: 0,
          subjects: extractSubjects(jsonData),
        };
        
        // Process student rows
        const students = processStudentRows(jsonData);
        
        // Update class data counts
        classData.totalStudents = students.length;
        classData.belowAverageCount = students.filter(s => s.averageGrade < 5).length;
        
        resolve({ students, classData });
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        reject(new Error('Erro ao processar o arquivo. Verifique se o formato está correto.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro na leitura do arquivo.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

function findHeaderRow(jsonData: any[]): number {
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row) && String(row[0]).toUpperCase() === 'ALUNO') {
      return i;
    }
  }
  return -1;
}

function extractSubjects(jsonData: any[]): string[] {
  const headerRow = findHeaderRow(jsonData);
  if (headerRow === -1) return [];
  
  const header = jsonData[headerRow];
  const subjects: string[] = [];
  let currentSubject = '';
  
  for (let i = 2; i < header.length; i++) {
    const cell = String(header[i] || '').trim();
    if (cell && cell !== 'Nº' && cell !== 'M' && cell !== 'F' && cell !== 'AC' && 
        cell !== 'TOTAL' && cell !== 'TF' && cell !== 'Fre(%)' && 
        cell !== 'FT An' && cell !== 'Fre An(%)') {
      currentSubject = cell;
      if (!subjects.includes(currentSubject)) {
        subjects.push(currentSubject);
      }
    }
  }
  
  return subjects;
}

function processStudentRows(jsonData: any[]): Student[] {
  const headerRow = findHeaderRow(jsonData);
  if (headerRow === -1) return [];
  
  const students: Student[] = [];
  const subjects = extractSubjects(jsonData);
  
  for (let i = headerRow + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || !Array.isArray(row) || !row[0]) continue;
    
    const name = String(row[0]);
    const status = String(row[1] || '');
    
    // Skip non-active students
    if (status.toLowerCase() !== 'ativo') continue;
    
    const studentSubjects: Record<string, any> = {};
    let totalGrade = 0;
    let subjectCount = 0;
    let column = 2;
    
    // Process each subject
    subjects.forEach(subject => {
      const subjectData = {
        number: Number(row[column] || 0),
        grade: Number(row[column + 1] || 0),
        absences: Number(row[column + 2] || 0),
        correctedAbsences: Number(row[column + 3] || 0)
      };
      
      studentSubjects[subject] = subjectData;
      totalGrade += subjectData.grade;
      subjectCount++;
      column += 4;
    });
    
    // Process total columns
    const totalAbsences = Number(row[column] || 0);
    const frequency = Number(row[column + 1] || 0);
    const yearlyAbsences = Number(row[column + 2] || 0);
    const yearlyFrequency = Number(row[column + 3] || 0);
    
    students.push({
      id: i - headerRow,
      name,
      status,
      averageGrade: subjectCount > 0 ? totalGrade / subjectCount : 0,
      behavioralCodes: [],
      subjects: studentSubjects,
      totalAbsences,
      frequency,
      yearlyAbsences,
      yearlyFrequency
    });
  }
  
  return students;
}

function extractClassNameFromHeader(jsonData: any[]): string {
  for (let i = 0; i < 10; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row) && row.length > 1) {
      const firstCol = String(row[0] || '');
      if (firstCol.includes('Turma:')) {
        return String(row[1] || 'Turma não identificada');
      }
    }
  }
  return 'Turma não identificada';
}

function extractYearFromHeader(jsonData: any[]): string {
  for (let i = 0; i < 10; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row) && row.length > 1) {
      const firstCol = String(row[0] || '');
      if (firstCol.includes('Ano Letivo:')) {
        return String(row[1] || new Date().getFullYear().toString());
      }
    }
  }
  return new Date().getFullYear().toString();
}

function extractPeriodFromHeader(jsonData: any[]): string {
  for (let i = 0; i < 10; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row) && row.length > 1) {
      const firstCol = String(row[0] || '');
      if (firstCol.includes('Tipo Fechamento:')) {
        return String(row[1] || 'Período não identificado');
      }
    }
  }
  return 'Período não identificado';
}
