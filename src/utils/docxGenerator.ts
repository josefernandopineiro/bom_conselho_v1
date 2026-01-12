import { Student, ClassData } from '@/types/student';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';

export async function generateStudentDocx(student: Student, classData: ClassData, behavioralCodeMap?: Record<string, string>) {
  try {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: classData.name || '', bold: true, size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: `Relatório do aluno: ${student.name}${student.paee ? ' (PAEE)' : ''}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: 'Identificação', bold: true, size: 20 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: `Turma: ${classData.name || ''}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Período: ${classData.period || ''}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: 'Desempenho Acadêmico', bold: true, size: 20 })], spacing: { after: 100 } }),
          // simple table for subjects
          (() => {
            const rows: any[] = [];
            rows.push(new TableRow({
              children: [
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Disciplina', size: 20 })] })] }),
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Nota', size: 20 })] })] }),
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Situação', size: 20 })] })] }),
              ]
            }));

            Object.entries(student.subjects).forEach(([subject, data]) => {
              rows.push(new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: subject, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String((data as any).grade), size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ((data as any).grade >= 5) ? 'Aprovado' : 'Abaixo da média', size: 20 })] })] }),
                ]
              }));
            });

            return new Table({ rows });
          })(),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: `Frequência atual: ${Math.round(student.frequency || 0)}%`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Frequência anual: ${Math.round(student.yearlyFrequency || 0)}%`, size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: 'Avaliação Comportamental', bold: true, size: 20 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: student.behavioralCodes && student.behavioralCodes.length > 0 ? student.behavioralCodes.map((c: string) => `${c} - ${behavioralCodeMap?.[c] || ''}`).join(', ') : 'Não classificado', size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: 'Observações', bold: true, size: 20 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: student.observations || '', size: 20 })] }),
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    return blob;
  } catch (err) {
    throw new Error(`docx: falha ao gerar arquivo (.docx): ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function generateMinutesDocx(
  classData: ClassData,
  minutesNotes: string,
  improvementPoints: string,
  bestWithPaee: string[],
  attentionList: string[]
) {
  try {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: `Ata do Conselho - ${classData.name || ''}`, bold: true, size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: `Período: ${classData.period || ''} — Ano: ${classData.year || ''}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: 'Resumo da Turma', bold: true, size: 20 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: `Total de alunos: ${classData.totalStudents || 0}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Alunos abaixo da média: ${classData.belowAverageCount || 0}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: 'Melhores Alunos (sugeridos)', bold: true, size: 20 })], spacing: { after: 100 } }),
          ...(bestWithPaee.length > 0 ? bestWithPaee.map(name => new Paragraph({ children: [new TextRun({ text: name, size: 20 })] })) : [new Paragraph({ children: [new TextRun({ text: 'Nenhuma sugestão', size: 20 })] })]),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: 'Alunos que necessitam apoio pedagógico', bold: true, size: 20 })], spacing: { after: 100 } }),
          ...(attentionList.length > 0 ? attentionList.map(item => new Paragraph({ children: [new TextRun({ text: item, size: 20 })] })) : [new Paragraph({ children: [new TextRun({ text: 'Nenhum aluno indicado', size: 20 })] })]),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: 'Pontos de Melhoria', bold: true, size: 20 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: improvementPoints || '', size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: 'Anotações da Reunião', bold: true, size: 20 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: minutesNotes || '', size: 20 })] }),
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    return blob;
  } catch (err) {
    throw new Error(`docx: falha ao gerar ata (.docx): ${err instanceof Error ? err.message : String(err)}`);
  }
}
