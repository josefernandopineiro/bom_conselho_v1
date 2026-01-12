import React, { useState } from 'react';
import { FileText, Download, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { useStudents } from '@/context/StudentsContext';
import { generateStudentReport, generateCouncilMinutes } from '@/utils/pdfGenerator';
import { generateStudentDocx, generateMinutesDocx } from '@/utils/docxGenerator';

const formatFrequency = (frequency: number | undefined) => {
  if (frequency === undefined || isNaN(frequency)) {
    return '0%';
  }
  
  const roundedFreq = Math.round(frequency);
  return `${roundedFreq}%`;
};

const ReportsPage = () => {
  const { toast } = useToast();
  const { students, classData, behavioralCodes } = useStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [minutesNotes, setMinutesNotes] = useState('');
  const [improvementPoints, setImprovementPoints] = useState('');
  const [suggestedBest, setSuggestedBest] = useState<string[]>([]);
  const [selectedBest, setSelectedBest] = useState<string[]>([]);
  
  const hasSubjectBelowAverage = (student: any) => {
    return Object.values(student.subjects).some((subject: any) => subject.grade < 5);
  };
  
  const countSubjectsBelowAverage = (student: any) => {
    return Object.values(student.subjects).filter((subject: any) => subject.grade < 5).length;
  };
  
  const getSubjectsBelowAverage = (student: any) => {
    return Object.entries(student.subjects)
      .filter(([_, data]: [string, any]) => data.grade < 5)
      .map(([subject, _]: [string, any]) => subject);
  };
  
  const handleGenerateStudentReport = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    setSelectedStudentId(studentId);
    
    // build map of code -> description for PDF rendering
    const codeMap: Record<string,string> = {};
    behavioralCodes.forEach(c => { codeMap[c.code] = c.description; });
    const doc = generateStudentReport(student, classData, codeMap);
    
    toast({
      title: "Relatório gerado com sucesso!",
      description: "O relatório do aluno foi gerado e está pronto para download.",
      duration: 3000,
    });
  };
  
  const handleGenerateMinutesReport = () => {
    if (!minutesNotes || !improvementPoints) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha as anotações e pontos de melhoria antes de gerar a ata.",
        duration: 3000,
      });
      return;
    }
    
    const bestWithPaee = selectedBest.map(name => {
      const s = students.find(st => st.name === name);
      return `${name}${s && s.paee ? ' (PAEE)' : ''}`;
    });
    const doc = generateCouncilMinutes(classData, minutesNotes, improvementPoints, bestWithPaee, getAttentionStudents());
    doc.save(`ata_conselho_${classData.name}_${new Date().toLocaleDateString('pt-BR')}.pdf`);
    
    toast({
      title: "Ata gerada com sucesso!",
      description: "A ata do conselho de classe foi gerada e está pronta para download.",
      duration: 3000,
    });
  };

  const handleDownloadMinutesDocx = async () => {
    if (!minutesNotes || !improvementPoints) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha as anotações e pontos de melhoria antes de gerar o DOCX.' });
      return;
    }

    try {
      const blob = await generateMinutesDocx(classData, minutesNotes, improvementPoints, selectedBest, getAttentionStudents());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ata_conselho_${classData.name}_${new Date().toLocaleDateString('pt-BR')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: 'Download DOCX iniciado', description: 'A ata em formato .docx está sendo baixada.' });
    } catch (err) {
      console.error('generateMinutesDocx error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível gerar a Ata em DOCX. ${msg}` });
    }
  };
  
  const handleDownloadReport = () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;
    const codeMap: Record<string,string> = {};
    behavioralCodes.forEach(c => { codeMap[c.code] = c.description; });
    const doc = generateStudentReport(student, classData, codeMap);
    doc.save(`relatorio_${student.name.replace(/\s+/g, '_')}.pdf`);
    
    toast({
      title: "Download iniciado",
      description: "O download do relatório foi iniciado.",
      duration: 3000,
    });
  };

  const handleDownloadDocx = async () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;
    try {
      const blob = await generateStudentDocx(student, classData as any, behavioralCodes.reduce((m:any,c:any)=>{m[c.code]=c.description;return m},{}) );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${student.name.replace(/\s+/g,'_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: 'Download iniciado', description: 'O documento editável está sendo baixado.' });
    } catch (err) {
      console.error('generateStudentDocx error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível gerar o DOCX. ${msg}` });
    }
  };

  const handleDownloadReportDocx = async () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;
    const codeMap: Record<string,string> = {};
    behavioralCodes.forEach(c => { codeMap[c.code] = c.description; });
    try {
      const blob = await generateStudentDocx(student, classData, codeMap);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${student.name.replace(/\s+/g,'_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Download DOCX iniciado', description: 'O arquivo .docx está sendo baixado.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível gerar o DOCX.' });
    }
  };

  const handleDownloadDocxFor = async (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    try {
      const codeMap: Record<string,string> = {};
      behavioralCodes.forEach(c => { codeMap[c.code] = c.description; });
      const blob = await generateStudentDocx(student, classData as any, codeMap);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${student.name.replace(/\s+/g,'_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Download iniciado', description: 'O documento Word está sendo baixado.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível gerar o DOCX.' });
    }
  };

  // DEBUG: generate a minimal DOCX to isolate runtime/library issues
  const handleTestMinimalDocx = async () => {
    try {
      const sampleStudent: any = {
        id: 0,
        name: 'Aluno Teste',
        status: 'OK',
        averageGrade: 0,
        behavioralCodes: [],
        subjects: { 'Matemática': { number: 1, grade: 7, absences: 0, compensatedAbsences: 0 } },
        totalAbsences: 0,
        frequency: 100,
        yearlyAbsences: 0,
        yearlyFrequency: 100,
        lowFrequency: false,
      };
      const sampleClass: any = { name: 'Turma Teste', year: '2026', period: 'T1', totalStudents: 1, belowAverageCount: 0, subjects: ['Matemática'] };
      const blob = await generateStudentDocx(sampleStudent, sampleClass, {});
      console.log('MINIMAL DOCX BLOB', blob);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test_relatorio.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Teste DOCX gerado', description: 'Arquivo .docx (minimal) foi gerado e o download iniciado.' });
    } catch (err) {
      console.error('MINIMAL DOCX ERROR', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Erro no teste DOCX', description: msg });
    }
  };

  // Generate ZIP with all student PDFs and trigger download
  const handleGenerateAllReports = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const codeMap: Record<string,string> = {};
      behavioralCodes.forEach(c => { codeMap[c.code] = c.description; });

      for (const student of students) {
        const doc = generateStudentReport(student, classData, codeMap);
        const blob: Blob = doc.output('blob');
        const filename = `relatorio_${student.name.replace(/\s+/g,'_')}.pdf`;
        zip.file(filename, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorios_${classData?.name || 'turma'}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: 'Lote de relatórios gerado', description: 'O arquivo compactado foi gerado e o download deve começar.', duration: 4000 });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível gerar o arquivo compactado.' });
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Utility: compute average grade for a student
  const computeAverage = (student: any) => {
    const grades = Object.values(student.subjects).map((s: any) => Number(s.grade)).filter((g: number) => !isNaN(g));
    if (grades.length === 0) return 0;
    return grades.reduce((a: number, b: number) => a + b, 0) / grades.length;
  };

  // Compute suggested best students: average desc, frequency >= 70
  const computeSuggestedBest = () => {
    const candidates = students
      .map(s => ({ name: s.name, avg: computeAverage(s), freq: s.frequency }))
      .filter(s => s.freq >= 70);
    candidates.sort((a, b) => b.avg - a.avg);
    if (candidates.length === 0) return [];
    // take top 3, but keep ties
    const top = candidates.slice(0, 3);
    const minAvg = top.length > 0 ? top[top.length - 1].avg : 0;
    return candidates.filter(c => c.avg >= minAvg).map(c => c.name);
  };

  // Compute distribution of behavioral codes
  const computeBehavioralDistribution = () => {
    const map: Record<string, number> = {};
    students.forEach(s => {
      if (s.behavioralCodes && s.behavioralCodes.length > 0) {
        s.behavioralCodes.forEach((code: string) => { map[code] = (map[code] || 0) + 1; });
      }
    });
    return map;
  };

  const getAttentionStudents = () => {
    // Return list of strings: "Name — Classification Description".
    const list: string[] = [];
    students.forEach(s => {
      const belowAvg = Object.values(s.subjects).some((sub: any) => sub.grade < 5);
      // prefer detractor behavioral codes (filter out descriptions mentioning 'POSITIV')
      const detractorCodes = (s.behavioralCodes || []).filter((code: string) => {
        const desc = behavioralCodes.find(c => c.code === code)?.description || '';
        return !/POSITIV/i.test(desc);
      });
      if (detractorCodes.length > 0) {
        const code = detractorCodes[0];
        const desc = behavioralCodes.find(c => c.code === code)?.description || '';
        list.push(`${s.name}${s.paee ? ' (PAEE)' : ''} — ${desc}`);
      } else if (s.lowFrequency) {
        list.push(`${s.name}${s.paee ? ' (PAEE)' : ''} — Baixa frequência`);
      } else if (belowAvg) {
        list.push(`${s.name}${s.paee ? ' (PAEE)' : ''} — Disciplinas abaixo da média`);
      }
    });
    // remove duplicates
    return Array.from(new Set(list));
  };

  // initialize suggested best when students load
  React.useEffect(() => {
    const sug = computeSuggestedBest();
    setSuggestedBest(sug);
    setSelectedBest(sug.slice(0, 3));
  }, [students]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-council-primary">Geração de Relatórios</h1>
          <div className="mt-2 md:mt-0">
            <Button variant="outline" onClick={handleTestMinimalDocx} className="ml-2">Test DOCX (minimal)</Button>
          </div>
        </div>
        
        <Tabs defaultValue="student-reports">
          <TabsList className="mb-6">
            <TabsTrigger value="student-reports">Relatórios dos Alunos</TabsTrigger>
            <TabsTrigger value="minutes">Ata do Conselho</TabsTrigger>
          </TabsList>
          
          <TabsContent value="student-reports">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-council-primary">Relatórios de Desempenho dos Alunos</CardTitle>
                  <CardDescription>
                    Gere relatórios individuais para serem utilizados nas reuniões de pais e mestres
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome do Aluno</TableHead>
                          <TableHead>Disciplinas Abaixo da Média</TableHead>
                          <TableHead>Frequência</TableHead>
                          <TableHead>Classificação</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map(student => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.name} {student.paee ? <span className="text-xs font-semibold ml-2 text-red-700">(PAEE)</span> : null}
                            </TableCell>
                            <TableCell>
                              {hasSubjectBelowAverage(student) ? (
                                <span className="text-red-600">
                                  {countSubjectsBelowAverage(student)} {countSubjectsBelowAverage(student) === 1 ? 'disciplina' : 'disciplinas'}
                                </span>
                              ) : (
                                <span className="text-green-600 flex items-center">
                                  <Check className="h-4 w-4 mr-1" />
                                  Todas aprovadas
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {student.lowFrequency ? (
                                <span className="text-amber-600">
                                  {formatFrequency(student.frequency)} (Baixa)
                                </span>
                              ) : (
                                <span>{formatFrequency(student.frequency)}</span>
                              )}
                            </TableCell>
                            <TableCell>
                                {student.behavioralCodes && student.behavioralCodes.length > 0 ? (
                                  <span className="flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-council-primary text-white text-xs flex items-center justify-center mr-2">
                                      {student.behavioralCodes.join(', ')}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Não classificado</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center"
                                  onClick={() => handleGenerateStudentReport(student.id)}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Gerar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center"
                                  onClick={() => handleDownloadDocxFor(student.id)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Baixar relatório (Word)
                                </Button>
                                {selectedStudentId === student.id && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="flex items-center bg-council-primary hover:bg-council-secondary"
                                    onClick={handleDownloadReport}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                  <div className="text-sm text-gray-500">
                    <p>Turma: {classData?.name || "Não identificada"}</p>
                    <p>Período: {classData?.period || "Não identificada"}</p>
                  </div>
                  <Button 
                    onClick={handleGenerateAllReports}
                    className="bg-council-primary hover:bg-council-secondary"
                  >
                    Gerar Todos os Relatórios
                  </Button>
                </CardFooter>
              </Card>
              
              {selectedStudent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-council-primary">Pré-visualização do Relatório</CardTitle>
                    <CardDescription>
                      {selectedStudent.name} {selectedStudent.paee ? <span className="text-xs font-semibold ml-2 text-red-700">(PAEE)</span> : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 border rounded-md">
                      <div className="text-center mb-6">
                        <h2 className="text-xl font-bold">RELATÓRIO DE DESEMPENHO DO ALUNO</h2>
                        <p className="text-gray-600">Conselho de Classe - {classData?.period || "Período não identificado"}</p>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="font-bold mb-2 border-b pb-1">Identificação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p><span className="font-semibold">Aluno(a):</span> {selectedStudent.name} {selectedStudent.paee ? <span className="text-sm font-semibold ml-2 text-red-700">(PAEE)</span> : null}</p>
                            <p><span className="font-semibold">Turma:</span> {classData?.name || "Não identificada"}</p>
                          </div>
                          <div>
                            <p><span className="font-semibold">Ano Letivo:</span> {classData?.year || new Date().getFullYear().toString()}</p>
                            <p><span className="font-semibold">Período:</span> {classData?.period || "Não identificado"}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="font-bold mb-2 border-b pb-1">Desempenho Acadêmico</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Disciplina</th>
                                <th className="border p-2 text-center">Nota</th>
                                <th className="border p-2 text-center">Situação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(selectedStudent.subjects).map(([subject, data]: [string, any]) => (
                                <tr key={subject}>
                                  <td className="border p-2">{subject}</td>
                                  <td className="border p-2 text-center">{data.grade}</td>
                                  <td className="border p-2 text-center">
                                    {data.grade >= 5 ? (
                                      <span className="text-green-600">Aprovado</span>
                                    ) : (
                                      <span className="text-red-600">Abaixo da Média</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {hasSubjectBelowAverage(selectedStudent) && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                            <h4 className="font-semibold text-red-700 mb-1">Disciplinas que requerem atenção:</h4>
                            <ul className="list-disc pl-5 text-red-700">
                              {getSubjectsBelowAverage(selectedStudent).map((subject: string) => (
                                <li key={subject}>{subject} - Nota: {selectedStudent.subjects[subject].grade}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="font-bold mb-2 border-b pb-1">Frequência</h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p>
                            <span className="font-semibold">Frequência atual:</span> {formatFrequency(selectedStudent.frequency)}
                            {selectedStudent.lowFrequency && (
                              <span className="ml-2 text-amber-600">(Abaixo do mínimo requerido de 70%)</span>
                            )}
                          </p>
                          <p className="mt-2">
                            <span className="font-semibold">Total de faltas:</span> {selectedStudent.totalAbsences}
                          </p>
                          <p className="mt-2">
                            <span className="font-semibold">Frequência anual:</span> {formatFrequency(selectedStudent.yearlyFrequency)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="font-bold mb-2 border-b pb-1">Avaliação Comportamental</h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p>
                            <span className="font-semibold">Classificação:</span> {
                              selectedStudent.behavioralCodes && selectedStudent.behavioralCodes.length > 0
                              ? selectedStudent.behavioralCodes.map(code => {
                                  const codeObj = behavioralCodes.find(c => c.code === code);
                                  return `${code} - ${codeObj ? codeObj.description : ''}`;
                                }).join(', ')
                              : "Não classificado"
                            }
                          </p>
                          <p className="mt-2"><span className="font-semibold">Observações:</span></p>
                          <p className="text-gray-600 mt-1">
                            {(() => {
                              const obs = selectedStudent.observations && String(selectedStudent.observations).trim();
                              if (obs) return obs;
                              if (selectedStudent.behavioralCodes && selectedStudent.behavioralCodes.length > 0) {
                                return (hasSubjectBelowAverage(selectedStudent) || selectedStudent.lowFrequency)
                                  ? 'O(a) aluno(a) apresenta desafios específicos que requerem atenção e acompanhamento adicional.'
                                  : 'O(a) aluno(a) demonstra comprometimento com os estudos e participa ativamente nas aulas.';
                              }
                              return 'Nenhuma observação registrada.';
                            })()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-4 border-t">
                        <div className="flex justify-between">
                          <div className="w-1/3 border-t pt-2 text-center">
                            <p>Professor(a) Responsável</p>
                          </div>
                          <div className="w-1/3 border-t pt-2 text-center">
                            <p>Coordenador(a) Pedagógico(a)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button
                      variant="default"
                      onClick={handleDownloadReport}
                      className="bg-council-primary hover:bg-council-secondary"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadDocx}
                      className="ml-2"
                    >
                      Baixar relatório (Word)
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="minutes">
            <Card>
              <CardHeader>
                <CardTitle className="text-council-primary">Ata do Conselho de Classe</CardTitle>
                <CardDescription>
                  Registre as decisões, pontos de melhoria e observações do conselho de classe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-3">Dados da Turma</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Turma</p>
                        <p className="font-medium">{classData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Período</p>
                        <p className="font-medium">{classData.period}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Ano Letivo</p>
                        <p className="font-medium">{classData.year}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-3">Estatísticas da Turma</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total de Alunos</p>
                        <p className="font-medium">{classData.totalStudents}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Alunos Abaixo da Média</p>
                        <p className="font-medium text-red-600">{classData.belowAverageCount}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Percentual Abaixo da Média</p>
                        <p className="font-medium text-red-600">{Math.round((classData.belowAverageCount / classData.totalStudents) * 100)}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="minutesNotes" className="block font-medium text-gray-900 mb-2">
                      Anotações da Reunião
                    </label>
                    <textarea
                      id="minutesNotes"
                      rows={4}
                      className="w-full border border-gray-300 rounded-md p-3"
                      placeholder="Registre aqui as principais discussões e decisões tomadas durante o conselho de classe..."
                      value={minutesNotes}
                      onChange={(e) => setMinutesNotes(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="improvementPoints" className="block font-medium text-gray-900 mb-2">
                      Pontos de Melhoria e Lacunas de Aprendizagem
                    </label>
                    <textarea
                      id="improvementPoints"
                      rows={4}
                      className="w-full border border-gray-300 rounded-md p-3"
                      placeholder="Liste aqui os principais pontos de melhoria identificados e as lacunas de aprendizagem que precisam ser abordadas..."
                      value={improvementPoints}
                      onChange={(e) => setImprovementPoints(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-3">Classificações Comportamentais da Turma</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Distribuição das Classificações</h4>
                        <ul className="space-y-2">
                          {(() => {
                            const dist = computeBehavioralDistribution();
                            const entries = Object.entries(dist);
                            if (entries.length === 0) return <li className="text-sm text-gray-500">Nenhuma classificação registrada.</li>;
                            return entries.map(([code, count]) => (
                              <li key={code} className="flex justify-between">
                                <span>{code} - {behavioralCodes.find(c => c.code === code)?.description || ''}</span>
                                <span className="font-medium">{count} aluno{count > 1 ? 's' : ''}</span>
                              </li>
                            ));
                          })()}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Apoio Pedagógico Necessário</h4>
                        <ul className="space-y-1">
                          {getAttentionStudents().length === 0 ? (
                            <li className="text-sm text-gray-500">Nenhum aluno explicitamente indicado.</li>
                          ) : (
                            getAttentionStudents().map(name => (
                              <li key={name}>{name}</li>
                            ))
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Sugestão dos 3 Melhores Alunos</h4>
                      <p className="text-sm text-gray-600 mb-2">Sugestão automática baseada em média geral e frequência &ge; 70%. Confirme antes de gerar a ata.</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedBest.length === 0 && <span className="text-sm text-gray-500">Nenhuma sugestão disponível.</span>}
                        {suggestedBest.map(name => {
                          const isSelected = selectedBest.includes(name);
                          const stud = students.find(s => s.name === name);
                          const displayName = `${name}${stud && stud.paee ? ' (PAEE)' : ''}`;
                          return (
                            <Button
                              key={name}
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => setSelectedBest(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name])}
                            >
                              {displayName}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <p className="text-sm text-gray-500">
                  Data do Conselho: {new Date().toLocaleDateString('pt-BR')}
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setMinutesNotes('');
                      setImprovementPoints('');
                    }}
                  >
                    Limpar
                  </Button>
                  <Button 
                    onClick={handleGenerateMinutesReport}
                    className="bg-council-primary hover:bg-council-secondary"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Ata
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadMinutesDocx}
                    className="ml-2"
                  >
                    Baixar Ata (Word)
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ReportsPage;
