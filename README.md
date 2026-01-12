# Sistema de Gestão de Conselho de Classe - Bom Conselho

Este projeto é uma ferramenta para gestão e automação de processos de conselho de classe, permitindo a importação de dados acadêmicos, visualização de desempenho de alunos e geração de relatórios (PDF e DOCX) otimizados para impressão.

## 🚀 Funcionalidades Principais

- **Importação de Dados**: Suporte para importação de planilhas "Mapão" de Excel.
- **Análise de Alunos**: Visualização detalhada de desempenho e frequência.
- **Detecção de PAEE**: Identificação automática de alunos do Público-Alvo da Educação Especial.
- **Relatórios**:
  - Geração de relatórios individuais de alunos (PDF e DOCX).
  - Geração de Atas do Conselho de Classe (PDF e DOCX).
  - Otimização para impressão (redução de páginas e consumo de tinta).
- **Gestão de Configurações**: Personalização de logo da escola e dados institucionais.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React, Vite, TypeScript
- **UI Components**: shadcn-ui, Tailwind CSS
- **Gerenciamento de Estado**: Context API (AuthContext, StudentsContext)
- **Geração de Documentos**: jspdf, docx
- **Processamento de Dados**: xlsx, zod

## 📋 Pré-requisitos

- Node.js & npm instalados

## 🔧 Configuração e Instalação

1. **Clonar o repositório**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd class-council-compass
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**
   Duplique o arquivo `.env.example` para `.env` (opcional).
   ```bash
   cp .env.example .env
   ```
   > O sistema funciona completamente sem variáveis de ambiente, utilizando localStorage para persistência.

4. **Iniciar servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:5173`

## 🔑 Acesso (Demonstração)

O sistema possui autenticação simulada para fins de demonstração:

- **Usuário**: `admin`
- **Senha**: `admin`

> **Nota:** A sessão expira automaticamente após 24 horas.

## 📖 Guia de Uso Básico

1. **Login**: Acesse com as credenciais acima.
2. **Importação**: Vá para a aba "Alunos" e importe o arquivo Excel do "Mapão".
3. **Análise**: Visualize a lista de alunos, filtre por nome ou status (Aprovado, Conselho, Reprovado).
4. **Relatórios**: Vá para a aba "Relatórios" para gerar documentos individuais ou ata da turma.
5. **Configurações**: Vá para "Configurações" (ícone de engrenagem) para alterar o logo e nome da escola.

## 📦 Build para Produção

Para gerar a versão otimizada para produção:

```bash
npm run build
```

Para visualizar a build localmente antes do deploy:

```bash
npm run preview
```

## ⚠️ Limitações Conhecidas

- A persistência de dados é feita via `localStorage`, portanto os dados **não são compartilhados** entre dispositivos diferentes.
- O upload de logo não possui validação estrita de tamanho de arquivo (recomendado < 1MB).

## 📄 Licença

Proprietário. Todos os direitos reservados.
