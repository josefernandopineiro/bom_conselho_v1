import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Filter, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MainLayout from '@/components/layout/MainLayout';
import { useStudents } from '@/context/StudentsContext';

const StudentsPage = () => {
  const { toast } = useToast();
  const { students, updateStudentBehavioralCodes, behavioralCodes } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const behavioralOptions = behavioralCodes.map(code => ({
    value: code.code,
    label: `${code.code} - ${code.description}`
  }));

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'below-average' && student.averageGrade < 5) ||
                          (filterStatus === 'above-average' && student.averageGrade >= 5) ||
                          (filterStatus === 'low-frequency' && student.lowFrequency) ||
                          (filterStatus === 'not-classified' && student.behavioralCodes.length === 0) ||
                          (filterStatus === 'classified' && student.behavioralCodes.length > 0);
    return matchesSearch && matchesStatus;
  });

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
  };

  const handleBehavioralChange = (value: string) => {
    if (!selectedStudent) return;

    const updatedCodes = selectedStudent.behavioralCodes.includes(value)
      ? selectedStudent.behavioralCodes.filter((code: string) => code !== value)
      : [...selectedStudent.behavioralCodes, value];

    updateStudentBehavioralCodes(selectedStudent.id, updatedCodes);
    
    setSelectedStudent({
      ...selectedStudent,
      behavioralCodes: updatedCodes
    });

    toast({
      title: "Classificação atualizada",
      description: `A classificação comportamental de ${selectedStudent.name} foi atualizada.`,
      duration: 3000,
    });
  };

  const getBadgeForGrade = (grade: number) => {
    if (grade >= 5) {
      return <Badge className="bg-council-success">Aprovado</Badge>;
    } else {
      return <Badge variant="destructive">Abaixo da Média</Badge>;
    }
  };

  const safeToFixed = (value: number | null | undefined, digits: number = 1) => {
    if (value === null || value === undefined) {
      return "0";
    }
    return value.toFixed(digits);
  };

  const isLowFrequency = (frequency: number) => {
    return frequency < 70;
  };

  const formatFrequency = (frequency: number | undefined, isManual = false) => {
    if (frequency === undefined || isNaN(frequency)) {
      return '0%';
    }
    
    const roundedFreq = Math.round(frequency);
    
    return `${roundedFreq}%${isManual ? '*' : ''}`;
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
                  <SelectItem value="low-frequency">Baixa frequência</SelectItem>
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
                              Média: {safeToFixed(student.averageGrade)}
                              {student.lowFrequency && (
                                <span className="ml-2 inline-flex items-center text-amber-600">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Freq: {formatFrequency(student.frequency, student.manualFrequency)}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            {student.averageGrade < 5 && (
                              <div className={`h-2 w-2 rounded-full ${selectedStudent?.id === student.id ? 'bg-red-300' : 'bg-red-500'}`}></div>
                            )}
                            {student.lowFrequency && (
                              <div className={`h-2 w-2 rounded-full ${selectedStudent?.id === student.id ? 'bg-amber-300' : 'bg-amber-500'}`}></div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <span className={`text-xs ${selectedStudent?.id === student.id ? 'text-gray-100' : 'text-gray-500'}`}>
                            {student.status}
                          </span>
                          {student.behavioralCodes && student.behavioralCodes.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {student.behavioralCodes.map((code: string) => (
                                <Badge key={code} className={`${selectedStudent?.id === student.id ? 'bg-white text-council-primary' : 'bg-council-secondary text-white'}`}>
                                  {code}
                                </Badge>
                              ))}
                            </div>
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
                    <div className="flex items-center gap-2">
                      {selectedStudent.lowFrequency && (
                        <Badge variant="outline" className="border-amber-500 text-amber-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Baixa Frequência ({formatFrequency(selectedStudent.frequency, selectedStudent.manualFrequency)})
                        </Badge>
                      )}
                      {getBadgeForGrade(selectedStudent.averageGrade)}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedStudent.manualFrequency && (
                    <Alert className="mb-4 bg-amber-50 border-amber-200">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        * Os valores de frequência foram estimados com base no total de faltas, pois os dados exatos não puderam ser extraídos do arquivo.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Tabs defaultValue="grades">
                    <TabsList className="mb-4">
                      <TabsTrigger value="grades">Notas</TabsTrigger>
                      <TabsTrigger value="frequency">Frequência</TabsTrigger>
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
                          {Object.entries(selectedStudent.subjects).map(([subject, data]: [string, any]) => (
                            <TableRow key={subject}>
                              <TableCell className="font-medium">{subject}</TableCell>
                              <TableCell className="text-right">{data.grade}</TableCell>
                              <TableCell className="text-right">
                                {data.grade >= 5 ? (
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
                            <TableCell className="text-right font-bold">{safeToFixed(selectedStudent.averageGrade)}</TableCell>
                            <TableCell className="text-right">
                              {selectedStudent.averageGrade >= 5 ? (
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
                    
                    <TabsContent value="frequency">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Disciplina</TableHead>
                            <TableHead className="text-right">Faltas</TableHead>
                            <TableHead className="text-right">Faltas Corrigidas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(selectedStudent.subjects).map(([subject, data]: [string, any]) => (
                            <TableRow key={subject}>
                              <TableCell className="font-medium">{subject}</TableCell>
                              <TableCell className="text-right">{data.absences}</TableCell>
                              <TableCell className="text-right">{data.correctedAbsences}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-gray-50">
                            <TableCell className="font-bold">Total (Período)</TableCell>
                            <TableCell className="text-right font-bold">
                              {selectedStudent.totalAbsences}
                              {selectedStudent.totalClasses && (
                                <span className="ml-1 text-xs text-gray-500">
                                  de {selectedStudent.totalClasses} aulas
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="inline-flex items-center">
                                      Frequência: {formatFrequency(selectedStudent.frequency, selectedStudent.manualFrequency)}
                                      {selectedStudent.manualFrequency && (
                                        <Info className="h-3 w-3 ml-1 text-gray-400" />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  {selectedStudent.manualFrequency && (
                                    <TooltipContent>
                                      <p className="text-xs max-w-[200px]">
                                        Este valor foi calculado com base nas faltas e total de aulas estimado, pois o valor exato não pôde ser extraído.
                                      </p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                              
                              {isLowFrequency(selectedStudent.frequency) && (
                                <span className="ml-2 text-amber-500 flex items-center justify-end">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Baixa
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow className="bg-gray-100">
                            <TableCell className="font-bold">Total (Anual)</TableCell>
                            <TableCell className="text-right font-bold">{selectedStudent.yearlyAbsences}</TableCell>
                            <TableCell className="text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="inline-flex items-center">
                                      Frequência: {formatFrequency(selectedStudent.yearlyFrequency, selectedStudent.manualFrequency)}
                                      {selectedStudent.manualFrequency && (
                                        <Info className="h-3 w-3 ml-1 text-gray-400" />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  {selectedStudent.manualFrequency && (
                                    <TooltipContent>
                                      <p className="text-xs max-w-[200px]">
                                        Este valor foi calculado com base nas faltas e total de aulas estimado, pois o valor exato não pôde ser extraído.
                                      </p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                              
                              {isLowFrequency(selectedStudent.yearlyFrequency) && (
                                <span className="ml-2 text-amber-500 flex items-center justify-end">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Baixa
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      
                      {selectedStudent.lowFrequency && (
                        <div className="mt-4">
                          <Alert variant="destructive" className="bg-amber-50 border-amber-300 text-amber-800">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Este aluno está com frequência inferior a 70%, o que pode comprometer sua aprovação mesmo que tenha notas suficientes.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="behavioral">
                      <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="font-medium text-gray-900 mb-2">Classificação Comportamental</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Selecione a classificação comportamental que melhor descreve o aluno com base na análise do conselho de classe.
                          </p>
                          
                          <div className="flex flex-wrap gap-2">
                            {behavioralOptions.map(option => {
                              const isSelected = selectedStudent.behavioralCodes && selectedStudent.behavioralCodes.includes(option.value);
                              return (
                                <Button 
                                  key={option.value}
                                  variant={isSelected ? "default" : "outline"}
                                  onClick={() => handleBehavioralChange(option.value)}
                                  className={isSelected ? "bg-council-primary" : ""}
                                >
                                  {option.label}
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="font-medium text-gray-900 mb-2">Descrição das Classificações</h3>
                          <div className="space-y-3 text-sm">
                            {behavioralCodes.map(code => (
                              <div key={code.code} className="flex items-start space-x-2">
                                <div 
                                  className="font-semibold px-2 py-1 rounded" 
                                  style={{ 
                                    backgroundColor: `${code.color}20`, 
                                    color: code.color 
                                  }}
                                >
                                  {code.code}
                                </div>
                                <div>
                                  <p className="font-medium">{code.description}</p>
                                </div>
                              </div>
                            ))}
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
