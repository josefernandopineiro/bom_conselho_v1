
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, ClassData, BehavioralCode } from '@/types/student';

interface StudentsContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  classData: ClassData | null;
  setClassData: React.Dispatch<React.SetStateAction<ClassData | null>>;
  behavioralCodes: BehavioralCode[];
  setBehavioralCodes: React.Dispatch<React.SetStateAction<BehavioralCode[]>>;
  updateStudentBehavioralCodes: (studentId: number, codes: string[]) => void;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export const StudentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('processedStudents');
    return saved ? JSON.parse(saved) : [];
  });

  const [classData, setClassData] = useState<ClassData | null>(() => {
    const saved = localStorage.getItem('processedClassData');
    return saved ? JSON.parse(saved) : null;
  });

  const [behavioralCodes, setBehavioralCodes] = useState<BehavioralCode[]>(() => {
    const saved = localStorage.getItem('behavioralCodes');
    return saved ? JSON.parse(saved) : [
      { code: '1', description: 'Atitude Positiva', color: '#34a853' },
      { code: '2', description: 'Precisa de Atenção', color: '#fbbc05' },
      { code: '3', description: 'Dificuldade de Aprendizagem', color: '#f57c00' },
      { code: '4', description: 'Problemas de Comportamento', color: '#ea4335' },
      { code: '5', description: 'Encaminhamento Necessário', color: '#9c27b0' },
    ];
  });

  // Atualiza o localStorage quando os dados mudarem
  useEffect(() => {
    localStorage.setItem('processedStudents', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    if (classData) {
      localStorage.setItem('processedClassData', JSON.stringify(classData));
    }
  }, [classData]);

  useEffect(() => {
    localStorage.setItem('behavioralCodes', JSON.stringify(behavioralCodes));
  }, [behavioralCodes]);

  // Função para atualizar as classificações comportamentais de um aluno
  const updateStudentBehavioralCodes = (studentId: number, codes: string[]) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId 
          ? { ...student, behavioralCodes: codes } 
          : student
      )
    );
  };

  return (
    <StudentsContext.Provider value={{
      students,
      setStudents,
      classData,
      setClassData,
      behavioralCodes,
      setBehavioralCodes,
      updateStudentBehavioralCodes
    }}>
      {children}
    </StudentsContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context;
};
