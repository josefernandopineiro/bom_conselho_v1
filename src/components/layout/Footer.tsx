
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-council-primary text-white py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">&copy; {new Date().getFullYear()} Bom Conselho</p>
            <p className="text-xs">Para escolas públicas de São Paulo</p>
          </div>
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            <a href="#" className="text-sm hover:underline">Ajuda</a>
            <a href="#" className="text-sm hover:underline">Termos de Uso</a>
            <a href="#" className="text-sm hover:underline">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
