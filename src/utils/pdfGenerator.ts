
import jsPDF from 'jspdf';
import { Student, ClassData } from '@/types/student';

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN);

export const generateStudentReport = (student: Student, classData: ClassData) => {
  const doc = new jsPDF();
  
  // Add logo
  try {
    const logoPath = "/lovable-uploads/b2b0f41c-35cb-4563-ac27-aa9ef6cdf0db.png";
    doc.addImage(logoPath, 'PNG', MARGIN, MARGIN, 40, 15);
  } catch (error) {
    console.error("Error adding logo to PDF:", error);
  }
  
  // Set initial position
  let yPos = MARGIN + 20;
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BOM CONSELHO', PAGE_WIDTH / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(14);
  doc.text('RELATÓRIO DE DESEMPENHO DO ALUNO', PAGE_WIDTH / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Conselho de Classe - ${classData.period}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
  
  // Student Info
  yPos += 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Identificação', MARGIN, yPos);
  doc.line(MARGIN, yPos + 2, PAGE_WIDTH - MARGIN, yPos + 2); // Underline
  
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Aluno(a): ${student.name}`, MARGIN, yPos);
  yPos += 8;
  doc.text(`Turma: ${classData.name}`, MARGIN, yPos);
  yPos += 8;
  doc.text(`Período: ${classData.period}`, MARGIN, yPos);
  yPos += 8;
  doc.text(`Ano Letivo: ${classData.year || new Date().getFullYear()}`, MARGIN, yPos);
  
  // Academic Performance
  yPos += 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Desempenho Acadêmico', MARGIN, yPos);
  doc.line(MARGIN, yPos + 2, PAGE_WIDTH - MARGIN, yPos + 2); // Underline
  
  yPos += 12;
  doc.setFontSize(11);
  
  // Improved table layout with dynamic row heights
  // Define column widths - wider subject column, narrower grade and status columns
  const colWidths = [CONTENT_WIDTH * 0.6, CONTENT_WIDTH * 0.15, CONTENT_WIDTH * 0.25];
  const COL_PADDING = 3; // padding inside cells
  
  // Table headers with background
  let xPos = MARGIN;
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN, yPos - 6, CONTENT_WIDTH, 8, 'F');
  
  doc.text('Disciplina', xPos + COL_PADDING, yPos);
  xPos += colWidths[0];
  doc.text('Nota', xPos + COL_PADDING, yPos);
  xPos += colWidths[1];
  doc.text('Situação', xPos + COL_PADDING, yPos);
  
  // Table content with text wrapping and dynamic row heights
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  
  const subjects = Object.entries(student.subjects);
  
  // Helper function to wrap text and return lines plus height
  const wrapText = (text, maxWidth) => {
    const fontSize = 11; // current font size
    doc.setFontSize(fontSize);
    
    // Split text into words
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = doc.getStringUnitWidth(currentLine + ' ' + word) * fontSize / doc.internal.scaleFactor;
      
      if (width < maxWidth - (2 * COL_PADDING)) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    lines.push(currentLine);
    
    // Calculate needed height (line height is approximately 1.2 times font size)
    const lineHeight = fontSize * 0.5; // in mm
    const totalHeight = lines.length * lineHeight + (2 * COL_PADDING);
    
    return { lines, height: totalHeight };
  };
  
  for (let i = 0; i < subjects.length; i++) {
    const [subject, data] = subjects[i];
    
    // Check if we need a new page
    if (yPos > PAGE_HEIGHT - MARGIN - 30) {
      doc.addPage();
      yPos = MARGIN + 10;
      
      // Add header for new page
      doc.setFont('helvetica', 'bold');
      doc.text('Continuação - Desempenho Acadêmico', PAGE_WIDTH / 2, yPos, { align: 'center' });
      yPos += 15;
    }
    
    // Wrap subject text
    const wrappedSubject = wrapText(subject, colWidths[0]);
    const rowHeight = Math.max(wrappedSubject.height, 10); // Minimum row height
    
    // Zebra pattern for rows
    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(MARGIN, yPos - 6, CONTENT_WIDTH, rowHeight, 'F');
    }
    
    // Draw subject in the first column with wrapping
    xPos = MARGIN;
    let textYPos = yPos;
    
    wrappedSubject.lines.forEach((line, index) => {
      doc.text(line, xPos + COL_PADDING, textYPos);
      textYPos += 5; // Move to next line
    });
    
    // Draw grade in the second column
    xPos += colWidths[0];
    doc.text(data.grade.toString(), xPos + COL_PADDING, yPos);
    
    // Draw status in the third column
    xPos += colWidths[1];
    const status = data.grade >= 5 ? 'Aprovado' : 'Abaixo da Média';
    const color = data.grade >= 5 ? [0, 128, 0] : [220, 53, 69]; // green or red
    
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(status, xPos + COL_PADDING, yPos);
    doc.setTextColor(0, 0, 0); // Reset text color
    
    // Update yPos for the next row
    yPos += rowHeight;
  }
  
  // Frequencies
  yPos += 10;
  if (yPos > PAGE_HEIGHT - MARGIN - 50) {
    doc.addPage();
    yPos = MARGIN + 10;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Frequência', MARGIN, yPos);
  doc.line(MARGIN, yPos + 2, PAGE_WIDTH - MARGIN, yPos + 2); // Underline
  
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Frequência atual: ${formatFrequency(student.frequency)}`, MARGIN, yPos);
  if (student.lowFrequency) {
    doc.setTextColor(220, 53, 69); // Red
    doc.text('(Abaixo do mínimo requerido de 70%)', MARGIN + 90, yPos);
    doc.setTextColor(0, 0, 0); // Reset
  }
  
  yPos += 8;
  doc.text(`Total de faltas: ${student.totalAbsences || 0}`, MARGIN, yPos);
  
  yPos += 8;
  doc.text(`Frequência anual: ${formatFrequency(student.yearlyFrequency)}`, MARGIN, yPos);
  
  // Behavioral Assessment
  yPos += 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Avaliação Comportamental', MARGIN, yPos);
  doc.line(MARGIN, yPos + 2, PAGE_WIDTH - MARGIN, yPos + 2); // Underline
  
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Check if we need a new page
  if (yPos > PAGE_HEIGHT - MARGIN - 60) {
    doc.addPage();
    yPos = MARGIN + 10;
  }
  // Render behavioral codes and observations similar to preview
  if (student.behavioralCodes && student.behavioralCodes.length > 0) {
    const codesText = student.behavioralCodes.join(', ');
    doc.text(`Classificação: ${codesText}`, MARGIN, yPos);
    yPos += 8;
    // Observations: prefer explicit `observations` field, else use same heuristic as preview
    const obsText = student.observations && String(student.observations).trim()
      ? String(student.observations).trim()
      : (student.behavioralCodes && student.behavioralCodes.length > 0
          ? ((student.lowFrequency || Object.values(student.subjects).some((s:any) => s.grade < 5))
              ? 'O(a) aluno(a) apresenta desafios específicos que requerem atenção e acompanhamento adicional.'
              : 'O(a) aluno(a) demonstra comprometimento com os estudos e participa ativamente nas aulas.')
          : 'Nenhuma observação registrada.');

    const splitObs = doc.splitTextToSize(obsText, CONTENT_WIDTH);
    doc.text(splitObs, MARGIN, yPos);
    yPos += splitObs.length * 5 + 6;
  } else {
    doc.text('Classificação: Não classificado', MARGIN, yPos);
    yPos += 8;
    const obsText = student.observations && String(student.observations).trim() ? String(student.observations).trim() : 'Nenhuma observação registrada.';
    const splitObs = doc.splitTextToSize(obsText, CONTENT_WIDTH);
    doc.text(splitObs, MARGIN, yPos);
    yPos += splitObs.length * 5 + 6;
  }

  // Signatures
  yPos = PAGE_HEIGHT - MARGIN - 40;
  
  const signatureWidth = 70;
  doc.line(MARGIN, yPos, MARGIN + signatureWidth, yPos);
  doc.line(PAGE_WIDTH/2 - signatureWidth/2, yPos, PAGE_WIDTH/2 + signatureWidth/2, yPos);
  doc.line(PAGE_WIDTH - MARGIN - signatureWidth, yPos, PAGE_WIDTH - MARGIN, yPos);
  
  yPos += 5;
  doc.setFontSize(10);
  doc.text('Professor(a)', MARGIN + signatureWidth/2, yPos, { align: 'center' });
  doc.text('Coordenador(a) Pedagógico(a)', PAGE_WIDTH/2, yPos, { align: 'center' });
  doc.text('Diretor(a)', PAGE_WIDTH - MARGIN - signatureWidth/2, yPos, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, MARGIN, PAGE_HEIGHT - 10);
  doc.text('Bom Conselho', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
  
  return doc;
};

export const generateCouncilMinutes = (
  classData: ClassData,
  minutesNotes: string,
  improvementPoints: string,
  bestStudents: string[] = [],
  attentionStudents: string[] = []
) => {
  const doc = new jsPDF();
  let yPos = MARGIN;
  
  // Add logo
  try {
    const logoPath = "/lovable-uploads/b2b0f41c-35cb-4563-ac27-aa9ef6cdf0db.png";
    doc.addImage(logoPath, 'PNG', MARGIN, MARGIN, 40, 15);
  } catch (error) {
    console.error("Error adding logo to PDF:", error);
  }
  
  yPos = MARGIN + 20;
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BOM CONSELHO', PAGE_WIDTH / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(16);
  doc.text('ATA DO CONSELHO DE CLASSE', PAGE_WIDTH / 2, yPos, { align: 'center' });
  
  yPos += 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Class info in a box
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN, yPos, CONTENT_WIDTH, 35, 'F');
  
  doc.setFontSize(12);
  yPos += 10;
  doc.text(`Turma: ${classData.name}`, MARGIN + 5, yPos);
  yPos += 8;
  doc.text(`Período: ${classData.period}`, MARGIN + 5, yPos);
  yPos += 8;
  doc.text(`Ano Letivo: ${classData.year || new Date().getFullYear()}`, MARGIN + 5, yPos);
  
  // Date and place
  yPos += 15;
  const today = new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${today}`, MARGIN, yPos);
  doc.text("Local: Sala da Coordenação", PAGE_WIDTH / 2, yPos);
  
  // Attendees section
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Presentes:', MARGIN, yPos);
  doc.line(MARGIN, yPos + 2, PAGE_WIDTH - MARGIN, yPos + 2);
  
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text("Diretor(a): ______________________________________", MARGIN, yPos);
  yPos += 8;
  doc.text("Coordenador(a) Pedagógico(a): ______________________________________", MARGIN, yPos);
  yPos += 8;
  doc.text("Professor(a) Conselheiro(a): ______________________________________", MARGIN, yPos);
  yPos += 8;
  doc.text("Secretário(a): ______________________________________", MARGIN, yPos);
  yPos += 8;
  doc.text("Professores: ______________________________________", MARGIN, yPos);
  
  // Meeting Notes
  yPos += 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Pauta e Deliberações', MARGIN, yPos);
  doc.line(MARGIN, yPos + 2, PAGE_WIDTH - MARGIN, yPos + 2);
  
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const splitNotes = doc.splitTextToSize(minutesNotes, CONTENT_WIDTH);
  
  // Check if notes will fit on current page
  if (yPos + splitNotes.length * 5 > PAGE_HEIGHT - MARGIN - 40) {
    doc.addPage();
    yPos = MARGIN + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Pauta e Deliberações (continuação)', MARGIN, yPos);
    doc.line(MARGIN, yPos + 2, PAGE_WIDTH - MARGIN, yPos + 2);
    yPos += 12;
    doc.setFont('helvetica', 'normal');
  }
  
  doc.text(splitNotes, MARGIN, yPos);
  yPos += splitNotes.length * 5 + 15;
  
  // Improvement Points
  if (yPos > PAGE_HEIGHT - MARGIN - 60) {
    doc.addPage();
    yPos = MARGIN + 10;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Pontos de Melhoria Identificados', MARGIN, yPos);
  doc.line(MARGIN, yPos + 2, PAGE_WIDTH - MARGIN, yPos + 2);
  
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const splitPoints = doc.splitTextToSize(improvementPoints, CONTENT_WIDTH);
  doc.text(splitPoints, MARGIN, yPos);
  
  // Student summary statistics
  yPos += splitPoints.length * 5 + 15;
  
  if (yPos > PAGE_HEIGHT - MARGIN - 60) {
    doc.addPage();
    yPos = MARGIN + 10;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo da Turma', MARGIN, yPos);
  doc.line(MARGIN, yPos + 2, PAGE_WIDTH - MARGIN, yPos + 2);
  
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de alunos: ${classData.totalStudents || 0}`, MARGIN, yPos);
  yPos += 8;
  doc.text(`Alunos abaixo da média: ${classData.belowAverageCount || 0}`, MARGIN, yPos);
  yPos += 8;
  const percentage = classData.totalStudents ? Math.round((classData.belowAverageCount / classData.totalStudents) * 100) : 0;
  doc.text(`Percentual abaixo da média: ${percentage}%`, MARGIN, yPos);
  
  // If provided, render suggested best students (explicit list, no inference)
  if (bestStudents && bestStudents.length > 0) {
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Melhores Alunos (sugeridos)', MARGIN, yPos);
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    bestStudents.forEach((s, idx) => {
      doc.text(`${idx + 1}. ${s}`, MARGIN + 5, yPos);
      yPos += 6;
    });
  }

  // Render explicit attention students list (only those passed in)
  if (attentionStudents && attentionStudents.length > 0) {
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Alunos que Precisam de Atenção', MARGIN, yPos);
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    attentionStudents.forEach(s => {
      doc.text(`- ${s}`, MARGIN + 5, yPos);
      yPos += 6;
    });
  }
  
  // Signature spaces
  yPos = PAGE_HEIGHT - MARGIN - 40;
  
  const signatureWidth = 70;
  doc.line(MARGIN, yPos, MARGIN + signatureWidth, yPos);
  doc.line(PAGE_WIDTH/2 - signatureWidth/2, yPos, PAGE_WIDTH/2 + signatureWidth/2, yPos);
  doc.line(PAGE_WIDTH - MARGIN - signatureWidth, yPos, PAGE_WIDTH - MARGIN, yPos);
  
  yPos += 5;
  doc.setFontSize(10);
  doc.text('Diretor(a)', MARGIN + signatureWidth/2, yPos, { align: 'center' });
  doc.text('Coordenador(a) Pedagógico(a)', PAGE_WIDTH/2, yPos, { align: 'center' });
  doc.text('Professor(a) Conselheiro(a)', PAGE_WIDTH - MARGIN - signatureWidth/2, yPos, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.text(`Documento gerado em ${today}`, MARGIN, PAGE_HEIGHT - 10);
  doc.text('Bom Conselho', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
  
  return doc;
};

// Helper function for formatting frequency
const formatFrequency = (frequency: number | undefined) => {
  if (frequency === undefined || isNaN(frequency)) {
    return '0%';
  }
  
  const roundedFreq = Math.round(frequency);
  return `${roundedFreq}%`;
};
