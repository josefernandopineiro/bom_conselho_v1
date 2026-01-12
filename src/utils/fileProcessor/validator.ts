
import { z } from 'zod';

/**
 * Schema para validar dados de aluno extraídos do Excel
 */
export const StudentDataSchema = z.object({
    id: z.number(),
    name: z.string().min(1, 'Nome do aluno é obrigatório'),
    status: z.string(),
    averageGrade: z.number().min(0).max(10),
    behavioralCodes: z.array(z.string()),
    observations: z.string().optional(),
    paee: z.boolean().optional(),
    subjects: z.record(z.object({
        number: z.number(),
        grade: z.number().min(0).max(10).nullable(),
        absences: z.number().min(0),
        compensatedAbsences: z.number().min(0),
    })),
    totalAbsences: z.number().min(0),
    frequency: z.number().min(0).max(100),
    yearlyAbsences: z.number().min(0),
    yearlyFrequency: z.number().min(0).max(100),
    lowFrequency: z.boolean(),
    manualFrequency: z.boolean().optional(),
    totalClasses: z.number().min(1).optional(),
});

/**
 * Schema para validar dados da turma extraídos do Excel
 */
export const ClassDataSchema = z.object({
    name: z.string().min(1, 'Nome da turma é obrigatório'),
    year: z.string().regex(/^\d{4}$/, 'Ano deve ter 4 dígitos'),
    period: z.string().min(1, 'Período é obrigatório'),
    totalStudents: z.number().min(0),
    belowAverageCount: z.number().min(0),
    subjects: z.array(z.string()),
    totalClassesPerPeriod: z.number().min(1).optional(),
});

/**
 * Valida dados de um aluno
 */
export function validateStudentData(data: unknown) {
    return StudentDataSchema.safeParse(data);
}

/**
 * Valida dados da turma
 */
export function validateClassData(data: unknown) {
    return ClassDataSchema.safeParse(data);
}
