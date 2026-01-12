import { Student, ClassData } from '@/types/student';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';

export async function generateStudentDocx(student: Student, classData: ClassData, behavioralCodeMap?: Record<string,string>) {
  const doc = new Document();

  doc.addSection({
    children: [
      new Paragraph({ children: [new TextRun({ text: classData.name || '', bold: true, size: 28 })] }),
      new Paragraph({ children: [new TextRun(`Relatório do aluno: ${student.name}${student.paee ? ' (PAEE)' : ''}`)] }),
      new Paragraph({ children: [new TextRun('')] }),
      new Paragraph({ children: [new TextRun('Identificação')], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun(`Turma: ${classData.name || ''}`)] }),
      new Paragraph({ children: [new TextRun(`Período: ${classData.period || ''}`)] }),
      new Paragraph({ children: [new TextRun('')] }),
      new Paragraph({ children: [new TextRun('Desempenho Acadêmico')], spacing: { after: 200 } }),
      // simple table for subjects
      (() => {
        const rows: any[] = [];
        rows.push(new TableRow({ children: [
          new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph('Disciplina')] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph('Nota')] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph('Situação')] }),
        ]}));

        Object.entries(student.subjects).forEach(([subject, data]) => {
          rows.push(new TableRow({ children: [
            new TableCell({ children: [new Paragraph(subject)] }),
            new TableCell({ children: [new Paragraph(String((data as any).grade))] }),
            new TableCell({ children: [new Paragraph(((data as any).grade >= 5) ? 'Aprovado' : 'Abaixo da média')] }),
          ]}));
        });

        return new Table({ rows });
      })(),
      new Paragraph({ children: [new TextRun('')] }),
      new Paragraph({ children: [new TextRun(`Frequência atual: ${Math.round(student.frequency || 0)}%`)] }),
      new Paragraph({ children: [new TextRun(`Frequência anual: ${Math.round(student.yearlyFrequency || 0)}%`)] }),
      new Paragraph({ children: [new TextRun('')] }),
      new Paragraph({ children: [new TextRun('Avaliação Comportamental')], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun(student.behavioralCodes && student.behavioralCodes.length > 0 ? student.behavioralCodes.map((c: string) => `${c} - ${behavioralCodeMap?.[c] || ''}`).join(', ') : 'Não classificado')] }),
      new Paragraph({ children: [new TextRun('')] }),
      new Paragraph({ children: [new TextRun('Observações')], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun(student.observations || '')] }),
    ]
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

export async function generateMinutesDocx(
  classData: ClassData,
  minutesNotes: string,
  improvementPoints: string,
  bestWithPaee: string[],
  attentionList: string[]
) {
  const doc = new Document();

  doc.addSection({
    children: [
      new Paragraph({ children: [new TextRun({ text: `Ata do Conselho - ${classData.name || ''}`, bold: true, size: 28 })] }),
      new Paragraph({ children: [new TextRun(`Período: ${classData.period || ''} — Ano: ${classData.year || ''}`)] }),
      new Paragraph({ children: [new TextRun('')] }),
      new Paragraph({ children: [new TextRun('Resumo da Turma')], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun(`Total de alunos: ${classData.totalStudents || 0}`)] }),
      new Paragraph({ children: [new TextRun(`Alunos abaixo da média: ${classData.belowAverageCount || 0}`)] }),
      new Paragraph({ children: [new TextRun('')] }),
      new Paragraph({ children: [new TextRun('Melhores Alunos (sugeridos)')], spacing: { after: 200 } }),
      ...(bestWithPaee.length > 0 ? bestWithPaee.map(name => new Paragraph(name)) : [new Paragraph('Nenhuma sugestão')]),
      new Paragraph({ children: [new TextRun('')] }),
      new Paragraph({ children: [new TextRun('Alunos que necessitam apoio pedagógico')], spacing: { after: 200 } }),
      ...(attentionList.length > 0 ? attentionList.map(item => new Paragraph(item)) : [new Paragraph('Nenhum aluno indicado')]),
      new Paragraph({ children: [new TextRun('')] }),
      new Paragraph({ children: [new TextRun('Pontos de Melhoria')], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun(improvementPoints || '')] }),
      new Paragraph({ children: [new TextRun('')] }),
      new Paragraph({ children: [new TextRun('Anotações da Reunião')], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun(minutesNotes || '')] }),
    ]
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
