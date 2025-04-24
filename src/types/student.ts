
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
    compensatedAbsences: number;
  }>;
  totalAbsences: number;
  frequency: number; // Frequency percentage for current period (0-100)
  yearlyAbsences: number;
  yearlyFrequency: number; // Yearly frequency percentage (0-100)
  lowFrequency: boolean;
  manualFrequency?: boolean; // Flag to indicate if frequency was calculated manually
  totalClasses?: number; // Total classes in the period (if available)
}

export interface ClassData {
  name: string;
  year: string;
  period: string;
  totalStudents: number;
  belowAverageCount: number;
  subjects: string[];
  totalClassesPerPeriod?: number; // Total number of classes in the period
}

export interface BehavioralCode {
  code: string;
  description: string;
  color: string;
}
