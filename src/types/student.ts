
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
  lowFrequency: boolean;
  manualFrequency?: boolean; // Flag para indicar se a frequência foi calculada manualmente
  totalClasses?: number; // Total de aulas no período (se disponível)
}

export interface ClassData {
  name: string;
  year: string;
  period: string;
  totalStudents: number;
  belowAverageCount: number;
  subjects: string[];
  totalClassesPerPeriod?: number; // Novo campo para o total de aulas no período
}

export interface BehavioralCode {
  code: string;
  description: string;
  color: string;
}
