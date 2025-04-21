
import * as XLSX from 'xlsx';

export interface Student {
  id: number;
  name: string;
  status: string;
  averageGrade: number;
  behavioralCodes: string[];
  subjects: Record<string, number>;
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
        
        // Assumimos que a primeira planilha contém os dados do Mapão
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Processa os dados do cabeçalho para extrair informações da turma
        const classData: ClassData = {
          name: extractClassNameFromHeader(jsonData),
          year: extractYearFromHeader(jsonData),
          period: extractPeriodFromHeader(jsonData),
          totalStudents: 0, // Será atualizado depois
          belowAverageCount: 0, // Será atualizado depois
          subjects: extractSubjects(jsonData),
        };
        
        // Processa as linhas de alunos
        const students = processStudentRows(jsonData);
        
        // Atualiza as contagens da turma
        classData.totalStudents = students.length;
        classData.belowAverageCount = students.filter(s => s.averageGrade < 7).length;
        
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

// Funções auxiliares para extrair informações específicas do arquivo

function extractClassNameFromHeader(jsonData: any[]): string {
  // Procuramos pela linha que contém "Turma:" no arquivo
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
  // Procuramos pela linha que contém "Ano Letivo:" no arquivo
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
  // Procuramos pela linha que contém informações do período/bimestre
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

function extractSubjects(jsonData: any[]): string[] {
  // Procuramos pela linha de cabeçalho que contém os nomes das disciplinas
  // Geralmente esta linha tem "ALUNO", "SITUAÇÃO", etc.
  let headerRow: any[] = [];
  let headerRowIndex = -1;
  
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row) && row.length > 2) {
      const firstCol = String(row[0] || '').toUpperCase();
      if (firstCol === 'ALUNO') {
        headerRow = row;
        headerRowIndex = i;
        break;
      }
    }
  }
  
  if (headerRowIndex === -1) return [];
  
  // Ignora as primeiras colunas que são administrativas (ALUNO, SITUAÇÃO, etc.)
  // e pega apenas os nomes das disciplinas
  const subjects: string[] = [];
  for (let i = 2; i < headerRow.length; i++) {
    const colName = String(headerRow[i] || '');
    if (colName && !colName.includes('TOTAL') && !colName.includes('%')) {
      subjects.push(colName);
    }
  }
  
  return subjects;
}

function processStudentRows(jsonData: any[]): Student[] {
  // Encontra a linha de cabeçalho primeiro
  let headerRowIndex = -1;
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row) && row.length > 2) {
      const firstCol = String(row[0] || '').toUpperCase();
      if (firstCol === 'ALUNO') {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  if (headerRowIndex === -1) return [];
  
  const headerRow = jsonData[headerRowIndex];
  const students: Student[] = [];
  
  // Mapeia os índices das colunas importantes
  const nameIndex = headerRow.findIndex((col: string) => String(col).toUpperCase() === 'ALUNO');
  const statusIndex = headerRow.findIndex((col: string) => String(col).toUpperCase() === 'SITUAÇÃO');
  
  // Encontra os índices das disciplinas
  const subjectIndices: { [key: string]: number } = {};
  for (let i = 0; i < headerRow.length; i++) {
    const colName = String(headerRow[i] || '');
    if (colName && !colName.includes('TOTAL') && !colName.includes('%') && 
        colName.toUpperCase() !== 'ALUNO' && colName.toUpperCase() !== 'SITUAÇÃO') {
      subjectIndices[colName] = i;
    }
  }
  
  // Processa as linhas dos alunos
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || !Array.isArray(row) || row.length < 3) continue;
    
    const name = String(row[nameIndex] || '');
    if (!name) continue; // Pula linhas sem nome
    
    const status = String(row[statusIndex] || 'Ativo');
    
    // Extrai as notas das disciplinas
    const subjects: Record<string, number> = {};
    let totalGrade = 0;
    let subjectCount = 0;
    
    Object.entries(subjectIndices).forEach(([subjectName, index]) => {
      if (index < row.length) {
        const gradeValue = row[index];
        // Converte para número se possível, ou usa 0
        const grade = typeof gradeValue === 'number' ? gradeValue : 
                     !isNaN(Number(gradeValue)) ? Number(gradeValue) : 0;
        
        subjects[subjectName] = grade;
        totalGrade += grade;
        subjectCount++;
      }
    });
    
    // Calcula a média
    const averageGrade = subjectCount > 0 ? totalGrade / subjectCount : 0;
    
    students.push({
      id: i - headerRowIndex, // Gera um ID baseado na posição
      name,
      status,
      averageGrade,
      behavioralCodes: [], // Inicialmente vazio, será preenchido depois
      subjects,
    });
  }
  
  return students;
}
