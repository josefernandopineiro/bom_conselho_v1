# Auditoria Técnica do Codebase - Bom Conselho
**Agente:** Codebase Auditor  
**Data:** 2026-01-12  
**Versão Base:** v0.9.0-baseline-safe-copy

---

## 📋 Resumo Executivo

Sistema educacional de gestão de Conselho de Classe construído com:
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Radix UI + Tailwind CSS
- **Estado:** React Context API + localStorage
- **Backend:** Supabase (configurado, mas não utilizado ativamente)
- **Relatórios:** jsPDF (PDF) + docx (DOCX - **instável**)

**Status Geral:** ✅ Funcional com áreas de risco identificadas

---

## 🏗️ Estrutura do Projeto

### Organização de Pastas

```
src/
├── components/
│   ├── auth/           # ProtectedRoute
│   ├── layout/         # Header, Footer, MainLayout
│   └── ui/             # 51 componentes shadcn/ui
├── context/
│   ├── AuthContext.tsx         # Autenticação (localStorage)
│   └── StudentsContext.tsx     # Estado global de alunos
├── integrations/
│   └── supabase/              # Cliente Supabase (não usado ativamente)
├── pages/
│   ├── Index.tsx              # Dashboard
│   ├── LoginPage.tsx          # Login simulado
│   ├── StudentsPage.tsx       # Gestão de alunos
│   ├── ReportsPage.tsx        # Geração de relatórios (38KB!)
│   ├── SettingsPage.tsx       # Configurações (admin)
│   └── NotFound.tsx
├── types/
│   └── student.ts             # Tipos principais
└── utils/
    ├── fileProcessor/         # Processamento de Excel "Mapão"
    │   ├── index.ts
    │   ├── fileReaders.ts
    │   ├── headerExtractors.ts
    │   ├── subjectExtractors.ts
    │   ├── studentProcessor.ts
    │   └── calculationUtils.ts
    ├── pdfGenerator.ts        # Geração de PDF (jsPDF)
    └── docxGenerator.ts       # Geração de DOCX (INSTÁVEL)
```

### Métricas de Código

| Arquivo | Linhas | Status | Complexidade |
|---------|--------|--------|--------------|
| `ReportsPage.tsx` | 773 | ⚠️ Muito grande | Alta |
| `StudentsPage.tsx` | 24.672 bytes | ⚠️ Grande | Média |
| `SettingsPage.tsx` | 17.535 bytes | ✅ OK | Média |
| `pdfGenerator.ts` | 485 | ⚠️ Grande | Alta |
| `docxGenerator.ts` | 91 | ⚠️ Instável | Baixa |

---

## 🔐 Fluxo de Autenticação

### Implementação Atual

**Tipo:** Autenticação simulada (localStorage)

```typescript
// AuthContext.tsx
- isLoggedIn: boolean (localStorage)
- userRole: 'admin' | 'teacher' | 'coordinator' | null
- login(role, schoolName?)
- logout()
```

**Credenciais hardcoded:**
- Usuário: `admin`
- Senha: `admin`

### Proteção de Rotas

```typescript
// App.tsx - Estrutura de rotas
/login              → Público
/                   → Protegido (qualquer usuário autenticado)
/students           → Protegido
/reports            → Protegido
/settings           → Protegido + requiresAdmin
```

### ⚠️ Riscos Identificados

| Risco | Severidade | Descrição |
|-------|------------|-----------|
| **Credenciais hardcoded** | 🔴 Alta | Login simulado com credenciais fixas no código |
| **Sem validação de sessão** | 🟡 Média | Apenas localStorage, sem expiração de sessão |
| **Supabase não integrado** | 🟡 Média | Cliente configurado mas não usado para auth |
| **Sem proteção CSRF** | 🟡 Média | Aplicação SPA sem tokens CSRF |

### ✅ Pontos Positivos

- ✅ ProtectedRoute implementado corretamente
- ✅ Separação de roles (admin vs usuários)
- ✅ Redirecionamento funcional

---

## 📊 Gestão de Estado

### Contextos Globais

#### 1. AuthContext
```typescript
Estado:
- isLoggedIn: boolean
- userRole: UserRole
- currentSchool: string (não exposto)

Persistência: localStorage
Chaves: 'isLoggedIn', 'userRole', 'currentSchoolName'
```

#### 2. StudentsContext
```typescript
Estado:
- students: Student[]
- classData: ClassData | null
- behavioralCodes: BehavioralCode[]

Métodos:
- updateStudentBehavioralCodes(id, codes)
- updateStudentObservations(id, observations)
- updateStudentPaee(id, paee)

Persistência: localStorage
Chaves: 'processedStudents', 'processedClassData', 'behavioralCodes'
```

### ⚠️ Riscos de Estado

| Risco | Severidade | Descrição |
|-------|------------|-----------|
| **localStorage como DB** | 🟡 Média | Todos os dados em localStorage (limite ~5-10MB) |
| **Sem sincronização** | 🟡 Média | Dados não sincronizados entre abas/dispositivos |
| **Sem versionamento** | 🟡 Média | Mudanças de schema podem quebrar dados salvos |
| **Sem backup** | 🟡 Média | Perda de dados se localStorage for limpo |

### ✅ Pontos Positivos

- ✅ Context API bem estruturado
- ✅ Separação de responsabilidades
- ✅ Hooks customizados (`useAuth`, `useStudents`)
- ✅ Validação de contexto com throw Error

---

## 📄 Fluxo de Geração de Relatórios

### PDF (jsPDF) - ✅ ESTÁVEL

**Arquivos:** `utils/pdfGenerator.ts`

**Funções principais:**
1. `generateStudentReport(student, classData, behavioralCodeMap)`
   - Relatório individual do aluno
   - Inclui: identificação, desempenho, frequência, comportamento
   - Suporte a logo da escola
   - Paginação automática

2. `generateCouncilMinutes(classData, notes, improvements, bestStudents, attentionStudents)`
   - Ata do conselho de classe
   - Resumo da turma
   - Listas de melhores alunos e alunos de atenção
   - Distribuição comportamental

**Características:**
- ✅ Geração síncrona
- ✅ Suporte a múltiplas páginas
- ✅ Formatação consistente
- ✅ Wrap de texto implementado
- ✅ Geração de ZIP com todos os relatórios

### DOCX (docx library) - ⚠️ INSTÁVEL

**Arquivos:** `utils/docxGenerator.ts`

**Funções principais:**
1. `generateStudentDocx(student, classData, behavioralCodeMap)`
   - Versão DOCX do relatório individual
   - Estrutura similar ao PDF
   - **Status:** Implementado mas com problemas

2. `generateMinutesDocx(classData, notes, improvements, bestWithPaee, attentionList)`
   - Versão DOCX da ata
   - **Status:** Implementado mas com problemas

**⚠️ Problemas Conhecidos:**

```typescript
// ReportsPage.tsx - Linha 194-227
handleTestMinimalDocx() {
  // DEBUG: generate a minimal DOCX to isolate runtime/library issues
  // Função de teste criada para isolar problemas
}
```

**Evidências de instabilidade:**
- Função de teste `handleTestMinimalDocx` criada para debug
- Try-catch específico com mensagens de erro customizadas
- Comentários indicando "runtime/library issues"
- Commit recente: `fix(docx): use top-level docx imports; add generateMinutesDocx()`

### 🔴 Riscos de Relatórios

| Risco | Severidade | Área | Descrição |
|-------|------------|------|-----------|
| **DOCX instável** | 🔴 Alta | DOCX | Geração de DOCX não confiável |
| **ReportsPage muito grande** | 🟡 Média | Manutenção | 773 linhas, difícil de manter |
| **Lógica duplicada** | 🟡 Média | PDF/DOCX | Lógica similar em PDF e DOCX |
| **Sem validação de dados** | 🟡 Média | Ambos | Não valida dados antes de gerar |

### ✅ Pontos Positivos

- ✅ PDF totalmente funcional
- ✅ Geração em lote (ZIP)
- ✅ Suporte a logos personalizados
- ✅ Formatação profissional

---

## 📁 Processamento de Arquivos Excel ("Mapão")

### Estrutura do Processador

**Arquivos:** `utils/fileProcessor/`

```typescript
index.ts                    // Orquestrador principal
├── fileReaders.ts         // Leitura de Excel (xlsx library)
├── headerExtractors.ts    // Extração de metadados da turma
├── subjectExtractors.ts   // Extração de disciplinas e colunas
├── studentProcessor.ts    // Processamento de linhas de alunos
└── calculationUtils.ts    // Cálculos de frequência
```

### Fluxo de Processamento

```mermaid
graph LR
    A[Upload Excel] --> B[readFile]
    B --> C[extractClassData]
    C --> D[extractSubjectsAndColumns]
    D --> E[processStudentRows]
    E --> F[Atualizar StudentsContext]
```

### Dados Extraídos

**ClassData:**
- Nome da turma
- Ano letivo
- Período
- Total de alunos
- Alunos abaixo da média
- Lista de disciplinas
- Total de aulas no período

**Student (por aluno):**
- ID, nome, status
- Notas por disciplina
- Faltas (totais, compensadas, anuais)
- Frequência (período e anual)
- Flag PAEE
- Códigos comportamentais
- Observações

### ⚠️ Riscos de Processamento

| Risco | Severidade | Descrição |
|-------|------------|-----------|
| **Formato Excel específico** | 🟡 Média | Depende de formato exato do "Mapão" |
| **Sem validação de schema** | 🟡 Média | Não valida estrutura antes de processar |
| **Console.log em produção** | 🟢 Baixa | 5 console.log encontrados (debug) |
| **Erro genérico** | 🟡 Média | Mensagens de erro pouco específicas |

### ✅ Pontos Positivos

- ✅ Modularização excelente (6 arquivos especializados)
- ✅ Separação de responsabilidades clara
- ✅ Reutilização de código
- ✅ Cálculos de frequência robustos

---

## 🛠️ Utilitários Compartilhados

### Logo Management

```typescript
// lib/logo.ts (inferido)
- getLogoForSchool(schoolName)
- DEFAULT_LOGO_PATH
```

**Uso:**
- LoginPage
- PDF reports
- Personalização por escola

### Tipos TypeScript

```typescript
// types/student.ts
interface Student {
  id: number;
  name: string;
  status: string;
  averageGrade: number;
  subjects: Record<string, SubjectData>;
  frequency: number;        // Fre(%)
  yearlyFrequency: number;  // Fre An(%)
  paee?: boolean;           // PAEE flag
  behavioralCodes: string[];
  observations?: string;
  // ... outros campos
}

interface ClassData {
  name: string;
  year: string;
  period: string;
  totalStudents: number;
  belowAverageCount: number;
  subjects: string[];
  totalClassesPerPeriod?: number;
}

interface BehavioralCode {
  code: string;
  description: string;
  color: string;
}
```

**✅ Tipagem forte e bem definida**

---

## 🚨 Tratamento de Erros e Logging

### Padrões Identificados

#### 1. Try-Catch com Toast
```typescript
// Padrão comum em ReportsPage.tsx
try {
  // operação
} catch (error) {
  toast({
    variant: "destructive",
    title: "Erro",
    description: error.message
  });
}
```

#### 2. Promise Rejection
```typescript
// fileProcessor/index.ts
return new Promise((resolve, reject) => {
  readFile(file)
    .then(...)
    .catch(error => {
      console.error('Erro na leitura do arquivo:', error);
      reject(new Error('Erro na leitura do arquivo.'));
    });
});
```

#### 3. Context Validation
```typescript
// Padrão em todos os contextos
if (context === undefined) {
  throw new Error('Hook must be used within Provider');
}
```

### Console.log em Produção

**Localizações encontradas:**
1. `utils/fileProcessor/subjectExtractors.ts` (3 ocorrências)
2. `utils/fileProcessor/index.ts` (1 ocorrência)
3. `pages/ReportsPage.tsx` (1 ocorrência - debug DOCX)

**⚠️ Recomendação:** Remover ou substituir por logger configurável

### ⚠️ Riscos de Error Handling

| Risco | Severidade | Descrição |
|-------|------------|-----------|
| **Mensagens genéricas** | 🟡 Média | Erros pouco informativos para debug |
| **Console.log em produção** | 🟢 Baixa | Logs de debug não removidos |
| **Sem logging centralizado** | 🟡 Média | Sem sistema de logging estruturado |
| **Sem error boundaries** | 🟡 Média | React sem Error Boundaries |

### ✅ Pontos Positivos

- ✅ Try-catch consistente
- ✅ Feedback visual (toast)
- ✅ Validação de contextos

---

## 🎯 Áreas de Risco (NÃO TOCAR)

### 🔴 Alto Risco - Evitar Modificações

| Área | Arquivo(s) | Motivo |
|------|-----------|--------|
| **Processamento Excel** | `utils/fileProcessor/*` | Sistema funcionando, formato específico |
| **PDF Generator** | `utils/pdfGenerator.ts` | Estável e funcional, não mexer |
| **AuthContext** | `context/AuthContext.tsx` | Login recentemente estabilizado |
| **Student Types** | `types/student.ts` | Tipos usados em todo o sistema |

### 🟡 Médio Risco - Modificar com Cuidado

| Área | Arquivo(s) | Motivo |
|------|-----------|--------|
| **StudentsContext** | `context/StudentsContext.tsx` | Estado global crítico |
| **ReportsPage** | `pages/ReportsPage.tsx` | Muito grande, mas funcional |
| **ProtectedRoute** | `components/auth/ProtectedRoute.tsx` | Segurança de rotas |

---

## ✅ Candidatos para Refatoração Segura

### 1. DOCX Generator (Prioridade Alta)

**Problema:** Instável, com problemas conhecidos

**Refatoração sugerida:**
- Isolar lógica de geração
- Adicionar testes unitários
- Melhorar error handling
- Considerar biblioteca alternativa se necessário

**Impacto:** 🟢 Baixo (funcionalidade já instável)

---

### 2. ReportsPage - Modularização (Prioridade Média)

**Problema:** 773 linhas, difícil de manter

**Refatoração sugerida:**
```
ReportsPage.tsx (atual)
↓
ReportsPage/
├── index.tsx              // Componente principal
├── StudentReports.tsx     // Seção de relatórios individuais
├── MinutesReports.tsx     // Seção de atas
├── ReportActions.tsx      // Botões e ações
└── hooks/
    ├── useReportGeneration.ts
    └── useStudentFilters.ts
```

**Impacto:** 🟡 Médio (requer testes extensivos)

---

### 3. Logging System (Prioridade Baixa)

**Problema:** Console.log em produção, sem logging estruturado

**Refatoração sugerida:**
```typescript
// utils/logger.ts
export const logger = {
  debug: (msg, data) => isDev ? console.log(msg, data) : null,
  info: (msg, data) => console.info(msg, data),
  warn: (msg, data) => console.warn(msg, data),
  error: (msg, data) => console.error(msg, data)
};
```

**Impacto:** 🟢 Baixo (substituição simples)

---

### 4. Error Boundaries (Prioridade Baixa)

**Problema:** Sem Error Boundaries em React

**Refatoração sugerida:**
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // Captura erros de renderização
}

// App.tsx
<ErrorBoundary>
  <Router>...</Router>
</ErrorBoundary>
```

**Impacto:** 🟢 Baixo (adição, não modificação)

---

### 5. Validação de Schema (Prioridade Média)

**Problema:** Sem validação de dados do Excel

**Refatoração sugerida:**
```typescript
// utils/fileProcessor/validator.ts
import { z } from 'zod'; // já instalado

const ExcelSchemaValidator = z.object({
  // definir schema esperado
});

export const validateExcelData = (data) => {
  return ExcelSchemaValidator.safeParse(data);
};
```

**Impacto:** 🟡 Médio (adiciona validação sem quebrar)

---

## 📊 Resumo de Riscos

### Por Severidade

| Severidade | Quantidade | Áreas |
|------------|------------|-------|
| 🔴 Alta | 2 | Credenciais hardcoded, DOCX instável |
| 🟡 Média | 12 | Estado, validação, logging, modularização |
| 🟢 Baixa | 3 | Console.log, error boundaries, logging |

### Por Categoria

| Categoria | Riscos | Status |
|-----------|--------|--------|
| **Autenticação** | 4 | ⚠️ Requer atenção |
| **Estado** | 4 | ⚠️ Funcional mas limitado |
| **Relatórios** | 4 | ⚠️ PDF OK, DOCX instável |
| **Processamento** | 4 | ✅ Funcional |
| **Error Handling** | 4 | ⚠️ Básico mas funcional |

---

## 🎯 Recomendações Prioritárias

### Curto Prazo (Antes de v1.0)

1. **🔴 Estabilizar DOCX Generator**
   - Isolar problemas
   - Adicionar fallback para PDF
   - Melhorar error handling

2. **🟡 Remover Console.log**
   - Substituir por logger configurável
   - Manter apenas em modo dev

3. **🟡 Adicionar Error Boundaries**
   - Prevenir crashes completos
   - Melhorar UX em erros

### Médio Prazo (v1.1+)

4. **🟡 Modularizar ReportsPage**
   - Quebrar em componentes menores
   - Melhorar manutenibilidade

5. **🟡 Validação de Schema Excel**
   - Usar Zod para validar dados
   - Mensagens de erro específicas

### Longo Prazo (v2.0+)

6. **🔴 Migrar Autenticação para Supabase**
   - Remover credenciais hardcoded
   - Implementar auth real
   - Gerenciamento de sessões

7. **🟡 Migrar Estado para Supabase**
   - Substituir localStorage
   - Sincronização multi-dispositivo
   - Backup automático

---

## ✅ Pontos Fortes do Sistema

1. **Arquitetura bem organizada**
   - Separação clara de responsabilidades
   - Modularização adequada
   - Estrutura de pastas lógica

2. **TypeScript bem utilizado**
   - Tipagem forte
   - Interfaces bem definidas
   - Poucos `any`

3. **UI/UX profissional**
   - shadcn/ui bem integrado
   - Componentes reutilizáveis
   - Design consistente

4. **Funcionalidades core estáveis**
   - Login funcional
   - Importação de Excel robusta
   - Geração de PDF confiável
   - Gestão de alunos completa

---

## 📝 Notas Finais

> [!IMPORTANT]
> Este sistema está **próximo de produção (v1.0)**. Priorize **estabilidade** sobre novas features.

> [!WARNING]
> **Áreas críticas (NÃO TOCAR):**
> - `utils/fileProcessor/*` (processamento Excel)
> - `utils/pdfGenerator.ts` (geração PDF)
> - `context/AuthContext.tsx` (login recém-estabilizado)
> - `types/student.ts` (tipos core)

> [!TIP]
> **Refatorações seguras:**
> - Estabilizar DOCX generator
> - Modularizar ReportsPage
> - Adicionar logging estruturado
> - Implementar Error Boundaries

---

**Auditoria concluída por:** Codebase Auditor  
**Próximo passo:** Aguardando definição do próximo agente especializado
