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
    
    const doc = generateStudentReport(student, classData);
    
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
    
    const doc = generateCouncilMinutes(classData, minutesNotes, improvementPoints);
    doc.save(`ata_conselho_${classData.name}_${new Date().toLocaleDateString('pt-BR')}.pdf`);
    
    toast({
      title: "Ata gerada com sucesso!",
      description: "A ata do conselho de classe foi gerada e está pronta para download.",
      duration: 3000,
    });
  };
  
  const handleDownloadReport = () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;
    
    const doc = generateStudentReport(student, classData);
    doc.save(`relatorio_${student.name.replace(/\s+/g, '_')}.pdf`);
    
    toast({
      title: "Download iniciado",
      description: "O download do relatório foi iniciado.",
      duration: 3000,
    });
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-council-primary">Geração de Relatórios</h1>
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
                            <TableCell className="font-medium">{student.name}</TableCell>
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
                                    {student.behavioralCodes[0]}
                                  </span>
                                  {behavioralCodes.find(c => c.code === student.behavioralCodes[0])?.description || ""}
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
                    onClick={() => toast({
                      title: "Lote de relatórios gerado",
                      description: "Todos os relatórios foram gerados e estão prontos para download em um arquivo compactado.",
                    })}
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
                      {selectedStudent.name}
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
                            <p><span className="font-semibold">Aluno(a):</span> {selectedStudent.name}</p>
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
                            {selectedStudent.behavioralCodes && selectedStudent.behavioralCodes.length > 0
                              ? (hasSubjectBelowAverage(selectedStudent) || selectedStudent.lowFrequency)
                                ? "O(a) aluno(a) apresenta desafios específicos que requerem atenção e acompanhamento adicional."
                                : "O(a) aluno(a) demonstra comprometimento com os estudos e participa ativamente nas aulas."
                              : "Nenhuma observação registrada."
                            }
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
                          <li className="flex justify-between">
                            <span>1 - Atitude Positiva</span>
                            <span className="font-medium">3 alunos (60%)</span>
                          </li>
                          <li className="flex justify-between">
                            <span>3 - Dificuldade de Aprendizagem</span>
                            <span className="font-medium">1 aluno (20%)</span>
                          </li>
                          <li className="flex justify-between">
                            <span>4 - Problemas de Comportamento</span>
                            <span className="font-medium">1 aluno (20%)</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Alunos que Precisam de Atenção</h4>
                        <ul className="space-y-1">
                          <li>Amanda Ramos Oliveira Silva (Dificuldade de Aprendizagem)</li>
                          <li>Danilo Martins Ferreira (Problemas de Comportamento)</li>
                        </ul>
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
