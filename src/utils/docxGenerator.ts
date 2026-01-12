import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';
import { Student, ClassData } from '@/types/student';

export async function generateStudentDocx(student: Student, classData: ClassData, behavioralCodeMap?: Record<string,string>) {
  const doc = new Document();

  doc.addSection({
    children: [
      new Paragraph({
        children: [new TextRun({ text: classData.name || '', bold: true, size: 28 })]
      }),
      new Paragraph({ children: [new TextRun(`Relatório do aluno: ${student.name}`)] }),
      new Paragraph({ children: [new TextRun('')]}),
      new Paragraph({ children: [new TextRun('Identificação')], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun(`Turma: ${classData.name || ''}`)] }),
      new Paragraph({ children: [new TextRun(`Período: ${classData.period || ''}`)] }),
      new Paragraph({ children: [new TextRun('')]}),
      new Paragraph({ children: [new TextRun('Desempenho Acadêmico')], spacing: { after: 200 } }),
      // simple table for subjects
      (() => {
        const rows: TableRow[] = [];
        rows.push(new TableRow({ children: [
          new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph('Disciplina')] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph('Nota')] }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph('Situação')] }),
        ]}));

        Object.entries(student.subjects).forEach(([subject, data]) => {
          rows.push(new TableRow({ children: [
            new TableCell({ children: [new Paragraph(subject)] }),
            new TableCell({ children: [new Paragraph(String(data.grade))] }),
            new TableCell({ children: [new Paragraph(data.grade >= 5 ? 'Aprovado' : 'Abaixo da média')] }),
          ]}));
        });

        return new Table({ rows });
      })(),
      new Paragraph({ children: [new TextRun('')]}),
      new Paragraph({ children: [new TextRun(`Frequência atual: ${Math.round(student.frequency)}%`)] }),
      new Paragraph({ children: [new TextRun(`Frequência anual: ${Math.round(student.yearlyFrequency)}%`)] }),
      new Paragraph({ children: [new TextRun('')]}),
      new Paragraph({ children: [new TextRun('Avaliação Comportamental')], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun(student.behavioralCodes && student.behavioralCodes.length > 0 ? student.behavioralCodes.map(c => `${c} - ${behavioralCodeMap?.[c] || ''}`).join(', ') : 'Não classificado')] }),
      new Paragraph({ children: [new TextRun('')]}),
      new Paragraph({ children: [new TextRun('Observações')], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun(student.observations || '')] }),
    ]
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
