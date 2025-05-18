
import { Student, ClassData } from '@/types/student';
import { readFile } from './fileReaders';
import { extractClassData } from './headerExtractors';
import { extractSubjectsAndColumns } from './subjectExtractors';
import { processStudentRows } from './studentProcessor';

export const processMapaoFile = (file: File): Promise<{
  students: Student[];
  classData: ClassData;
}> => {
  return new Promise((resolve, reject) => {
    readFile(file)
      .then(jsonData => {
        try {
          console.log('Raw JSON Data:', jsonData);
          
          // Extract class metadata
          const classData = extractClassData(jsonData);
          
          // Extract subjects and their column indices
          const { subjects, subjectColumns } = extractSubjectsAndColumns(jsonData);
          
          // Update classData with subject names only
          classData.subjects = subjects;
          
          // Process student rows with the detailed column mapping
          const students = processStudentRows(jsonData, subjectColumns, classData.totalClassesPerPeriod);
          
          // Update class data counts
          classData.totalStudents = students.length;
          classData.belowAverageCount = students.filter(s => {
            // Check if any subject has grade < 5
            return Object.values(s.subjects).some(subject => subject.grade < 5);
          }).length;
          
          resolve({ students, classData });
        } catch (error) {
          console.error('Erro ao processar dados do arquivo:', error);
          reject(new Error('Erro ao processar o arquivo. Verifique se o formato está correto.'));
        }
      })
      .catch(error => {
        console.error('Erro na leitura do arquivo:', error);
        reject(new Error('Erro na leitura do arquivo.'));
      });
  });
};

// Re-export all utilities for external use if needed
export * from './fileReaders';
export * from './csvParser';
export * from './headerExtractors';
export * from './subjectExtractors';
export * from './studentProcessor';
export * from './calculationUtils';
