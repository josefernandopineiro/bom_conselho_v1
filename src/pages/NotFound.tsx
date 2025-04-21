
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';

const NotFound = () => {
  const location = useLocation();

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-red-100 p-6 mb-6">
          <AlertCircle className="h-16 w-16 text-red-600" />
        </div>
        <h1 className="text-4xl font-bold text-council-primary mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Página não encontrada</p>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          A página "{location.pathname}" que você está procurando não existe ou foi movida.
        </p>
        <Button asChild className="bg-council-primary hover:bg-council-secondary">
          <Link to="/">Voltar para a página inicial</Link>
        </Button>
      </div>
    </MainLayout>
  );
};

export default NotFound;
