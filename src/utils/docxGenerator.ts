import { Student, ClassData } from '@/types/student';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';

export async function generateStudentDocx(student: Student, classData: ClassData, behavioralCodeMap?: Record<string, string>, schoolInfo?: { name: string }) {
  try {
    const schoolName = schoolInfo?.name || classData.name || 'BOM CONSELHO'; // fallback logic

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: schoolName, bold: true, size: 24 })] }),
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
          new Paragraph({ children: [new TextRun({ text: `Frequência atual: ${student.frequency !== undefined && !isNaN(student.frequency) ? Math.round(student.frequency) + '%' : '-'}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Frequência anual: ${student.yearlyFrequency !== undefined && !isNaN(student.yearlyFrequency) ? Math.round(student.yearlyFrequency) + '%' : '-'}`, size: 20 })] }),
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
  attentionList: { name: string, classifications: string[] }[],
  schoolInfo?: { name: string, director: string, coordinator: string }
) {
  try {
    const schoolName = schoolInfo?.name || 'BOM CONSELHO';
    const directorName = schoolInfo?.director || '______________________________________';
    const coordName = schoolInfo?.coordinator || '______________________________________';

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: `Ata do Conselho - ${schoolName}`, bold: true, size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: `Turma: ${classData.name || ''}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Período: ${classData.period || ''} — Ano: ${classData.year || ''}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),

          // Attendees Section (Added)
          new Paragraph({ children: [new TextRun({ text: 'Presentes', bold: true, size: 20 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: `Diretor(a): ${directorName === '______________________________________' ? directorName : directorName + ' (ou representante)'}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Coordenador(a) Pedagógico(a): ${coordName === '______________________________________' ? coordName : coordName}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: 'Professor(a) Conselheiro(a): ______________________________________', size: 20 })] }),
          // Secretário removed
          new Paragraph({ children: [new TextRun({ text: 'Professores: ______________________________________', size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),

          new Paragraph({ children: [new TextRun({ text: 'Pauta e Deliberações', bold: true, size: 20 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: minutesNotes || '', size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),

          new Paragraph({ children: [new TextRun({ text: 'Pontos de Melhoria Identificados', bold: true, size: 20 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: improvementPoints || '', size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),

          new Paragraph({ children: [new TextRun({ text: 'Resumo da Turma', bold: true, size: 20 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: `Total de alunos: ${classData.totalStudents || 0}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Alunos abaixo da média: ${classData.belowAverageCount || 0}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun('')] }),

          new Paragraph({ children: [new TextRun({ text: 'Melhores Alunos (sugeridos)', bold: true, size: 20 })], spacing: { after: 100 } }),
          ...(bestWithPaee.length > 0 ? bestWithPaee.map(name => new Paragraph({ children: [new TextRun({ text: name, size: 20 })] })) : [new Paragraph({ children: [new TextRun({ text: 'Nenhuma sugestão', size: 20 })] })]),
          new Paragraph({ children: [new TextRun('')] }),

          new Paragraph({ children: [new TextRun({ text: 'Alunos que necessitam apoio pedagógico', bold: true, size: 20 })], spacing: { after: 100 } }),
          ...(attentionList.length > 0 ? attentionList.flatMap(item => {
            const lines = [new Paragraph({ children: [new TextRun({ text: item.name, bold: true, size: 20 })], spacing: { before: 100 } })];
            if (item.classifications && item.classifications.length > 0) {
              item.classifications.forEach(cls => lines.push(new Paragraph({ children: [new TextRun({ text: `• ${cls}`, size: 20 })], indent: { left: 300 } })));
            } else {
              lines.push(new Paragraph({ children: [new TextRun({ text: `• Sem classificação específica`, size: 20 })], indent: { left: 300 } }));
            }
            return lines;
          }) : [new Paragraph({ children: [new TextRun({ text: 'Nenhum aluno indicado', size: 20 })] })]),

          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun('')] }),

          // Signatures
          new Paragraph({ children: [new TextRun({ text: '______________________________________', size: 20 })], alignment: 'center' }),
          new Paragraph({ children: [new TextRun({ text: 'Diretor(a)', size: 16 })], alignment: 'center' }),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: '______________________________________', size: 20 })], alignment: 'center' }),
          new Paragraph({ children: [new TextRun({ text: 'Coordenador(a) Pedagógico(a)', size: 16 })], alignment: 'center' }),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ children: [new TextRun({ text: '______________________________________', size: 20 })], alignment: 'center' }),
          new Paragraph({ children: [new TextRun({ text: 'Professor(a) Conselheiro(a)', size: 16 })], alignment: 'center' }),
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    return blob;
  } catch (err) {
    throw new Error(`docx: falha ao gerar ata (.docx): ${err instanceof Error ? err.message : String(err)}`);
  }
}
