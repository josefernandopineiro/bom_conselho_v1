
import React, { useState } from 'react';
import { FileText, Download, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';

// Mock student data
const mockStudents = [
  { id: 1, name: 'Ana Beatriz Lima da Silva', status: 'Ativo', averageGrade: 7.5, behavioralCode: '1', subjects: { 'Matemática': 8, 'Português': 7, 'História': 8, 'Geografia': 7, 'Ciências': 7 } },
  { id: 2, name: 'Amanda Ramos Oliveira Silva', status: 'Ativo', averageGrade: 6.2, behavioralCode: '3', subjects: { 'Matemática': 6, 'Português': 5, 'História': 7, 'Geografia': 7, 'Ciências': 6 } },
  { id: 3, name: 'Beatriz de Carvalho Belizardo', status: 'Ativo', averageGrade: 7.8, behavioralCode: '1', subjects: { 'Matemática': 8, 'Português': 8, 'História': 7, 'Geografia': 8, 'Ciências': 8 } },
  { id: 4, name: 'Danilo Martins Ferreira', status: 'Ativo', averageGrade: 5.4, behavioralCode: '4', subjects: { 'Matemática': 6, 'Português': 5, 'História': 4, 'Geografia': 6, 'Ciências': 6 } },
  { id: 5, name: 'Daniela Borges Bispo dos Santos', status: 'Ativo', averageGrade: 9.2, behavioralCode: '1', subjects: { 'Matemática': 9, 'Português': 9, 'História': 10, 'Geografia': 9, 'Ciências': 9 } },
];

// Class metadata
const classData = {
  name: '2ª Série A INT - ADMINISTRAÇÃO',
  year: '2025',
  period: 'Primeiro Bimestre',
  totalStudents: 30,
  belowAverageCount: 12,
  subjects: ['Matemática', 'Português', 'História', 'Geografia', 'Ciências'],
};

// Behavioral classification descriptions
const behavioralCodes = {
  '1': 'Atitude Positiva',
  '2': 'Precisa de Atenção',
  '3': 'Dificuldade de Aprendizagem',
  '4': 'Problemas de Comportamento',
  '5': 'Encaminhamento Necessário',
};

const ReportsPage = () => {
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [minutesNotes, setMinutesNotes] = useState('');
  const [improvementPoints, setImprovementPoints] = useState('');
  
  const handleGenerateStudentReport = (studentId: number) => {
    setSelectedStudentId(studentId);
    
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
    
    toast({
      title: "Ata gerada com sucesso!",
      description: "A ata do conselho de classe foi gerada e está pronta para download.",
      duration: 3000,
    });
  };
  
  const handleDownloadReport = () => {
    toast({
      title: "Download iniciado",
      description: "O download do relatório foi iniciado.",
      duration: 3000,
    });
  };

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
                          <TableHead>Média</TableHead>
                          <TableHead>Classificação</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockStudents.map(student => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.averageGrade.toFixed(1)}</TableCell>
                            <TableCell>
                              {student.behavioralCode ? (
                                <span className="flex items-center">
                                  <span className="w-6 h-6 rounded-full bg-council-primary text-white text-xs flex items-center justify-center mr-2">
                                    {student.behavioralCode}
                                  </span>
                                  {behavioralCodes[student.behavioralCode as keyof typeof behavioralCodes]}
                                </span>
                              ) : (
                                <span className="text-gray-400">Não classificado</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {student.averageGrade >= 7 ? (
                                <span className="flex items-center text-green-600">
                                  <Check className="h-4 w-4 mr-1" />
                                  Aprovado
                                </span>
                              ) : (
                                <span className="flex items-center text-red-600">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Abaixo da Média
                                </span>
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
                    <p>Turma: {classData.name}</p>
                    <p>Período: {classData.period}</p>
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
              
              {selectedStudentId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-council-primary">Pré-visualização do Relatório</CardTitle>
                    <CardDescription>
                      {mockStudents.find(s => s.id === selectedStudentId)?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 border rounded-md">
                      <div className="text-center mb-6">
                        <h2 className="text-xl font-bold">RELATÓRIO DE DESEMPENHO DO ALUNO</h2>
                        <p className="text-gray-600">Conselho de Classe - {classData.period}</p>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="font-bold mb-2 border-b pb-1">Identificação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p><span className="font-semibold">Aluno(a):</span> {mockStudents.find(s => s.id === selectedStudentId)?.name}</p>
                            <p><span className="font-semibold">Turma:</span> {classData.name}</p>
                          </div>
                          <div>
                            <p><span className="font-semibold">Ano Letivo:</span> {classData.year}</p>
                            <p><span className="font-semibold">Período:</span> {classData.period}</p>
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
                              {Object.entries(mockStudents.find(s => s.id === selectedStudentId)?.subjects || {}).map(([subject, grade]: [string, any]) => (
                                <tr key={subject}>
                                  <td className="border p-2">{subject}</td>
                                  <td className="border p-2 text-center">{grade}</td>
                                  <td className="border p-2 text-center">
                                    {grade >= 7 ? (
                                      <span className="text-green-600">Aprovado</span>
                                    ) : (
                                      <span className="text-red-600">Abaixo da Média</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50 font-bold">
                                <td className="border p-2">Média Geral</td>
                                <td className="border p-2 text-center">
                                  {mockStudents.find(s => s.id === selectedStudentId)?.averageGrade.toFixed(1)}
                                </td>
                                <td className="border p-2 text-center">
                                  {(mockStudents.find(s => s.id === selectedStudentId)?.averageGrade || 0) >= 7 ? (
                                    <span className="text-green-600">Aprovado</span>
                                  ) : (
                                    <span className="text-red-600">Abaixo da Média</span>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="font-bold mb-2 border-b pb-1">Avaliação Comportamental</h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p>
                            <span className="font-semibold">Classificação:</span> {
                              mockStudents.find(s => s.id === selectedStudentId)?.behavioralCode 
                              ? `${mockStudents.find(s => s.id === selectedStudentId)?.behavioralCode} - ${
                                  behavioralCodes[mockStudents.find(s => s.id === selectedStudentId)?.behavioralCode as keyof typeof behavioralCodes]
                                }`
                              : "Não classificado"
                            }
                          </p>
                          <p className="mt-2"><span className="font-semibold">Observações:</span></p>
                          <p className="text-gray-600 mt-1">
                            {mockStudents.find(s => s.id === selectedStudentId)?.behavioralCode === '1'
                              ? "O(a) aluno(a) demonstra comprometimento com os estudos e participa ativamente das aulas."
                              : mockStudents.find(s => s.id === selectedStudentId)?.behavioralCode === '3'
                              ? "O(a) aluno(a) apresenta dificuldades específicas que requerem atenção e suporte adicional."
                              : mockStudents.find(s => s.id === selectedStudentId)?.behavioralCode === '4'
                              ? "O(a) aluno(a) apresenta desafios comportamentais que estão impactando seu aprendizado."
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
