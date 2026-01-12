
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Settings, Upload, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLogoForSchool, DEFAULT_LOGO_PATH } from '@/lib/logo';
import { useStudents } from '@/context/StudentsContext';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const isMobile = useIsMobile();

  const { classData } = useStudents();
  const logo = getLogoForSchool(classData?.name) || DEFAULT_LOGO_PATH;

  return (
    <header className="sticky top-0 z-50 w-full bg-council-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img 
            src={logo}
            alt="Bom Conselho Logo" 
            className="h-10 w-10" 
          />
          <h1 className="text-xl font-bold tracking-tight">
            {isMobile ? "Bom Conselho" : "Bom Conselho"}
          </h1>
        </div>

        <nav className="hidden md:flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-1 hover:text-council-light hover:underline">
            <Upload size={18} />
            <span>Upload</span>
          </Link>
          <Link to="/students" className="flex items-center space-x-1 hover:text-council-light hover:underline">
            <Users size={18} />
            <span>Alunos</span>
          </Link>
          <Link to="/reports" className="flex items-center space-x-1 hover:text-council-light hover:underline">
            <FileText size={18} />
            <span>Relatórios</span>
          </Link>
          <Link to="/settings" className="flex items-center space-x-1 hover:text-council-light hover:underline">
            <Settings size={18} />
            <span>Configurações</span>
          </Link>
        </nav>

        <div className="md:hidden flex items-center">
          <Button variant="ghost" size="icon" className="text-white hover:bg-council-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
