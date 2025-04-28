
import jsPDF from 'jspdf';
import { Student, ClassData } from '@/types/student';

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;

export const generateStudentReport = (student: Student, classData: ClassData) => {
  const doc = new jsPDF();
  
  // Set initial position
  let yPos = MARGIN;
  
  // Header
  doc.setFontSize(16);
  doc.text('RELATÓRIO DE DESEMPENHO DO ALUNO', PAGE_WIDTH / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(12);
  doc.text(`Conselho de Classe - ${classData.period}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
  
  // Student Info
  yPos += 15;
  doc.setFontSize(14);
  doc.text('Identificação', MARGIN, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  doc.text(`Aluno(a): ${student.name}`, MARGIN, yPos);
  yPos += 7;
  doc.text(`Turma: ${classData.name}`, MARGIN, yPos);
  yPos += 7;
  doc.text(`Período: ${classData.period}`, MARGIN, yPos);
  
  // Academic Performance
  yPos += 15;
  doc.setFontSize(14);
  doc.text('Desempenho Acadêmico', MARGIN, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  
  // Table headers
  const headers = ['Disciplina', 'Nota', 'Situação'];
  const columnWidths = [80, 30, 40];
  let xPos = MARGIN;
  
  headers.forEach((header, index) => {
    doc.text(header, xPos, yPos);
    xPos += columnWidths[index];
  });
  
  // Table content
  yPos += 7;
  Object.entries(student.subjects).forEach(([subject, data]) => {
    if (yPos > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      yPos = MARGIN;
    }
    
    xPos = MARGIN;
    doc.text(subject, xPos, yPos);
    
    xPos += columnWidths[0];
    doc.text(data.grade.toString(), xPos, yPos);
    
    xPos += columnWidths[1];
    doc.text(data.grade >= 5 ? 'Aprovado' : 'Abaixo da Média', xPos, yPos);
    
    yPos += 7;
  });
  
  // Footer
  doc.setFontSize(10);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, MARGIN, PAGE_HEIGHT - MARGIN);
  doc.text('Class Council Compass', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN, { align: 'right' });
  
  return doc;
};

export const generateCouncilMinutes = (
  classData: ClassData,
  minutesNotes: string,
  improvementPoints: string
) => {
  const doc = new jsPDF();
  let yPos = MARGIN;
  
  // Header
  doc.setFontSize(16);
  doc.text('ATA DO CONSELHO DE CLASSE', PAGE_WIDTH / 2, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setFontSize(12);
  doc.text(`Turma: ${classData.name}`, MARGIN, yPos);
  yPos += 7;
  doc.text(`Período: ${classData.period}`, MARGIN, yPos);
  yPos += 7;
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, MARGIN, yPos);
  
  // Meeting Notes
  yPos += 15;
  doc.setFontSize(14);
  doc.text('Anotações da Reunião', MARGIN, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  const splitNotes = doc.splitTextToSize(minutesNotes, PAGE_WIDTH - (2 * MARGIN));
  doc.text(splitNotes, MARGIN, yPos);
  
  yPos += splitNotes.length * 7 + 15;
  
  // Improvement Points
  doc.setFontSize(14);
  doc.text('Pontos de Melhoria', MARGIN, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  const splitPoints = doc.splitTextToSize(improvementPoints, PAGE_WIDTH - (2 * MARGIN));
  doc.text(splitPoints, MARGIN, yPos);
  
  // Signature spaces
  yPos = PAGE_HEIGHT - (MARGIN + 40);
  doc.line(MARGIN, yPos, MARGIN + 70, yPos);
  doc.line(PAGE_WIDTH - MARGIN - 70, yPos, PAGE_WIDTH - MARGIN, yPos);
  
  yPos += 5;
  doc.setFontSize(10);
  doc.text('Professor(a) Responsável', MARGIN, yPos);
  doc.text('Coordenador(a) Pedagógico(a)', PAGE_WIDTH - MARGIN - 70, yPos);
  
  return doc;
};
