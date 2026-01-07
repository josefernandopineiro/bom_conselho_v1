
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { processMapaoFile } from '@/utils/fileProcessor';
import { useStudents } from '@/context/StudentsContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setStudents, setClassData } = useStudents();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setError(null);
    
    // Basic validation for file type
    if (file) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (fileExt !== 'csv' && fileExt !== 'xlsx' && fileExt !== 'xls') {
        setError('Formato de arquivo inválido. Por favor, envie um arquivo CSV ou Excel.');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecione um arquivo para enviar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Processa o arquivo usando o novo utilitário
      const { students, classData } = await processMapaoFile(selectedFile);
      
      // Atualiza o contexto de estudantes (StudentsContext). O provider salva no localStorage.
      setStudents(students);
      setClassData(classData);
      
      // Mostra notificação de sucesso
      toast({
        title: "Arquivo processado com sucesso!",
        description: `${students.length} alunos foram carregados da turma ${classData.name}.`,
        duration: 5000,
      });

      // Navega para a página de alunos
      navigate('/students');
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      setError((err as Error).message || 'Ocorreu um erro ao processar o arquivo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-council-primary mb-6">Bem-vindo ao Bom Conselho</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-council-primary">Upload do Mapão</CardTitle>
              <CardDescription>
                Carregue o arquivo Mapão Excel/CSV para começar o processo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 mb-4">
                  Arraste e solte seu arquivo Mapão aqui, ou clique para selecionar
                </p>
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
                <Button
                  onClick={() => document.getElementById('fileUpload')?.click()}
                  variant="outline"
                  className="w-full"
                >
                  Selecionar Arquivo
                </Button>
                {selectedFile && (
                  <div className="mt-4 flex items-center text-sm text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    <span className="truncate">{selectedFile.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-council-primary hover:bg-council-secondary"
                onClick={handleUpload}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <LoadingSpinner className="mr-2" />
                    Processando...
                  </span>
                ) : 'Processar Arquivo'}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-council-primary">Como Funciona</CardTitle>
              <CardDescription>
                Guia rápido do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-council-primary rounded-full h-6 w-6 flex items-center justify-center text-white text-xs font-bold">1</div>
                <p className="text-sm">Faça upload do arquivo Mapão exportado do sistema Sala do Futuro</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-council-primary rounded-full h-6 w-6 flex items-center justify-center text-white text-xs font-bold">2</div>
                <p className="text-sm">Analise os dados dos alunos e insira as classificações comportamentais</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-council-primary rounded-full h-6 w-6 flex items-center justify-center text-white text-xs font-bold">3</div>
                <p className="text-sm">Gere relatórios de desempenho para os alunos e a ata do conselho de classe</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-council-primary rounded-full h-6 w-6 flex items-center justify-center text-white text-xs font-bold">4</div>
                <p className="text-sm">Economize tempo e reduza erros no processo de conselho de classe</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold text-council-primary mb-4">Antes de Começar</h2>
          <p className="text-gray-700 mb-3">
            Para garantir o processamento correto, seu arquivo Mapão deve seguir estas diretrizes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Formato Excel (.xls, .xlsx) ou CSV</li>
            <li>Conter colunas para nome do aluno, situação, e notas das disciplinas</li>
            <li>Manter o cabeçalho original do arquivo Mapão exportado</li>
            <li>Verificar se todas as notas estão preenchidas corretamente</li>
          </ul>
          <p className="text-gray-700">
            O sistema identificará automaticamente os alunos com desempenho abaixo da média para facilitar a revisão durante o conselho de classe.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
