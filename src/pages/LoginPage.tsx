
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Lock, LogIn, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Este é um login simulado para fins de demonstração
    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        // Login bem-sucedido
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo ao sistema Bom Conselho",
        });
        
        // Usar a função de login do contexto de autenticação
        login('admin');
        navigate('/');
      } else {
        // Falha no login
        toast({
          variant: "destructive",
          title: "Falha no login",
          description: "Nome de usuário ou senha inválidos. Tente novamente.",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-4">
        <div className="mb-8 text-center">
          <img 
            src="/lovable-uploads/b2b0f41c-35cb-4563-ac27-aa9ef6cdf0db.png" 
            alt="Bom Conselho Logo" 
            className="mx-auto h-32 w-auto" 
          />
          <p className="text-gray-600">Sistema de Gestão de Conselho de Classe</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Nome de usuário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite seu nome de usuário"
                    className="pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="rounded border-gray-300 text-council-primary focus:ring-council-primary"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600">
                    Lembrar-me
                  </label>
                </div>
                <a href="#" className="text-sm text-council-primary hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-council-primary hover:bg-council-secondary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </div>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Para fins de demonstração, use:<br />
            <span className="font-medium">Usuário: admin / Senha: admin</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
