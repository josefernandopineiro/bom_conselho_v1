
import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';

// Mock data for students
const mockStudents = [
  { id: 1, name: 'Ana Beatriz Lima da Silva', status: 'Ativo', averageGrade: 7.5, behavioralCode: null, subjects: { 'Matemática': 8, 'Português': 7, 'História': 8, 'Geografia': 7, 'Ciências': 7 } },
  { id: 2, name: 'Amanda Ramos Oliveira Silva', status: 'Ativo', averageGrade: 6.2, behavioralCode: null, subjects: { 'Matemática': 6, 'Português': 5, 'História': 7, 'Geografia': 7, 'Ciências': 6 } },
  { id: 3, name: 'Beatriz de Carvalho Belizardo', status: 'Ativo', averageGrade: 7.8, behavioralCode: null, subjects: { 'Matemática': 8, 'Português': 8, 'História': 7, 'Geografia': 8, 'Ciências': 8 } },
  { id: 4, name: 'Danilo Martins Ferreira', status: 'Ativo', averageGrade: 5.4, behavioralCode: null, subjects: { 'Matemática': 6, 'Português': 5, 'História': 4, 'Geografia': 6, 'Ciências': 6 } },
  { id: 5, name: 'Daniela Borges Bispo dos Santos', status: 'Ativo', averageGrade: 9.2, behavioralCode: null, subjects: { 'Matemática': 9, 'Português': 9, 'História': 10, 'Geografia': 9, 'Ciências': 9 } },
  { id: 6, name: 'Emily Martins Pereira', status: 'Ativo', averageGrade: 8.0, behavioralCode: null, subjects: { 'Matemática': 8, 'Português': 8, 'História': 7, 'Geografia': 9, 'Ciências': 8 } },
  { id: 7, name: 'Emily Rodrigues Conceição', status: 'Ativo', averageGrade: 6.8, behavioralCode: null, subjects: { 'Matemática': 7, 'Português': 6, 'História': 7, 'Geografia': 7, 'Ciências': 7 } },
];

// Behavioral classification options
const behavioralOptions = [
  { value: '1', label: '1 - Atitude Positiva' },
  { value: '2', label: '2 - Precisa de Atenção' },
  { value: '3', label: '3 - Dificuldade de Aprendizagem' },
  { value: '4', label: '4 - Problemas de Comportamento' },
  { value: '5', label: '5 - Encaminhamento Necessário' },
];

const StudentsPage = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Filter students based on search term and status
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'below-average' && student.averageGrade < 7) ||
                          (filterStatus === 'above-average' && student.averageGrade >= 7) ||
                          (filterStatus === 'not-classified' && student.behavioralCode === null) ||
                          (filterStatus === 'classified' && student.behavioralCode !== null);
    return matchesSearch && matchesStatus;
  });

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
  };

  const handleBehavioralChange = (value: string) => {
    if (!selectedStudent) return;

    const updatedStudents = students.map(student => {
      if (student.id === selectedStudent.id) {
        return { ...student, behavioralCode: value };
      }
      return student;
    });

    setStudents(updatedStudents);
    setSelectedStudent({ ...selectedStudent, behavioralCode: value });

    toast({
      title: "Classificação atualizada",
      description: `A classificação comportamental de ${selectedStudent.name} foi atualizada.`,
      duration: 3000,
    });
  };

  const getBadgeForGrade = (grade: number) => {
    if (grade >= 7) {
      return <Badge className="bg-council-success">Aprovado</Badge>;
    } else {
      return <Badge variant="destructive">Abaixo da Média</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-council-primary">Análise de Alunos</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar aluno..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar alunos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os alunos</SelectItem>
                  <SelectItem value="below-average">Abaixo da média</SelectItem>
                  <SelectItem value="above-average">Acima da média</SelectItem>
                  <SelectItem value="not-classified">Não classificados</SelectItem>
                  <SelectItem value="classified">Classificados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-council-primary">Lista de Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <div
                        key={student.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedStudent?.id === student.id
                            ? 'bg-council-primary text-white'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => handleSelectStudent(student)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className={`font-medium ${selectedStudent?.id === student.id ? 'text-white' : 'text-gray-900'}`}>
                              {student.name}
                            </h3>
                            <p className={`text-sm ${selectedStudent?.id === student.id ? 'text-gray-100' : 'text-gray-500'}`}>
                              Média: {student.averageGrade.toFixed(1)}
                            </p>
                          </div>
                          <div>
                            {student.averageGrade < 7 && (
                              <div className={`h-2 w-2 rounded-full ${selectedStudent?.id === student.id ? 'bg-red-300' : 'bg-red-500'}`}></div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <span className={`text-xs ${selectedStudent?.id === student.id ? 'text-gray-100' : 'text-gray-500'}`}>
                            {student.status}
                          </span>
                          {student.behavioralCode ? (
                            <Badge className={`${selectedStudent?.id === student.id ? 'bg-white text-council-primary' : 'bg-council-secondary text-white'}`}>
                              Código: {student.behavioralCode}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={`${selectedStudent?.id === student.id ? 'border-white text-white' : 'border-gray-300 text-gray-500'}`}>
                              Não classificado
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                      <p>Nenhum aluno encontrado.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedStudent ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-council-primary flex justify-between items-center">
                    <span>{selectedStudent.name}</span>
                    {getBadgeForGrade(selectedStudent.averageGrade)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="grades">
                    <TabsList className="mb-4">
                      <TabsTrigger value="grades">Notas</TabsTrigger>
                      <TabsTrigger value="behavioral">Classificação Comportamental</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="grades">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Disciplina</TableHead>
                            <TableHead className="text-right">Nota</TableHead>
                            <TableHead className="text-right">Situação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(selectedStudent.subjects).map(([subject, grade]: [string, any]) => (
                            <TableRow key={subject}>
                              <TableCell className="font-medium">{subject}</TableCell>
                              <TableCell className="text-right">{grade}</TableCell>
                              <TableCell className="text-right">
                                {grade >= 7 ? (
                                  <span className="text-green-600 flex items-center justify-end">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Aprovado
                                  </span>
                                ) : (
                                  <span className="text-red-600 flex items-center justify-end">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Abaixo da média
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-gray-50">
                            <TableCell className="font-bold">Média Geral</TableCell>
                            <TableCell className="text-right font-bold">{selectedStudent.averageGrade.toFixed(1)}</TableCell>
                            <TableCell className="text-right">
                              {selectedStudent.averageGrade >= 7 ? (
                                <span className="text-green-600 flex items-center justify-end">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprovado
                                </span>
                              ) : (
                                <span className="text-red-600 flex items-center justify-end">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Abaixo da média
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TabsContent>
                    
                    <TabsContent value="behavioral">
                      <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="font-medium text-gray-900 mb-2">Classificação Comportamental</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Selecione a classificação comportamental que melhor descreve o aluno com base na análise do conselho de classe.
                          </p>
                          
                          <Select value={selectedStudent.behavioralCode || ''} onValueChange={handleBehavioralChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione uma classificação" />
                            </SelectTrigger>
                            <SelectContent>
                              {behavioralOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="font-medium text-gray-900 mb-2">Descrição das Classificações</h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-start space-x-2">
                              <div className="bg-green-100 text-green-800 font-semibold px-2 py-1 rounded">1</div>
                              <div>
                                <p className="font-medium">Atitude Positiva</p>
                                <p className="text-gray-600">Aluno participativo e comprometido com o aprendizado.</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <div className="bg-yellow-100 text-yellow-800 font-semibold px-2 py-1 rounded">2</div>
                              <div>
                                <p className="font-medium">Precisa de Atenção</p>
                                <p className="text-gray-600">Aluno com potencial, mas necessita de acompanhamento mais próximo.</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <div className="bg-orange-100 text-orange-800 font-semibold px-2 py-1 rounded">3</div>
                              <div>
                                <p className="font-medium">Dificuldade de Aprendizagem</p>
                                <p className="text-gray-600">Aluno com dificuldades específicas que requerem intervenção pedagógica.</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <div className="bg-red-100 text-red-800 font-semibold px-2 py-1 rounded">4</div>
                              <div>
                                <p className="font-medium">Problemas de Comportamento</p>
                                <p className="text-gray-600">Aluno com desafios comportamentais que afetam o aprendizado.</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <div className="bg-purple-100 text-purple-800 font-semibold px-2 py-1 rounded">5</div>
                              <div>
                                <p className="font-medium">Encaminhamento Necessário</p>
                                <p className="text-gray-600">Aluno que precisa de apoio especializado além do ambiente escolar.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center p-8 bg-white rounded-lg shadow">
                <div className="text-center">
                  <div className="rounded-full bg-gray-100 p-4 mx-auto w-16 h-16 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum aluno selecionado</h3>
                  <p className="mt-2 text-gray-500">
                    Selecione um aluno da lista para visualizar suas informações e definir sua classificação comportamental.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentsPage;
