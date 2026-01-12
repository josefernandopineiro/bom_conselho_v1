import React, { useState } from 'react';
import { Settings, Save, Plus, Trash, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { saveLogoForSchool, getLogoForSchool, removeLogoForSchool, DEFAULT_LOGO_PATH } from '@/lib/logo';

const SettingsPage = () => {
  const { toast } = useToast();

  const [schoolInfo, setSchoolInfo] = useState(() => {
    const saved = localStorage.getItem('schoolInfo');
    if (saved) return JSON.parse(saved);
    return {
      name: 'Escola Técnica Estadual',
      director: 'Maria Silva',
      coordinator: 'José Santos',
      address: 'Rua da Escola, 123 - São Paulo, SP',
      phone: '(11) 3333-4444',
      email: 'contato@escola.edu.br',
    };
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(() => {
    const saved = getLogoForSchool(schoolInfo.name);
    return saved || null;
  });

  const [behavioralCodes, setBehavioralCodes] = useState(() => {
    const savedCodes = localStorage.getItem('behavioralCodes');
    return savedCodes ? JSON.parse(savedCodes) : [
      { code: '1', description: 'Atitude Positiva', color: '#34a853' },
      { code: '2', description: 'Precisa de Atenção', color: '#fbbc05' },
      { code: '3', description: 'Dificuldade de Aprendizagem', color: '#f57c00' },
      { code: '4', description: 'Problemas de Comportamento', color: '#ea4335' },
      { code: '5', description: 'Encaminhamento Necessário', color: '#9c27b0' },
    ];
  });

  const [newCode, setNewCode] = useState({ code: '', description: '', color: '#000000' });
  const [error, setError] = useState<string | null>(null);

  const handleSchoolInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSchoolInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSchoolInfo = () => {
    localStorage.setItem('schoolInfo', JSON.stringify(schoolInfo));
    // if user changed school name, ensure logo key continuity handled by normalize helper
    const savedLogo = getLogoForSchool(schoolInfo.name);
    if (!savedLogo) {
      // keep default behavior; nothing to do
    }
    
    toast({
      title: "Informações salvas",
      description: "As informações da escola foram atualizadas com sucesso.",
      duration: 3000,
    });
  };

  const handleLogoSelected = (file?: File) => {
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg'];
    const maxSize = 300 * 1024; // 300KB
    if (!validTypes.includes(file.type)) {
      setError('Formato inválido. Use PNG ou JPG.');
      return;
    }
    if (file.size > maxSize) {
      setError('Arquivo muito grande. Tamanho máximo: 300KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      try {
        await saveLogoForSchool(schoolInfo.name, result);
        setLogoPreview(result);
        toast({ title: 'Logo salvo', description: 'O logo da escola foi salvo com sucesso.' });
      } catch (err) {
        setError('Falha ao salvar o logo.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    removeLogoForSchool(schoolInfo.name);
    setLogoPreview(null);
    toast({ title: 'Logo removido', description: 'O logo da escola foi removido.' });
  };

  const handleCodeChange = (index: number, field: string, value: string) => {
    const updatedCodes = [...behavioralCodes];
    updatedCodes[index] = { ...updatedCodes[index], [field]: value };
    setBehavioralCodes(updatedCodes);
  };

  const handleNewCodeChange = (field: string, value: string) => {
    setNewCode(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAddCode = () => {
    if (!newCode.code || !newCode.description) {
      setError('Código e descrição são obrigatórios.');
      return;
    }

    if (behavioralCodes.some(code => code.code === newCode.code)) {
      setError('Este código já existe. Por favor, use um código diferente.');
      return;
    }

    if (behavioralCodes.length >= 10) {
      setError('Limite máximo de 10 códigos comportamentais atingido.');
      return;
    }

    setBehavioralCodes([...behavioralCodes, newCode]);
    setNewCode({ code: '', description: '', color: '#000000' });
    setError(null);

    toast({
      title: "Código adicionado",
      description: "O novo código comportamental foi adicionado com sucesso.",
      duration: 3000,
    });
  };

  const handleDeleteCode = (index: number) => {
    const updatedCodes = [...behavioralCodes];
    updatedCodes.splice(index, 1);
    setBehavioralCodes(updatedCodes);

    toast({
      title: "Código removido",
      description: "O código comportamental foi removido com sucesso.",
      duration: 3000,
    });
  };

  const handleSaveCodes = () => {
    localStorage.setItem('behavioralCodes', JSON.stringify(behavioralCodes));
    
    toast({
      title: "Códigos salvos",
      description: "Os códigos comportamentais foram atualizados com sucesso.",
      duration: 3000,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-council-primary" />
          <h1 className="text-2xl font-bold text-council-primary">Configurações</h1>
        </div>

        <Tabs defaultValue="school">
          <TabsList className="mb-6">
            <TabsTrigger value="school">Informações da Escola</TabsTrigger>
            <TabsTrigger value="behavioral">Códigos Comportamentais</TabsTrigger>
          </TabsList>

          <TabsContent value="school">
            <Card>
              <CardHeader>
                <CardTitle className="text-council-primary">Dados da Escola</CardTitle>
                <CardDescription>
                  Configure as informações da sua escola que aparecerão nos relatórios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Logo da Escola</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border rounded-md flex items-center justify-center overflow-hidden">
                      <img src={logoPreview || DEFAULT_LOGO_PATH} alt="Logo" className="object-contain w-full h-full" />
                    </div>
                    <div className="space-y-2">
                      <input
                        id="logoUpload"
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={(e) => handleLogoSelected(e.target.files ? e.target.files[0] : undefined)}
                      />
                      <div className="flex space-x-2">
                        <Button onClick={() => document.getElementById('logoUpload')?.click()} size="sm">Selecionar</Button>
                        <Button variant="destructive" size="sm" onClick={handleRemoveLogo}>Remover</Button>
                      </div>
                      <p className="text-xs text-gray-500">PNG/JPG — máximo 300KB</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nome da Escola
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={schoolInfo.name}
                      onChange={handleSchoolInfoChange}
                      placeholder="Nome da escola"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="director" className="block text-sm font-medium text-gray-700">
                      Diretor(a)
                    </label>
                    <Input
                      id="director"
                      name="director"
                      value={schoolInfo.director}
                      onChange={handleSchoolInfoChange}
                      placeholder="Nome do(a) diretor(a)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="coordinator" className="block text-sm font-medium text-gray-700">
                      Coordenador(a)
                    </label>
                    <Input
                      id="coordinator"
                      name="coordinator"
                      value={schoolInfo.coordinator}
                      onChange={handleSchoolInfoChange}
                      placeholder="Nome do(a) coordenador(a)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Endereço
                    </label>
                    <Input
                      id="address"
                      name="address"
                      value={schoolInfo.address}
                      onChange={handleSchoolInfoChange}
                      placeholder="Endereço da escola"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Telefone
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      value={schoolInfo.phone}
                      onChange={handleSchoolInfoChange}
                      placeholder="Telefone da escola"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      E-mail
                    </label>
                    <Input
                      id="email"
                      name="email"
                      value={schoolInfo.email}
                      onChange={handleSchoolInfoChange}
                      placeholder="E-mail da escola"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSaveSchoolInfo}
                  className="bg-council-primary hover:bg-council-secondary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Informações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="behavioral">
            <Card>
              <CardHeader>
                <CardTitle className="text-council-primary">Códigos Comportamentais</CardTitle>
                <CardDescription>
                  Configure os códigos comportamentais utilizados na avaliação dos alunos (máximo de 10)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-4">Códigos Atuais ({behavioralCodes.length}/10)</h3>
                  <div className="space-y-4">
                    {behavioralCodes.map((code, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-3 border-b pb-3">
                        <div className="md:w-1/12">
                          <label className="block text-xs text-gray-500 mb-1">Código</label>
                          <Input
                            value={code.code}
                            onChange={(e) => handleCodeChange(index, 'code', e.target.value)}
                            className="text-center"
                          />
                        </div>
                        <div className="flex-grow">
                          <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                          <Input
                            value={code.description}
                            onChange={(e) => handleCodeChange(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="md:w-2/12">
                          <label className="block text-xs text-gray-500 mb-1">Cor</label>
                          <Input
                            type="color"
                            value={code.color}
                            onChange={(e) => handleCodeChange(index, 'color', e.target.value)}
                            className="h-10 p-1 cursor-pointer"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteCode(index)}
                            className="h-10"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <CircleAlert className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-4">Adicionar Novo Código</h3>
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="md:w-1/12">
                      <label className="block text-xs text-gray-500 mb-1">Código</label>
                      <Input
                        value={newCode.code}
                        onChange={(e) => handleNewCodeChange('code', e.target.value)}
                        placeholder="Código"
                        className="text-center"
                      />
                    </div>
                    <div className="flex-grow">
                      <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                      <Input
                        value={newCode.description}
                        onChange={(e) => handleNewCodeChange('description', e.target.value)}
                        placeholder="Descrição do código"
                      />
                    </div>
                    <div className="md:w-2/12">
                      <label className="block text-xs text-gray-500 mb-1">Cor</label>
                      <Input
                        type="color"
                        value={newCode.color}
                        onChange={(e) => handleNewCodeChange('color', e.target.value)}
                        className="h-10 p-1 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleAddCode}
                        className="h-10 bg-council-primary hover:bg-council-secondary"
                        disabled={behavioralCodes.length >= 10}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSaveCodes}
                  className="bg-council-primary hover:bg-council-secondary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Códigos
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
