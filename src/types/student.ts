
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
  lowFrequency?: boolean;
}

export interface ClassData {
  name: string;
  year: string;
  period: string;
  totalStudents: number;
  belowAverageCount: number;
  subjects: string[];
}

export interface BehavioralCode {
  code: string;
  description: string;
  color: string;
}
