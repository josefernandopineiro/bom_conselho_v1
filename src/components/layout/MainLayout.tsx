
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoggedIn) {
      toast({
        variant: "destructive",
        title: "Acesso não autorizado",
        description: "Por favor, faça login para acessar esta página.",
      });
      navigate('/login');
    }
  }, [isLoggedIn, navigate, toast]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-council-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
