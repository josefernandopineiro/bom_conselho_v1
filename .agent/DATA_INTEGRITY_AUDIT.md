# Auditoria de Integridade de Dados - Bom Conselho
**Agente:** Data Integrity Agent  
**Data:** 2026-01-12  
**Versão Base:** v0.9.0-baseline-safe-copy

---

## 📋 Resumo Executivo

**Escopo da Auditoria:**
- ✅ Processamento do "Mapão" (Excel)
- ✅ Parsing de disciplinas
- ✅ Campos de frequência (Fre% vs Fre An%)
- ✅ Flag PAEE
- ✅ Propagação de dados para UI, PDF, DOCX e Ata

**Status Geral:** ⚠️ **CRÍTICO** - Problemas graves identificados

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **Fre(%) e Fre An(%) - RISCO DE CONFUSÃO**

**Localização:** `utils/fileProcessor/studentProcessor.ts` (linhas 53-87)

**Problema:**
O código tenta distinguir entre frequência do período (`Fre%`) e frequência anual (`Fre An%`), mas a lógica tem **falhas graves**:

```typescript
// Linha 60-63: Detecta Fre An primeiro
if (freqAnCol === -1 && /\bFRE\b.*\bAN\b|.../.test(combined)) {
  freqAnCol = i;
  continue;
}

// Linha 78-81: Detecta Fre do período
if (freqCol === -1 && (/\bFRE\b/.test(combined) || ...) && !/\bAN\b|ANUAL|FRE.*AN/.test(combined)) {
  freqCol = i;
  continue;
}

// Linha 85-87: Safety check - SE AMBOS SÃO IGUAIS, ANULA O ANUAL!
if (freqCol !== -1 && freqAnCol === freqCol) {
  freqAnCol = -1;  // ⚠️ PERDA DE DADOS!
}
```

**Consequências:**
- ⚠️ Se o Excel tiver apenas uma coluna de frequência, o sistema pode **anular** a frequência anual
- ⚠️ Risco de **usar o mesmo valor** para ambos os campos
- ⚠️ Cálculos de fallback podem gerar **dados incorretos**

---

### 2. **Conversão de Percentuais - AMBIGUIDADE**

**Localização:** `utils/fileProcessor/calculationUtils.ts` (linhas 23-32)

**Código Atual:**
```typescript
export const convertToPercentage = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const strValue = String(value).trim();
  if (strValue === '') return 0;
  const cleanValue = strValue.replace(/[%\s]/g, '').replace(',', '.');
  const numValue = parseFloat(cleanValue);
  if (isNaN(numValue)) return 0;
  if (numValue > 0 && numValue < 1) return Math.max(0, Math.min(100, numValue * 100));
  return Math.max(0, Math.min(100, numValue));
};
```

**Problemas:**
1. ⚠️ **Ambiguidade:** Não fica claro se `0.85` deve ser `0.85%` ou `85%`
2. ⚠️ **Silencioso:** Retorna `0` para valores inválidos sem avisar
3. ⚠️ **Sem validação:** Aceita valores absurdos como `999` e converte para `100`

**Casos Problemáticos:**
| Valor no Excel | Convertido | Esperado | Status |
|----------------|------------|----------|--------|
| `"85%"` | `85` | `85` | ✅ OK |
| `"85"` | `85` | `85` | ✅ OK |
| `"0.85"` | `85` | `85` | ⚠️ Ambíguo |
| `"0,85"` | `85` | `85` | ⚠️ Ambíguo |
| `""` | `0` | `null` ou erro | ❌ Silencioso |
| `"abc"` | `0` | erro | ❌ Silencioso |
| `"150"` | `100` | erro | ❌ Aceita inválido |

---

### 3. **PAEE Flag - PARSING FRACO**

**Localização:** `utils/fileProcessor/studentProcessor.ts` (linha 142)

**Código Atual:**
```typescript
const paeeFlag = paeeCol > -1 ? Boolean(String(row[paeeCol] || '').trim()) : false;
```

**Problema:**
- ⚠️ **Qualquer texto** é considerado `true`
- ⚠️ `Boolean("Não")` = `true` (ERRADO!)
- ⚠️ `Boolean("0")` = `true` (ERRADO!)
- ⚠️ `Boolean("false")` = `true` (ERRADO!)

**Casos Problemáticos:**
| Valor no Excel | Resultado | Esperado | Status |
|----------------|-----------|----------|--------|
| `"Sim"` | `true` | `true` | ✅ OK |
| `"S"` | `true` | `true` | ✅ OK |
| `"X"` | `true` | `true` | ✅ OK |
| `"Não"` | `true` | `false` | ❌ ERRO |
| `"N"` | `true` | `false` | ❌ ERRO |
| `"0"` | `true` | `false` | ❌ ERRO |
| `"false"` | `true` | `false` | ❌ ERRO |
| `""` (vazio) | `false` | `false` | ✅ OK |

---

### 4. **Cálculos de Fallback - DADOS INVENTADOS**

**Localização:** `utils/fileProcessor/studentProcessor.ts` (linhas 144-150)

**Código Atual:**
```typescript
// Linha 144-146: Se Fre% não encontrado, CALCULA
if ((isNaN(frequency) || frequency === 0) && totalClassesPerPeriod) {
  frequency = calculateFrequency(totalAbsences, totalClassesPerPeriod);
}

// Linha 147-150: Se Fre An% não encontrado, INVENTA (faltas * 2)
if ((isNaN(yearlyFrequency) || yearlyFrequency === 0) && totalClassesPerPeriod) {
  const yearlyAbsences = ftAnCol > -1 ? (Number(row[ftAnCol]) || totalAbsences * 2) : totalAbsences * 2;
  yearlyFrequency = calculateFrequency(yearlyAbsences, (totalClassesPerPeriod || 111) * 2);
}
```

**Problemas:**
1. ⚠️ **Inventa dados:** `totalAbsences * 2` é uma **suposição**
2. ⚠️ **Hardcoded:** `111` como fallback é arbitrário
3. ⚠️ **Sobrescreve zeros:** `frequency === 0` pode ser um valor real, não ausência de dados
4. ⚠️ **Sem flag:** Não marca que o dado foi calculado vs. extraído

**Consequência:**
- ❌ **Dados falsos** podem ser apresentados como reais
- ❌ Impossível distinguir dados reais de calculados

---

## ✅ PONTOS POSITIVOS

### 1. **PAEE Propagação - BEM IMPLEMENTADA**

**Verificação completa:**

| Localização | Status | Código |
|-------------|--------|--------|
| **Parsing (Excel → Student)** | ✅ | `studentProcessor.ts:169` |
| **UI - StudentsPage** | ✅ | `StudentsPage.tsx:174, 237, 383` |
| **UI - ReportsPage** | ✅ | `ReportsPage.tsx:366, 458, 472` |
| **PDF - Student Report** | ✅ | `pdfGenerator.ts:57-71` |
| **PDF - Ata (Best Students)** | ✅ | `ReportsPage.tsx:74-76` |
| **PDF - Ata (Attention)** | ✅ | `ReportsPage.tsx:307, 309, 311` |
| **DOCX - Student Report** | ✅ | `docxGenerator.ts:10` |
| **DOCX - Ata** | ✅ | Via `selectedBest` array |
| **Context - Update** | ✅ | `StudentsContext.tsx:79-86` |

**Conclusão:** ✅ **PAEE está propagando corretamente** para todos os destinos

---

### 2. **Detecção de Colunas - ROBUSTA**

**Localização:** `utils/fileProcessor/studentProcessor.ts` (linhas 24-52)

**Pontos Fortes:**
- ✅ Busca em múltiplas linhas de cabeçalho (header + 3 subheaders)
- ✅ Regex flexível para variações de nomenclatura
- ✅ Detecta: `TOTAL`, `TF`, `FTAN`, `PAEE`, `FRE`, `FRE AN`
- ✅ Combina header + subheader para melhor precisão

**Exemplo:**
```typescript
const cellText = (i: number) => {
  const parts: string[] = [];
  for (const r of labelRows) {
    try { parts.push(String(r[i] || '').trim()); } catch (e) { parts.push(''); }
  }
  const headerText = parts[0] || '';
  const sub = parts.slice(1).join(' ');
  return { header: headerText, sub: sub, combined: `${headerText} ${sub}`.trim() };
};
```

---

### 3. **Parsing de Notas - DEFENSIVO**

**Localização:** `utils/fileProcessor/studentProcessor.ts` (linhas 118-123)

**Código:**
```typescript
const gradeRaw = String(mediaValue || '').trim();
const grade = gradeRaw === '-' || gradeRaw === '' ? null : (() => {
  const n = parseFloat(gradeRaw.replace(',', '.'));
  return isNaN(n) ? null : n;
})();
```

**Pontos Fortes:**
- ✅ Trata `-` como `null` (sem nota)
- ✅ Converte vírgula para ponto
- ✅ Retorna `null` para valores inválidos
- ✅ Não inventa dados

---

## 🔧 CORREÇÕES NECESSÁRIAS

### Correção 1: **PAEE Flag - Parsing Robusto**

**Prioridade:** 🔴 ALTA  
**Arquivo:** `utils/fileProcessor/studentProcessor.ts`  
**Linha:** 142

**Código Atual:**
```typescript
const paeeFlag = paeeCol > -1 ? Boolean(String(row[paeeCol] || '').trim()) : false;
```

**Código Corrigido:**
```typescript
const paeeFlag = paeeCol > -1 ? (() => {
  const val = String(row[paeeCol] || '').trim().toUpperCase();
  // Aceita: "SIM", "S", "X", "1", "TRUE", "PAEE"
  // Rejeita: "NÃO", "NAO", "N", "0", "FALSE", "" (vazio)
  if (val === '' || val === '0' || val === 'N' || val === 'NÃO' || val === 'NAO' || val === 'FALSE') {
    return false;
  }
  return val.length > 0; // Qualquer outro texto não-vazio = true
})() : false;
```

**Impacto:** 🟢 Baixo (melhoria de precisão)

---

### Correção 2: **Conversão de Percentuais - Validação**

**Prioridade:** 🔴 ALTA  
**Arquivo:** `utils/fileProcessor/calculationUtils.ts`  
**Linha:** 23-32

**Código Atual:**
```typescript
export const convertToPercentage = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const strValue = String(value).trim();
  if (strValue === '') return 0;
  const cleanValue = strValue.replace(/[%\s]/g, '').replace(',', '.');
  const numValue = parseFloat(cleanValue);
  if (isNaN(numValue)) return 0;
  if (numValue > 0 && numValue < 1) return Math.max(0, Math.min(100, numValue * 100));
  return Math.max(0, Math.min(100, numValue));
};
```

**Código Corrigido:**
```typescript
export const convertToPercentage = (value: any): number => {
  if (value === null || value === undefined) return NaN; // Retorna NaN para ausência de dados
  const strValue = String(value).trim();
  if (strValue === '' || strValue === '-') return NaN; // NaN para vazios
  
  const cleanValue = strValue.replace(/[%\s]/g, '').replace(',', '.');
  const numValue = parseFloat(cleanValue);
  
  if (isNaN(numValue)) {
    console.warn(`[convertToPercentage] Valor inválido: "${value}"`);
    return NaN;
  }
  
  // Se valor entre 0 e 1, assume decimal (0.85 -> 85%)
  if (numValue > 0 && numValue < 1) {
    return Math.round(numValue * 100);
  }
  
  // Se valor > 100, é inválido
  if (numValue > 100) {
    console.warn(`[convertToPercentage] Percentual inválido (>100): ${numValue}`);
    return NaN;
  }
  
  // Se valor < 0, é inválido
  if (numValue < 0) {
    console.warn(`[convertToPercentage] Percentual inválido (<0): ${numValue}`);
    return NaN;
  }
  
  return Math.round(numValue);
};
```

**Mudanças:**
1. ✅ Retorna `NaN` para ausência de dados (não `0`)
2. ✅ Valida range (0-100)
3. ✅ Adiciona warnings para valores inválidos
4. ✅ Arredonda para inteiro

**Impacto:** 🟡 Médio (requer ajustes em consumidores)

---

### Correção 3: **Frequência - Não Sobrescrever Zeros**

**Prioridade:** 🔴 ALTA  
**Arquivo:** `utils/fileProcessor/studentProcessor.ts`  
**Linha:** 144-150

**Código Atual:**
```typescript
if ((isNaN(frequency) || frequency === 0) && totalClassesPerPeriod) {
  frequency = calculateFrequency(totalAbsences, totalClassesPerPeriod);
}
if ((isNaN(yearlyFrequency) || yearlyFrequency === 0) && totalClassesPerPeriod) {
  const yearlyAbsences = ftAnCol > -1 ? (Number(row[ftAnCol]) || totalAbsences * 2) : totalAbsences * 2;
  yearlyFrequency = calculateFrequency(yearlyAbsences, (totalClassesPerPeriod || 111) * 2);
}
```

**Código Corrigido:**
```typescript
// Apenas calcula se NaN (ausente), NÃO se for 0 (pode ser real)
let manualFrequency = false;
if (isNaN(frequency) && totalClassesPerPeriod) {
  frequency = calculateFrequency(totalAbsences, totalClassesPerPeriod);
  manualFrequency = true;
}

let manualYearlyFrequency = false;
if (isNaN(yearlyFrequency) && totalClassesPerPeriod) {
  const yearlyAbsences = ftAnCol > -1 ? (Number(row[ftAnCol]) || 0) : 0;
  if (yearlyAbsences > 0) {
    yearlyFrequency = calculateFrequency(yearlyAbsences, (totalClassesPerPeriod || 111) * 2);
    manualYearlyFrequency = true;
  } else {
    // Se não tem faltas anuais, não inventa dados
    yearlyFrequency = NaN;
  }
}
```

**Mudanças:**
1. ✅ Remove `frequency === 0` da condição (0% pode ser real)
2. ✅ Remove `totalAbsences * 2` (não inventa dados)
3. ✅ Adiciona flag `manualFrequency` para rastreabilidade
4. ✅ Se não tem dados, deixa `NaN` (não inventa)

**Impacto:** 🟡 Médio (melhora precisão)

---

### Correção 4: **Detecção de Colunas - Melhorar Distinção**

**Prioridade:** 🟡 MÉDIA  
**Arquivo:** `utils/fileProcessor/studentProcessor.ts`  
**Linha:** 53-87

**Problema:** Safety check anula `freqAnCol` se igual a `freqCol`

**Código Atual:**
```typescript
// Linha 85-87
if (freqCol !== -1 && freqAnCol === freqCol) {
  freqAnCol = -1;  // ⚠️ PERDA DE DADOS
}
```

**Código Corrigido:**
```typescript
// Se ambos apontam para a mesma coluna, prioriza o período
if (freqCol !== -1 && freqAnCol === freqCol) {
  console.warn(`[studentProcessor] Fre% e Fre An% apontam para a mesma coluna (${freqCol}). Usando para período apenas.`);
  freqAnCol = -1;
}

// Log de debug para verificar detecção
console.log(`[studentProcessor] Colunas detectadas: freqCol=${freqCol}, freqAnCol=${freqAnCol}, tfCol=${tfCol}, ftAnCol=${ftAnCol}, paeeCol=${paeeCol}`);
```

**Mudanças:**
1. ✅ Adiciona warning quando há conflito
2. ✅ Adiciona log de debug para auditoria
3. ✅ Mantém lógica atual (prioriza período)

**Impacto:** 🟢 Baixo (melhora observabilidade)

---

### Correção 5: **Adicionar Validação de Schema**

**Prioridade:** 🟡 MÉDIA  
**Arquivo:** `utils/fileProcessor/validator.ts` (NOVO)

**Criar novo arquivo:**
```typescript
import { z } from 'zod';

// Schema para validar dados extraídos do Excel
export const StudentDataSchema = z.object({
  name: z.string().min(1, 'Nome do aluno é obrigatório'),
  status: z.string(),
  frequency: z.number().min(0).max(100).or(z.nan()),
  yearlyFrequency: z.number().min(0).max(100).or(z.nan()),
  totalAbsences: z.number().min(0),
  yearlyAbsences: z.number().min(0),
  paee: z.boolean(),
  subjects: z.record(z.object({
    number: z.number(),
    grade: z.number().min(0).max(10).nullable(),
    absences: z.number().min(0),
    compensatedAbsences: z.number().min(0),
  })),
});

export const ClassDataSchema = z.object({
  name: z.string().min(1, 'Nome da turma é obrigatório'),
  year: z.string().regex(/^\d{4}$/, 'Ano deve ter 4 dígitos'),
  period: z.string().min(1, 'Período é obrigatório'),
  totalStudents: z.number().min(0),
  belowAverageCount: z.number().min(0),
  subjects: z.array(z.string()),
  totalClassesPerPeriod: z.number().min(1).optional(),
});

export function validateStudentData(data: unknown) {
  return StudentDataSchema.safeParse(data);
}

export function validateClassData(data: unknown) {
  return ClassDataSchema.safeParse(data);
}
```

**Integrar no processador:**
```typescript
// Em studentProcessor.ts, após criar o student
const validation = validateStudentData(student);
if (!validation.success) {
  console.warn(`[studentProcessor] Aluno "${name}" tem dados inválidos:`, validation.error.format());
}
```

**Impacto:** 🟡 Médio (adiciona camada de segurança)

---

## 📊 Resumo de Correções

| # | Correção | Prioridade | Impacto | Arquivo |
|---|----------|------------|---------|---------|
| 1 | PAEE Flag - Parsing Robusto | 🔴 ALTA | 🟢 Baixo | `studentProcessor.ts` |
| 2 | Conversão de Percentuais - Validação | 🔴 ALTA | 🟡 Médio | `calculationUtils.ts` |
| 3 | Frequência - Não Sobrescrever Zeros | 🔴 ALTA | 🟡 Médio | `studentProcessor.ts` |
| 4 | Detecção de Colunas - Melhorar Distinção | 🟡 MÉDIA | 🟢 Baixo | `studentProcessor.ts` |
| 5 | Adicionar Validação de Schema | 🟡 MÉDIA | 🟡 Médio | `validator.ts` (NOVO) |

---

## 🎯 Plano de Implementação

### Fase 1: Correções Críticas (Prioridade ALTA)

**Ordem de execução:**

1. **Correção 2** - `calculationUtils.ts`
   - Menos dependências
   - Impacto isolado
   - Commit: `fix(data): improve percentage conversion with validation`

2. **Correção 1** - `studentProcessor.ts` (PAEE)
   - Depende apenas de si mesmo
   - Commit: `fix(data): robust PAEE flag parsing`

3. **Correção 3** - `studentProcessor.ts` (Frequência)
   - Depende da Correção 2
   - Commit: `fix(data): prevent overwriting zero frequencies with calculated values`

### Fase 2: Melhorias (Prioridade MÉDIA)

4. **Correção 4** - `studentProcessor.ts` (Logs)
   - Observabilidade
   - Commit: `feat(data): add logging for column detection conflicts`

5. **Correção 5** - `validator.ts` (NOVO)
   - Validação adicional
   - Commit: `feat(data): add Zod schema validation for student and class data`

---

## ⚠️ Impactos e Riscos

### Correção 2 - Conversão de Percentuais

**Mudança de comportamento:**
- **Antes:** Retorna `0` para valores inválidos
- **Depois:** Retorna `NaN` para valores inválidos

**Consumidores afetados:**
1. `studentProcessor.ts:140-141` - Usa `convertToPercentage`
2. `studentProcessor.ts:152-153` - Verifica `isNaN(frequency)`

**Ajustes necessários:**
```typescript
// Antes
if (isNaN(frequency)) frequency = 0;
if (isNaN(yearlyFrequency)) yearlyFrequency = 0;

// Depois (manter NaN para indicar ausência)
// Remover essas linhas OU substituir por:
if (isNaN(frequency)) frequency = 0; // Apenas se quiser exibir 0% na UI
if (isNaN(yearlyFrequency)) yearlyFrequency = 0;
```

**Recomendação:** Manter `NaN` internamente e formatar como `"N/A"` ou `"--"` na UI

---

### Correção 3 - Frequência

**Mudança de comportamento:**
- **Antes:** Calcula frequência se `isNaN(frequency) || frequency === 0`
- **Depois:** Calcula frequência apenas se `isNaN(frequency)`

**Impacto:**
- ✅ Alunos com 0% de frequência real não terão dados sobrescritos
- ⚠️ Se Excel tiver `0` como "ausência de dados", não será calculado

**Mitigação:** Documentar que `0%` é considerado valor real, não ausência

---

## 📝 Checklist de Testes

Após implementar as correções, testar com:

### Teste 1: PAEE Flag
- [ ] Excel com `"Sim"` → `paee: true`
- [ ] Excel com `"S"` → `paee: true`
- [ ] Excel com `"X"` → `paee: true`
- [ ] Excel com `"Não"` → `paee: false`
- [ ] Excel com `"N"` → `paee: false`
- [ ] Excel com `"0"` → `paee: false`
- [ ] Excel com `""` (vazio) → `paee: false`
- [ ] PAEE aparece em StudentsPage
- [ ] PAEE aparece em ReportsPage
- [ ] PAEE aparece em PDF (Student Report)
- [ ] PAEE aparece em PDF (Ata)
- [ ] PAEE aparece em DOCX (Student Report)

### Teste 2: Conversão de Percentuais
- [ ] `"85%"` → `85`
- [ ] `"85"` → `85`
- [ ] `"0.85"` → `85`
- [ ] `"0,85"` → `85`
- [ ] `""` → `NaN`
- [ ] `"-"` → `NaN`
- [ ] `"abc"` → `NaN` + warning
- [ ] `"150"` → `NaN` + warning
- [ ] `"-10"` → `NaN` + warning

### Teste 3: Frequência
- [ ] Excel com `Fre% = 0%` → não sobrescreve
- [ ] Excel sem `Fre%` → calcula se possível
- [ ] Excel com `Fre An% = 0%` → não sobrescreve
- [ ] Excel sem `Fre An%` → deixa `NaN` (não inventa)
- [ ] Flag `manualFrequency` correta

### Teste 4: Detecção de Colunas
- [ ] Excel com `Fre%` e `Fre An%` separados → detecta ambos
- [ ] Excel com apenas `Fre%` → detecta apenas período
- [ ] Excel com colunas iguais → warning no console
- [ ] Log de debug mostra colunas detectadas

### Teste 5: Validação de Schema
- [ ] Aluno com dados válidos → sem warnings
- [ ] Aluno com nome vazio → warning
- [ ] Aluno com frequência > 100 → warning
- [ ] Aluno com nota > 10 → warning

---

## 🎯 Recomendações Finais

### Curto Prazo (Antes de v1.0)

1. **🔴 CRÍTICO:** Implementar Correções 1, 2 e 3
2. **🟡 IMPORTANTE:** Testar com arquivos Excel reais
3. **🟡 IMPORTANTE:** Documentar formato esperado do "Mapão"

### Médio Prazo (v1.1+)

4. **🟡 MELHORIA:** Implementar Correções 4 e 5
5. **🟡 MELHORIA:** Criar testes automatizados para parsing
6. **🟡 MELHORIA:** Adicionar validação de schema no upload

### Longo Prazo (v2.0+)

7. **🟢 FEATURE:** Interface para mapear colunas manualmente
8. **🟢 FEATURE:** Histórico de importações com rollback
9. **🟢 FEATURE:** Validação visual pré-importação

---

## ✅ Conclusão

**Integridade de Dados: ⚠️ REQUER ATENÇÃO**

**Principais Achados:**
- ✅ **PAEE propagação:** Funcionando perfeitamente
- ⚠️ **Fre% vs Fre An%:** Lógica complexa com risco de confusão
- ⚠️ **Conversão de percentuais:** Aceita valores inválidos silenciosamente
- ⚠️ **PAEE parsing:** Aceita "Não" como `true`
- ⚠️ **Cálculos de fallback:** Inventa dados (faltas * 2)

**Próximos Passos:**
1. Implementar Correções 1, 2 e 3 (ALTA prioridade)
2. Testar com arquivos Excel reais
3. Commit separado para cada correção
4. Validar com usuário final

---

**Auditoria concluída por:** Data Integrity Agent  
**Próximo passo:** Aguardando aprovação para implementar correções
