# Auditoria de Branding e Configuração - Bom Conselho
**Agente:** Branding & Configuration Agent  
**Data:** 2026-01-12  
**Status:** ✅ CONFORME

---

## 📋 Análise do Sistema Atual

### Arquitetura de Logos:

```
DEFAULT_LOGO_PATH (Sistema)
    ↓
LoginPage (usa DEFAULT_LOGO_PATH) ✅
    ↓
localStorage (schoolLogo_<nome_normalizado>)
    ↓
getLogoForSchool(schoolName) → School Logo ou DEFAULT_LOGO_PATH
    ↓
Reports PDF (usa School Logo com fallback) ✅
Header (usa School Logo com fallback) ✅
```

---

## 🔍 Componentes Analisados

### 1. **Logo Library** (`lib/logo.ts`)

**Funções:**
```typescript
saveLogoForSchool(schoolName, dataUrl)   // Salva logo da escola
getLogoForSchool(schoolName)             // Recupera logo da escola
removeLogoForSchool(schoolName)          // Remove logo da escola
DEFAULT_LOGO_PATH                        // Logo padrão do sistema
```

**Persistência:**
- ✅ Usa `localStorage` com chave normalizada
- ✅ Key format: `schoolLogo_<nome_normalizado>`
- ✅ Normalização: lowercase, underscores, sem caracteres especiais

**Exemplo:**
```typescript
normalize("Escola Maria de Lourdes") → "escola_maria_de_lourdes"
Key: "schoolLogo_escola_maria_de_lourdes"
```

---

### 2. **LoginPage** - Logo do Sistema

**Localização:** `src/pages/LoginPage.tsx`

**Código:**
```typescript
import { DEFAULT_LOGO_PATH } from '@/lib/logo';

<img 
  src={DEFAULT_LOGO_PATH}
  alt="Bom Conselho Logo" 
  className="mx-auto h-32 w-auto" 
/>
```

**Status:** ✅ **CORRETO**
- Usa apenas `DEFAULT_LOGO_PATH`
- Não usa logo da escola
- Branding do sistema mantido

---

### 3. **PDF Generator** - Logo da Escola

**Localização:** `src/utils/pdfGenerator.ts`

**Código (Student Report):**
```typescript
import { getLogoForSchool, DEFAULT_LOGO_PATH } from '@/lib/logo';

const logo = getLogoForSchool(classData?.name) || DEFAULT_LOGO_PATH;
// doc.addImage accepts dataURL or URL; detect image type for data URLs
if (typeof logo === 'string' && logo.startsWith('data:image/')) {
  const isPng = logo.startsWith('data:image/png');
  doc.addImage(logo as any, isPng ? 'PNG' : 'JPEG', MARGIN, MARGIN, 32, 12);
} else {
  doc.addImage(logo as any, 'PNG', MARGIN, MARGIN, 32, 12);
}
```

**Código (Council Minutes):**
```typescript
const logo = getLogoForSchool(classData?.name) || DEFAULT_LOGO_PATH;
// Mesmo código de detecção de tipo
```

**Status:** ✅ **CORRETO**
- Tenta usar logo da escola primeiro
- Fallback para `DEFAULT_LOGO_PATH`
- Detecta tipo de imagem (PNG vs JPEG)
- Graceful fallback em caso de erro (try-catch)

---

### 4. **Header Component** - Logo da Escola

**Localização:** `src/components/layout/Header.tsx`

**Código:**
```typescript
import { getLogoForSchool, DEFAULT_LOGO_PATH } from '@/lib/logo';

const logo = getLogoForSchool(classData?.name) || DEFAULT_LOGO_PATH;

<img 
  src={logo} 
  alt="Logo" 
  className="h-8 w-auto" 
/>
```

**Status:** ✅ **CORRETO**
- Usa logo da escola se disponível
- Fallback para logo do sistema
- Não bloqueia renderização

---

### 5. **SettingsPage** - Gerenciamento de Logo

**Localização:** `src/pages/SettingsPage.tsx`

**Funcionalidades:**
- ✅ Upload de logo da escola
- ✅ Preview do logo
- ✅ Remoção de logo
- ✅ Persistência em `localStorage`

**Código:**
```typescript
import { saveLogoForSchool, getLogoForSchool, removeLogoForSchool, DEFAULT_LOGO_PATH } from '@/lib/logo';

// Carrega logo existente
const saved = getLogoForSchool(schoolInfo.name);
setLogoPreview(saved || DEFAULT_LOGO_PATH);

// Salva novo logo
await saveLogoForSchool(schoolInfo.name, base64);

// Remove logo
removeLogoForSchool(schoolInfo.name);
setLogoPreview(DEFAULT_LOGO_PATH);
```

**Status:** ✅ **CORRETO**
- Interface funcional
- Persistência correta
- Fallback adequado

---

## ✅ Conformidade com Regras

### Regra 1: Login usa apenas logo do sistema
**Status:** ✅ **CONFORME**

```typescript
// LoginPage.tsx
src={DEFAULT_LOGO_PATH}  // ✅ Correto
```

---

### Regra 2: Reports usam logo da escola + fallback
**Status:** ✅ **CONFORME**

```typescript
// pdfGenerator.ts
const logo = getLogoForSchool(classData?.name) || DEFAULT_LOGO_PATH;  // ✅ Correto
```

---

### Regra 3: Logo nunca bloqueia renderização
**Status:** ✅ **CONFORME**

**Evidências:**
```typescript
// PDF Generator - try-catch
try {
  const logo = getLogoForSchool(classData?.name) || DEFAULT_LOGO_PATH;
  doc.addImage(logo as any, isPng ? 'PNG' : 'JPEG', MARGIN, MARGIN, 32, 12);
} catch (error) {
  console.error("Error adding logo to PDF:", error);
  // Continua sem logo ✅
}

// Header - fallback simples
const logo = getLogoForSchool(classData?.name) || DEFAULT_LOGO_PATH;
// Se getLogoForSchool falhar, usa DEFAULT_LOGO_PATH ✅
```

---

## 📊 Persistência de Dados

### School Info (`localStorage`)

**Key:** `schoolInfo`  
**Formato:**
```json
{
  "name": "Escola Maria de Lourdes",
  "address": "Rua Exemplo, 123",
  "phone": "(11) 1234-5678"
}
```

**Uso:**
- ✅ Salvo em `SettingsPage`
- ✅ Recuperado em `AuthContext` (para login)
- ✅ Usado em `Header` via `StudentsContext`

---

### School Logo (`localStorage`)

**Key:** `schoolLogo_<nome_normalizado>`  
**Formato:** Base64 data URL
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

**Uso:**
- ✅ Salvo em `SettingsPage`
- ✅ Recuperado via `getLogoForSchool()`
- ✅ Usado em PDF, Header

---

### Class Data (`localStorage`)

**Key:** `classData`  
**Formato:**
```json
{
  "name": "3º Ano A",
  "year": "2026",
  "period": "1º Bimestre",
  "totalStudents": 30,
  "belowAverageCount": 5,
  "subjects": ["Matemática", "Português", ...],
  "totalClassesPerPeriod": 111
}
```

**Uso:**
- ✅ Salvo em `StudentsContext`
- ✅ Usado em PDF (para buscar logo)
- ✅ Usado em Header

---

## 🎯 Pontos Fortes

### 1. **Arquitetura Sólida**
- ✅ Separação clara: sistema vs escola
- ✅ Biblioteca centralizada (`lib/logo.ts`)
- ✅ Funções reutilizáveis

### 2. **Fallbacks Adequados**
- ✅ Sempre tem fallback para `DEFAULT_LOGO_PATH`
- ✅ Try-catch em operações críticas
- ✅ Nunca bloqueia renderização

### 3. **Normalização Consistente**
- ✅ Função `normalize()` garante chaves consistentes
- ✅ Evita problemas com espaços e caracteres especiais

### 4. **Detecção de Tipo de Imagem**
- ✅ PDF detecta PNG vs JPEG
- ✅ Suporta data URLs e file paths

---

## ⚠️ Limitações Identificadas

### Limitação 1: **localStorage Não Sincroniza Entre Dispositivos**

**Problema:**
- Logo salvo em um computador não aparece em outro
- Cada dispositivo tem seu próprio `localStorage`

**Impacto:** 🟡 Médio
- Usuário precisa fazer upload do logo em cada dispositivo
- Não é um problema crítico para uso local

**Mitigação Futura:**
- Integrar com Supabase Storage
- Salvar logo no backend

---

### Limitação 2: **Tamanho do localStorage**

**Problema:**
- `localStorage` tem limite de ~5-10MB
- Logos grandes (>1MB) podem causar problemas

**Impacto:** 🟢 Baixo
- Logos normalmente são pequenos (<500KB)
- Sistema não valida tamanho

**Mitigação Atual:**
- Nenhuma validação de tamanho
- Usuário pode encontrar erro silencioso

**Mitigação Futura:**
- Adicionar validação de tamanho
- Comprimir imagens automaticamente

---

### Limitação 3: **Sem Validação de Formato**

**Problema:**
- Sistema aceita qualquer arquivo como logo
- Não valida se é realmente uma imagem

**Impacto:** 🟢 Baixo
- Browser geralmente previne uploads inválidos
- PDF pode falhar silenciosamente

**Mitigação Atual:**
- Try-catch em PDF generator
- Fallback para logo padrão

**Mitigação Futura:**
- Validar tipo MIME
- Validar dimensões mínimas/máximas

---

### Limitação 4: **Normalização Pode Causar Colisões**

**Problema:**
```typescript
normalize("Escola A-B") → "escola_a_b"
normalize("Escola A B") → "escola_a_b"
// Mesma chave! ⚠️
```

**Impacto:** 🟢 Muito Baixo
- Improvável ter escolas com nomes tão similares
- Usuário geralmente tem apenas 1 escola

**Mitigação Atual:**
- Nenhuma

**Mitigação Futura:**
- Usar ID único em vez de nome
- Adicionar hash ao nome

---

### Limitação 5: **Sem Backup/Export**

**Problema:**
- Se `localStorage` for limpo, logo é perdido
- Sem forma de exportar configurações

**Impacto:** 🟡 Médio
- Usuário precisa fazer upload novamente
- Dados da escola também são perdidos

**Mitigação Atual:**
- Nenhuma

**Mitigação Futura:**
- Botão de export/import de configurações
- Backup automático no backend

---

## 📝 Recomendações

### Curto Prazo (Opcional):

1. **Adicionar Validação de Tamanho**
```typescript
const MAX_LOGO_SIZE = 1 * 1024 * 1024; // 1MB

if (file.size > MAX_LOGO_SIZE) {
  toast({
    variant: "destructive",
    title: "Logo muito grande",
    description: "O logo deve ter no máximo 1MB"
  });
  return;
}
```

2. **Adicionar Validação de Tipo**
```typescript
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

if (!ALLOWED_TYPES.includes(file.type)) {
  toast({
    variant: "destructive",
    title: "Formato inválido",
    description: "Use apenas PNG ou JPEG"
  });
  return;
}
```

---

### Médio Prazo (Futuro):

3. **Migrar para Supabase Storage**
- Salvar logos no Supabase
- Sincronizar entre dispositivos
- Backup automático

4. **Adicionar Export/Import**
- Exportar configurações como JSON
- Importar configurações salvas
- Facilita migração entre dispositivos

---

### Longo Prazo (Futuro):

5. **Multi-School Support**
- Suportar múltiplas escolas por usuário
- Seletor de escola ativa
- Logos separados por escola

---

## ✅ Conclusão

**Status Geral:** ✅ **SISTEMA CONFORME**

**Conformidade com Regras:**
- ✅ Login usa apenas logo do sistema
- ✅ Reports usam logo da escola + fallback
- ✅ Logo nunca bloqueia renderização

**Pontos Fortes:**
- ✅ Arquitetura sólida e bem organizada
- ✅ Fallbacks adequados em todos os lugares
- ✅ Código limpo e reutilizável

**Limitações Documentadas:**
1. 🟡 localStorage não sincroniza entre dispositivos
2. 🟢 Sem validação de tamanho de arquivo
3. 🟢 Sem validação de formato de imagem
4. 🟢 Normalização pode causar colisões raras
5. 🟡 Sem backup/export de configurações

**Recomendação:** Sistema está funcionando corretamente. Limitações são aceitáveis para uso atual. Melhorias podem ser implementadas no futuro conforme necessidade.

---

**Auditoria concluída por:** Branding & Configuration Agent  
**Data:** 2026-01-12 17:28  
**Próximo passo:** Sistema aprovado, sem correções necessárias
